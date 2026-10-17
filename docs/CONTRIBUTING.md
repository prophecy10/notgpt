# Contributing to NotGPT

Thanks for wanting to contribute! NotGPT is designed to make adding new tools as easy as possible.

## How to Add a New Tool

### Step 1: Create your tool file

Create a new file in `web/js/tools/your-tool-name.js`

```javascript
// your-tool-name.js
function tryYourTool(lower, original) {
  // `lower` = user input in lowercase
  // `original` = user input with original casing

  // 1. Check if this input matches your tool
  const match = lower.match(/your pattern here/i);
  if (!match) return null;  // Not for this tool — return null

  // 2. Extract values and compute
  const value = parseFloat(match[1]);
  const result = value * 42;  // Your computation

  // 3. Return formatted HTML
  const html = `<div class="result-box">
    <div class="result-value">${escapeHtml(String(result))}</div>
    <div class="result-detail">Your calculation detail here</div>
  </div>`;

  return { type: 'yourtool', html: html };
}
```

### Step 2: Register in the parser

Open `web/js/parser.js` and add your tool call inside `parseAndRoute()`:

```javascript
result = tryYourTool(lower, text);
if (result) return result;
```

### Step 3: Add script tag

Open `web/index.html` and add before the parser script:

```html
<script src="js/tools/your-tool-name.js"></script>
```

### Step 4: Submit a PR!

That's it. Three files touched, one new file created.

## Coding Rules

1. **No AI / No LLMs** — The whole point. Use math, regex, algorithms.
2. **No eval() or new Function()** — Security risk and blocked by CSP.
3. **No external API calls** — Everything must run client-side, offline.
4. **No dependencies** — Pure vanilla JavaScript only.
5. **Deterministic** — Same input must always produce the same output.
6. **Return null if no match** — Let other tools try if yours doesn't match.
7. **Use `escapeHtml()`** — Always escape user text before putting in HTML.

## CSS Classes Available

| Class | Use |
|---|---|
| `result-box` | Container for the result |
| `result-value` | Big number / main result |
| `result-detail` | Smaller detail text below result |

## NLP Pattern Tips

- Support multiple phrasings: "what is X", "calculate X", "X please"
- Handle with/without spaces: "55m" and "55 m"
- Be generous with matching but specific enough to avoid false positives
- Test edge cases: negative numbers, decimals, commas, currency symbols

## PR Guidelines

- One tool per PR (keeps review simple)
- Include 5+ example queries in your PR description
- Test in Chrome, Firefox, and mobile
- No breaking changes to existing tools

## Testing

Run `npm test` (or `node tests/run.js`) before opening a PR. It loads the real browser scripts in Node, freezes the clock at 2026-10-17, and checks that each sample input reaches the right tool with the right answer. CI runs it on every pull request.

When you add or change a tool, add cases to `tests/run.js`, including at least one input that should **not** match. A wrong confident answer is worse than "I can't do that".
