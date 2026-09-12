// ============================================================================
// NotGPT — wink-nlp Integration Layer (wink-integration.js)
// ============================================================================
// Bridges: nlp-preprocess.js → wink-nlp (custom entities) → tool execution
//
// Load order in HTML:
//   1. wink-bundle.js        (sets window.winkNLP, winkIts, winkAs)
//   2. nlp-preprocess.js     (provides preprocessInput())
//   3. parser.js             (provides tryPercentage, tryArithmetic, etc.)
//   4. tools/*.js            (tool implementations)
//   5. wink-integration.js   (THIS FILE — wires everything together)
//   6. app.js                (UI layer, calls parseAndRoute)
//
// Design principles:
//   - wink-nlp custom entities are an ADDITIONAL matching layer
//   - If wink-nlp isn't loaded (bundle failed), everything works via regex
//   - All tool functions (tryPercentage, etc.) still do the actual parsing
//   - Uses `var` throughout for max browser compatibility
//   - No eval(), no new Function(), no /s regex flag
// ============================================================================


// ============================================================================
// SECTION 1: Custom Entity Definitions
// ============================================================================

/**
 * Register custom entity patterns with wink-nlp for intent detection.
 * Each entity maps to one of the 19 tools (11 existing + 8 new).
 *
 * These patterns are intentionally broad — they're meant to DETECT intent,
 * not extract values. The actual number extraction and computation is still
 * handled by the regex-based tryXxx() functions.
 *
 * @returns {boolean} true if wink-nlp is available and patterns were registered
 */
function initWinkEntities() {
  if (!window.winkNLP) {
    console.warn('wink-nlp not loaded, falling back to regex parser');
    return false;
  }

  var nlp = window.winkNLP;

  // Define custom entity patterns for tool matching
  nlp.learnCustomEntities([

    // --- Percentage: "18% of 4500", "what is 15 percent of 200" ---
    { name: 'percentQuery', patterns: [
      '[NUMBER] [percent|%] [|of] [|NUMBER]',
      '[NUMBER] [percent|%] [of] NUMBER'
    ]},

    // --- Date difference: "days between date and date" ---
    { name: 'dateQuery', patterns: [
      '[|how] [|many] days between',
      'days [from|since|until|till|to]',
      'how [many|long] [|days|weeks|months|years] [between|from|since|until|till]'
    ]},

    // --- Unit conversion: "convert 55 celsius to fahrenheit" ---
    { name: 'convertQuery', patterns: [
      '[|convert] NUMBER [NOUN|PROPN] [to|in|into] [NOUN|PROPN]'
    ]},

    // --- Random number ---
    { name: 'randomQuery', patterns: [
      '[|generate] [|a] random [number|integer]',
      'roll [|a] [dice|die]',
      'flip [|a] coin',
      '[|pick] [|a] random [|number] [between|from]'
    ]},

    // --- JSON format ---
    { name: 'jsonQuery', patterns: [
      '[format|beautify|prettify|pretty|indent|validate] [|this|my] json',
      'json [format|formatter|beautify|prettify|pretty|indent]'
    ]},

    // --- Character count ---
    { name: 'charCountQuery', patterns: [
      '[|how] [|many] [characters|chars|letters] [in|of]',
      'character [count|counter]',
      'char [count|counter]',
      'count [|the] [characters|chars|letters]'
    ]},

    // --- Word count ---
    { name: 'wordCountQuery', patterns: [
      '[|how] [|many] words [in|of]',
      'word [count|counter]',
      'count [|the] words'
    ]},

    // --- Case convert ---
    { name: 'caseQuery', patterns: [
      '[|to|make|convert] [uppercase|lowercase|upper|lower|title|camel|snake|kebab] [|case]',
      '[uppercase|lowercase|upper|lower|title|camel|snake|kebab] [case|this|convert]'
    ]},

    // --- Arithmetic ---
    { name: 'mathQuery', patterns: [
      'NUMBER [plus|minus|times|divided] [|by] NUMBER',
      '[|square] root [|of] NUMBER',
      'sqrt [|of] NUMBER',
      'NUMBER [to|raised] [|the] power [|of] NUMBER'
    ]},

    // --- BMI ---
    { name: 'bmiQuery', patterns: [
      'bmi',
      'body mass index',
      'bmi [calculator|calc]'
    ]},

    // --- Tip calculator ---
    { name: 'tipQuery', patterns: [
      '[|calculate] [|a|the] tip [|on|for]',
      '[NUMBER] [percent|%] tip [|on|for]',
      'tip [calculator|calc]',
      'split [|the|a] bill'
    ]},

    // --- Discount ---
    { name: 'discountQuery', patterns: [
      '[NUMBER] [percent|%] [off|discount] [|of|on]',
      '[|calculate] discount [|on|for|of]',
      'price after [NUMBER] [percent|%] [off|discount]',
      'sale price'
    ]},

    // --- Tax calculator ---
    { name: 'taxQuery', patterns: [
      '[NUMBER] [percent|%] [tax|gst|vat] [|on|for|of]',
      '[add|remove|calculate] [tax|gst|vat]',
      '[tax|gst|vat] [on|for|of|calculator]',
      'price [before|after|including|with|without] tax'
    ]},

    // --- Password generator ---
    { name: 'passwordQuery', patterns: [
      '[generate|create|make] [|a|me] [|strong|secure|random] password',
      '[strong|secure|random] password',
      'password [generator|gen]',
      '[generate|create] [|a] passphrase'
    ]},

    // --- Base64 ---
    { name: 'base64Query', patterns: [
      'base64 [encode|decode|convert]',
      '[encode|decode|convert] [to|from] base64',
      '[encode|decode] base64'
    ]},

    // --- URL encode/decode ---
    { name: 'urlEncodeQuery', patterns: [
      'url [encode|decode]',
      '[encode|decode] url',
      'percent [encode|decode]',
      'urlencode',
      'urldecode'
    ]},

    // --- UUID generator ---
    { name: 'uuidQuery', patterns: [
      '[generate|create|new|make] [|a|me] [uuid|guid|unique]',
      'uuid [generator|gen]',
      'guid [generator|gen]'
    ]},

    // --- Lorem ipsum ---
    { name: 'loremQuery', patterns: [
      'lorem [ipsum|generator]',
      '[generate|create] [|some] [placeholder|filler|dummy|lorem] text',
      '[placeholder|filler|dummy] text [|generator]',
      'lorem ipsum'
    ]}

  ]);

  return true;
}


// ============================================================================
// SECTION 2: Enhanced Parse and Route
// ============================================================================

/**
 * Enhanced parser that uses wink-nlp custom entity detection as the primary
 * intent matching layer, with regex fallback for robustness.
 *
 * Flow:
 *   1. preprocessInput() cleans the raw input (typo fix, word→number, etc.)
 *   2. Check for help triggers
 *   3. Run wink-nlp custom entity detection for intent
 *   4. Route to the appropriate tryXxx() function
 *   5. If wink-nlp misses, fall through to regex chain
 *
 * @param {string} rawInput - The user's raw input text
 * @returns {Object|null} Parsed result object or null if no tool matched
 */
function parseAndRouteEnhanced(rawInput) {
  // Step 1: NLP Preprocessing (typo fix, word-to-number, synonyms, fillers)
  var cleaned = (typeof preprocessInput === 'function') ? preprocessInput(rawInput) : rawInput;
  var text = cleaned.trim();
  var lower = text.toLowerCase();

  // Step 2: Check help triggers first
  if (/^(what can you do|help|tools|\/tools|list tools|what do you support|what do you do|show me what you can do|capabilities|features)\??$/i.test(lower)) {
    return { type: 'help' };
  }

  // Step 3: Try wink-nlp custom entities for intent detection
  if (window.winkNLP) {
    var doc = window.winkNLP.readDoc(cleaned);
    var entities = doc.customEntities().out(window.winkIts.detail);

    if (entities.length > 0) {
      // Use the first matched custom entity as the intent
      var intent = entities[0].type;

      // Route to the appropriate tool based on intent
      // The tryXxx() functions still do the actual number extraction and computation
      var result = routeByIntent(intent, lower, text);
      if (result) return result;
    }
  }

  // Step 4: Fall back to regex-based parsing (existing parseAndRoute logic)
  return parseAndRouteFallback(lower, text);
}


// ============================================================================
// SECTION 3: Intent Router
// ============================================================================

/**
 * Routes a wink-nlp detected intent to the appropriate tool function.
 *
 * @param {string} intent  - The custom entity type name (e.g. 'percentQuery')
 * @param {string} lower   - Lowercased cleaned input
 * @param {string} text    - Original-case cleaned input
 * @returns {Object|null}  - Tool result or null if the tool function didn't match
 */
function routeByIntent(intent, lower, text) {
  switch (intent) {
    case 'percentQuery':   return tryPercentage(lower, text);
    case 'dateQuery':      return tryDateDifference(lower, text);
    case 'convertQuery':   return tryUnitConversionExpanded(lower, text);
    case 'randomQuery':    return tryRandomNumber(lower, text);
    case 'jsonQuery':      return tryJsonFormat(lower, text);
    case 'charCountQuery': return tryCharCount(lower, text);
    case 'wordCountQuery': return tryWordCount(lower, text);
    case 'caseQuery':      return tryCaseConvert(lower, text);
    case 'mathQuery':      return tryArithmetic(lower, text);
    case 'bmiQuery':       return tryBMI(lower, text);
    case 'tipQuery':       return tryTipCalculator(lower, text);
    case 'discountQuery':  return tryDiscount(lower, text);
    case 'taxQuery':       return tryTaxCalculator(lower, text);
    case 'passwordQuery':  return tryPasswordGenerator(lower, text);
    case 'base64Query':    return tryBase64(lower, text);
    case 'urlEncodeQuery': return tryUrlEncode(lower, text);
    case 'uuidQuery':      return tryUuidGenerator(lower, text);
    case 'loremQuery':     return tryLoremIpsum(lower, text);
    default:               return null;
  }
}


// ============================================================================
// SECTION 4: Regex Fallback Chain
// ============================================================================

/**
 * Falls back to the regex-based tool matching chain when wink-nlp
 * either isn't loaded or didn't detect a matching custom entity.
 *
 * This is the same logic as the original parseAndRoute — it tries each
 * tool function in priority order and returns the first match.
 *
 * @param {string} lower - Lowercased cleaned input
 * @param {string} text  - Original-case cleaned input
 * @returns {Object|null} - Tool result or null if nothing matched
 */
function parseAndRouteFallback(lower, text) {
  var result;

  // --- Existing 11 tools ---
  result = tryPercentage(lower, text);              if (result) return result;
  result = tryDateDifference(lower, text);          if (result) return result;
  result = tryUnitConversionExpanded(lower, text);  if (result) return result;
  result = tryRandomNumber(lower, text);            if (result) return result;
  result = tryJsonFormat(lower, text);              if (result) return result;
  result = tryCharCount(lower, text);               if (result) return result;
  result = tryWordCount(lower, text);               if (result) return result;
  result = tryCaseConvert(lower, text);             if (result) return result;
  result = tryArithmetic(lower, text);              if (result) return result;
  result = tryBMI(lower, text);                     if (result) return result;

  // --- New 8 tools ---
  result = tryTipCalculator(lower, text);           if (result) return result;
  result = tryDiscount(lower, text);                if (result) return result;
  result = tryTaxCalculator(lower, text);           if (result) return result;
  result = tryPasswordGenerator(lower, text);       if (result) return result;
  result = tryBase64(lower, text);                  if (result) return result;
  result = tryUrlEncode(lower, text);               if (result) return result;
  result = tryUuidGenerator(lower, text);           if (result) return result;
  result = tryLoremIpsum(lower, text);              if (result) return result;

  return null;
}


// ============================================================================
// SECTION 5: Initialisation (self-executing)
// ============================================================================

(function() {
  // Initialize wink custom entities
  var winkReady = initWinkEntities();

  // Override parseAndRoute to use enhanced version
  // The original parseAndRoute from parser.js is preserved as the fallback
  var _originalParseAndRoute = (typeof parseAndRoute === 'function') ? parseAndRoute : null;
  parseAndRoute = function(input) {
    return parseAndRouteEnhanced(input);
  };

  if (winkReady) {
    console.log('NotGPT: wink-nlp loaded, enhanced NLP active');
  } else {
    console.log('NotGPT: wink-nlp not available, using regex fallback');
  }
})();
