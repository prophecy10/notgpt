// 💰 Tip Calculator Tool for NotGPT
// Patterns matched:
//   "tip on $85", "20% tip on 120", "tip calculator"
//   "split bill of $200 between 4 people with 18% tip"
//   "how much to tip on $45"
// Default tip: 15% if not specified
// Supports "$" prefix, naked numbers, "dollars", "bucks"

function tryTipCalculator(lower, original) {
  var CUR = currencyOf(original);
  // Quick bail: must mention tip, or "split bill"
  if (!/tip|split\s*bill/.test(lower)) return null;

  // --- "tip calculator" with no numbers → show a help blurb ---
  if (/tip\s*calculator/.test(lower) && !/\d/.test(lower)) {
    return {
      type: 'tip-calculator',
      html:
        '<strong style="color:var(--accent)">💰 Tip Calculator</strong><br><br>' +
        'Try something like:<br>' +
        '&bull; "tip on $85"<br>' +
        '&bull; "20% tip on $60"<br>' +
        '&bull; "split bill of $200 between 4 people with 18% tip"<br><br>' +
        '<span style="font-size:12px;color:var(--text-secondary)">Default tip is 15% because I\'m a decent fake robot.</span>'
    };
  }

  // --- Extract numbers ---
  var billAmount = null;
  var tipPercent = null;
  var splitCount = null;

  // Tip percent: "20% tip" or "tip 20%" or "with 18% tip" or "at 20%"
  var tipMatch = lower.match(/(\d+(?:\.\d+)?)\s*%\s*tip/) ||
                 lower.match(/tip\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*%/) ||
                 lower.match(/(?:with|at)\s+(\d+(?:\.\d+)?)\s*%/);
  if (tipMatch) {
    tipPercent = parseFloat(tipMatch[1]);
  }

  // Split count: "between 4 people" or "split 4 ways" or "for 6 people" or "among 3"
  var splitMatch = lower.match(/(?:between|among|for|split(?:\s+between)?)\s+(\d+)\s*(?:people|persons|ways|friends|guests)?/) ||
                   lower.match(/(\d+)\s*(?:people|persons|ways|friends|guests)/);
  if (splitMatch) {
    splitCount = parseInt(splitMatch[1], 10);
  }

  // Bill amount: "$85", "85 dollars", "85 bucks", or fallback to number near "on/of/bill"
  var billMatch = lower.match(/\$\s*(\d+(?:\.\d+)?)/) ||
                  lower.match(/(\d+(?:\.\d+)?)\s*(?:dollars|bucks)/) ||
                  lower.match(/(?:on|of|bill)\s+\$?(\d+(?:\.\d+)?)/);

  if (billMatch) {
    billAmount = parseFloat(billMatch[1]);
  }

  // If we still don't have a bill amount, grab the largest number that isn't the tip% or split count
  if (billAmount === null) {
    var allNums = [];
    var numRe = /(\d+(?:\.\d+)?)/g;
    var m;
    while ((m = numRe.exec(lower)) !== null) {
      allNums.push(parseFloat(m[1]));
    }
    // Remove the tip percent and split count from candidates
    var candidates = allNums.filter(function (n) {
      if (tipPercent !== null && n === tipPercent) return false;
      if (splitCount !== null && n === splitCount) return false;
      return true;
    });
    if (candidates.length > 0) {
      billAmount = Math.max.apply(null, candidates);
    }
  }

  if (billAmount === null || billAmount <= 0) return null;

  // Defaults
  if (tipPercent === null) tipPercent = 15;
  if (splitCount !== null && splitCount < 1) splitCount = null;

  // Edge guards
  if (tipPercent < 0) tipPercent = 0;
  if (tipPercent > 100) tipPercent = 100;
  if (billAmount > 1e8) {
    return {
      type: 'tip-calculator',
      html:
        '<strong style="color:var(--accent)">💰 Whoa there, big spender!</strong><br>' +
        'That bill is... suspiciously large. Maybe double-check that number?'
    };
  }

  var tipAmount = billAmount * (tipPercent / 100);
  var total = billAmount + tipAmount;

  var html =
    '<strong style="color:var(--accent)">💰 Tip Calculator</strong><br><br>' +
    'Bill: <strong>' + money(billAmount, CUR) + '</strong><br>' +
    'Tip (' + tipPercent + '%): <strong style="color:var(--accent)">' + money(tipAmount, CUR) + '</strong><br>' +
    'Total: <strong>' + money(total, CUR) + '</strong>';

  if (splitCount && splitCount > 1) {
    var perPerson = total / splitCount;
    html += '<br><br>' +
      'Split ' + splitCount + ' ways: <strong style="color:var(--accent)">' + money(perPerson, CUR) + ' per person</strong>';
  }

  html += '<br><br><span style="font-size:12px;color:var(--text-secondary)">' +
    'Formula: ' + money(billAmount, CUR) + ' x ' + tipPercent + '% = ' + money(tipAmount, CUR) +
    (splitCount && splitCount > 1 ? ' | ' + money(total, CUR) + ' / ' + splitCount + ' = ' + money((total / splitCount), CUR) : '') +
    '</span>';

  return { type: 'tip-calculator', html: html };
}
