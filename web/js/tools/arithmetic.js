// ---- ARITHMETIC + BMI ----
// =================== TOOL: BASIC ARITHMETIC ===================
// Safe math evaluator - NO eval(). Tokenizes, respects order of operations,
// handles parentheses, unary minus, and multi-operation expressions.

function tryArithmetic(lower, original) {
  // ---- Gate: only proceed if this looks like a math expression ----
  const mathSignals = /(\d\s*[\+\-\*\/\^%×÷]\s*\d|plus|minus|times|divided|multiplied|mod(?:ulo)?|square\s*root|sqrt|power|raise|\bsum\b|\bproduct\b)/i;
  if (!mathSignals.test(lower)) return null;

  // ---- Reject dates and other number shapes that only look like maths ----
  // "2026-10-17", "10/10/2026", "17-10-2026" are dates, not subtractions or divisions.
  if (/\b\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}\b|\b\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}\b/.test(lower)) return null;

  // ---- Reject if this looks like a date query (don't steal from date-diff) ----
  if (/\b(?:days?|between|from|until|since)\b/i.test(lower) && /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december|today|tomorrow|yesterday)\b/i.test(lower)) return null;


  // ---- Normalise the input into a math-ready string ----
  let expr = original.trim();

  // Strip leading conversational fluff
  expr = expr.replace(/^(?:what\s+is|what's|calculate|compute|evaluate|solve|find|tell\s+me|how\s+much\s+is|can\s+you\s+(?:calculate|compute|solve|evaluate))\s*/i, '');
  expr = expr.replace(/[?!]+$/g, '').trim();

  // ---- Handle "square root of N" / "sqrt N" first (before generic normalisation) ----
  const sqrtWordMatch = expr.match(/^(?:(?:the\s+)?square\s*root\s*(?:of\s*)?)(\d+(?:\.\d+)?)\s*$/i);
  if (sqrtWordMatch) {
    const n = parseFloat(sqrtWordMatch[1]);
    if (n < 0) return _mathError('Cannot take the square root of a negative number.');
    const result = Math.sqrt(n);
    return _mathResult(`√${formatNum(n)}`, result);
  }
  const sqrtFnMatch = expr.match(/^sqrt\s*\(?\s*(\d+(?:\.\d+)?)\s*\)?\s*$/i);
  if (sqrtFnMatch) {
    const n = parseFloat(sqrtFnMatch[1]);
    if (n < 0) return _mathError('Cannot take the square root of a negative number.');
    const result = Math.sqrt(n);
    return _mathResult(`√${formatNum(n)}`, result);
  }

  // ---- Handle "3/4 of 120" (fraction of a number) ----
  const fracOfMatch = expr.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s+of\s+(\d+(?:,\d{3})*(?:\.\d+)?)\s*$/i);
  if (fracOfMatch) {
    const num = parseFloat(fracOfMatch[1]), den = parseFloat(fracOfMatch[2]);
    const whole = parseFloat(fracOfMatch[3].replace(/,/g, ''));
    if (den === 0) return _mathError('Division by zero');
    return _mathResult(`${formatNum(num)}/${formatNum(den)} × ${formatNum(whole)}`, num / den * whole);
  }

  // ---- Handle "A to the power of B" / "A raised to B" ----
  const powerWordMatch = expr.match(/(\d+(?:\.\d+)?)\s+(?:to\s+the\s+power\s+of|raised\s+to(?:\s+the\s+power\s+of)?)\s+(\d+(?:\.\d+)?)/i);
  if (powerWordMatch) {
    const base = parseFloat(powerWordMatch[1]);
    const exp = parseFloat(powerWordMatch[2]);
    const result = Math.pow(base, exp);
    return _mathResult(`${formatNum(base)} ^ ${formatNum(exp)}`, result);
  }

  // ---- Normalise operators from words / symbols to canonical form ----
  let normalised = expr;

  // Word operators → symbols  (order matters: longest first)
  normalised = normalised.replace(/\bplus\b/gi, '+');
  normalised = normalised.replace(/\bminus\b/gi, '-');
  normalised = normalised.replace(/\btimes\b/gi, '*');
  normalised = normalised.replace(/\bmultiplied\s+by\b/gi, '*');
  normalised = normalised.replace(/\bdivided\s+by\b/gi, '/');
  normalised = normalised.replace(/\bmod(?:ulo)?\b/gi, '%');
  normalised = normalised.replace(/\bover\b/gi, '/');

  // Unicode / alternate symbols
  normalised = normalised.replace(/×/g, '*');
  normalised = normalised.replace(/÷/g, '/');
  normalised = normalised.replace(/\*\*/g, '^');

  // Strip commas inside numbers (e.g. 1,000)
  normalised = normalised.replace(/(\d),(\d{3})/g, '$1$2');

  // Politeness is fine; any other leftover word means this isn't a pure expression
  // (e.g. "phone number 98765-43210", "age 1990-05-15") — refuse rather than guess.
  normalised = normalised.replace(/\b(?:please|pls|plz|thanks|thank\s+you|equals?|is)\b/gi, ' ').replace(/=/g, ' ');
  const leftover = normalised.replace(/\d+(?:\.\d+)?e[+-]?\d+/gi, '');
  if (/[a-z\u00C0-\uFFFF]/i.test(leftover.replace(/[×÷√]/g, ''))) return null;

  // Strip any remaining non-math characters but keep digits, ops, parens, dots, spaces
  normalised = normalised.replace(/[^0-9+\-*/%^().e\s]/gi, '');
  normalised = normalised.trim();

  // If nothing meaningful remains, bail
  if (!normalised || !/\d/.test(normalised)) return null;

  // ---- Tokenise ----
  const tokens = _tokenise(normalised);
  if (!tokens) return null;

  // Must contain at least one operator (otherwise it's just a bare number, not "arithmetic")
  const hasOperator = tokens.some(t => t.type === 'op');
  if (!hasOperator) return null;

  // ---- Evaluate via recursive-descent parser (respects order of operations) ----
  try {
    const result = _evaluate(tokens);

    // Build a clean display expression from the normalised form
    const displayExpr = _buildDisplayExpr(normalised, original);

    return _mathResult(displayExpr, result);
  } catch (e) {
    return _mathError(e.message);
  }
}

// ---- Tokeniser: string → token array ----
function _tokenise(str) {
  const tokens = [];
  let i = 0;
  const s = str.replace(/\s+/g, '');

  while (i < s.length) {
    const ch = s[i];

    // Number (including decimals and scientific notation like 1e5)
    if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < s.length && /[0-9.eE]/.test(s[i])) {
        num += s[i];
        // Handle e+ or e-
        if ((s[i] === 'e' || s[i] === 'E') && i + 1 < s.length && (s[i + 1] === '+' || s[i + 1] === '-')) {
          num += s[++i];
        }
        i++;
      }
      const val = parseFloat(num);
      if (isNaN(val)) return null;
      tokens.push({ type: 'num', value: val });
      continue;
    }

    // Operators
    if ('+-*/%^'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    // Parentheses
    if (ch === '(') { tokens.push({ type: 'lparen' }); i++; continue; }
    if (ch === ')') { tokens.push({ type: 'rparen' }); i++; continue; }

    // Skip unknown
    i++;
  }

  return tokens.length > 0 ? tokens : null;
}

// ---- Recursive-descent evaluator ----
// Grammar (ascending precedence):
//   expr     → term (('+' | '-') term)*
//   term     → exponent (('*' | '/' | '%') exponent)*
//   exponent → unary ('^' unary)*          (right-associative)
//   unary    → ('-')* atom
//   atom     → NUMBER | '(' expr ')'

function _evaluate(tokens) {
  let pos = 0;

  var peek = function() { return pos < tokens.length ? tokens[pos] : null; }
  var consume = function() { return tokens[pos++]; }

  var parseExpr = function() {
    let left = parseTerm();
    while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  var parseTerm = function() {
    let left = parseExponent();
    while (peek() && peek().type === 'op' && (peek().value === '*' || peek().value === '/' || peek().value === '%')) {
      const op = consume().value;
      const right = parseExponent();
      if (op === '/') {
        if (right === 0) throw new Error('Division by zero');
        left = left / right;
      } else if (op === '%') {
        if (right === 0) throw new Error('Division by zero (modulo)');
        left = left % right;
      } else {
        left = left * right;
      }
    }
    return left;
  }

  var parseExponent = function() {
    const base = parseUnary();
    if (peek() && peek().type === 'op' && peek().value === '^') {
      consume();
      const exp = parseExponent(); // right-associative: recurse into self
      return Math.pow(base, exp);
    }
    return base;
  }

  var parseUnary = function() {
    let negCount = 0;
    while (peek() && peek().type === 'op' && peek().value === '-') {
      consume();
      negCount++;
    }
    let val = parseAtom();
    if (negCount % 2 === 1) val = -val;
    return val;
  }

  var parseAtom = function() {
    const tok = peek();
    if (!tok) throw new Error('Unexpected end of expression');

    if (tok.type === 'num') {
      consume();
      return tok.value;
    }

    if (tok.type === 'lparen') {
      consume(); // eat '('
      const val = parseExpr();
      const closing = consume();
      if (!closing || closing.type !== 'rparen') throw new Error('Missing closing parenthesis');
      return val;
    }

    // Handle unary + at atom level (just skip it)
    if (tok.type === 'op' && tok.value === '+') {
      consume();
      return parseAtom();
    }

    throw new Error('Unexpected token');
  }

  const result = parseExpr();

  // Make sure we consumed everything
  if (pos < tokens.length) throw new Error('Unexpected input after expression');

  if (!isFinite(result)) throw new Error('Result is not finite');

  return result;
}

// ---- Build a readable display expression ----
function _buildDisplayExpr(normalised, original) {
  // Clean up the normalised expression for display
  let display = normalised;
  // Add spaces around operators for readability
  display = display.replace(/([+\-*/%^])/g, ' $1 ');
  // Collapse multiple spaces
  display = display.replace(/\s{2,}/g, ' ').trim();
  // Don't show leading unary as " - 5"
  display = display.replace(/^\s*-\s+/, '-');
  return display;
}

// ---- Format a number for display ----
function formatNum(n) {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) {
    return n.toLocaleString();
  }
  // Floating point - limit fraction digits
  const str = n.toFixed(10).replace(/\.?0+$/, '');
  const val = parseFloat(str);
  if (Math.abs(val) >= 1e15 || (Math.abs(val) < 1e-6 && val !== 0)) {
    return n.toExponential(6);
  }
  return val.toLocaleString(undefined, { maximumFractionDigits: 10 });
}

// ---- Build result HTML ----
function _mathResult(expression, value) {
  const displayValue = formatNum(value);
  const safeExpr = escapeHtml(expression);
  const html =
    `<div class="result-box">` +
      `<div class="result-value">${escapeHtml(displayValue)}</div>` +
      `<div class="result-detail">` +
        `${safeExpr} = ${escapeHtml(displayValue)}` +
      `</div>` +
    `</div>`;
  return { type: 'math', html };
}

function _mathError(message) {
  const html =
    `<div class="result-box" style="border-color: rgba(239,83,80,0.25); background: rgba(239,83,80,0.06);">` +
      `<div class="result-value" style="color:#ef5350;">Error</div>` +
      `<div class="result-detail">${escapeHtml(message)}</div>` +
    `</div>`;
  return { type: 'math', html };
}