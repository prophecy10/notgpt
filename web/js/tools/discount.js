// 🏷️ Discount Calculator Tool for NotGPT
// Patterns matched:
//   "30% off $250", "price after 25% discount on $180"
//   "how much do I save on $350 at 40% off"
//   "sale price of $90 at 50% off"
// Supports "$" prefix, "dollars", "bucks", naked numbers

function tryDiscount(lower, original) {
  // Must mention discount/off/sale or percent-off pattern
  if (!/discount|%\s*off|\boff\b|sale\s*price/.test(lower)) return null;

  var discountPercent = null;
  var price = null;

  // Discount percent: "30% off", "25% discount", "at 40% off", "discount of 15%"
  var discMatch = lower.match(/(\d+(?:\.\d+)?)\s*%\s*(?:off|discount)/) ||
                  lower.match(/discount\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*%/);
  if (discMatch) {
    discountPercent = parseFloat(discMatch[1]);
  }

  // Price: "$250", "250 dollars", "250 bucks", or number near "on/of/price"
  var priceMatch = lower.match(/\$\s*(\d+(?:\.\d+)?)/) ||
                   lower.match(/(\d+(?:\.\d+)?)\s*(?:dollars|bucks)/) ||
                   lower.match(/(?:on|of|price)\s+\$?(\d+(?:\.\d+)?)/);
  if (priceMatch) {
    price = parseFloat(priceMatch[1]);
  }

  // Fallback: grab numbers and assign the largest as price (that isn't the discount %)
  if (price === null || discountPercent === null) {
    var allNums = [];
    var numRe = /(\d+(?:\.\d+)?)/g;
    var m;
    while ((m = numRe.exec(lower)) !== null) {
      allNums.push(parseFloat(m[1]));
    }
    if (discountPercent === null) {
      // The number followed by % or the smaller number
      var pctMatch = lower.match(/(\d+(?:\.\d+)?)\s*%/);
      if (pctMatch) discountPercent = parseFloat(pctMatch[1]);
    }
    if (price === null) {
      var candidates = allNums.filter(function (n) {
        return discountPercent === null || n !== discountPercent;
      });
      if (candidates.length > 0) {
        price = Math.max.apply(null, candidates);
      }
    }
  }

  if (price === null || price <= 0 || discountPercent === null) return null;

  // Edge guards
  if (discountPercent < 0) discountPercent = 0;
  if (discountPercent > 100) discountPercent = 100;
  if (price > 1e8) {
    return {
      type: 'discount',
      html:
        '<strong style="color:var(--accent)">🏷️ That\'s a Pricey Item!</strong><br>' +
        'I don\'t think my calculator goes that high. Or your wallet.'
    };
  }

  var savings = price * (discountPercent / 100);
  var finalPrice = price - savings;

  var html =
    '<strong style="color:var(--accent)">🏷️ Discount Calculator</strong><br><br>' +
    'Original price: <strong>$' + price.toFixed(2) + '</strong><br>' +
    'Discount: ' + discountPercent + '% off<br>' +
    'You save: <strong style="color:var(--accent)">$' + savings.toFixed(2) + '</strong><br>' +
    'Final price: <strong>$' + finalPrice.toFixed(2) + '</strong>';

  html += '<br><br><span style="font-size:12px;color:var(--text-secondary)">' +
    'Formula: $' + price.toFixed(2) + ' - (' + discountPercent + '% x $' + price.toFixed(2) + ') = $' + finalPrice.toFixed(2) +
    '</span>';

  // Cheeky commentary
  if (discountPercent >= 70) {
    html += '<br><span style="font-size:12px;color:var(--text-secondary)">That discount is almost suspicious. You sure this isn\'t a scam? (Kidding. Mostly.)</span>';
  } else if (discountPercent === 0) {
    html += '<br><span style="font-size:12px;color:var(--text-secondary)">0% off? So... full price? Bold strategy.</span>';
  }

  return { type: 'discount', html: html };
}
