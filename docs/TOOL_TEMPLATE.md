# Tool Template

Copy this template to create a new tool. Save as `web/js/tools/your-tool.js`.

## Template

```javascript
/**
 * Tool: [Your Tool Name]
 *
 * Example queries:
 *   "example query 1"
 *   "example query 2"
 *   "example query 3"
 *
 * @param  {string} lower    – lowercased user input
 * @param  {string} original – raw (original-case) user input
 * @return {{ type: string, html: string } | null}
 */
function tryYourTool(lower, original) {

  // ── Step 1: Pattern matching ──
  // Define regex patterns that detect when the user wants YOUR tool.
  // Return null immediately if nothing matches.

  const patterns = [
    /pattern one (.+)/i,
    /pattern two (.+)/i,
    /another way to ask (.+)/i,
  ];

  let match = null;
  for (const pat of patterns) {
    match = lower.match(pat);
    if (match) break;
  }

  if (!match) return null;

  // ── Step 2: Extract and compute ──
  // Parse the matched groups and perform your deterministic computation.

  const input = match[1].trim();
  const result = doYourComputation(input);

  // ── Step 3: Build result HTML ──
  // Use the result-box CSS classes for consistent styling.

  const html =
    `<div class="result-box">` +
      `<div class="result-value">${escapeHtml(String(result))}</div>` +
      `<div class="result-detail">` +
        `Input: ${escapeHtml(input)}` +
      `</div>` +
    `</div>` +
    `<span style="font-size:12px;color:var(--text-secondary)">` +
      `Formula or explanation here` +
    `</span>`;

  return { type: 'yourtool', html: html };
}
```

## Registration

1. Add to `web/js/parser.js` inside `parseAndRoute()`:
```javascript
result = tryYourTool(lower, text);
if (result) return result;
```

2. Add to `web/index.html` (before parser.js):
```html
<script src="js/tools/your-tool.js"></script>
```

## Checklist

- [ ] Function returns `null` when input doesn't match
- [ ] All user text escaped with `escapeHtml()`
- [ ] No `eval()`, no `new Function()`, no API calls
- [ ] Works offline
- [ ] Tested with 5+ different phrasings
- [ ] Added to parser.js routing
- [ ] Added script tag to index.html
