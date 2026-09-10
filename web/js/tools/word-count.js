// ---- WORD COUNT + CASE CONVERT ----
// ============================================================================
// NotGPT Text Tools - tools-text.js
// Two deterministic utilities: Word Counter & Case Converter
// ============================================================================

/**
 * Tool 1: Word Counter
 *
 * Matches natural-language requests like:
 *   "how many words in The quick brown fox"
 *   "word count of some paragraph here"
 *   "count words in hello world"
 *   "count this: some pasted text"
 *   "how many words does this have: blah blah"
 *   A big paste followed by "word count" / "how many words"
 *
 * @param  {string} lower    – lowercased user input
 * @param  {string} original – raw (original-case) user input
 * @return {{ type: 'wordcount', html: string } | null}
 */
function tryWordCount(lower, original) {

  // ── Pattern A: explicit "text" is supplied after a recognisable phrase ──
  //
  //   "how many words in <text>"
  //   "how many words does <text> have"
  //   "word count of <text>" / "word count for <text>"
  //   "count words in <text>" / "count the words in <text>"
  //   "count words of <text>"
  //
  // We try these first because they let us isolate the target text cleanly.

  const extractionPatterns = [
    // "how many words in …" / "how many words are in …"
    /how many words\s+(?:are\s+)?in\s+(.+)/,
    // "how many words does … have" / "how many words do … have"
    /how many words\s+(?:does|do)\s+(.+?)\s+have/,
    // "word count of …" / "word count for …"
    /word\s*count\s+(?:of|for)\s+(.+)/,
    // "count words in …" / "count the words in …" / "count words of …"
    /count\s+(?:the\s+)?words\s+(?:in|of)\s+(.+)/,
    // "make this uppercase: text" style - but for counting
    // "count this: …" / "count these: …"
    /count\s+(?:this|these)\s*[:\-–—]\s*(.+)/,
  ];

  let targetText = null;

  for (const pat of extractionPatterns) {
    const m = lower.match(pat);
    if (m && m[1]) {
      // We matched on the lowered string to detect intent, but we want the
      // original-case text for character-accurate analysis.  Grab the same
      // tail from `original` using the capture's start index.
      const tailLength = m[1].length;
      targetText = original.slice(original.length - tailLength);
      break;
    }
  }

  // ── Pattern B: no explicit extraction, but "word count" / "how many words"
  //     appears somewhere and there's enough surrounding text to analyse ──
  //
  //   User pastes a paragraph then types "word count"
  //   "how many words" on its own line after a pasted block
  //   "word count" followed by nothing (the *rest* of the input is the text)

  if (targetText === null) {
    // Check that intent is present at all
    const hasIntent =
      /\b(?:word\s*count|count\s*words|how\s+many\s+words)\b/.test(lower);

    if (!hasIntent) return null;

    // Strip the intent phrase itself and see if meaningful text remains.
    // We strip from `original` so casing is preserved.
    const intentPhrases =
      /\b(?:how\s+many\s+words?|word\s*count|count\s*(?:the\s+)?words?|count\s+this|count\s+these)\b/gi;

    let stripped = original.replace(intentPhrases, '');
    // Also strip leading colons / dashes that served as separators
    stripped = stripped.replace(/^\s*[:\-–—]\s*/, '').trim();

    if (stripped.length === 0) return null;   // nothing left to analyse
    targetText = stripped;
  }

  // ── Clean up surrounding quotes the user may have wrapped around text ──
  targetText = targetText.replace(/^["'`""'']+|["'`""'']+$/g, '').trim();

  if (targetText.length === 0) return null;

  // ── Analyse ──

  const text = targetText;

  // Words: split on whitespace, drop empties
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Characters
  const charCountWithSpaces = text.length;
  const charCountNoSpaces   = text.replace(/\s/g, '').length;

  // Lines (split on actual newlines; a single line has count 1)
  const lines = text.split(/\r?\n/);
  const lineCount = lines.length;

  // Sentences - approximate: split on . ! ? (ignoring common abbreviations
  // like Mr. Mrs. Dr. etc. is hard, so we keep it simple)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(sentences.length, wordCount > 0 ? 1 : 0);

  // Average word length
  const totalLetters = words.reduce((sum, w) => sum + w.length, 0);
  const avgWordLength = wordCount > 0
    ? (totalLetters / wordCount).toFixed(1)
    : '0';

  // ── Truncated preview (so huge pastes don't flood the result) ──
  const MAX_PREVIEW = 120;
  const preview = text.length > MAX_PREVIEW
    ? text.slice(0, MAX_PREVIEW) + '…'
    : text;

  // ── Build HTML ──

  const html = `
<div class="result-box">
  <div class="result-value">${wordCount} word${wordCount !== 1 ? 's' : ''}</div>
  <div class="result-detail" style="margin-bottom:8px;opacity:0.7;font-style:italic;">
    "${escapeHtml(preview)}"
  </div>
  <div class="result-detail">${charCountWithSpaces.toLocaleString()} characters (${charCountNoSpaces.toLocaleString()} without spaces)</div>
  <div class="result-detail">${lineCount} line${lineCount !== 1 ? 's' : ''}</div>
  <div class="result-detail">${sentenceCount} sentence${sentenceCount !== 1 ? 's' : ''} (approximate)</div>
  <div class="result-detail">Average word length: ${avgWordLength} characters</div>
</div>`.trim();

  return { type: 'wordcount', html };
}