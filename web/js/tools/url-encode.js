// 🔗 URL Encode/Decode Tool for NotGPT
// Patterns matched:
//   "url encode: hello world & goodbye"
//   "decode url: hello%20world"
//   "percent encode: text", "urlencode: text"
//   "urldecode: %23hash", "url decode this: text"
// Two modes: encode and decode
// Uses encodeURIComponent / decodeURIComponent

function tryUrlEncode(lower, original) {
  // Must mention url encode/decode, percent encode, or urlencode/urldecode
  if (!/url\s*encode|url\s*decode|percent\s*encode|percent\s*decode|urlencode|urldecode|encodeuri|decodeuri/.test(lower)) return null;

  var isDecode = /url\s*decode|urldecode|percent\s*decode|decodeuri/.test(lower);

  // Extract the input text - look after colon, quotes, or keyword
  var inputText = null;

  // Try: after colon
  var colonMatch = original.match(/:\s*(.+)/);
  if (colonMatch) {
    inputText = colonMatch[1].trim();
  }

  // Try: in quotes
  if (!inputText) {
    var quoteMatch = original.match(/["'](.+?)["']/);
    if (quoteMatch) {
      inputText = quoteMatch[1];
    }
  }

  // Try: after the keyword phrase
  if (!inputText) {
    var afterMatch = original.match(/(?:url\s*(?:en|de)code|urlencode|urldecode|percent\s*(?:en|de)code)\s+(?:this\s*:?\s*)?(.+)/i);
    if (afterMatch) {
      inputText = afterMatch[1].trim();
    }
  }

  if (!inputText || inputText.length === 0) {
    return {
      type: 'url-encode',
      html:
        '<strong style="color:var(--accent)">🔗 URL ' + (isDecode ? 'Decoder' : 'Encoder') + '</strong><br><br>' +
        'I need some text to work with! Try:<br>' +
        '&bull; "url encode: hello world &amp; goodbye"<br>' +
        '&bull; "url decode: hello%20world%26goodbye"<br><br>' +
        '<span style="font-size:12px;color:var(--text-secondary)">Pop your text after the colon and I\'ll handle the rest.</span>'
    };
  }

  // Limit input
  if (inputText.length > 10000) {
    return {
      type: 'url-encode',
      html:
        '<strong style="color:var(--accent)">🔗 Too Much Text!</strong><br>' +
        'Over 10,000 characters is a bit much for a URL. Even the internet has limits.'
    };
  }

  var result = '';
  var html = '';

  // HTML escape helper (inline to keep file self-contained)
  function esc(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  if (isDecode) {
    try {
      result = decodeURIComponent(inputText.replace(/\+/g, ' '));
    } catch (e) {
      return {
        type: 'url-encode',
        html:
          '<strong style="color:var(--accent)">🔗 URL Decode Error</strong><br><br>' +
          'That doesn\'t look like valid percent-encoded text.<br>' +
          '<span style="font-size:12px;color:var(--text-secondary)">Check for malformed %XX sequences. Each % should be followed by two hex digits.</span>'
      };
    }

    html =
      '<strong style="color:var(--accent)">🔗 URL Decoded</strong><br><br>' +
      '<span style="font-size:12px;color:var(--text-secondary)">Input:</span><br>' +
      '<span style="font-family:monospace;font-size:13px;word-break:break-all">' + esc(inputText).substring(0, 300) + '</span><br><br>' +
      '<span style="font-size:12px;color:var(--text-secondary)">Decoded:</span><br>' +
      '<strong style="font-family:monospace;font-size:14px;word-break:break-all">' + esc(result).substring(0, 500) + '</strong>';
  } else {
    try {
      result = encodeURIComponent(inputText);
    } catch (e) {
      return {
        type: 'url-encode',
        html:
          '<strong style="color:var(--accent)">🔗 URL Encode Error</strong><br><br>' +
          'Something went wrong. That\'s... unusual for encoding. ' +
          '<span style="font-size:12px;color:var(--text-secondary)">Error: ' + e.message + '</span>'
      };
    }

    html =
      '<strong style="color:var(--accent)">🔗 URL Encoded</strong><br><br>' +
      '<span style="font-size:12px;color:var(--text-secondary)">Input:</span><br>' +
      '<span style="font-family:monospace;font-size:13px;word-break:break-all">' + esc(inputText).substring(0, 300) + '</span><br><br>' +
      '<span style="font-size:12px;color:var(--text-secondary)">Encoded:</span><br>' +
      '<strong style="font-family:monospace;font-size:14px;word-break:break-all">' + esc(result).substring(0, 500) + '</strong>';
  }

  html += '<br><br><span style="font-size:12px;color:var(--text-secondary)">' +
    inputText.length + ' chars in, ' + result.length + ' chars out. ' +
    'Just string manipulation - no neurons harmed.</span>';

  return { type: 'url-encode', html: html };
}
