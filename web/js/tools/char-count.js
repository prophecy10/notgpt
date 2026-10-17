// ---- CHARACTER COUNT ----
function tryCharCount(lower, original) {
  var letter = tryLetterCount(lower, original);
  if (letter) return letter;
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

// ---- COUNT ONE LETTER: "how many r's in strawberry" ----
// The classic question chatbots get wrong. Counting is not a job for a language model.
function tryLetterCount(lower, original) {
  var Q = '["\u201c\u201d\'\u2018\u2019]?';
  var patterns = [
    // how many r / r's / rs / "r" (letters) (are there) in strawberry
    new RegExp('how\\s+many\\s+(?:times\\s+(?:does|is)\\s+(?:the\\s+)?(?:letter\\s+)?)?' + Q + '([a-z\\u0B80-\\u0BFF])' + Q + '(?:\'?s)?\\s*(?:letters?)?\\s*(?:(?:are\\s+)?(?:there\\s+)?(?:appear\\s+|occur\\s+|come\\s+)?)?(?:in|inside)\\s+(?:the\\s+word\\s+)?' + Q + '(.+?)' + Q + '\\s*\\??$', 'i'),
    // count (the letter) s in mississippi / number of e in excellence / occurrences of a in banana
    new RegExp('(?:count|number\\s+of|occurrences?\\s+of|no\\.?\\s+of)\\s+(?:the\\s+)?(?:letter\\s+)?' + Q + '([a-z\\u0B80-\\u0BFF])' + Q + '(?:\'?s)?\\s+(?:in|inside)\\s+(?:the\\s+word\\s+)?' + Q + '(.+?)' + Q + '\\s*\\??$', 'i'),
  ];
  for (var i = 0; i < patterns.length; i++) {
    var m = original.match(patterns[i]);
    if (!m) continue;
    var ch = m[1], word = m[2].trim();
    if (!word) continue;
    var target = ch.toLowerCase(), count = 0, marked = '';
    for (var j = 0; j < word.length; j++) {
      var c = word[j];
      if (c.toLowerCase() === target) {
        count++;
        marked += '<span style="color:var(--accent);font-weight:700;text-decoration:underline">' + escapeHtml(c) + '</span>';
      } else marked += escapeHtml(c);
    }
    var html = '<div class="result-box"><div class="result-value">' + count + '</div>' +
      '<div class="result-detail">"' + escapeHtml(ch) + '" appears ' + count + ' time' + (count === 1 ? '' : 's') + ' in "' + escapeHtml(word) + '"</div></div>' +
      '<span style="font-family:var(--font-mono);font-size:18px;letter-spacing:2px">' + marked + '</span>' +
      '<br><br><span style="font-size:12px;color:var(--text-secondary)">Counted one character at a time (case-insensitive). No tokens, no guessing.</span>';
    return { type: 'lettercount', html: html };
  }
  return null;
}
