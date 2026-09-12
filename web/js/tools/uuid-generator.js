// 🆔 UUID Generator Tool for NotGPT
// Patterns matched:
//   "generate uuid", "new uuid", "create unique id"
//   "give me 5 uuids", "uuid without dashes", "guid"
// Generates proper v4 UUIDs using crypto.getRandomValues()
// Options: multiple (up to 10), with/without dashes

function tryUuidGenerator(lower, original) {
  // Must mention uuid, guid, or "unique id"
  if (!/uuid|guid|unique\s*id/.test(lower)) return null;

  // --- Parse count ---
  var countMatch = lower.match(/(\d+)\s*(?:uuid|guid|unique\s*id)/) ||
                   lower.match(/(?:generate|create|make|give\s+me|need)\s+(\d+)/);
  var count = countMatch ? parseInt(countMatch[1], 10) : 1;
  if (count < 1) count = 1;
  if (count > 10) count = 10;

  // --- Parse dashes option ---
  var noDashes = /without\s*dash|no\s*dash|no\s*hyphen|without\s*hyphen|remove\s*dash|nodash/.test(lower);

  // --- Generate v4 UUID using crypto.getRandomValues() ---
  function generateUUID() {
    var bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set version (4) in byte 6: 0100xxxx
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant (10) in byte 8: 10xxxxxx
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    var hex = '';
    for (var i = 0; i < 16; i++) {
      var h = bytes[i].toString(16);
      if (h.length === 1) h = '0' + h;
      hex += h;
    }

    // Format: 8-4-4-4-12
    return hex.substring(0, 8) + '-' +
           hex.substring(8, 12) + '-' +
           hex.substring(12, 16) + '-' +
           hex.substring(16, 20) + '-' +
           hex.substring(20, 32);
  }

  // --- Generate UUIDs ---
  var uuids = [];
  for (var i = 0; i < count; i++) {
    var uuid = generateUUID();
    if (noDashes) uuid = uuid.replace(/-/g, '');
    uuids.push(uuid);
  }

  // --- Build HTML ---
  var html = '<strong style="color:var(--accent)">🆔 UUID Generator</strong><br><br>';

  for (var j = 0; j < uuids.length; j++) {
    if (count > 1) {
      html += '<span style="font-size:12px;color:var(--text-secondary)">' + (j + 1) + '.</span> ';
    }
    html += '<span style="font-family:monospace;font-size:14px;background:var(--bg-secondary);padding:3px 8px;border-radius:4px;display:inline-block;margin:2px 0">' +
      uuids[j] + '</span><br>';
  }

  html += '<br><span style="font-size:12px;color:var(--text-secondary)">' +
    'Version 4 (random) | ' +
    (noDashes ? '32 hex chars (no dashes)' : '36 chars with dashes') +
    (count > 1 ? ' | ' + count + ' generated' : '') +
    ' | crypto.getRandomValues() - proper randomness, not Math.random() nonsense' +
    '</span>';

  return { type: 'uuid-generator', html: html };
}
