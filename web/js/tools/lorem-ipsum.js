// 📄 Lorem Ipsum Generator Tool for NotGPT
// Patterns matched:
//   "lorem ipsum 3 paragraphs", "placeholder text 500 words"
//   "filler text 10 sentences", "dummy text"
//   "generate lorem ipsum"
// Modes: paragraphs (default), words, sentences
// Default: 1 paragraph

function tryLoremIpsum(lower, original) {
  // Must mention lorem, placeholder text, filler text, or dummy text
  if (!/lorem\s*ipsum|placeholder\s*text|filler\s*text|dummy\s*text|lipsum|dummy\s*text\s*generator|generate\s*(?:some\s+)?(?:filler|dummy|placeholder)\s*text|(?:need|want|give|get)\s+(?:some\s+)?(?:filler|dummy|placeholder)\s*text/.test(lower)) return null;

  // --- Classic lorem ipsum paragraphs ---
  var paragraphs = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula ut dictum pharetra, nisi nunc fringilla magna, in commodo elit erat nec turpis. Ut pharetra augue nec augue.',
    'Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus. Phasellus ultrices nulla quis nibh. Quisque a lectus. Donec consectetuer ligula vulputate sem tristique cursus. Nam nulla quam, gravida non, commodo a, sodales sit amet, nisi.',
    'Pellentesque fermentum dolor. Aliquam quam lectus, facilisis auctor, ultrices ut, elementum vulputate, nunc. Sed adipiscing ornare risus. Morbi est est, blandit sit amet, sagittis vel, euismod vel, velit. Pellentesque egestas sem. Suspendisse commodo ullamcorper magna. Ut nulla. Vivamus bibendum, nulla ut congue fringilla, lorem ipsum ultricies risus, ut rutrum velit tortor vel purus.',
    'Fusce mauris. Vestibulum luctus nibh at lectus. Sed bibendum, nulla a faucibus semper, leo velit ultricies tellus, ac venenatis arcu wisi vel nisl. Vestibulum diam. Aliquam pellentesque, augue quis sagittis posuere, turpis lacus congue quam, in hendrerit risus eros eget felis. Maecenas eget erat in sapien mattis facilisis. Aliquam feugiat tellus ut neque.',
    'In hac habitasse platea dictumst. Etiam ac tortor. Etiam commodo nulla. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nunc dapibus tortor vel mi dapibus sollicitudin. Etiam posuere lacus quis dolor. Praesent id justo in neque elementum ultrices. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos.',
    'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Duis faucibus accumsan odio. Curabitur convallis. Duis ante. Aliquam nisl. Aenean sit amet justo. Morbi ut odio. Cras mi pede, malesuada in, imperdiet et, commodo vulputate, justo. In blandit ultrices enim. Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    'Suspendisse potenti. Aliquam feugiat. Nunc cursus lacinia erat. Praesent blandit laoreet nibh. Fusce convallis metus id felis luctus adipiscing. Pellentesque egestas, neque sit amet convallis pulvinar, justo nulla eleifend augue, ac auctor orci leo non est. Quisque id mi. Ut tincidunt tincidunt erat. Etiam vestibulum volutpat enim. Diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.'
  ];

  // Break paragraphs into sentences for sentence mode
  var allSentences = [];
  for (var p = 0; p < paragraphs.length; p++) {
    var sents = paragraphs[p].match(/[^.!?]+[.!?]+/g);
    if (sents) {
      for (var s = 0; s < sents.length; s++) {
        allSentences.push(sents[s].trim());
      }
    }
  }

  // Build a big word pool for word mode
  var allWords = paragraphs.join(' ').replace(/[.,;:!?]/g, '').split(/\s+/);

  // --- Detect mode and count ---
  var mode = 'paragraphs'; // default
  var count = 1;

  if (/(\d+)\s*paragraph/.test(lower)) {
    mode = 'paragraphs';
    count = parseInt(lower.match(/(\d+)\s*paragraph/)[1], 10);
  } else if (/(\d+)\s*word/.test(lower)) {
    mode = 'words';
    count = parseInt(lower.match(/(\d+)\s*word/)[1], 10);
  } else if (/(\d+)\s*sentence/.test(lower)) {
    mode = 'sentences';
    count = parseInt(lower.match(/(\d+)\s*sentence/)[1], 10);
  } else if (/paragraph/.test(lower)) {
    mode = 'paragraphs';
    var numM = lower.match(/(\d+)/);
    if (numM) count = parseInt(numM[1], 10);
  } else if (/word/.test(lower)) {
    mode = 'words';
    var numW = lower.match(/(\d+)/);
    if (numW) count = parseInt(numW[1], 10);
  } else if (/sentence/.test(lower)) {
    mode = 'sentences';
    var numS = lower.match(/(\d+)/);
    if (numS) count = parseInt(numS[1], 10);
  } else {
    // Check for a bare number
    var bareNum = lower.match(/(\d+)/);
    if (bareNum) count = parseInt(bareNum[1], 10);
  }

  // Clamp counts
  if (count < 1) count = 1;
  if (mode === 'paragraphs' && count > 20) count = 20;
  if (mode === 'sentences' && count > 100) count = 100;
  if (mode === 'words' && count > 2000) count = 2000;

  // --- Generate content ---
  var output = '';

  if (mode === 'paragraphs') {
    var parts = [];
    for (var i = 0; i < count; i++) {
      parts.push(paragraphs[i % paragraphs.length]);
    }
    output = parts.join('<br><br>');
  } else if (mode === 'sentences') {
    var sentParts = [];
    for (var j = 0; j < count; j++) {
      sentParts.push(allSentences[j % allSentences.length]);
    }
    output = sentParts.join(' ');
  } else if (mode === 'words') {
    var wordParts = [];
    for (var k = 0; k < count; k++) {
      wordParts.push(allWords[k % allWords.length]);
    }
    // Capitalize first word
    if (wordParts.length > 0) {
      wordParts[0] = wordParts[0].charAt(0).toUpperCase() + wordParts[0].substring(1);
    }
    output = wordParts.join(' ');
    // Add a period at the end if there isn't one
    if (output.charAt(output.length - 1) !== '.') {
      output += '.';
    }
  }

  // --- Word/char count for the generated text ---
  var plainText = output.replace(/<br>/g, ' ').replace(/<[^>]+>/g, '');
  var wordCount = plainText.split(/\s+/).filter(function (w) { return w.length > 0; }).length;
  var charCount = plainText.length;

  // --- Build HTML ---
  var html =
    '<strong style="color:var(--accent)">📄 Lorem Ipsum Generator</strong><br><br>' +
    '<div style="font-size:13px;line-height:1.6;max-height:400px;overflow-y:auto;padding:8px;background:var(--bg-secondary);border-radius:6px">' +
    output +
    '</div><br>' +
    '<span style="font-size:12px;color:var(--text-secondary)">' +
    count + ' ' + mode + ' | ' + wordCount + ' words | ' + charCount + ' characters<br>' +
    'Classic placeholder text since 1500 AD. The OG filler - no AI required.</span>';

  return { type: 'lorem-ipsum', html: html };
}
