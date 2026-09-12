// 🔐 Base64 Encode/Decode Tool for NotGPT
// Patterns matched:
//   "base64 encode: hello world", "decode base64: SGVsbG8="
//   "convert to base64: text", "base64 decode: ..."
//   "encode to base64: text", "from base64: ..."
// Two modes: encode and decode
// Handles text after colon, quotes, or separator

function tryBase64(lower, original) {
  // Must mention base64 or b64
  if (!/base64|b64/.test(lower)) return null;

  var isDecode = /decode|from\s*base64|convert\s*from/.test(lower);
  var isEncode = /encode|to\s*base64|convert\s*to/.test(lower);

  // If neither explicitly stated, try to infer from word order
  if (!isDecode && !isEncode) {
    if (/decode/.test(lower)) isDecode = true;
    else isEncode = true; // default to encode
  }
  // If both matched somehow, look at order
  if (isDecode && isEncode) {
    isDecode = lower.indexOf('decode') < lower.indexOf('encode');
    isEncode = !isDecode;
  }

  // Extract the input text - look after colon, quotes, or common separators
  var inputText = null;

  // Try: after colon
  var colonMatch = original.match(/:\s*(.+)/);
  if (colonMatch) {
    inputText = colonMatch[1].trim();
  }

  // Try: after quotes
  if (!inputText) {
    var quoteMatch = original.match(/["'](.+?)["']/);
    if (quoteMatch) {
      inputText = quoteMatch[1];
    }
  }

  // Try: after "base64 encode/decode" + the rest
  if (!inputText) {
    var afterMatch = original.match(/(?:base64|b64)\s+(?:encode|decode)\s+(.+)/i) ||
                     original.match(/(?:encode|decode)\s+(?:base64|b64)\s+(.+)/i);
    if (afterMatch) {
      inputText = afterMatch[1].trim();
    }
  }

  if (!inputText || inputText.length === 0) {
    return {
      type: 'base64',
      html:
        '<strong style="color:var(--accent)">🔐 Base64 ' + (isDecode ? 'Decoder' : 'Encoder') + '</strong><br><br>' +
        'Give me something to work with! Try:<br>' +
        '&bull; "base64 encode: hello world"<br>' +
        '&bull; "base64 decode: SGVsbG8gd29ybGQ="<br><br>' +
        '<span style="font-size:12px;color:var(--text-secondary)">Put your text after the colon and I\'ll do the rest. No AI needed.</span>'
    };
  }

  // Limit input size
  if (inputText.length > 10000) {
    return {
      type: 'base64',
      html:
        '<strong style="color:var(--accent)">🔐 Too Much Text!</strong><br>' +
        'That\'s over 10,000 characters. I\'m a simple tool, not a data pipeline.'
    };
  }

  var html = '';
  var result = '';

  if (isDecode) {
    // Decode base64
    try {
      // Clean up: remove whitespace
      var cleaned = inputText.replace(/\s/g, '');
      result = decodeURIComponent(escape(atob(cleaned)));
    } catch (e) {
      return {
        type: 'base64',
        html:
          '<strong style="color:var(--accent)">🔐 Base64 Decode Error</strong><br><br>' +
          'That doesn\'t look like valid base64 to me.<br>' +
          'Input: <span style="font-family:monospace">' + inputText.substring(0, 80) + (inputText.length > 80 ? '...' : '') + '</span><br><br>' +
          '<span style="font-size:12px;color:var(--text-secondary)">Base64 uses A-Z, a-z, 0-9, +, /, and = for padding. Double-check your input!</span>'
      };
    }

    html =
      '<strong style="color:var(--accent)">🔐 Base64 Decoded</strong><br><br>' +
      '<span style="font-size:12px;color:var(--text-secondary)">Input:</span><br>' +
      '<span style="font-family:monospace;font-size:13px;word-break:break-all">' + inputText.substring(0, 200) + (inputText.length > 200 ? '...' : '') + '</span><br><br>' +
      '<span style="font-size:12px;color:var(--text-secondary)">Decoded:</span><br>' +
      '<strong style="font-family:monospace;font-size:14px;word-break:break-all">' + escapeHtml(result).substring(0, 500) + (result.length > 500 ? '...' : '') + '</strong>';
  } else {
    // Encode to base64
    try {
      result = btoa(unescape(encodeURIComponent(inputText)));
    } catch (e) {
      return {
        type: 'base64',
        html:
          '<strong style="color:var(--accent)">🔐 Base64 Encode Error</strong><br><br>' +
          'Something went wrong encoding that. Weird characters perhaps?<br>' +
          '<span style="font-size:12px;color:var(--text-secondary)">Error: ' + e.message + '</span>'
      };
    }

    html =
      '<strong style="color:var(--accent)">🔐 Base64 Encoded</strong><br><br>' +
      '<span style="font-size:12px;color:var(--text-secondary)">Input:</span><br>' +
      '<span style="font-family:monospace;font-size:13px;word-break:break-all">' + escapeHtml(inputText).substring(0, 200) + (inputText.length > 200 ? '...' : '') + '</span><br><br>' +
      '<span style="font-size:12px;color:var(--text-secondary)">Encoded:</span><br>' +
      '<strong style="font-family:monospace;font-size:14px;word-break:break-all">' + result.substring(0, 500) + (result.length > 500 ? '...' : '') + '</strong>';
  }

  html += '<br><br><span style="font-size:12px;color:var(--text-secondary)">' +
    (isDecode ? 'Decoded' : 'Encoded') + ' ' + inputText.length + ' chars -> ' + result.length + ' chars. Zero AI, pure math.</span>';

  return { type: 'base64', html: html };
}

// Helper to escape HTML entities in user input
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
