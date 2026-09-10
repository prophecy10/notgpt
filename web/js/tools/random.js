// ---- RANDOM NUMBER ----
function tryRandomNumber(lower, original) {
  // "roll a dice", "roll dice", "roll a die"
  if (/roll\s+(?:a\s+)?(?:dice|die|d6)/i.test(lower)) {
    const result = Math.floor(Math.random() * 6) + 1;
    const dieFaces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    const html = `🎲 You rolled a <strong style="color:var(--accent);font-size:20px">${result}</strong> ${dieFaces[result-1]}`;
    return { type: 'random', html };
  }

  // "flip a coin", "coin flip", "heads or tails"
  if (/flip\s+(?:a\s+)?coin|coin\s+flip|heads\s+or\s+tails/i.test(lower)) {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const emoji = result === 'Heads' ? '👑' : '🪙';
    const html = `${emoji} <strong style="color:var(--accent);font-size:18px">${result}!</strong>`;
    return { type: 'random', html };
  }

  // "random number between X and Y", "random number 1-100", "give me a random number from 1 to 100"
  let m = lower.match(/random\s*(?:number|num|int|integer)?\s*(?:between|from)?\s*(\d+)\s*(?:and|to|-|–| -)\s*(\d+)/);
  if (m) {
    const min = parseInt(m[1]);
    const max = parseInt(m[2]);
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    const html = `🎲 Random number between <strong>${min.toLocaleString()}</strong> and <strong>${max.toLocaleString()}</strong>:` +
      `<br><br><span style="font-size:28px;font-weight:700;color:var(--accent)">${result.toLocaleString()}</span>`;
    return { type: 'random', html };
  }

  // "generate a random number"
  if (/(?:generate|give|pick|get|create)\s+(?:me\s+)?(?:a\s+)?random\s*(?:number|num|int|integer)/i.test(lower)) {
    const result = Math.floor(Math.random() * 100) + 1;
    const html = `🎲 Here's a random number (1–100):<br><br><span style="font-size:28px;font-weight:700;color:var(--accent)">${result}</span>` +
      `<br><span style="font-size:12px;color:var(--text-secondary)">Tip: say "random number between X and Y" for a custom range</span>`;
    return { type: 'random', html };
  }

  return null;
}