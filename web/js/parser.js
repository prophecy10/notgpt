// =================== NotGPT Parser ===================
// Data arrays and NLP routing logic

const categoryEmojis = {
  percentage: '📊', math: '🔢', tip: '💰', discount: '🏷️', tax: '🧾',
  date: '📅', age: '🎂', time: '⏰', timezone: '🌍',
  convert: '🔄', length: '📏', weight: '⚖️', temperature: '🌡️',
  text: '📝', count: '🔤', case: 'Aa', sort: '↕️',
  json: '{ }', base64: '🔐', uuid: '🆔', hash: '#️⃣', url: '🔗', regex: '.*',
  pw: '🔑', random: '🎲', lorem: '📄', color: '🎨',
  bmi: '💪', fuel: '⛽', cook: '🍳', recipe: '👨‍🍳', loan: '🏦',
  default: '💬'
};

// =================== 50 WELCOME MESSAGES ===================
const welcomeMessages = [
  { title: "Zero em dashes were used in this site.", sub: "If you know, you know. Built different. Actually." },
  { title: "Not every request needs AI.", sub: "Some just need good math. Type what you need - we'll calculate, convert, or generate it. No neurons (artificial or otherwise) harmed." },
  { title: "Remember Akinator? A no-AI genie.", sub: "We're like that, but for math and utilities. Ask us anything simple - percentages, conversions, random numbers. We guess what tool you need." },
  { title: "Thanks for deciding to save water. 💧", sub: "Every AI query uses compute. Every compute uses power. Every power plant uses water. For simple tasks, let's skip all that." },
  { title: "AI is great. But 18% of 4500 is just math.", sub: "You don't need a neural network to calculate a tip. Or convert feet to centimeters. Or format JSON. We handle the simple stuff - the old-fashioned way." },
  { title: "A calculator never hallucinated.", sub: "Just saying. Ask us to calculate, convert, generate, or format something. Deterministic answers, every single time." },
  { title: "Your pocket calculator deserves more respect.", sub: "It never needed a GPU cluster. It never drank water. And it never got 2+2 wrong. We're carrying that legacy forward." },
  { title: "We don't think. We compute.", sub: "And honestly? For most daily tasks, computing is all you need. Try us - percentage, date difference, unit conversion, random numbers..." },
  { title: "If math can solve it, why ask a robot?", sub: "Type your question naturally. We'll match it to the right tool and give you a precise answer. No LLM, no API calls, no water wasted." },
  { title: "Simple tools for simple tasks.", sub: "We're not replacing ChatGPT. We're just handling the stuff it shouldn't have to do. Percentages, conversions, generators - all local, all instant." },
  { title: "Zero AI inside. 100% useful.", sub: "Everything here runs on formulas, algorithms, and basic logic. The way computers were meant to work before everyone added AI to everything." },
  { title: "Casio called. It wants credit.", sub: "We're basically a Casio with a chat interface. Percentages, conversions, random numbers - the classics. No app subscription required." },
  { title: "We run on regex and determination.", sub: "No transformer models. No attention heads. Just pattern matching and arithmetic. Ask a question, get an answer. Simple." },
  { title: "This chat runs on zero watts of guilt.", sub: "No GPUs humming in a data center. No cooling systems draining reservoirs. Just your browser doing honest math." },
  { title: "Before AI, there was math.", sub: "And math still works. It's fast, precise, and doesn't need a $10 billion training run. Ask me to calculate something." },
  { title: "The abacus would be proud.", sub: "Thousands of years of computational tools, and the formula hasn't changed: input → math → output. That's us." },
  { title: "I'm what happens when you don't overthink it.", sub: "Need a percentage? Conversion? Random number? Just ask. No login, no token limits, no existential crisis." },
  { title: "Fun fact: 2+2 has never been controversial.", sub: "At least not for us. We deal in absolutes - mathematical ones. Try a calculation or conversion." },
  { title: "I'm a vending machine for math answers.", sub: "Insert question. Receive answer. No AI, no queue, no water used. Available 24/7 because JavaScript never sleeps." },
  { title: "Not smart. Just accurate.", sub: "We don't understand your question. We pattern-match it. And for calculations and conversions, that's all you need." },
  { title: "Every AI query uses ~10ml of water.", sub: "That's real. We made this tool so simple tasks don't have to contribute to that. Math locally. Water saved. You're welcome." },
  { title: "Welcome to the anti-AI AI.", sub: "We look like a chatbot but we're really a calculator in a trench coat. Ask us math stuff. We're very good at it." },
  { title: "The TI-84 was ahead of its time.", sub: "It did math without WiFi, without AI, without a subscription. We're honoring that legacy - in browser form." },
  { title: "I cost $0 to run. Take that, GPU cluster.", sub: "No servers, no inference costs, no carbon footprint. Just JavaScript and vibes. Try a calculation." },
  { title: "You found the off-grid calculator.", sub: "While everyone's busy training models on the entire internet, we're here doing 18% of 4500 the honest way." },
  { title: "Less artificial. More intelligence.", sub: "We actually give you the right answer - with math, not probability. Ask a percentage, conversion, or date question." },
  { title: "I peaked in the 90s, and I'm okay with that.", sub: "Back when calculators were tools, not apps. Back when 'cloud' meant weather. Ask me something simple - I'll show you the old ways." },
  { title: "This is a protest app. Against bloat.", sub: "Not every task needs an AI model, a cloud backend, and 4GB of RAM. Some tasks just need JavaScript. Like yours." },
  { title: "I once calculated 1 million percentages. No sweat.", sub: "Because I don't sweat. Or think. Or hallucinate. I'm a tool, and I'm proud of it. Try me." },
  { title: "Warning: May cause nostalgia for simpler times.", sub: "When you asked a computer a question and it just... answered. No 'as an AI language model' disclaimers. Just results." },
  { title: "The greenest query is the one that skips the data center.", sub: "For simple math and conversions, your browser is all you need. We run 100% client-side. Zero emissions." },
  { title: "I don't learn from your data. I can't.", sub: "I literally have no backend. Your questions stay in your browser. Your privacy is safe because I'm too simple to violate it." },
  { title: "Built different. Actually.", sub: "No neural networks, no embeddings, no attention mechanisms. Just regex, formulas, and a healthy respect for simplicity." },
  { title: "Need poetry? Go to ChatGPT. Need 18% of 4500? Stay here.", sub: "We know our lane. And our lane is math, conversions, and random numbers. We're really good in this lane." },
  { title: "Think of me as the opening act.", sub: "I handle the quick stuff - calculations, conversions, formatting. For the deep stuff, the headliner (ChatGPT) is just a click away." },
  { title: "I don't dream of electric sheep.", sub: "I dream of nothing because I'm a script tag. But I can calculate, convert, and generate random numbers like nobody's business." },
  { title: "My carbon footprint is literally zero.", sub: "Okay, your browser uses some power. But compared to a GPU farm? This is basically a rounding error. Ask me something!" },
  { title: "Honestly? Most of your daily queries don't need AI.", sub: "Tip calculations, unit conversions, date math - all solvable with basic formulas. That's what we're here for." },
  { title: "We're the decaf of chatbots.", sub: "All the utility, none of the artificial stuff. Works great for everyday tasks. Won't keep a data center up at night." },
  { title: "No model weights were loaded in the making of this chat.", sub: "Just HTML, CSS, and JavaScript. The holy trinity of the old web. Ask me to calculate something." },
  { title: "I'm a lookup table with personality.", sub: "My entire intelligence fits in one script tag. And you know what? For percentages and conversions, that's plenty." },
  { title: "Somewhere, a server just thanked you.", sub: "By using NotGPT for simple tasks, you're giving AI servers a break. They're overworked. Let them rest." },
  { title: "I don't scale. And that's my superpower.", sub: "No load balancers, no auto-scaling, no rate limits. I run in your browser. I am the edge in edge computing." },
  { title: "If a calculator and a chatbot had a baby.", sub: "It'd be me. Weird-looking? Maybe. But I can do percentages AND have a conversation about it. Sort of." },
  { title: "My training data is math class.", sub: "I learned everything I know from formulas, not from scraping the internet. My knowledge is small but provably correct." },
  { title: "We put the 'no' in innovation.", sub: "No AI. No cloud. No tracking. No subscriptions. Just tools. Sometimes saying no is the most innovative thing you can do." },
  { title: "I'm what you get when you ask 'do we really need AI for this?'", sub: "The answer is usually no. And I'm here for all those 'no' moments. Percentages, dates, conversions - bring 'em." },
  { title: "Welcome. I'm the intern.", sub: "ChatGPT is the senior engineer. I'm the intern who's really good at one thing: basic math. But I do it fast and free." },
  { title: "I may be simple, but at least I'm honest about it.", sub: "I'll tell you exactly what I can and can't do. And what I can't? I'll point you to ChatGPT. No ego here." },
];

// =================== 15+ LOADING MESSAGES ===================
const loadingMessages = [
  "Fixing the leaking tap...", "Carrying the 1...", "Consulting the abacus...",
  "Crunching without the cloud...", "Running locally... like a fridge...",
  "Saving a drop of water...", "No GPUs were harmed...", "Dusting off the calculator...",
  "Asking the math elves...", "Deterministically computing...",
  "Skipping the AI queue...", "Plugging into pure logic...",
  "Faster than a token generation...", "The humble algorithm at work...",
  "Zero carbon. Maximum math...", "Dividing by everything except zero...",
  "Consulting the ancient scrolls of arithmetic...", "Spinning up the abacus cluster...",
  "Borrowing from the tens column...", "Recalibrating the slide rule...",
];

// =================== 50 FALLBACK RESPONSES ===================
const fallbackResponses = [
  "Hmm, that sounds like a job for the big guys. 👉 <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>",
  "I'm flattered you asked, but I'm just a calculator with good vibes. Try <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> for that!",
  "That one's above my pay grade. I don't have a brain - just really fast math. 👉 <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>",
  "I wish I could help, but I'm literally a bunch of if-else statements. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> might know though!",
  "That requires actual intelligence. I only have the artificial-free kind. 👉 <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>",
  "I'm not that smart - I just pretend well with regex. Try <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>!",
  "My neurons are made of JavaScript, not silicon. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> is what you need.",
  "I'm a simple tool in a complex world. For that, you'll want <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>.",
  "I crunch numbers, not existential questions. 😅 <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> can handle that.",
  "If I could answer that, I'd be an AI. And then I'd need water cooling. 💧 Try <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>.",
  "That's a think-y question. I'm more of a calculate-y tool. 👉 <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>",
  "My skill set: math. My weakness: everything else. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> has you covered!",
  "A calculator tried to write poetry once. It didn't go well. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> is better at that.",
  "I ran that through my algorithm and got a shrug. 🤷 <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> might do better.",
  "That question needs neurons. Real ones or artificial - either way, not mine. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>",
  "I'm basically a Swiss Army knife - but only the blade and bottle opener. Try <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> for the corkscrew stuff.",
  "I don't have opinions. I have outputs. For opinions, there's <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>.",
  "Error 418: I'm a teapot, not a chatbot. ☕ <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> can help!",
  "I checked all my if-else branches. None of them cover that. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> probably has more branches.",
  "My parser looked at that and said 'nope'. <a href='https://chat.openai.com' target='_blank'>Ask ChatGPT</a> - it's braver than me.",
  "I tried. I really tried. But my regex doesn't understand feelings. 💔 <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> might.",
  "You're overestimating me and I appreciate the confidence. But try <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> for that one.",
  "If I had a nickel for every question I couldn't answer... I still couldn't count it. Wait, I can count. But I can't answer this. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>!",
  "That's like asking a toaster to write an essay. I toast numbers, not ideas. 👉 <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>",
  "My developer only taught me math and conversions. Blame them. Try <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> for the big brain stuff.",
  "Processing... processing... nah, I got nothing. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> is your friend here.",
  "I'm not ignoring your question - I genuinely don't know. 🤖 <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> does though.",
  "I'd need about 175 billion parameters to answer that. I have about 12. Try <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>.",
  "That's outside my jurisdiction. I only have authority over percentages and unit conversions. 👉 <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>",
  "My magic 8-ball says 'Ask Again at ChatGPT'. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> is ready for you!",
  "Look, I'm a calculator in a chat costume. For real conversations, try <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>.",
  "I searched my entire codebase. It's 400 lines and none of them help here. 👉 <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>",
  "My IQ is exactly NaN. For smart answers, <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> is right there.",
  "I'm like a golden retriever - enthusiastic but limited. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> is the one who went to Harvard.",
  "In a parallel universe, I can answer that. In this one, try <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>.",
  "My response to that is exactly what you'd expect from a glorified calculator: ¯\\_(ツ)_/¯. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> though...",
  "I only understand numbers and a few keywords. That had too many of the other kind of words. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> speaks human better.",
  "I maxed out my computational theory on this one. Which is to say: I have no idea. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> 👉",
  "That's a great question for something with actual intelligence. May I suggest <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>?",
  "I'm the equivalent of a 'Hello World' program that got ambitious. For that question, try <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>.",
  "My training data is literally just Math.js documentation. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> read the whole internet.",
  "I'm not being lazy - I genuinely can't process that. My brain is a switch statement. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> has the real brain.",
  "Asking me that is like asking Alexa to do your taxes. In theory possible, in practice: <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>.",
  "That's the kind of question that separates the AIs from the if-elses. I'm the if-else. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> is the AI.",
  "My honest answer? I don't know. My helpful answer? <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> probably does. 🙂",
  "Congratulations, you've found the edge of my abilities. It wasn't far. Try <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> for that.",
  "I appreciate your faith in me but that's like bringing a spoon to a sword fight. <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> has the sword.",
  "I did a full diagnostic. Result: I can't do that. Recommendation: <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>.",
  "My answer would be wrong, and unlike AI, I refuse to be confidently wrong. Try <a href='https://chat.openai.com' target='_blank'>ChatGPT</a> - it's usually right!",
  "That's a bit like asking a fish to climb a tree. I swim in numbers. For everything else: <a href='https://chat.openai.com' target='_blank'>ChatGPT</a>. 🐟",
];

// =================== NLP PARSER ENGINE ===================

function parseAndRoute(input) {
  const text = input.trim();
  const lower = text.toLowerCase();

  // 1. Check for help/tools triggers
  if (/^(what can you do|help|tools|\/tools|list tools|what do you support|what do you do|show me what you can do|capabilities|features)\??$/i.test(lower)) {
    return { type: 'help' };
  }

  // 2. Try each utility parser in order
  let result;

  result = tryPercentage(lower, text);
  if (result) return result;

  result = tryDateDifference(lower, text);
  if (result) return result;

  result = tryUnitConversionExpanded(lower, text);
  if (result) return result;

  result = tryRandomNumber(lower, text);
  if (result) return result;

  result = tryJsonFormat(lower, text);
  if (result) return result;


  result = tryCharCount(lower, text);
  if (result) return result;

  result = tryWordCount(lower, text);
  if (result) return result;

  result = tryCaseConvert(lower, text);
  if (result) return result;

  result = tryArithmetic(lower, text);
  if (result) return result;

  result = tryBMI(lower, text);
  if (result) return result;

  // No match → fallback
  return null;
}

// =================== CHAT NAMING ===================
function getCategoryEmoji(text) {
  const lower = text.toLowerCase();
  if (/%|percent/.test(lower)) return categoryEmojis.percentage;
  if (/\+|-|\*|\/|add|subtract|multiply|divide|sum|arithmetic/.test(lower)) return categoryEmojis.math;
  if (/tip/.test(lower)) return categoryEmojis.tip;
  if (/discount/.test(lower)) return categoryEmojis.discount;
  if (/tax/.test(lower)) return categoryEmojis.tax;
  if (/age|birthday|born/.test(lower)) return categoryEmojis.age;
  if (/date|day|month|year|between.*and/.test(lower)) return categoryEmojis.date;
  if (/time|hour|minute|second/.test(lower)) return categoryEmojis.time;
  if (/timezone|utc|ist|pst|est/.test(lower)) return categoryEmojis.timezone;
  if (/convert|feet|inch|cm|meter|mile|kg|pound|lb|fahrenheit|celsius/.test(lower)) return categoryEmojis.convert;
  if (/length/.test(lower)) return categoryEmojis.length;
  if (/weight/.test(lower)) return categoryEmojis.weight;
  if (/temperature|°/.test(lower)) return categoryEmojis.temperature;
  if (/word.*count|character.*count|count.*word/.test(lower)) return categoryEmojis.count;
  if (/uppercase|lowercase|camel|case/.test(lower)) return categoryEmojis.case;
  if (/sort/.test(lower)) return categoryEmojis.sort;
  if (/json/.test(lower)) return categoryEmojis.json;
  if (/base64/.test(lower)) return categoryEmojis.base64;
  if (/uuid/.test(lower)) return categoryEmojis.uuid;
  if (/hash|md5|sha/.test(lower)) return categoryEmojis.hash;
  if (/url|encode|decode/.test(lower)) return categoryEmojis.url;
  if (/regex/.test(lower)) return categoryEmojis.regex;
  if (/password/.test(lower)) return categoryEmojis.pw;
  if (/random|roll|dice|flip|coin/.test(lower)) return categoryEmojis.random;
  if (/lorem/.test(lower)) return categoryEmojis.lorem;
  if (/color|colour|hex|rgb/.test(lower)) return categoryEmojis.color;
  if (/bmi|body mass/.test(lower)) return categoryEmojis.bmi;
  if (/fuel|petrol|diesel|gas/.test(lower)) return categoryEmojis.fuel;
  if (/cook|cup|tablespoon|teaspoon/.test(lower)) return categoryEmojis.cook;
  if (/recipe|scale/.test(lower)) return categoryEmojis.recipe;
  if (/loan|emi|mortgage|interest/.test(lower)) return categoryEmojis.loan;
  return categoryEmojis.default;
}

function generateChatName(text) {
  const emoji = getCategoryEmoji(text);
  const truncated = text.length > 36 ? text.substring(0, 36) + '…' : text;
  return emoji + ' ' + truncated;
}