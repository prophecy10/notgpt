<div align="center">

# { NotGPT }

### Not everything needs AI.

A ChatGPT-style interface for simple tasks that don't require artificial intelligence.  
Calculate, convert, generate, format — all with math, not AI.

💧 **Save Water** — AI infrastructure consumes water for cooling. For simple tasks, skip the heavy computation.

<!-- Add the live site link here once you have the URL: [Live Demo](https://…) · -->
[Report Bug](../../issues) · [Request Tool](../../issues)

</div>

---

## What is NotGPT?

NotGPT is a conversational utility tool that looks and feels like ChatGPT, but its fundamental purpose is the opposite.

Instead of using an LLM, NotGPT uses **deterministic algorithms, formulas, and pattern matching** to handle simple everyday tasks that people increasingly (and unnecessarily) ask AI to do.

When it doesn't recognise a request, it says so and points you elsewhere. It never guesses.

**Philosophy:** *"If a deterministic algorithm can solve the problem reliably, use the algorithm instead of AI."*

## How It Works

```
User → types naturally → NLP parser identifies the utility → utility computes → result displayed
```

No AI APIs. No servers. Everything runs **in your browser**, and it keeps working **offline** once loaded (install it from your browser's menu like an app).

**Privacy:** nothing you type leaves your device. The one exception is opt-in: if you turn on *Share failed chats* in Settings, queries NotGPT couldn't answer are sent (with a timestamp, no user details) so new tools can be added, and are deleted after 7 days.

## Tools Available

| Category | Tools |
|---|---|
| 📊 **Calculators** | Percentage, arithmetic (order of operations, powers, roots, "3/4 of 120"), tip & bill split, discount, tax / GST |
| 📅 **Date & Time** | Days until / between / since, countdowns to holidays, age from date of birth, day of the week for any date |
| 🔄 **Unit Conversion** | Length, weight, temperature, data, speed, area, volume, cooking, time (30+ units) |
| 📝 **Text** | Character count, **letter count** ("how many r's in strawberry"), word count, case converter (upper/lower/title/camel/snake/kebab) |
| { } **Developer** | JSON formatter, Base64, URL encode/decode, UUID, password generator, lorem ipsum |
| 🎲 **Generators** | Random number, dice roll, coin flip |
| 💪 **Everyday** | BMI calculator |

Money answers use the currency you type (₹, $, €, £). Ambiguous dates like 01/02/2026 follow your browser's locale (1 Feb in India and the UK, Jan 2 in the US), and the answer always shows which date it used.

## Try It

Just type naturally:
- *"What is 18% of 4500?"*
- *"Convert 5 feet 8 inches to cm"*
- *"How many days until December 31 2026?"*
- *"Random number between 1 and 100"*
- *"How many r's in strawberry?"*
- *"How old am I if born on 15 May 1990?"*
- *"18% GST on 1000"*
- *"uppercase hello world"*
- *"BMI for 170 cm and 65 kg"*

## Tech Stack

- **Frontend:** Pure HTML, CSS, JavaScript — no frameworks, no build tools
- **Language handling:** regex pattern matching, a small typo fixer, and [winkNLP](https://winkjs.org/wink-nlp/) (a lightweight, rule-based NLP library, no AI model) for intent detection
- **Storage:** Browser localStorage only
- **Offline:** service worker (`web/sw.js`), installable as an app
- **Tests:** `npm test` runs 60 routing and answer checks in plain Node
- **Backend:** None. Zero. Nada.
- **Cost to run:** ₹0

## Contributing

We'd love your help! Adding a new tool is easy — create one JS file and register it in the parser. Add a few cases to `tests/run.js` and run `npm test` before opening a PR.

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for the full guide.

## Project Structure

```
NotGPT/
├── web/                        ← Website (host on Netlify/Vercel/GitHub Pages)
│   ├── index.html
│   ├── manifest.webmanifest    ← Install-as-app metadata
│   ├── sw.js                   ← Offline support
│   ├── css/style.css
│   ├── js/
│   │   ├── app.js              ← Chat UI, history, settings
│   │   ├── parser.js           ← Routing + messages
│   │   ├── nlp-preprocess.js   ← Typo fixes, word numbers, synonyms
│   │   ├── wink-integration.js ← Intent detection with winkNLP
│   │   └── tools/              ← One file per tool (20 files)
│   └── assets/
├── tests/                      ← npm test: routing + answer checks (Node, no deps)
├── docs/                       ← Architecture, contributing, opt-in endpoint script
├── android/                    ← Notes on the Android app (PWA works today)
├── README.md
└── LICENSE
```

## License

MIT License — see [LICENSE](LICENSE) for details.

## Disclaimer

NotGPT is **not affiliated with OpenAI or ChatGPT**. "GPT" is a trademark of OpenAI. We just think not everything needs it.

---

<div align="center">

**{ NotGPT }** — Simple tasks. Simple tools. No LLM required. 💧

</div>
