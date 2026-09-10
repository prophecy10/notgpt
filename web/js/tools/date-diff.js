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
  const betweenMatch = lower.match(/(?:how\s+many\s+)?days?\s*between\s+(.+?)\s+and\s+(.+?)(?:\?|$)/);
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
      const html = `📅 There are <strong style="color:var(--accent)">${diffDays.toLocaleString()} days</strong> between <strong>${s1}</strong> and <strong>${s2}</strong>` +
        (breakdown ? `<br><br><span style="font-size:12px;color:var(--text-secondary)">${breakdown}</span>` : '');
      return { type: 'date', html };
    }
  }

  return null;
}

function parseDateFuzzy(str) {
  str = str.replace(/[,\.]+/g, ' ').replace(/\s+/g, ' ').trim();
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

  // "Dec 31 2026", "December 31 2026"
  m = str.match(/^(\w+)\s+(\d{1,2})(?:\s+(\d{4}))?$/i);
  if (m && monthNames[m[1].toLowerCase()] !== undefined) {
    const year = m[3] ? parseInt(m[3]) : new Date().getFullYear();
    return new Date(year, monthNames[m[1].toLowerCase()], parseInt(m[2]));
  }

  // "2025-01-01" or "01/01/2025" or "1/1/2025"
  m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));

  m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2]));

  return null;
}