// ---- MONEY FORMATTING (shared by tip / discount / tax) ----
// Shows the currency the user typed instead of always "$".
// ₹ / rs / rupees / inr → ₹ (Indian digit grouping), $ / usd / dollars / bucks → $, € / eur → €, £ / gbp → £.
// No currency in the input → plain number.
function currencyOf(text) {
  var t = String(text || '');
  if (/₹|\brs\.?\s*\d|\d\s*rs\b|\brupees?\b|\binr\b/i.test(t)) return '₹';
  if (/\$|\busd\b|\bdollars?\b|\bbucks\b/i.test(t)) return '$';
  if (/€|\beur\b|\beuros?\b/i.test(t)) return '€';
  if (/£|\bgbp\b/i.test(t)) return '£';
  return '';
}

function money(n, cur) {
  var locale = cur === '₹' ? 'en-IN' : undefined;
  return (cur || '') + Number(n).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
