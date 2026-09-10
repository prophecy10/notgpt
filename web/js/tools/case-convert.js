// ============================================================================

/**
 * Tool 2: Case Converter
 *
 * Matches natural-language requests like:
 *   "uppercase hello world"
 *   "make this uppercase: hello world"
 *   "convert to lowercase: HELLO"
 *   "title case hello world"
 *   "capitalize hello world"
 *   "camelCase hello world"
 *   "snake_case Hello World"
 *   "kebab-case Hello World"
 *
 * @param  {string} lower    – lowercased user input
 * @param  {string} original – raw (original-case) user input
 * @return {{ type: 'case', html: string } | null}
 */
function tryCaseConvert(lower, original) {

  // ── Define the case modes we support ──
  //
  // Each entry: { id, label, pattern (regex on lowered input), convert(text) }
  // The pattern MUST have a named group `text` OR we extract text separately.

  const modes = [
    {
      id: 'upper',
      label: 'UPPER CASE',
      // "uppercase …", "upper case …", "to uppercase …",
      // "make … uppercase", "convert … to uppercase"
      patterns: [
        /(?:(?:convert|change|make|transform)\s+(?:this\s+)?(?:to\s+)?upper\s*case|(?:to\s+)?upper\s*case)\s*[:\-–—]?\s*(.+)/,
        /(.+?)\s+(?:to|in)\s+upper\s*case\s*$/,
      ],
      convert: t => t.toUpperCase(),
    },
    {
      id: 'lower',
      label: 'lower case',
      patterns: [
        /(?:(?:convert|change|make|transform)\s+(?:this\s+)?(?:to\s+)?lower\s*case|(?:to\s+)?lower\s*case)\s*[:\-–—]?\s*(.+)/,
        /(.+?)\s+(?:to|in)\s+lower\s*case\s*$/,
      ],
      convert: t => t.toLowerCase(),
    },
    {
      id: 'title',
      label: 'Title Case',
      patterns: [
        /(?:(?:convert|change|make|transform)\s+(?:this\s+)?(?:to\s+)?title\s*case|(?:to\s+)?title\s*case)\s*[:\-–—]?\s*(.+)/,
        /(.+?)\s+(?:to|in)\s+title\s*case\s*$/,
      ],
      convert: t => t.replace(
        /\w\S*/g,
        w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      ),
    },
    {
      id: 'capitalize',
      label: 'Capitalized (first letter)',
      patterns: [
        /(?:(?:convert|change|make|transform)\s+(?:this\s+)?(?:to\s+)?capitaliz(?:e|ed)|capitaliz(?:e|ed))\s*[:\-–—]?\s*(.+)/,
      ],
      convert: t => t.charAt(0).toUpperCase() + t.slice(1),
    },
    {
      id: 'camel',
      label: 'camelCase',
      patterns: [
        /(?:(?:convert|change|make|transform)\s+(?:this\s+)?(?:to\s+)?camel\s*case|(?:to\s+)?camel\s*case)\s*[:\-–—]?\s*(.+)/,
        /(.+?)\s+(?:to|in)\s+camel\s*case\s*$/,
      ],
      convert: t => {
        const words = t.trim().split(/[\s_\-]+/).filter(Boolean);
        return words
          .map((w, i) =>
            i === 0
              ? w.toLowerCase()
              : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
          )
          .join('');
      },
    },
    {
      id: 'snake',
      label: 'snake_case',
      patterns: [
        /(?:(?:convert|change|make|transform)\s+(?:this\s+)?(?:to\s+)?snake[\s_]*case|(?:to\s+)?snake[\s_]*case)\s*[:\-–—]?\s*(.+)/,
        /(.+?)\s+(?:to|in)\s+snake[\s_]*case\s*$/,
      ],
      convert: t => {
        return t
          .trim()
          // Insert underscore before uppercase letters in camelCase input
          .replace(/([a-z])([A-Z])/g, '$1_$2')
          // Replace spaces, hyphens, multiple underscores with single _
          .replace(/[\s\-]+/g, '_')
          .replace(/_+/g, '_')
          .toLowerCase();
      },
    },
    {
      id: 'kebab',
      label: 'kebab-case',
      patterns: [
        /(?:(?:convert|change|make|transform)\s+(?:this\s+)?(?:to\s+)?kebab[\s\-]*case|(?:to\s+)?kebab[\s\-]*case)\s*[:\-–—]?\s*(.+)/,
        /(.+?)\s+(?:to|in)\s+kebab[\s\-]*case\s*$/,
      ],
      convert: t => {
        return t
          .trim()
          .replace(/([a-z])([A-Z])/g, '$1-$2')
          .replace(/[\s_]+/g, '-')
          .replace(/-+/g, '-')
          .toLowerCase();
      },
    },
  ];

  // ── Try each mode's patterns against `lower` ──

  for (const mode of modes) {
    for (const pat of mode.patterns) {
      const m = lower.match(pat);
      if (!m || !m[1]) continue;

      // Extract the original-case text (same tail length trick as word count)
      const capturedLower = m[1].trim();
      if (capturedLower.length === 0) continue;

      // Find where the captured group starts in the original string.
      // Because lowercasing preserves length, the index in `lower` maps
      // directly to `original`.
      const captureStart = m.index + m[0].indexOf(m[1]);
      let targetText = original.slice(captureStart, captureStart + m[1].length).trim();

      // Strip wrapping quotes
      targetText = targetText.replace(/^["'`""'']+|["'`""'']+$/g, '').trim();
      if (targetText.length === 0) continue;

      // Convert
      const converted = mode.convert(targetText);

      // Build HTML
      const html = `
<div class="result-box">
  <div class="result-value">${escapeHtml(converted)}</div>
  <div class="result-detail" style="margin-top:6px;">
    Converted to <strong>${escapeHtml(mode.label)}</strong>
  </div>
  <div class="result-detail" style="opacity:0.65;">
    Original: "${escapeHtml(targetText)}"
  </div>
</div>`.trim();

      return { type: 'case', html };
    }
  }

  return null;
}