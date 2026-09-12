// ---- CHARACTER COUNT ----
function tryCharCount(lower, original) {
  var patterns = [
    /(?:how\s+many\s+)?(?:characters?|chars?|letters?)\s+(?:in|of|for)\s+["\u201c\u201d'\u2018\u2019]?(.+?)["\u201c\u201d'\u2018\u2019]?\s*\??$/i,
    /(?:count|get|find|tell me)\s+(?:the\s+)?(?:characters?|chars?|letters?)\s+(?:in|of|for)\s+["\u201c\u201d'\u2018\u2019]?(.+?)["\u201c\u201d'\u2018\u2019]?\s*\??$/i,
    /(?:character|char|letter)\s+count\s+(?:of|for|in)\s+["\u201c\u201d'\u2018\u2019]?(.+?)["\u201c\u201d'\u2018\u2019]?\s*\??$/i,
    /(?:length|len)\s+(?:of|for)\s+["\u201c\u201d'\u2018\u2019]?(.+?)["\u201c\u201d'\u2018\u2019]?\s*\??$/i,
    /(?:how\s+(?:long|many\s+chars?)\s+is)\s+["\u201c\u201d'\u2018\u2019]?(.+?)["\u201c\u201d'\u2018\u2019]?\s*\??$/i,
    /(?:character|char|letter)\s*count\s*[:\-\u2013\u2014]\s*(.+)\s*$/i,
    /count\s+(?:the\s+)?(?:characters?|chars?|letters?)\s*[:\-\u2013\u2014]\s*(.+)\s*$/i,
  ];
  for (var i = 0; i < patterns.length; i++) {
    var match = original.match(patterns[i]);
    if (match) {
      var text = match[1].trim().replace(/^["'\u201c\u201d\u2018\u2019]+|["'\u201c\u201d\u2018\u2019]+$/g, '');
      if (text.length === 0) continue;
      var charCount = text.length;
      var charCountNoSpaces = text.replace(/\s/g, '').length;
      var charMap = {};
      for (var j = 0; j < text.length; j++) {
        var ch = text[j].toLowerCase();
        if (ch === ' ') continue;
        charMap[ch] = (charMap[ch] || 0) + 1;
      }
      var sorted = Object.entries(charMap).sort(function(a, b) { return b[1] - a[1]; });
      var breakdown = sorted.map(function(pair) {
        return '<span style="display:inline-block;background:rgba(79,195,247,0.1);padding:2px 8px;border-radius:6px;margin:2px;font-family:var(--font-mono);font-size:13px;">' + escapeHtml(pair[0]) + ' \u00d7 ' + pair[1] + '</span>';
      }).join(' ');
      var html = '<div class="result-box"><div class="result-value">' + charCount + ' characters</div><div class="result-detail">' + charCountNoSpaces + ' without spaces</div></div><strong>"' + escapeHtml(text) + '"</strong><br><br><span style="font-size:12px;color:var(--text-secondary);">Character breakdown:</span><br><div style="margin-top:6px;">' + breakdown + '</div>';
      return { type: 'charcount', html: html };
    }
  }
  return null;
}