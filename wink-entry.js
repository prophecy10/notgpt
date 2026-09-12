// ============================================================================
// NotGPT — wink-nlp Browserify Entry Point (wink-entry.js)
// ============================================================================
// Usage:  npx browserify wink-entry.js -o web/js/wink-bundle.js
//
// This file is processed by browserify to create a single browser bundle
// that exposes the initialized wink-nlp instance and its helpers globally.
//
// The bundle includes:
//   - wink-nlp core
//   - wink-eng-lite-web-model (optimised for browser use)
//   - Sentence boundary detection (sbd)
//   - Part-of-speech tagging (pos)
//   - Named entity recognition (ner)
//   - Custom entity recognition (cer) — used for tool intent matching
// ============================================================================

var winkNLP = require('wink-nlp');
var model = require('wink-eng-lite-web-model');

// Initialize wink-nlp with all pipes we need
// 'cer' (custom entity recognition) is critical — it lets us define
// patterns for each tool so wink-nlp can detect intent from natural language
var nlp = winkNLP(model, ['sbd', 'pos', 'ner', 'cer']);

// Expose on window for use by wink-integration.js and other scripts
window.winkNLP = nlp;
window.winkIts = nlp.its;
window.winkAs = nlp.as;
