/**
 * NotGPT — opt-in feedback endpoint (Google Apps Script, bound to a Google Sheet)
 *
 * Receives two kinds of POST from the site (see web/js/app.js):
 *   { _t: 'notgpt_v2', type: 'failed_query', query, tool, matched, timestamp }   — only if the user opted in
 *   { _t: 'notgpt_v2', type: 'feedback', message }                               — when the user sends feedback
 *   { _t: 'notgpt_v2', type: 'cleanup', maxAgeDays }                             — ignored here; cleanup is scheduled
 *
 * Hardening over a bare doPost:
 *   - rejects anything without the expected _t / type
 *   - caps text length (stops someone filling your sheet with megabytes)
 *   - strips leading = + - @ so a row can't become a spreadsheet formula
 *   - simple global rate limit (per minute) using CacheService
 *   - deletion of rows older than 7 days runs on a schedule, not from browsers
 *
 * Setup:
 *   1. Sheet → Extensions → Apps Script → paste this file.
 *   2. Run setup() once (authorise when asked). It creates the "failed" and "feedback" tabs and
 *      a daily trigger for cleanupOld().
 *   3. Deploy → Manage deployments → edit your existing web app → New version → Deploy.
 *      Keeping the same deployment keeps the same URL, so SHEETS_URL in app.js doesn't change.
 */

const MAX_AGE_DAYS = 7;
const MAX_LEN = 500;             // characters kept per field
const MAX_PER_MINUTE = 60;       // across all visitors

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body._t !== 'notgpt_v2') return reply_('ignored');
    if (body.type === 'cleanup') return reply_('ok');           // handled by the daily trigger
    if (!rateOk_()) return reply_('busy');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const now = new Date();
    if (body.type === 'failed_query') {
      sheet_(ss, 'failed', ['time', 'query', 'tool']).appendRow([now, clean_(body.query), clean_(body.tool)]);
    } else if (body.type === 'feedback') {
      sheet_(ss, 'feedback', ['time', 'message']).appendRow([now, clean_(body.message)]);
    } else {
      return reply_('ignored');
    }
    return reply_('ok');
  } catch (err) {
    return reply_('error');
  }
}

/** Deletes rows older than MAX_AGE_DAYS from the "failed" tab. Runs daily. */
function cleanupOld() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('failed');
  if (!sh || sh.getLastRow() < 2) return;
  const cutoff = Date.now() - MAX_AGE_DAYS * 864e5;
  const times = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  for (let i = times.length - 1; i >= 0; i--) {        // bottom-up so row numbers stay valid
    const t = new Date(times[i][0]).getTime();
    if (t && t < cutoff) sh.deleteRow(i + 2);
  }
}

/** Run once: creates tabs and the daily cleanup trigger. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  sheet_(ss, 'failed', ['time', 'query', 'tool']);
  sheet_(ss, 'feedback', ['time', 'message']);
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'cleanupOld').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('cleanupOld').timeBased().everyDays(1).atHour(3).create();
}

function sheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); }
  return sh;
}

function clean_(v) {
  let s = String(v == null ? '' : v).slice(0, MAX_LEN);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;             // never let a cell become a formula
  return s;
}

function rateOk_() {
  const cache = CacheService.getScriptCache();
  const key = 'n_' + Math.floor(Date.now() / 60000);
  const n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 120);
  return n <= MAX_PER_MINUTE;
}

function reply_(status) {
  return ContentService.createTextOutput(JSON.stringify({ status })).setMimeType(ContentService.MimeType.JSON);
}
