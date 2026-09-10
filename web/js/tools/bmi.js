// =================== TOOL: BMI CALCULATOR ===================

function tryBMI(lower, original) {
  // ---- Gate: must mention "bmi" ----
  if (!/\bbmi\b/i.test(lower)) return null;

  const text = original.trim();

  let heightCm = null;
  let weightKg = null;
  let heightDisplay = '';
  let weightDisplay = '';

  // ---- Extract height ----

  // Feet and inches: 5'8, 5 feet 8 inches, 5ft8in, 5 foot 8, 5'8"
  const ftInPatterns = [
    /(\d+)\s*(?:'|ft|feet|foot)\s*(\d+)\s*(?:"|''|in|inches|inch)?/i,
    /(\d+)\s*(?:'|ft|feet|foot)(?:\s|$)/i,
    /height\s*:?\s*(\d+)\s*(?:'|ft|feet|foot)\s*(\d+)?\s*(?:"|''|in|inches|inch)?/i,
  ];

  for (const pat of ftInPatterns) {
    const m = text.match(pat);
    if (m) {
      const feet = parseInt(m[1]);
      const inches = m[2] ? parseInt(m[2]) : 0;
      if (feet >= 3 && feet <= 8 && inches >= 0 && inches <= 11) {
        heightCm = (feet * 12 + inches) * 2.54;
        heightDisplay = inches > 0 ? `${feet}ft ${inches}in (${heightCm.toFixed(1)} cm)` : `${feet}ft (${heightCm.toFixed(1)} cm)`;
        break;
      }
    }
  }

  // Centimeters: 170 cm, 170cm, height 170 cm
  if (!heightCm) {
    const cmMatch = text.match(/(\d{2,3})\s*cm\b/i);
    if (cmMatch) {
      const val = parseFloat(cmMatch[1]);
      if (val >= 50 && val <= 280) {
        heightCm = val;
        heightDisplay = `${val} cm`;
      }
    }
  }

  // ---- Extract weight ----

  // Kilograms: 70 kg, 70kg, weight 70 kg
  const kgMatch = text.match(/(\d+(?:\.\d+)?)\s*kg\b/i);
  if (kgMatch) {
    const val = parseFloat(kgMatch[1]);
    if (val >= 20 && val <= 400) {
      weightKg = val;
      weightDisplay = `${val} kg`;
    }
  }

  // Pounds: 154 pounds, 154 lbs, 154 lb, weight 154 pounds
  if (!weightKg) {
    const lbMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)\b/i);
    if (lbMatch) {
      const lbs = parseFloat(lbMatch[1]);
      if (lbs >= 44 && lbs <= 880) {
        weightKg = lbs * 0.453592;
        weightDisplay = `${lbs} lbs (${weightKg.toFixed(1)} kg)`;
      }
    }
  }

  // ---- Fallback: try to infer from two bare numbers + context ----
  // "bmi 75 kg 180 cm" or "bmi 180 cm 75 kg" — already handled above via kg/cm patterns
  // "bmi calculator 65kg 165cm" — also handled
  // If we still don't have both, try to disambiguate bare numbers near unit hints
  if (!heightCm || !weightKg) {
    // Try extracting all numbers from the string
    const nums = [];
    const numRe = /(\d+(?:\.\d+)?)/g;
    let nm;
    while ((nm = numRe.exec(lower)) !== null) {
      nums.push(parseFloat(nm[1]));
    }

    // Heuristic: if exactly two numbers, one is plausibly height-cm (100-250) and one is weight-kg (30-200)
    if (nums.length >= 2) {
      const candidates = nums.filter(n => n >= 30);
      for (let i = 0; i < candidates.length && (!heightCm || !weightKg); i++) {
        const n = candidates[i];
        if (!heightCm && n >= 100 && n <= 250) {
          heightCm = n;
          heightDisplay = `${n} cm (inferred)`;
        } else if (!weightKg && n >= 30 && n <= 200) {
          weightKg = n;
          weightDisplay = `${n} kg (inferred)`;
        }
      }
    }
  }

  // ---- If we couldn't extract both, give a helpful message ----
  if (!heightCm || !weightKg) {
    if (!heightCm && !weightKg) return null; // Probably not actually a BMI request with data
    const missing = !heightCm ? 'height' : 'weight';
    const html =
      `<div class="result-box" style="border-color: rgba(255,183,77,0.3); background: rgba(255,183,77,0.06);">` +
        `<div class="result-value" style="color:#ffb74d;">Missing ${escapeHtml(missing)}</div>` +
        `<div class="result-detail">` +
          `I found ${!heightCm ? 'your weight' : 'your height'} but not your ${missing}.<br>` +
          `Try: <em>"BMI for 170 cm and 65 kg"</em> or <em>"BMI height 5'8 weight 154 lbs"</em>` +
        `</div>` +
      `</div>`;
    return { type: 'bmi', html };
  }

  // ---- Calculate BMI ----
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const bmiRounded = Math.round(bmi * 10) / 10;

  // ---- Category + colour ----
  let category, color, bgTint;
  if (bmi < 18.5) {
    category = 'Underweight';
    color = '#4fc3f7';      // light blue
    bgTint = 'rgba(79,195,247,0.08)';
  } else if (bmi < 25) {
    category = 'Normal';
    color = '#66bb6a';      // green
    bgTint = 'rgba(102,187,106,0.08)';
  } else if (bmi < 30) {
    category = 'Overweight';
    color = '#ffb74d';      // amber/yellow
    bgTint = 'rgba(255,183,77,0.08)';
  } else {
    category = 'Obese';
    color = '#ef5350';      // red
    bgTint = 'rgba(239,83,80,0.08)';
  }

  // ---- Build the visual scale bar ----
  // Scale: BMI 10–40 mapped to 0–100%
  const scaleMin = 10, scaleMax = 40;
  const pct = Math.max(0, Math.min(100, ((bmi - scaleMin) / (scaleMax - scaleMin)) * 100));

  const scaleBar =
    `<div style="margin:14px 0 8px; position:relative; height:10px; border-radius:5px; overflow:hidden; ` +
      `background: linear-gradient(to right, #4fc3f7 0%, #66bb6a 28%, #66bb6a 50%, #ffb74d 67%, #ef5350 100%);">` +
      `<div style="position:absolute; top:-3px; left:calc(${pct.toFixed(1)}% - 4px); ` +
        `width:8px; height:16px; background:#fff; border-radius:3px; box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>` +
    `</div>` +
    `<div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); margin-bottom:6px;">` +
      `<span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span>` +
    `</div>`;

  // ---- Compose HTML ----
  const html =
    `<div class="result-box" style="border-color: ${color}30; background: ${bgTint};">` +
      `<div style="display:flex; align-items:baseline; gap:10px; margin-bottom:2px;">` +
        `<div class="result-value" style="font-size:32px; color:${color};">${bmiRounded}</div>` +
        `<div style="font-size:15px; font-weight:600; color:${color};">${category}</div>` +
      `</div>` +
      scaleBar +
      `<div class="result-detail" style="margin-top:8px;">` +
        `<strong>Height:</strong> ${escapeHtml(heightDisplay)}<br>` +
        `<strong>Weight:</strong> ${escapeHtml(weightDisplay)}<br>` +
        `<span style="margin-top:4px; display:inline-block;">Formula: ${escapeHtml(weightKg.toFixed(1))} kg ÷ (${escapeHtml(heightM.toFixed(2))} m)² = ${bmiRounded}</span>` +
      `</div>` +
    `</div>`;

  return { type: 'bmi', html };
}