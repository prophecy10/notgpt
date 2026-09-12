// 🔑 Password Generator Tool for NotGPT
// Patterns matched:
//   "generate a password", "strong password", "16 character password"
//   "password without symbols", "create 5 passwords"
//   "passphrase 4 words", "random password"
// Uses crypto.getRandomValues() for secure randomness
// Default: 16 chars, upper + lower + digits + symbols

function tryPasswordGenerator(lower, original) {
  // Must mention password or passphrase
  if (!/password|passphrase|passwd/.test(lower)) return null;

  // --- Detect passphrase mode ---
  var isPassphrase = /passphrase/.test(lower);

  // --- Parse count (how many to generate) ---
  var countMatch = lower.match(/(?:generate|create|make|give\s+me)\s+(\d+)\s*(?:password|passphrase)/) ||
                   lower.match(/(\d+)\s*(?:password|passphrase)s/);
  var count = countMatch ? parseInt(countMatch[1], 10) : 1;
  if (count < 1) count = 1;
  if (count > 10) count = 10;

  // --- Parse length ---
  var lengthMatch = lower.match(/(\d+)\s*(?:char|character|letter|digit|long)/) ||
                    lower.match(/(?:length|len)\s*(?:of|:)?\s*(\d+)/);
  var length = lengthMatch ? parseInt(lengthMatch[1], 10) : 16;
  if (length < 8) length = 8;
  if (length > 128) length = 128;

  // --- Parse options ---
  var noSymbols = /without\s*symbol|no\s*symbol|no\s*special|without\s*special|alpha\s*numeric|alphanumeric/.test(lower);

  // --- Passphrase word count ---
  var wordCountMatch = lower.match(/(\d+)\s*word/);
  var wordCount = wordCountMatch ? parseInt(wordCountMatch[1], 10) : 4;
  if (wordCount < 2) wordCount = 2;
  if (wordCount > 12) wordCount = 12;

  // --- Built-in word list for passphrases (~200 common English words) ---
  var wordList = [
    'apple','brave','candy','delta','eagle','flame','grape','house','ivory','jolly',
    'kite','lunar','maple','noble','ocean','piano','quest','river','solar','tiger',
    'ultra','vivid','waltz','xenon','yacht','zebra','arrow','bloom','charm','dream',
    'ember','frost','gleam','haven','index','joker','knack','lemon','mango','novel',
    'olive','pearl','quilt','robin','stone','torch','union','valor','wheat','xylem',
    'yield','zones','amber','blaze','coral','dodge','epoch','forge','giant','haste',
    'ionic','jewel','karma','lotus','merit','nexus','orbit','pulse','quota','realm',
    'spark','trend','urban','voter','wrist','youth','zonal','alpha','brisk','cliff',
    'depth','event','fluid','globe','humor','input','judge','known','level','minor',
    'north','outer','plant','quiet','rapid','shift','trace','unity','voice','world',
    'acute','blank','crane','drift','elect','fixed','grain','hover','infer','jumbo',
    'knife','layer','model','nerve','onset','prime','queue','ridge','shelf','thumb',
    'usage','vault','wedge','azure','bonus','cedar','diver','exact','fiber','glyph',
    'handy','irony','jasper','kayak','limbo','mirth','nylon','oxide','plume','quake',
    'radar','siege','trout','umbra','venom','woven','oxide','pixel','rogue','stump',
    'tulip','usher','vigor','wafer','xerox','yeast','zippy','acorn','birch','chess',
    'dwarf','exile','flint','gnome','hyper','ivory','jelly','koala','llama','moose',
    'newt','otter','panda','quail','raven','snail','trout','urchin','viper','whale',
    'yucca','zinnia','badge','camel','daisy','egret','finch','goose','heron','ibis',
    'lemur','mole','newt','okapi','perch','quokka','sloth','tapir','asp','bison'
  ];

  // --- Secure random helpers ---
  function secureRandomInt(max) {
    var arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }

  function generatePassword(len, includeSymbols) {
    var upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    var digits = '0123456789';
    var symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';

    var charset = upper + lowerChars + digits;
    if (includeSymbols) charset += symbols;

    var result = '';
    // Ensure at least one of each required category
    result += upper[secureRandomInt(upper.length)];
    result += lowerChars[secureRandomInt(lowerChars.length)];
    result += digits[secureRandomInt(digits.length)];
    if (includeSymbols) {
      result += symbols[secureRandomInt(symbols.length)];
    }

    // Fill the rest
    for (var i = result.length; i < len; i++) {
      result += charset[secureRandomInt(charset.length)];
    }

    // Shuffle (Fisher-Yates using secure random)
    var arr = result.split('');
    for (var j = arr.length - 1; j > 0; j--) {
      var k = secureRandomInt(j + 1);
      var temp = arr[j];
      arr[j] = arr[k];
      arr[k] = temp;
    }
    return arr.join('');
  }

  function generatePassphrase(numWords) {
    var words = [];
    for (var i = 0; i < numWords; i++) {
      words.push(wordList[secureRandomInt(wordList.length)]);
    }
    return words.join('-');
  }

  // --- Escape HTML for display ---
  function escPwd(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- Generate output ---
  var html = '';

  if (isPassphrase) {
    html = '<strong style="color:var(--accent)">🔑 Passphrase Generator</strong><br><br>';
    for (var p = 0; p < count; p++) {
      var phrase = generatePassphrase(wordCount);
      html += '<span style="font-family:monospace;font-size:14px;background:var(--bg-secondary);padding:4px 8px;border-radius:4px;display:inline-block;margin:2px 0">' +
        escPwd(phrase) + '</span><br>';
    }
    html += '<br><span style="font-size:12px;color:var(--text-secondary)">' +
      wordCount + ' words per passphrase' +
      (count > 1 ? ' | ' + count + ' generated' : '') +
      ' | Cryptographically random selection</span>';
  } else {
    html = '<strong style="color:var(--accent)">🔑 Password Generator</strong><br><br>';
    for (var g = 0; g < count; g++) {
      var pwd = generatePassword(length, !noSymbols);
      html += '<span style="font-family:monospace;font-size:14px;background:var(--bg-secondary);padding:4px 8px;border-radius:4px;display:inline-block;margin:2px 0">' +
        escPwd(pwd) + '</span><br>';
    }
    html += '<br><span style="font-size:12px;color:var(--text-secondary)">' +
      length + ' characters | ' +
      (noSymbols ? 'Letters + digits' : 'Letters + digits + symbols') +
      (count > 1 ? ' | ' + count + ' generated' : '') +
      ' | Powered by crypto.getRandomValues()</span>';
  }

  html += '<br><span style="font-size:12px;color:var(--text-secondary)">No AI was involved. Your secrets are safe with my dumb algorithms.</span>';

  return { type: 'password-generator', html: html };
}
