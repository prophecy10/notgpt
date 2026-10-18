// 🧾 Tax Calculator Tool for NotGPT
// Patterns matched:
//   "8.5% tax on $150", "add GST 18% to 1500"
//   "remove VAT 20% from 120", "total with 7% tax on $89.99"
//   "price before tax if total was $108 at 8%"
// Two modes: add tax (forward) and remove/reverse tax (backward)
// Recognizes: tax, GST, VAT, sales tax

function tryTaxCalculator(lower, original) {
  var CUR = currencyOf(original) || (/\bgst\b/i.test(lower) ? '₹' : '');
  // Must mention tax, GST, or VAT
  if (!/\btax\b|\bgst\b|\bvat\b/.test(lower)) return null;

  var taxPercent = null;
  var amount = null;
  var isReverse = false;
  var taxLabel = 'Tax';

  // Detect tax type label
  if (/\bgst\b/.test(lower)) taxLabel = 'GST';
  if (/\bvat\b/.test(lower)) taxLabel = 'VAT';
  if (/sales\s*tax/.test(lower)) taxLabel = 'Sales tax';

  // Detect reverse mode: "remove", "without", "before tax", "price before", "exclude", "extract"
  if (/remov|without|before\s*tax|price\s*before|exclud|extract|strip|back\s*out|reverse/.test(lower)) {
    isReverse = true;
  }

  // Tax percent: "8.5% tax", "tax 18%", "GST 18%", "at 8%", "VAT 20%"
  var taxMatch = lower.match(/(\d+(?:\.\d+)?)\s*%\s*(?:tax|gst|vat|sales)/) ||
                 lower.match(/(?:tax|gst|vat|sales\s*tax)\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*%/) ||
                 lower.match(/(?:at|of)\s+(\d+(?:\.\d+)?)\s*%/) ||
                 lower.match(/(\d+(?:\.\d+)?)\s*%/);
  if (taxMatch) {
    taxPercent = parseFloat(taxMatch[1]);
  }

  // Amount: "$150", "150 dollars", or number near "on/to/from/was"
  var amtMatch = lower.match(/\$\s*(\d+(?:\.\d+)?)/) ||
                 lower.match(/(\d+(?:\.\d+)?)\s*(?:dollars|bucks)/) ||
                 lower.match(/(?:on|to|from|was)\s+\$?(\d+(?:\.\d+)?)/);
  if (amtMatch) {
    amount = parseFloat(amtMatch[1]);
  }

  // Fallback: grab all numbers, remove tax%, take the largest as amount
  if (amount === null) {
    var allNums = [];
    var numRe = /(\d+(?:\.\d+)?)/g;
    var m;
    while ((m = numRe.exec(lower)) !== null) {
      allNums.push(parseFloat(m[1]));
    }
    var candidates = allNums.filter(function (n) {
      return taxPercent === null || n !== taxPercent;
    });
    if (candidates.length > 0) {
      amount = Math.max.apply(null, candidates);
    }
  }

  if (amount === null || amount <= 0 || taxPercent === null) return null;

  // Edge guards
  if (taxPercent < 0) taxPercent = 0;
  if (taxPercent > 200) taxPercent = 200; // some countries stack taxes high
  if (amount > 1e10) {
    return {
      type: 'tax-calculator',
      html:
        '<strong style="color:var(--accent)">🧾 Astronomical Amount</strong><br>' +
        'That number is bigger than some GDPs. Maybe try again?'
    };
  }

  var html = '<strong style="color:var(--accent)">🧾 ' + taxLabel + ' Calculator</strong><br><br>';

  if (isReverse) {
    // Reverse: given total (tax-inclusive), find pre-tax price
    var preTax = amount / (1 + taxPercent / 100);
    var taxAmount = amount - preTax;

    html +=
      'Total (tax-inclusive): <strong>' + money(amount, CUR) + '</strong><br>' +
      taxLabel + ' rate: ' + taxPercent + '%<br>' +
      taxLabel + ' amount: <strong style="color:var(--accent)">' + money(taxAmount, CUR) + '</strong><br>' +
      'Price before ' + taxLabel.toLowerCase() + ': <strong>' + money(preTax, CUR) + '</strong>';

    html += '<br><br><span style="font-size:12px;color:var(--text-secondary)">' +
      'Formula: ' + money(amount, CUR) + ' / (1 + ' + taxPercent + '%) = ' + money(preTax, CUR) +
      '</span>';
  } else {
    // Forward: add tax to amount
    var taxAmount2 = amount * (taxPercent / 100);
    var total = amount + taxAmount2;

    html +=
      'Price: <strong>' + money(amount, CUR) + '</strong><br>' +
      taxLabel + ' rate: ' + taxPercent + '%<br>' +
      taxLabel + ' amount: <strong style="color:var(--accent)">' + money(taxAmount2, CUR) + '</strong><br>' +
      'Total with ' + taxLabel.toLowerCase() + ': <strong>' + money(total, CUR) + '</strong>';

    html += '<br><br><span style="font-size:12px;color:var(--text-secondary)">' +
      'Formula: ' + money(amount, CUR) + ' + (' + taxPercent + '% x ' + money(amount, CUR) + ') = ' + money(total, CUR) +
      '</span>';
  }

  return { type: 'tax-calculator', html: html };
}
