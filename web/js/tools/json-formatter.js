// ---- JSON FORMATTER ----
function tryJsonFormat(lower, original) {
  const text = original.trim();

  // Check if user explicitly asks to format JSON
  const isJsonRequest = /format\s*(?:this\s+)?json|make\s*(?:this\s+)?json\s*(?:readable|pretty|nice|formatted)|prettify\s*(?:this\s+)?json|json\s*format|pretty\s*print\s*(?:this\s+)?json|beautify\s*(?:this\s+)?json/i.test(lower);

  let jsonStr = null;

  if (isJsonRequest) {
    // Try to extract JSON from the message (after the command part)
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
  }

  // Also detect if the entire message IS JSON
  if (!jsonStr && (text.startsWith('{') || text.startsWith('['))) {
    try {
      JSON.parse(text);
      jsonStr = text;
    } catch(e) {}
  }

  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      const formatted = JSON.stringify(parsed, null, 2);
      const escaped = escapeHtml(formatted);
      const html = `<strong>{ } Formatted JSON:</strong><br><br>` +
        `<pre style="background:rgba(255,255,255,0.04);padding:14px;border-radius:8px;overflow-x:auto;font-family:var(--font-mono);font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-all"><code>${escaped}</code></pre>` +
        `<br><span style="font-size:12px;color:var(--text-secondary)">` +
        `${typeof parsed === 'object' && parsed !== null ? (Array.isArray(parsed) ? parsed.length + ' items' : Object.keys(parsed).length + ' keys') : 'Valid JSON'} • ` +
        `${formatted.length.toLocaleString()} chars formatted</span>`;
      return { type: 'json', html };
    } catch(e) {
      if (isJsonRequest) {
        const html = `<strong>{ } JSON Error:</strong><br><br>` +
          `<span style="color:#ef5350">⚠️ Couldn't parse that as valid JSON.</span><br><br>` +
          `<span style="font-size:12px;color:var(--text-secondary)">Error: ${escapeHtml(e.message)}<br>Make sure your JSON is properly formatted with matching brackets and quoted keys.</span>`;
        return { type: 'json', html };
      }
    }
  }

  // If they asked to format JSON but didn't include any
  if (isJsonRequest && !jsonStr) {
    const html = `<strong>{ } JSON Formatter</strong><br><br>` +
      `I'd love to format your JSON, but I don't see any in your message!<br><br>` +
      `<span style="font-size:12px;color:var(--text-secondary)">Try pasting your JSON directly, or type something like:<br><code>format this json {"name":"NotGPT","cool":true}</code></span>`;
    return { type: 'json', html };
  }

  return null;
}