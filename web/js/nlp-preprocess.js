// ============================================================================
// NotGPT — NLP Preprocessing Layer (nlp-preprocess.js)
// ============================================================================
// Runs BEFORE the parser to normalise user input for better tool matching.
//
// Pipeline (in order):
//   1. Trim & collapse whitespace
//   2. Contraction expansion
//   3. Leading filler word stripping
//   4. Word-to-number conversion
//   5. Synonym normalisation
//   6. Typo correction (Levenshtein-based)
//   7. Final cleanup
//
// Usage:  var cleaned = preprocessInput(rawUserInput);
//         var lower = cleaned.toLowerCase();
//         // ... pass to parser / tool matchers
// ============================================================================

function preprocessInput(text) {
  if (!text || typeof text !== 'string') return text || '';

  // --- Skip JSON input entirely ---
  var trimmed = text.trim();
  if (/^\s*[\{\[]/.test(trimmed)) return trimmed;

  // --- Detect colon-separated tool input (e.g. "format this json: {...}") ---
  // Only preprocess the part before the colon; preserve payload after it.
  var colonIdx = -1;
  var colonPatterns = [
    /\b(?:format|encode|decode|base64|convert|count|hash|url\s*encode|url\s*decode)\b.*?:\s*/i
  ];
  for (var cp = 0; cp < colonPatterns.length; cp++) {
    var cm = trimmed.match(colonPatterns[cp]);
    if (cm) {
      colonIdx = trimmed.indexOf(':', cm.index + cm[0].length - 1);
      if (colonIdx === -1) colonIdx = trimmed.indexOf(':');
      break;
    }
  }
  // Fallback: if there's a colon and the stuff after it looks like data, split
  if (colonIdx === -1) {
    var simpleColon = trimmed.indexOf(':');
    if (simpleColon > 3 && simpleColon < trimmed.length - 1) {
      var afterColon = trimmed.slice(simpleColon + 1).trim();
      // If it starts with { or [ or is very long, treat as payload
      if (/^\s*[\{\[]/.test(afterColon) || afterColon.length > 200) {
        colonIdx = simpleColon;
      }
    }
  }

  var prefix, payload;
  if (colonIdx > 0) {
    prefix = trimmed.slice(0, colonIdx);
    payload = trimmed.slice(colonIdx); // includes the colon
  } else {
    prefix = trimmed;
    payload = '';
  }

  // Run the pipeline on the prefix only
  prefix = _step1_whitespace(prefix);
  prefix = _step2_contractions(prefix);
  prefix = _step3_fillers(prefix);
  prefix = _step4_wordToNumber(prefix);
  prefix = _step5_synonyms(prefix);
  prefix = _step6_typos(prefix);
  prefix = _step7_cleanup(prefix);

  return (prefix + payload).trim();
}


// ============================================================================
// STEP 1: Trim & collapse whitespace
// ============================================================================
function _step1_whitespace(s) {
  return s.replace(/[\t\r\n]+/g, ' ').replace(/  +/g, ' ').trim();
}


// ============================================================================
// STEP 2: Contraction expansion
// ============================================================================
var _contractions = {
  "what's":  "what is",
  "whats":   "what is",
  "how's":   "how is",
  "hows":    "how is",
  "it's":    "it is",
  "don't":   "do not",
  "dont":    "do not",
  "can't":   "cannot",
  "cant":    "cannot",
  "won't":   "will not",
  "wont":    "will not",
  "i'm":     "i am",
  "im":      "i am",
  "that's":  "that is",
  "thats":   "that is",
  "there's": "there is",
  "theres":  "there is",
  "who's":   "who is",
  "whos":    "who is",
  "let's":   "let us",
  "lets":    "let us",
  "didn't":  "did not",
  "didnt":   "did not",
  "doesn't": "does not",
  "doesnt":  "does not",
  "isn't":   "is not",
  "isnt":    "is not",
  "aren't":  "are not",
  "arent":   "are not",
  "wasn't":  "was not",
  "wasnt":   "was not",
  "couldn't":"could not",
  "couldnt": "could not",
  "wouldn't":"would not",
  "wouldnt": "would not",
  "shouldn't":"should not",
  "shouldnt":"should not",
  "haven't": "have not",
  "havent":  "have not",
  "hasn't":  "has not",
  "hasnt":   "has not",
  "they're": "they are",
  "theyre":  "they are",
  "you're":  "you are",
  "youre":   "you are"
};

function _step2_contractions(s) {
  // Replace whole-word matches, preserving surrounding case
  return s.replace(/\b[\w']+\b/g, function(word) {
    var lower = word.toLowerCase();
    if (_contractions[lower] !== undefined) {
      // Preserve capitalisation of first letter
      var replacement = _contractions[lower];
      if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
        replacement = replacement[0].toUpperCase() + replacement.slice(1);
      }
      return replacement;
    }
    return word;
  });
}


// ============================================================================
// STEP 3: Leading filler word stripping
// ============================================================================
function _step3_fillers(s) {
  // Strip common conversational fillers from the START of input only.
  // We loop because fillers can stack: "hey um can you please calculate..."
  var prev;
  do {
    prev = s;
    s = s.replace(
      /^(?:hey|yo|hi|hello|please|pls|plz|kindly|umm?|uh+|hmm+|okay|ok|so|well|actually|basically|just|like)\b[,.]?\s*/i,
      ''
    );
    // Multi-word fillers
    s = s.replace(
      /^(?:can you|could you|would you|will you|i want to|i need to|i'd like to|i would like to|do me a favor and|be so kind and|help me with|help me)\s+/i,
      ''
    );
  } while (s !== prev && s.length > 0);
  return s;
}


// ============================================================================
// STEP 4: Word-to-number conversion
// ============================================================================
var _ones = {
  'zero':0,'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,
  'eight':8,'nine':9,'ten':10,'eleven':11,'twelve':12,'thirteen':13,
  'fourteen':14,'fifteen':15,'sixteen':16,'seventeen':17,'eighteen':18,
  'nineteen':19
};
var _tens = {
  'twenty':20,'thirty':30,'forty':40,'fifty':50,'sixty':60,'seventy':70,
  'eighty':80,'ninety':90
};
var _specials = { 'dozen': 12, 'half': 0.5, 'quarter': 0.25 };

function _step4_wordToNumber(s) {
  // Strategy: scan for sequences of number words and replace them.
  // We work on the lowered version to detect, but patch the original string.

  var lower = s.toLowerCase();
  var words = lower.split(/\s+/);
  var origWords = s.split(/\s+/);
  var result = [];
  var i = 0;

  while (i < words.length) {
    var consumed = _tryParseNumberSequence(words, i);
    if (consumed) {
      result.push(String(consumed.value));
      i = consumed.endIndex;
    } else {
      result.push(origWords[i]);
      i++;
    }
  }

  return result.join(' ');
}

function _tryParseNumberSequence(words, start) {
  // Try to parse a multi-word number starting at index `start`.
  // Returns { value, endIndex } or null.

  var i = start;
  var total = 0;
  var current = 0;
  var found = false;

  // Handle "a hundred", "a thousand", "a million"
  if (words[i] === 'a' && i + 1 < words.length) {
    if (words[i+1] === 'hundred') { current = 100; i += 2; found = true; }
    else if (words[i+1] === 'thousand') { total = 1000; i += 2; found = true; }
    else if (words[i+1] === 'million') { total = 1000000; i += 2; found = true; }
  }

  while (i < words.length) {
    var w = words[i];

    // Skip "and" between number words (e.g., "two hundred and fifty")
    if (w === 'and' && found && i + 1 < words.length) {
      // Peek ahead: is the next word a number word?
      var peek = words[i+1];
      if (_ones[peek] !== undefined || _tens[peek] !== undefined) {
        i++;
        continue;
      }
    }

    if (_ones[w] !== undefined) {
      current += _ones[w];
      i++;
      found = true;
    } else if (_tens[w] !== undefined) {
      current += _tens[w];
      i++;
      found = true;
    } else if (w === 'hundred' && found) {
      current = (current === 0 ? 1 : current) * 100;
      i++;
    } else if (w === 'thousand' && found) {
      current = (current === 0 ? 1 : current) * 1000;
      total += current;
      current = 0;
      i++;
    } else if (w === 'million' && found) {
      current = (current === 0 ? 1 : current) * 1000000;
      total += current;
      current = 0;
      i++;
    } else if (w === 'point' && found && i + 1 < words.length) {
      // Handle "three point five" -> 3.5
      // Also "three point five million" -> 3500000
      // Collect decimal digit words
      i++;
      var decimalStr = '';
      while (i < words.length && _ones[words[i]] !== undefined) {
        decimalStr += String(_ones[words[i]]);
        i++;
      }
      if (decimalStr.length > 0) {
        // Store the decimal number in current so multipliers (million, thousand) can still apply
        current = parseFloat(String(total + current) + '.' + decimalStr);
        total = 0;
      }
    } else {
      break;
    }
  }

  if (!found) {
    // Check specials as standalone
    var w2 = words[start];
    if (_specials[w2] !== undefined) {
      return { value: _specials[w2], endIndex: start + 1 };
    }
    return null;
  }

  total += current;
  return { value: total, endIndex: i };
}


// ============================================================================
// STEP 5: Synonym normalisation
// ============================================================================
function _step5_synonyms(s) {
  // Math operators
  s = s.replace(/\bsubtract\b/gi, 'minus');
  s = s.replace(/\badd\b/gi, 'plus');
  s = s.replace(/\bmultiply(?:\s+by)?\b/gi, 'times');
  s = s.replace(/\bdivide(?:\s+by)?\b/gi, 'divided by');

  // Percentage
  s = s.replace(/\bper\s*cent\b/gi, 'percent');
  s = s.replace(/\bpct\b/gi, 'percent');

  // Conversion
  s = s.replace(/\btransform\b/gi, 'convert');
  // "change X to Y" -> "convert X to Y" (only when followed by "to")
  s = s.replace(/\bchange\s+(.*?\s+to\s+)/gi, 'convert $1');

  return s;
}


// ============================================================================
// STEP 6: Typo correction (Levenshtein-based)
// ============================================================================

// Common misspellings - always corrected (no distance check needed)
var _hardcodedTypos = {
  'percnet': 'percent', 'percnt': 'percent', 'persent': 'percent',
  'precentage': 'percentage', 'percantage': 'percentage', 'percentge': 'percentage',
  'caculate': 'calculate', 'calcualte': 'calculate', 'calculat': 'calculate',
  'claculate': 'calculate', 'calulate': 'calculate',
  'convrt': 'convert', 'conver': 'convert', 'covert': 'convert',
  'betwee': 'between', 'beetween': 'between', 'betwen': 'between',
  'randon': 'random', 'radom': 'random', 'randm': 'random',
  'temprature': 'temperature', 'temperture': 'temperature', 'tempreture': 'temperature',
  'farenheit': 'fahrenheit', 'farenheight': 'fahrenheit', 'farenhiet': 'fahrenheit',
  'fahrenhiet': 'fahrenheit', 'fahreheit': 'fahrenheit', 'fahreinheit': 'fahrenheit',
  'celcius': 'celsius', 'celsuis': 'celsius', 'celcuis': 'celsius',
  'kilomter': 'kilometer', 'kilmeter': 'kilometer', 'kilometre': 'kilometer',
  'centimter': 'centimeter', 'centimetre': 'centimeter',
  'milimeter': 'millimeter', 'milimetre': 'millimeter', 'millimetre': 'millimeter',
  'genrate': 'generate', 'generae': 'generate', 'generat': 'generate',
  'pasword': 'password', 'passwrd': 'password', 'passowrd': 'password',
  'discont': 'discount', 'dicount': 'discount', 'discout': 'discount',
  'diffrence': 'difference', 'diferrence': 'difference', 'differece': 'difference',
  'foramt': 'format', 'fromats': 'formats', 'fromat': 'format',
  'cahracter': 'character', 'charcter': 'character', 'charachter': 'character',
  'sentance': 'sentence', 'sentense': 'sentence',
  'paragrah': 'paragraph', 'paragrpah': 'paragraph',
  'encde': 'encode', 'encod': 'encode',
  'decde': 'decode', 'decod': 'decode',
  'loream': 'lorem', 'loren': 'lorem',
  'ipusm': 'ipsum', 'ispum': 'ipsum',
  'placeholdr': 'placeholder', 'plceholder': 'placeholder',
  'numbr': 'number', 'nubmer': 'number', 'numbre': 'number',
  'lenght': 'length', 'legnth': 'length',
  'wieght': 'weight', 'weigth': 'weight', 'weght': 'weight',
  'hieght': 'height', 'heigth': 'height', 'heght': 'height',
  'strng': 'strong', 'stron': 'strong',
  'mximum': 'maximum', 'maximun': 'maximum',
  'minimun': 'minimum', 'minium': 'minimum',
  'avrage': 'average', 'averge': 'average', 'avarage': 'average',
  'intrest': 'interest', 'interes': 'interest', 'interst': 'interest',
  'mortage': 'mortgage', 'morgage': 'mortgage',
  'amortiation': 'amortization', 'amortizaton': 'amortization',
  'princpal': 'principal', 'prinicpal': 'principal',
  'compund': 'compound', 'compoud': 'compound'
  ,'filp': 'flip', 'fllip': 'flip',
  'coun': 'coin', 'coiin': 'coin'
};

// Short-word hardcoded fixes (below 4-char threshold for Levenshtein)
var _shortTypos = {
  'hw': 'how', 'mch': 'much', 'wht': 'what', 'wat': 'what',
  'ot': 'of', 'fo': 'of', 'te': 'the', 'teh': 'the',
  'fro': 'from', 'tme': 'time', 'dte': 'date', 'hwo': 'how'
};
// Dictionary of valid keywords for Levenshtein matching
var _knownWords = [
  'percent','percentage','calculate','calculator','compute','convert','conversion',
  'between','random','temperature','fahrenheit','celsius','kilometer','centimeter',
  'millimeter','meter','inch','inches','feet','foot','yard','mile','miles',
  'kilogram','gram','pound','pounds','ounce','ounces','liter','litre',
  'gallon','cup','tablespoon','teaspoon','pint','quart',
  'generate','password','discount','difference','format','character','characters',
  'sentence','sentences','paragraph','paragraphs','encode','decode','lorem','ipsum',
  'placeholder','number','length','weight','height','strong','maximum','minimum',
  'average','interest','mortgage','amortization','principal','compound',
  'binary','octal','hexadecimal','decimal',
  'uppercase','lowercase','camelcase','snakecase',
  'date','days','weeks','months','years','today','tomorrow','yesterday',
  'birthday','minutes','hours','seconds',
  'area','volume','speed','distance',
  'square','root','power','factorial',
  'tip','bill','split','total','price','cost','tax','sale',
  'words','lines','count',
  'uuid','guid','unique',
  'base64','json','many','much','from','into','with','have','that','this',
  'what','which','does','will','just','some','more','each','than','them',
  'most','only','also','when','then','make','find','tell','give','take',
  'coin','flip','dice','roll',
  'bmi','body','mass','index'
];

function _levenshtein(a, b) {
  // Short-circuit: if length difference > 2, distance is definitely > 2
  if (Math.abs(a.length - b.length) > 2) return 3;
  if (a === b) return 0;

  var la = a.length, lb = b.length;
  // Use single-row DP for space efficiency
  var prev = [];
  var curr = [];
  var i, j;

  for (j = 0; j <= lb; j++) prev[j] = j;

  for (i = 1; i <= la; i++) {
    curr[0] = i;
    for (j = 1; j <= lb; j++) {
      var cost = a[i-1] === b[j-1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j-1] + 1,    // insertion
        prev[j-1] + cost   // substitution
      );
    }
    var tmp = prev;
    prev = curr;
    curr = tmp;
  }
  return prev[lb];
}

function _findClosestWord(word) {
  var best = null;
  var bestDist = 3; // threshold: max distance 2
  for (var k = 0; k < _knownWords.length; k++) {
    var d = _levenshtein(word, _knownWords[k]);
    if (d < bestDist) {
      bestDist = d;
      best = _knownWords[k];
      if (d === 1) break; // close enough, stop early
    }
  }
  return best;
}

function _step6_typos(s) {
  s = s.replace(/\b[a-zA-Z]{4,}\b/g, function(word) {
    var lower = word.toLowerCase();

    // Skip common English words that should never be "corrected"
    var _skipWords = ['many','much','from','into','with','have','does','will',
      'that','this','what','which','just','some','more','each','than','them',
      'most','only','also','when','then','make','find','tell','give','take',
      'your','about','would','could','should','there','their','where','other',
      'been','were','very','here','over','after','before','under','every',
      'times','plus','minus','divided','hello','help','world','like','open',
      'need','want','show','know','look','work','long','last','first','next'];
    if (_skipWords.indexOf(lower) !== -1) return word;

    // Skip if it is already a known word
    if (_knownWords.indexOf(lower) !== -1) return word;

    // Check hardcoded misspellings first
    if (_hardcodedTypos[lower]) {
      var fixed = _hardcodedTypos[lower];
      // Preserve capitalisation
      if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
        fixed = fixed[0].toUpperCase() + fixed.slice(1);
      }
      return fixed;
    }

    // Levenshtein fuzzy match
    var closest = _findClosestWord(lower);
    if (closest) {
      // Preserve capitalisation
      if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
        closest = closest[0].toUpperCase() + closest.slice(1);
      }
      return closest;
    }

    return word;
  });

  // Also fix short words (below 4-char threshold)
  s = s.replace(/\b[a-zA-Z]{2,3}\b/g, function(word) {
    var lower = word.toLowerCase();
    if (_shortTypos[lower]) {
      var fixed = _shortTypos[lower];
      if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
        fixed = fixed[0].toUpperCase() + fixed.slice(1);
      }
      return fixed;
    }
    return word;
  });

  return s;
}


// ============================================================================
// STEP 7: Final cleanup
// ============================================================================
function _step7_cleanup(s) {
  return s.replace(/  +/g, ' ').trim();
}


// ============================================================================
// TEST EXAMPLES (uncomment to verify in browser console)
// ============================================================================
/*
var tests = [
  ["hey whats 18 percnet of 4500",                 "what is 18 percent of 4500"],
  ["can you caculate twenty plus thirty",           "calculate 20 plus 30"],
  ["convrt 55 celcius to farenheit",                "convert 55 celsius to fahrenheit"],
  ["pls generate a randon number betwee 1 and 100", "generate a random number between 1 and 100"],
  ["what's 30% off $250",                           "what is 30% off $250"],
  ["how many words in hello world",                 "how many words in hello world"],
  ["um ok so basically multiply 5 by 10",           "5 times 10"],
  ["base64 encode: SGVsbG8gV29ybGQ=",              "base64 encode: SGVsbG8gV29ybGQ="],
  ["one hundred and fifty plus two hundred",        "150 plus 200"],
  ["three point five million",                      "3500000"],
  ["hey yo what is fifteen percent of a thousand",  "what is 15 percent of 1000"],
];

tests.forEach(function(t) {
  var result = preprocessInput(t[0]);
  var pass = result === t[1];
  console.log((pass ? "PASS" : "FAIL") + ": \"" + t[0] + "\"");
  if (!pass) {
    console.log("  Expected: \"" + t[1] + "\"");
    console.log("  Got:      \"" + result + "\"");
  }
});
*/
