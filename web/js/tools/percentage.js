// ---- PERCENTAGE ----
function tryPercentage(lower, original) {
  // Patterns: "what is 18% of 4500", "calculate 20 percent of 500", "20% of 300", "how much is 15% of 2000"
  const patterns = [
    /(?:what\s+is|calculate|compute|find|how\s+much\s+is|get|tell\s+me)?\s*(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:of)\s*(\d+(?:[\d,]*\d)?(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:of)\s*(\d+(?:[\d,]*\d)?(?:\.\d+)?)/i,
    /(?:what\s+is|calculate|find)\s+(\d+(?:\.\d+)?)\s*(?:%|percent)\s+(?:of\s+)?(\d+(?:[\d,]*\d)?(?:\.\d+)?)/i,
  ];

  for (const pat of patterns) {
    const m = lower.match(pat);
    if (m) {
      const pct = parseFloat(m[1]);
      const base = parseFloat(m[2].replace(/,/g, ''));
      const result = (pct / 100) * base;
      const formatted = Number.isInteger(result) ? result.toLocaleString() : result.toLocaleString(undefined, { maximumFractionDigits: 2 });
      const html = `<strong>${pct}%</strong> of <strong>${base.toLocaleString()}</strong> = <strong style="color:var(--accent)">${formatted}</strong>` +
        `<br><br><span style="font-size:12px;color:var(--text-secondary)">Formula: ${base.toLocaleString()} × ${pct}/100 = ${formatted}</span>`;
      return { type: 'percentage', html };
    }
  }
  return null;
}