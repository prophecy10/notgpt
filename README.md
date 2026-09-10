<div align="center">

# { NotGPT }

### Not everything needs AI.

A ChatGPT-style interface for simple tasks that don't require artificial intelligence.  
Calculate, convert, generate, format — all with math, not AI.

💧 **Save Water** — AI infrastructure consumes water for cooling. For simple tasks, skip the heavy computation.

[Live Demo](#) · [Report Bug](../../issues) · [Request Tool](../../issues)

</div>

---

## What is NotGPT?

NotGPT is a conversational utility tool that looks and feels like ChatGPT, but its fundamental purpose is the opposite.

Instead of using an LLM, NotGPT uses **deterministic algorithms, formulas, and pattern matching** to handle simple everyday tasks that people increasingly (and unnecessarily) ask AI to do.

**Philosophy:** *"If a deterministic algorithm can solve the problem reliably, use the algorithm instead of AI."*

## How It Works

```
User → types naturally → NLP parser identifies the utility → utility computes → result displayed
```

No API calls. No servers. No data collection. Everything runs **in your browser**.

## Tools Available

| Category | Tools |
|---|---|
| 📊 **Calculators** | Percentage, Basic arithmetic |
| 📅 **Date & Time** | Date difference, Countdown |
| 🔄 **Unit Conversion** | Length, Weight, Temperature, Data/Storage, Speed, Area, Volume, Cooking, Time (30+ conversions) |
| 📝 **Text** | Character count, Word count, Case converter (upper/lower/title/camel/snake/kebab) |
| { } **Developer** | JSON formatter |
| 🎲 **Generators** | Random number, Dice roll, Coin flip |
| 💪 **Everyday** | BMI calculator |

## Try It

Just type naturally:
- *"What is 18% of 4500?"*
- *"Convert 5 feet 8 inches to cm"*
- *"How many days until December 31 2026?"*
- *"Random number between 1 and 100"*
- *"How many characters in strawberry?"*
- *"uppercase hello world"*
- *"BMI for 170 cm and 65 kg"*

## Tech Stack

- **Frontend:** Pure HTML, CSS, JavaScript — no frameworks, no build tools
- **NLP:** Regex-based pattern matching (no AI, no NLP libraries)
- **Storage:** Browser localStorage only
- **Backend:** None. Zero. Nada.
- **Cost to run:** ₹0

## Contributing

We'd love your help! Adding a new tool is easy — create one JS file and register it in the parser.

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for the full guide.

## Project Structure

```
NotGPT/
├── web/                        ← Website (host on Vercel/Netlify)
│   ├── index.html
│   ├── css/style.css
│   ├── js/
│   │   ├── app.js              ← Core application
│   │   ├── parser.js           ← NLP routing + data
│   │   └── tools/              ← One file per tool
│   │       ├── percentage.js
│   │       ├── date-diff.js
│   │       ├── unit-converter.js
│   │       └── ... (10 tools)
│   └── assets/
├── android/                    ← Android app (coming soon)
├── docs/                       ← Documentation
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
