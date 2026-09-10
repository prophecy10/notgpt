// ---- UNIT CONVERSION ----
// ============================================================================
// NotGPT — Expanded Unit Conversion Engine
// ============================================================================
// Drop-in replacement for tryUnitConversion(lower, original).
// Covers: length, weight, temperature, data/storage, speed, area, volume,
//         cooking, time — with broad alias and NLP pattern support.
//
// Returns { type: 'conversion', html: '...' } or null.
// Relies on the global escapeHtml(text) helper already in the app.
// ============================================================================

function tryUnitConversionExpanded(lower, original) {

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Format a number nicely: up to `digits` decimals, strip trailing zeros */
  function fmt(n, digits = 4) {
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toLocaleString();
    const s = n.toFixed(digits);
    // strip trailing zeros after decimal
    return parseFloat(s).toLocaleString(undefined, { maximumFractionDigits: digits });
  }

  /** Build the standard result HTML using result-box / result-value / result-detail */
  function makeHtml(emoji, fromVal, fromUnit, toVal, toUnit, formula) {
    return (
      `<div class="result-box">` +
        `<div class="result-value">${emoji} ${escapeHtml(fmt(toVal))} ${escapeHtml(toUnit)}</div>` +
        `<div class="result-detail">${escapeHtml(fmt(fromVal))} ${escapeHtml(fromUnit)} → ${escapeHtml(fmt(toVal))} ${escapeHtml(toUnit)}</div>` +
        `<div class="result-detail" style="margin-top:6px;font-size:12px;opacity:0.7">${formula}</div>` +
      `</div>`
    );
  }

  // ── Normalise input ─────────────────────────────────────────────────────
  // Strip leading filler words so all NLP patterns collapse to "NUM UNIT to UNIT"
  let s = lower
    .replace(/^(?:can\s+you\s+)?(?:convert|what\s+is|what'?s|how\s+many|how\s+much\s+is|calculate|compute|find|tell\s+me|please)\s+/i, '')
    .replace(/\?+$/, '')
    .trim();

  // "how many [toUnit] in NUM [fromUnit]" → rewrite to "NUM [fromUnit] to [toUnit]"
  // e.g. "how many cups in 500 ml" → already stripped "how many" → "cups in 500 ml"
  const howManyFlip = s.match(
    /^(.+?)\s+in\s+(\d+(?:[,\d]*\d)?(?:\.\d+)?)\s*(.+)$/
  );
  if (howManyFlip) {
    // Only flip when the first token(s) look like a unit (not a number)
    const maybeUnit = howManyFlip[1].trim();
    if (!/^\d/.test(maybeUnit)) {
      s = howManyFlip[2] + ' ' + howManyFlip[3] + ' to ' + maybeUnit;
    }
  }

  // ── Master regex: extract value, fromUnit, toUnit ───────────────────────
  // Patterns matched (after normalisation):
  //   "1.5 GB to MB"
  //   "1.5 GB in MB"
  //   "1.5 GB into MB"
  //   "1.5 GB as MB"
  //   "1.5 GB = MB"
  const master = s.match(
    /^(-?\d+(?:[,\d]*\d)?(?:\.\d+)?)\s*(.+?)\s+(?:to|in|into|as|=)\s+(.+)$/
  );
  if (!master) {
    // ── Legacy feet-inches compound pattern ─────────────────────────────
    return tryFeetInchesCompound(lower);
  }

  const value = parseFloat(master[1].replace(/,/g, ''));
  const rawFrom = master[2].trim();
  const rawTo = master[3].trim();

  const fromKey = canonicalUnit(rawFrom);
  const toKey = canonicalUnit(rawTo);

  if (!fromKey || !toKey) {
    // One of the units wasn't recognised — fall through to legacy compound
    return tryFeetInchesCompound(lower);
  }

  // ── Conversion lookup ───────────────────────────────────────────────────
  const result = convert(value, fromKey, toKey);
  if (!result) {
    return tryFeetInchesCompound(lower);
  }

  return {
    type: 'conversion',
    html: makeHtml(
      result.emoji,
      value, displayUnit(fromKey),
      result.value, displayUnit(toKey),
      result.formula
    )
  };

  // ======================================================================
  //  UNIT ALIAS MAP — maps any user string to a canonical key
  // ======================================================================
  function canonicalUnit(raw) {
    const u = raw.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\.$/, '')
      .trim();

    const map = {
      // ── Length ──
      'mm':1, 'millimeter':1, 'millimeters':1, 'millimetre':1, 'millimetres':1,
      'cm':2, 'centimeter':2, 'centimeters':2, 'centimetre':2, 'centimetres':2,
      'm':3, 'meter':3, 'meters':3, 'metre':3, 'metres':3,
      'km':4, 'kilometer':4, 'kilometers':4, 'kilometre':4, 'kilometres':4,
      'in':5, 'inch':5, 'inches':5, '"':5,
      'ft':6, 'foot':6, 'feet':6, "'":6,
      'yd':7, 'yard':7, 'yards':7,
      'mi':8, 'mile':8, 'miles':8,

      // ── Weight ──
      'g':10, 'gram':10, 'grams':10,
      'kg':11, 'kilogram':11, 'kilograms':11, 'kilo':11, 'kilos':11,
      'oz':12, 'ounce':12, 'ounces':12,
      'lb':13, 'lbs':13, 'pound':13, 'pounds':13,
      'ton':14, 'tons':14, 'tonne':14, 'tonnes':14, 'metric ton':14, 'metric tons':14, 'metric tonne':14, 'metric tonnes':14,

      // ── Temperature ──
      'c':20, 'celsius':20, 'centigrade':20, '°c':20, 'deg c':20, 'degrees celsius':20, 'degree celsius':20,
      'f':21, 'fahrenheit':21, '°f':21, 'deg f':21, 'degrees fahrenheit':21, 'degree fahrenheit':21,

      // ── Data/Storage ──
      'b':30, 'byte':30, 'bytes':30,
      'kb':31, 'kilobyte':31, 'kilobytes':31,
      'mb':32, 'megabyte':32, 'megabytes':32,
      'gb':33, 'gigabyte':33, 'gigabytes':33,
      'tb':34, 'terabyte':34, 'terabytes':34,

      // ── Speed ──
      'km/h':40, 'kph':40, 'kmph':40, 'kmh':40, 'kilometers per hour':40, 'kilometres per hour':40, 'kilometer per hour':40, 'kilometre per hour':40,
      'mph':41, 'miles per hour':41, 'mile per hour':41,
      'm/s':42, 'meters per second':42, 'metres per second':42, 'meter per second':42, 'metre per second':42, 'mps':42,

      // ── Area ──
      'sq ft':50, 'sqft':50, 'square foot':50, 'square feet':50, 'ft2':50, 'ft²':50,
      'sq m':51, 'sqm':51, 'square meter':51, 'square meters':51, 'square metre':51, 'square metres':51, 'm2':51, 'm²':51,
      'acre':52, 'acres':52,
      'hectare':53, 'hectares':53, 'ha':53,

      // ── Volume ──
      'l':60, 'liter':60, 'liters':60, 'litre':60, 'litres':60,
      'ml':61, 'milliliter':61, 'milliliters':61, 'millilitre':61, 'millilitres':61,
      'gal':62, 'gallon':62, 'gallons':62, 'us gallon':62, 'us gallons':62,
      'fl oz':63, 'fluid ounce':63, 'fluid ounces':63, 'fluid oz':63,

      // ── Cooking ──
      'cup':70, 'cups':70,
      'tbsp':71, 'tablespoon':71, 'tablespoons':71,
      'tsp':72, 'teaspoon':72, 'teaspoons':72,

      // ── Time ──
      'sec':80, 'second':80, 'seconds':80, 'secs':80, 's':80,
      'min':81, 'minute':81, 'minutes':81, 'mins':81,
      'hr':82, 'hour':82, 'hours':82, 'hrs':82, 'h':82,
      'day':83, 'days':83,
    };

    // Direct match
    if (map[u] !== undefined) return map[u];

    // Try stripping degree symbol at start: "°c" already covered, but "°f" etc.
    const stripped = u.replace(/^°\s*/, '');
    if (map[stripped] !== undefined) return map[stripped];

    return null;
  }

  // ======================================================================
  //  DISPLAY NAMES — pretty unit labels for output
  // ======================================================================
  function displayUnit(key) {
    const names = {
      1:'mm', 2:'cm', 3:'m', 4:'km', 5:'inches', 6:'feet', 7:'yards', 8:'miles',
      10:'g', 11:'kg', 12:'oz', 13:'lbs', 14:'tonnes',
      20:'°C', 21:'°F',
      30:'bytes', 31:'KB', 32:'MB', 33:'GB', 34:'TB',
      40:'km/h', 41:'mph', 42:'m/s',
      50:'sq ft', 51:'sq m', 52:'acres', 53:'hectares',
      60:'liters', 61:'ml', 62:'gallons', 63:'fl oz',
      70:'cups', 71:'tbsp', 72:'tsp',
      80:'seconds', 81:'minutes', 82:'hours', 83:'days',
    };
    return names[key] || '?';
  }

  // ======================================================================
  //  EMOJI for each category
  // ======================================================================
  function emojiFor(key) {
    if (key <= 8) return '📏';   // length
    if (key <= 14) return '⚖️';  // weight
    if (key <= 21) return '🌡️';  // temperature
    if (key <= 34) return '💾';  // data
    if (key <= 42) return '🏎️';  // speed
    if (key <= 53) return '📐';  // area
    if (key <= 63) return '🧪';  // volume
    if (key <= 72) return '🍳';  // cooking
    if (key <= 83) return '⏱️';  // time
    return '🔄';
  }

  // ======================================================================
  //  CONVERSION ENGINE
  // ======================================================================
  function convert(val, from, to) {
    if (from === to) {
      return { value: val, formula: 'Same unit — no conversion needed', emoji: emojiFor(from) };
    }

    const emoji = emojiFor(from);

    // ── Temperature (special — not ratio-based) ────────────────────────
    if ((from === 20 && to === 21) || (from === 21 && to === 20)) {
      if (from === 20) {
        const r = (val * 9 / 5) + 32;
        return { value: r, formula: `(${fmt(val)} × 9/5) + 32 = ${fmt(r)} · 1 °C = 33.8 °F`, emoji };
      } else {
        const r = (val - 32) * 5 / 9;
        return { value: r, formula: `(${fmt(val)} − 32) × 5/9 = ${fmt(r)} · 1 °F = −17.2222 °C`, emoji };
      }
    }

    // ── Length (all via meters) ─────────────────────────────────────────
    const lengthToM = { 1:0.001, 2:0.01, 3:1, 4:1000, 5:0.0254, 6:0.3048, 7:0.9144, 8:1609.344 };
    if (lengthToM[from] !== undefined && lengthToM[to] !== undefined) {
      const r = val * lengthToM[from] / lengthToM[to];
      const ratio = lengthToM[from] / lengthToM[to];
      return { value: r, formula: `1 ${displayUnit(from)} = ${fmt(ratio)} ${displayUnit(to)}`, emoji };
    }

    // ── Weight (all via grams) ──────────────────────────────────────────
    const weightToG = { 10:1, 11:1000, 12:28.3495, 13:453.592, 14:1000000 };
    if (weightToG[from] !== undefined && weightToG[to] !== undefined) {
      const r = val * weightToG[from] / weightToG[to];
      const ratio = weightToG[from] / weightToG[to];
      return { value: r, formula: `1 ${displayUnit(from)} = ${fmt(ratio)} ${displayUnit(to)}`, emoji };
    }

    // ── Data / Storage (all via bytes) ──────────────────────────────────
    const dataToB = { 30:1, 31:1024, 32:1048576, 33:1073741824, 34:1099511627776 };
    if (dataToB[from] !== undefined && dataToB[to] !== undefined) {
      const r = val * dataToB[from] / dataToB[to];
      const ratio = dataToB[from] / dataToB[to];
      return { value: r, formula: `1 ${displayUnit(from)} = ${fmt(ratio)} ${displayUnit(to)}`, emoji };
    }

    // ── Speed (all via m/) ─────────────────────────────────────────────
    const speedToMS = { 40: 1/3.6, 41: 0.44704, 42: 1 };
    if (speedToMS[from] !== undefined && speedToMS[to] !== undefined) {
      const r = val * speedToMS[from] / speedToMS[to];
      const ratio = speedToMS[from] / speedToMS[to];
      return { value: r, formula: `1 ${displayUnit(from)} = ${fmt(ratio)} ${displayUnit(to)}`, emoji };
    }

    // ── Area (all via sq m) ─────────────────────────────────────────────
    const areaToSqM = { 50: 0.092903, 51: 1, 52: 4046.8564224, 53: 10000 };
    if (areaToSqM[from] !== undefined && areaToSqM[to] !== undefined) {
      const r = val * areaToSqM[from] / areaToSqM[to];
      const ratio = areaToSqM[from] / areaToSqM[to];
      return { value: r, formula: `1 ${displayUnit(from)} = ${fmt(ratio, 6)} ${displayUnit(to)}`, emoji };
    }

    // ── Volume (all via ml) ─────────────────────────────────────────────
    const volToML = { 60: 1000, 61: 1, 62: 3785.41, 63: 29.5735 };
    if (volToML[from] !== undefined && volToML[to] !== undefined) {
      const r = val * volToML[from] / volToML[to];
      const ratio = volToML[from] / volToML[to];
      return { value: r, formula: `1 ${displayUnit(from)} = ${fmt(ratio)} ${displayUnit(to)}`, emoji };
    }

    // ── Cooking (all via ml) — merge with volume ────────────────────────
    const cookToML = { 70: 236.588, 71: 14.7868, 72: 4.92892 };
    // Cooking ↔ Cooking
    if (cookToML[from] !== undefined && cookToML[to] !== undefined) {
      const r = val * cookToML[from] / cookToML[to];
      const ratio = cookToML[from] / cookToML[to];
      return { value: r, formula: `1 ${displayUnit(from)} = ${fmt(ratio)} ${displayUnit(to)}`, emoji };
    }
    // Cooking ↔ Volume (cups ↔ ml, tbsp ↔ ml, etc.)
    const allVolML = { ...volToML, ...cookToML };
    if (allVolML[from] !== undefined && allVolML[to] !== undefined) {
      const r = val * allVolML[from] / allVolML[to];
      const ratio = allVolML[from] / allVolML[to];
      const e = cookToML[from] !== undefined || cookToML[to] !== undefined ? '🍳' : '🧪';
      return { value: r, formula: `1 ${displayUnit(from)} = ${fmt(ratio)} ${displayUnit(to)}`, emoji: e };
    }

    // ── Time (all via seconds) ──────────────────────────────────────────
    const timeToS = { 80: 1, 81: 60, 82: 3600, 83: 86400 };
    if (timeToS[from] !== undefined && timeToS[to] !== undefined) {
      const r = val * timeToS[from] / timeToS[to];
      const ratio = timeToS[from] / timeToS[to];
      return { value: r, formula: `1 ${displayUnit(from)} = ${fmt(ratio)} ${displayUnit(to)}`, emoji };
    }

    // No valid conversion between different categories
    return null;
  }

  // ======================================================================
  //  LEGACY: Feet + Inches compound pattern (e.g. "5 feet 8 inches to cm")
  // ======================================================================
  function tryFeetInchesCompound(lwr) {
    let m;

    // Feet and inches to cm: "5 feet 8 inches to cm", "5ft 8in to cm", "5'8 to cm"
    m = lwr.match(
      /(\d+)\s*(?:feet|foot|ft|')[\s,]*(\d+)?\s*(?:inches|inch|in|"|''|)?\s*(?:to|in|into|as|=)\s*(?:cm|centimeters?|centimetres?)/
    );
    if (m) {
      const feet = parseInt(m[1]);
      const inches = m[2] ? parseInt(m[2]) : 0;
      const totalInches = feet * 12 + inches;
      const cm = totalInches * 2.54;
      return {
        type: 'conversion',
        html: makeHtml('📏', totalInches, 'inches', cm, 'cm',
          `${feet}ft ${inches}in = ${totalInches} inches × 2.54 = ${fmt(cm)} cm`)
      };
    }

    // cm to feet+inches: "172 cm to feet", "180cm to feet and inches"
    m = lwr.match(
      /(\d+(?:\.\d+)?)\s*(?:cm|centimeters?|centimetres?)\s*(?:to|in|into|as|=)\s*(?:feet|foot|ft|feet\s*(?:and|&)?\s*inches?)/
    );
    if (m) {
      const cm = parseFloat(m[1]);
      const totalInches = cm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return {
        type: 'conversion',
        html:
          `<div class="result-box">` +
            `<div class="result-value">📏 ${feet}ft ${fmt(inches, 1)}in</div>` +
            `<div class="result-detail">${fmt(cm)} cm → ${feet}ft ${fmt(inches, 1)}in</div>` +
            `<div class="result-detail" style="margin-top:6px;font-size:12px;opacity:0.7">${fmt(cm)} ÷ 2.54 = ${fmt(totalInches, 1)} inches = ${feet}ft ${fmt(inches, 1)}in</div>` +
          `</div>`
      };
    }

    return null;
  }
}

