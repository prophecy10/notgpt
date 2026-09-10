# NotGPT Architecture

## Overview

NotGPT is a 100% client-side web application. No backend, no APIs, no build tools.

```
┌──────────────────────────────────────────────────┐
│                   Browser                         │
│                                                   │
│  ┌─────────┐    ┌──────────┐    ┌──────────────┐ │
│  │  User    │───▶│  Parser  │───▶│  Tool        │ │
│  │  Input   │    │  (NLP)   │    │  (Compute)   │ │
│  └─────────┘    └──────────┘    └──────────────┘ │
│                       │                │          │
│                       │ no match       │ result   │
│                       ▼                ▼          │
│                 ┌──────────┐    ┌──────────────┐ │
│                 │ Fallback │    │  Display     │ │
│                 │ Response │    │  Result      │ │
│                 └──────────┘    └──────────────┘ │
│                                                   │
│  Storage: localStorage only (browser)             │
│  Network: zero API calls                          │
└──────────────────────────────────────────────────┘
```

## File Structure

```
web/
├── index.html          ← HTML structure, script loading order
├── css/style.css       ← All styles (dark theme, responsive)
├── js/
│   ├── parser.js       ← NLP router + data arrays
│   ├── app.js          ← Core UI, chat history, settings
│   └── tools/          ← One file per tool (self-contained)
```

## How the Parser Works

1. User types a message
2. `sendMessage()` in app.js calls `parseAndRoute(text)` in parser.js
3. `parseAndRoute()` tries each tool function in order:
   - `tryPercentage()` → `tryDateDifference()` → `tryUnitConversion()` → ...
4. First tool that returns non-null wins
5. If all tools return null → fallback response (quirky + ChatGPT link)

## Adding a New Tool

See [CONTRIBUTING.md](CONTRIBUTING.md) and [TOOL_TEMPLATE.md](TOOL_TEMPLATE.md).

## Script Loading Order

Order matters because tools must be loaded before the parser, and parser before app:

1. **Tool files** (any order among themselves)
2. **parser.js** (references tool functions)
3. **app.js** (references parser + tool functions, runs init)

## localStorage Usage

| Key | What | Max Size |
|---|---|---|
| `notgpt_chats` | Array of chat objects (messages, names, timestamps) | ~25 chats |
| `notgpt_settings` | User preferences (chat limit, share toggle) | Tiny |

## CSS Classes for Tools

| Class | Description |
|---|---|
| `.result-box` | Blue-bordered container for results |
| `.result-value` | Large, bold result number |
| `.result-detail` | Smaller detail text |

## Design Principles

1. **No build step** — Open index.html and it works
2. **No dependencies** — Pure vanilla JS, no npm
3. **One tool = one file** — Easy to understand and contribute
4. **Deterministic** — Same input always gives same output
5. **Privacy first** — Zero data leaves the browser
