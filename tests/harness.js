// Loads NotGPT's browser scripts (same order as web/index.html) into a sandbox so the
// router and tools can be tested with plain Node — no browser, no dependencies.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WEB = path.join(__dirname, '..', 'web');

function load(opts = {}) {
  const html = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1])
    .filter(s => s !== 'js/app.js');            // UI layer: needs a real DOM, not under test
  const store = {};
  const el = () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, appendChild() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    setAttribute() {}, textContent: '', innerHTML: '', value: '', checked: false });
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    document: { getElementById: el, querySelector: el, querySelectorAll: () => [], createElement: el, addEventListener() {}, body: el() },
    navigator: { userAgent: 'node', language: opts.language || 'en-US', clipboard: { writeText: async () => {} } },
    crypto: require('crypto').webcrypto,
    setTimeout, clearTimeout, Intl, Date: opts.now ? fixedDate(opts.now) : Date, Math, JSON, encodeURIComponent, decodeURIComponent,
    btoa: s => Buffer.from(s, 'binary').toString('base64'),
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    TextEncoder, TextDecoder, unescape, escape, fetch: async () => ({ ok: true, json: async () => ({}) }),
  };
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const s of scripts) {
    // top-level const/let would not be visible across scripts in a vm; browsers share them, so mimic that
    const src = fs.readFileSync(path.join(WEB, s), 'utf8');
    vm.runInContext(src, ctx, { filename: s });
  }
  return ctx;
}

// A Date whose "now" is frozen, so date answers are testable
function fixedDate(iso) {
  const NOW = new Date(iso).getTime();
  class FixedDate extends Date {
    constructor(...a) { a.length ? super(...a) : super(NOW); }
    static now() { return NOW; }
  }
  return FixedDate;
}

const text = html => String(html || '').replace(/<br\s*\/?>/g, '\n').replace(/<\/(?:div|p|li)>/g, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
  .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

module.exports = { load, text };
