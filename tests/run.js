// NotGPT router + tool tests. Run: npm test   (plain Node, no dependencies)
// Each case: input → expected tool type and text that must (or must not) appear in the answer.
// The clock is frozen at 2026-10-17 so date answers are stable.
const { load, text } = require('./harness');

const NOW = '2026-10-17T10:00:00';
const en = load({ now: NOW, language: 'en-US' });   // US: 01/02/2026 = Jan 2
const inn = load({ now: NOW, language: 'en-IN' });  // India: 01/02/2026 = 1 Feb

const cases = [
  // --- maths ---
  ['What is 18% of 4500?', 'percentage', '= 810'],
  ['what is 0.5% of 1000', 'percentage', '= 5'],
  ['what is 25 + 17', 'math', '= 42'],
  ['what is 5 plus 3', 'math', '= 8'],
  ['calculate 5*3 please', 'math', '= 15'],
  ['(2+3)*4', 'math', '= 20'],
  ['2^10', 'math', '= 1,024'],
  ['what is 2 to the power of 8', 'math', '= 256'],
  ['sqrt 144', 'math', '= 12'],
  ['10 mod 3', 'math', '= 1'],
  ['what is 1,000 + 2,500', 'math', '= 3,500'],
  ['what is 3/4 of 120', 'math', '= 90'],
  ['what is 7 divided by 0', 'math', 'Division by zero'],
  // --- must NOT be treated as maths (these used to give confident wrong answers) ---
  ['phone number 98765-43210', null],
  ['2026-10-17', 'date', 'Saturday'],
  ['17-10-2026', 'date', 'Saturday, October 17, 2026'],
  ['31/02/2026', null],                                   // not a real date
  // --- dates ---
  ['How many days until December 31 2026?', 'date', '75 days'],
  ['days between jan 1 2026 and mar 1 2026', 'date', '59 days'],
  ['how many days since 2020-03-24', 'date', '2,398 days'],
  ['what day is 25 dec 2026', 'date', 'Friday'],
  ['how old am I if born on 1990-05-15', 'date', '36 years, 5 months, 2 days'],
  ['my age if born 15 may 1990', 'date', '36 years, 5 months, 2 days'],
  ['dob 22/11/1992', 'date', '33 years, 10 months, 25 days'],
  ['how mny days until christmas', 'date', '69 days'],
  // --- counting ---
  ['how many r in strawberry', 'lettercount', 'appears 3 times'],
  ["How many r's are there in strawberry?", 'lettercount', 'appears 3 times'],
  ['count the letter s in mississippi', 'lettercount', 'appears 4 times'],
  ['number of e in excellence', 'lettercount', 'appears 4 times'],
  ['how many times does a appear in banana', 'lettercount', 'appears 3 times'],
  ['How many characters in strawberry?', 'charcount', '10 characters'],
  ['how many words in the quick brown fox', 'wordcount', '4 words'],
  // --- conversions ---
  ['Convert 5 feet 8 inches to cm', 'conversion', '172.72 cm'],
  ['convert 100 fahrenheit to celsius', 'conversion', '37.7778'],
  ['convert 30 c to f', 'conversion', '86 °F'],
  ['10 km to miles', 'conversion', '6.2137'],
  ['1 GB to MB', 'conversion', '1,024 MB'],
  // --- money: currency follows the input ---
  ['tip 10% on ₹850', 'tip-calculator', '₹935.00'],
  ['18% gst on 1000', 'tax-calculator', '₹1,180.00'],
  ['20% discount on $50', 'discount', '$40.00'],
  ['tip 15% on 1200', 'tip-calculator', 'Total: 1,380.00', '$'],
  // --- text / dev / generators ---
  ['uppercase hello world', 'case', 'HELLO WORLD'],
  ['camelcase hello world foo', 'case', 'helloWorldFoo'],
  ['base64 encode hello', 'base64', 'aGVsbG8='],
  ['url encode hello world', 'url-encode', 'hello%20world'],
  ['BMI for 170 cm and 65 kg', 'bmi', '22.5'],
  ['generate uuid', 'uuid-generator', 'Version 4'],
  ['flip a coin', 'random', ''],
  // --- out of scope → honest fallback, never a made-up answer ---
  ['what is the capital of france', null],
  ['write a poem', null],
  ['100 usd to inr', null],                                // no live exchange rates
];

// Typo fixer: fixes typos of keywords, never rewrites real words
const typoCases = [
  ['convrt 5 km to miles', 'convert 5 km to miles'],
  ['calclate 20 percent of 80', 'calculate 20 percent of 80'],
  ['genrate pasword', 'generate password'],
  ['count the letter s', 'count the letter s'],
  ['days since monday', 'days since monday'],
  ['how old if born today', 'how old if born today'],
];

let pass = 0, fail = 0;
const check = (ok, label, detail) => { if (ok) pass++; else { fail++; console.log('✗ ' + label + (detail ? '\n    ' + detail : '')); } };

for (const [input, type, must = '', mustNot] of cases) {
  let r;
  try { r = en.parseAndRoute(input); } catch (e) { r = { type: 'ERROR', html: e.stack }; }
  const got = r ? r.type : null, out = r ? text(r.html) : '';
  check(got === type && (!must || out.includes(must)) && (!mustNot || !out.includes(mustNot)),
    JSON.stringify(input), `expected ${type}${must ? ` containing "${must}"` : ''}${mustNot ? ` without "${mustNot}"` : ''}; got ${got}: ${out.slice(0, 140)}`);
}

// Ambiguous numeric dates follow the browser's locale
const d = (ctx, s) => text((ctx.parseAndRoute(s) || {}).html);
check(d(en, 'days between 01/02/2026 and 01/03/2026').includes('January 2, 2026'), 'US locale reads 01/02/2026 as Jan 2', d(en, 'days between 01/02/2026 and 01/03/2026'));
check(d(inn, 'days between 01/02/2026 and 01/03/2026').includes('February 1, 2026 and March 1, 2026'), 'Indian locale reads 01/02/2026 as 1 Feb', d(inn, 'days between 01/02/2026 and 01/03/2026'));
check(d(en, '25/12/2026').includes('December 25, 2026'), 'Unambiguous dd/mm works in any locale', d(en, '25/12/2026'));

for (const [input, want] of typoCases) {
  const got = en.preprocessInput(input);
  check(got === want, `typo fixer: ${JSON.stringify(input)}`, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
