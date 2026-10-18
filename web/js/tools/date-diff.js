// ---- DATE DIFFERENCE ----
function tryDateDifference(lower, original) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // "days until christmas", "days until new year"
  const specialDates = {
    'christmas': () => { let d = new Date(today.getFullYear(), 11, 25); if (d <= today) d = new Date(today.getFullYear() + 1, 11, 25); return d; },
    'new year': () => new Date(today.getFullYear() + 1, 0, 1),
    'new years': () => new Date(today.getFullYear() + 1, 0, 1),
    "new year's": () => new Date(today.getFullYear() + 1, 0, 1),
    "new year's day": () => new Date(today.getFullYear() + 1, 0, 1),
    'valentine': () => { let d = new Date(today.getFullYear(), 1, 14); if (d <= today) d = new Date(today.getFullYear() + 1, 1, 14); return d; },
    "valentine's": () => { let d = new Date(today.getFullYear(), 1, 14); if (d <= today) d = new Date(today.getFullYear() + 1, 1, 14); return d; },
    "valentine's day": () => { let d = new Date(today.getFullYear(), 1, 14); if (d <= today) d = new Date(today.getFullYear() + 1, 1, 14); return d; },
    'halloween': () => { let d = new Date(today.getFullYear(), 9, 31); if (d <= today) d = new Date(today.getFullYear() + 1, 9, 31); return d; },
    'thanksgiving': () => { // 4th Thursday in November
      let year = today.getFullYear();
      let nov1 = new Date(year, 10, 1);
      let dayOfWeek = nov1.getDay();
      let firstThurs = dayOfWeek <= 4 ? (4 - dayOfWeek + 1) : (11 - dayOfWeek + 1);
      let d = new Date(year, 10, firstThurs + 21);
      if (d <= today) { year++; nov1 = new Date(year, 10, 1); dayOfWeek = nov1.getDay(); firstThurs = dayOfWeek <= 4 ? (4 - dayOfWeek + 1) : (11 - dayOfWeek + 1); d = new Date(year, 10, firstThurs + 21); }
      return d;
    },
  };

  // Check "days until <special date>"
  const untilSpecialMatch = lower.match(/(?:how\s+many\s+)?days?\s*(?:until|till|to|before|left\s+(?:until|till|to|for))\s+(.+)/);
  if (untilSpecialMatch) {
    const target = untilSpecialMatch[1].replace(/[?.!]+$/, '').trim();
    for (const [key, fn] of Object.entries(specialDates)) {
      if (target.includes(key)) {
        const targetDate = fn();
        const diffMs = targetDate - today;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(diffDays / 7);
        const remDays = diffDays % 7;
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const targetStr = months[targetDate.getMonth()] + ' ' + targetDate.getDate() + ', ' + targetDate.getFullYear();
        let breakdown = `That's about <strong>${weeks} weeks and ${remDays} days</strong>`;
        const html = `📅 <strong>${diffDays} days</strong> until ${key.charAt(0).toUpperCase() + key.slice(1)}` +
          `<br><span style="font-size:12px;color:var(--text-secondary)">${targetStr}</span>` +
          `<br><br><span style="font-size:12px;color:var(--text-secondary)">${breakdown}</span>`;
        return { type: 'date', html };
      }
    }

    // "days until <parsed date>"
    const parsedTarget = parseDateFuzzy(target);
    if (parsedTarget) {
      const diffMs = parsedTarget - today;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) {
        const weeks = Math.floor(diffDays / 7);
        const remDays = diffDays % 7;
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const targetStr = months[parsedTarget.getMonth()] + ' ' + parsedTarget.getDate() + ', ' + parsedTarget.getFullYear();
        let breakdown = `That's about <strong>${weeks} weeks and ${remDays} days</strong>`;
        const html = `📅 <strong>${diffDays} days</strong> from today until <strong>${targetStr}</strong>` +
          `<br><br><span style="font-size:12px;color:var(--text-secondary)">${breakdown}</span>`;
        return { type: 'date', html };
      }
    }
  }

  // "how many days between X and Y"
  // Also handles: "no of days between X to Y", "number of days from X to Y",
  //               "days between X and Y", "days from X to Y"
  const betweenMatch = lower.match(/(?:(?:how\s+many|no\.?\s*(?:of)?|number\s+of)\s+)?days?\s*(?:between|from)\s+(.+?)\s+(?:and|to)\s+(.+?)(?:\?|$)/);
  if (betweenMatch) {
    let dateStr1 = betweenMatch[1].trim();
    let dateStr2 = betweenMatch[2].trim();

    const d1 = (dateStr1 === 'today') ? new Date(today) : parseDateFuzzy(dateStr1);
    const d2 = (dateStr2 === 'today') ? new Date(today) : parseDateFuzzy(dateStr2);

    if (d1 && d2) {
      const diffMs = Math.abs(d2 - d1);
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(diffDays / 7);
      const remDays = diffDays % 7;
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const s1 = months[d1.getMonth()] + ' ' + d1.getDate() + ', ' + d1.getFullYear();
      const s2 = months[d2.getMonth()] + ' ' + d2.getDate() + ', ' + d2.getFullYear();
      let yearsDiff = Math.floor(diffDays / 365.25);
      let remainAfterYears = diffDays - Math.round(yearsDiff * 365.25);
      let monthsDiff = Math.floor(remainAfterYears / 30.44);
      let remainDays = remainAfterYears - Math.round(monthsDiff * 30.44);
      let breakdown = '';
      if (yearsDiff > 0) breakdown = `≈ ${yearsDiff} year${yearsDiff>1?'s':''}, ${monthsDiff} month${monthsDiff!==1?'s':''}, ${remainDays} day${remainDays!==1?'s':''}`;
      else if (weeks > 0) breakdown = `That's about ${weeks} week${weeks>1?'s':''} and ${remDays} day${remDays!==1?'s':''}`;
      const html = `📅 There ${diffDays===1?'is':'are'} <strong style="color:var(--accent)">${diffDays.toLocaleString()} day${diffDays===1?'':'s'}</strong> between <strong>${s1}</strong> and <strong>${s2}</strong>` +
        (breakdown ? `<br><br><span style="font-size:12px;color:var(--text-secondary)">${breakdown}</span>` : '');
      return { type: 'date', html };
    }
  }

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const fmt = d => MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  const dayMs = 1000 * 60 * 60 * 24;
  const clean = s => s.replace(/[?.!]+$/, '').replace(/^(?:on|the)\s+/i, '').trim();

  // "age if born 1990-05-15", "how old am I, born 15 May 1990", "age 1990-05-15", "my age born on 15/05/1990"
  const ageMatch = lower.match(/(?:\bage\b|how\s+old|\bborn\b|birth\s*date|dob|date\s+of\s+birth)[^0-9a-z]*(?:(?:am\s+i|is\s+(?:he|she|someone)|if|i\s+was|was|on|in|my|born|birth\s*date|dob|date\s+of\s+birth)\s+)*(?:(?:born|on)\s+)?(.+)$/);
  if (ageMatch) {
    const birth = parseDateFuzzy(clean(ageMatch[1]));
    if (birth) {
      if (birth > today) return { type: 'date', html: `📅 <strong>${fmt(birth)}</strong> is in the future, so there's no age to calculate yet.` };
      let y = today.getFullYear() - birth.getFullYear();
      let m = today.getMonth() - birth.getMonth();
      let d = today.getDate() - birth.getDate();
      if (d < 0) { m--; d += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
      if (m < 0) { y--; m += 12; }
      const totalDays = Math.round((today - birth) / dayMs);
      let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      if (next < today) next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
      const toNext = Math.round((next - today) / dayMs);
      const html = `🎂 <strong style="color:var(--accent)">${y} years, ${m} month${m!==1?'s':''}, ${d} day${d!==1?'s':''}</strong>` +
        `<br><span style="font-size:12px;color:var(--text-secondary)">Born ${fmt(birth)} (${DAYS[birth.getDay()]}) · ${totalDays.toLocaleString()} days old</span>` +
        `<br><br><span style="font-size:12px;color:var(--text-secondary)">${toNext === 0 ? 'Happy birthday! 🎉' : `Next birthday in ${toNext} day${toNext!==1?'s':''}`}</span>`;
      return { type: 'date', html };
    }
  }

  // "how many days since 2020-03-24", "days since jan 1 2026", "days ago was 1 jan 2026"
  const sinceMatch = lower.match(/(?:(?:how\s+many|no\.?\s*(?:of)?|number\s+of)\s+)?days?\s*(?:since|after|have\s+passed\s+since|from)\s+(.+)$/);
  if (sinceMatch) {
    const from = parseDateFuzzy(clean(sinceMatch[1]));
    if (from && from <= today) {
      const diffDays = Math.round((today - from) / dayMs);
      const weeks = Math.floor(diffDays / 7), rem = diffDays % 7;
      const html = `📅 <strong style="color:var(--accent)">${diffDays.toLocaleString()} days</strong> since <strong>${fmt(from)}</strong>` +
        `<br><br><span style="font-size:12px;color:var(--text-secondary)">That's about ${weeks.toLocaleString()} week${weeks!==1?'s':''} and ${rem} day${rem!==1?'s':''}</span>`;
      return { type: 'date', html };
    }
  }

  // A bare date ("2026-10-17", "17/10/2026", "what day is 25 dec 2026") → weekday + distance from today
  const bare = lower.replace(/^(?:what\s+(?:day|weekday)\s+(?:is|was|will\s+be|of\s+the\s+week\s+is)|which\s+day\s+is|day\s+of)\s+/, '');
  const bareDate = parseDateFuzzy(clean(bare));
  if (bareDate) {
    const diff = Math.round((bareDate - today) / dayMs);
    const rel = diff === 0 ? 'Today' : diff > 0 ? `${diff.toLocaleString()} day${diff!==1?'s':''} from today` : `${(-diff).toLocaleString()} day${diff!==-1?'s':''} ago`;
    const html = `📅 <strong style="color:var(--accent)">${DAYS[bareDate.getDay()]}</strong>, ${fmt(bareDate)}` +
      `<br><br><span style="font-size:12px;color:var(--text-secondary)">${rel}</span>`;
    return { type: 'date', html };
  }

  return null;
}

// Does this browser's locale write the day before the month (22/11/2026, as in India and the UK)?
// Used only when a numeric date is ambiguous (both parts ≤ 12).
function _dayFirstLocale() {
  try {
    const lang = (typeof navigator !== 'undefined' && navigator.language) || undefined;
    const parts = new Intl.DateTimeFormat(lang).formatToParts(new Date(2000, 10, 22));
    const order = parts.filter(p => p.type === 'day' || p.type === 'month').map(p => p.type);
    return order[0] === 'day';
  } catch (e) { return false; }
}

// Builds a date only if it really exists (no silent roll-over: 31/02 is not 3 March)
function _ymd(y, m, d) {
  const dt = new Date(y, m - 1, d);
  return (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) ? dt : null;
}

function _dmy(a, b, y) {
  // a/b are the first two numbers of a numeric date
  if (a > 12 && b <= 12) return _ymd(y, b, a);               // must be DD/MM
  if (b > 12 && a <= 12) return _ymd(y, a, b);               // must be MM/DD
  if (a > 12 || b > 12) return null;                         // 13/13 — not a date
  return _dayFirstLocale() ? _ymd(y, b, a) : _ymd(y, a, b);
}

function parseDateFuzzy(str) {
  str = str.replace(/[,\.]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\u2013|\u2014/g, '-');
  const monthNames = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5,
    jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8, sept: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
  };

  // "Jan 1 2025", "January 1 2025", "Jan 1, 2025"
  let m = str.match(/^(\w+)\s+(\d{1,2})\s+(\d{4})$/i);
  if (m && monthNames[m[1].toLowerCase()] !== undefined) {
    return new Date(parseInt(m[3]), monthNames[m[1].toLowerCase()], parseInt(m[2]));
  }

  // "1 Jan 2025", "1 January 2025"
  m = str.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/i);
  if (m && monthNames[m[2].toLowerCase()] !== undefined) {
    return new Date(parseInt(m[3]), monthNames[m[2].toLowerCase()], parseInt(m[1]));
  }

  // "22-nov-1992", "22-november-1992", "1-jan-2025" (day-month-year with dashes)
  m = str.match(/^(\d{1,2})-(\w+)-(\d{4})$/i);
  if (m && monthNames[m[2].toLowerCase()] !== undefined) {
    return new Date(parseInt(m[3]), monthNames[m[2].toLowerCase()], parseInt(m[1]));
  }

  // "nov-22-1992", "november-22-1992" (month-day-year with dashes)
  m = str.match(/^(\w+)-(\d{1,2})-(\d{4})$/i);
  if (m && monthNames[m[1].toLowerCase()] !== undefined) {
    return new Date(parseInt(m[3]), monthNames[m[1].toLowerCase()], parseInt(m[2]));
  }

  // "Dec 31 2026", "December 31 2026"
  m = str.match(/^(\w+)\s+(\d{1,2})(?:\s+(\d{4}))?$/i);
  if (m && monthNames[m[1].toLowerCase()] !== undefined) {
    const year = m[3] ? parseInt(m[3]) : new Date().getFullYear();
    return new Date(year, monthNames[m[1].toLowerCase()], parseInt(m[2]));
  }

  // "2025-01-01" or "01/01/2025" or "1/1/2025"
  m = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (m) return _ymd(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));

  m = str.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/);
  if (m) return _dmy(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));

  // "22/11/1992" (DD/MM/YYYY - assume DD/MM for international format when day > 12)
  // Already handled above as MM/DD — but add DD-MM-YYYY with dashes
  m = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) return _dmy(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));

  return null;
}
