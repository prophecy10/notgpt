/* sw.js — lets NotGPT open and work with no internet.
   Every tool runs in the browser, so caching the app's own files is enough.
   Same-origin files are served from cache and refreshed in the background;
   the icon font (cdnjs) is cached the first time it loads.
   The opt-in feedback endpoint is never cached or intercepted. */
const CACHE = 'notgpt-v1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/style.css', 'assets/favicon.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'js/tools/percentage.js', 'js/tools/date-diff.js', 'js/tools/unit-converter.js', 'js/tools/random.js', 'js/tools/json-formatter.js', 'js/tools/char-count.js', 'js/tools/word-count.js', 'js/tools/case-convert.js', 'js/tools/arithmetic.js', 'js/tools/bmi.js', 'js/nlp-preprocess.js', 'js/tools/money.js', 'js/tools/tip-calculator.js', 'js/tools/discount.js', 'js/tools/tax-calculator.js', 'js/tools/password-generator.js', 'js/tools/base64.js', 'js/tools/url-encode.js', 'js/tools/uuid-generator.js', 'js/tools/lorem-ipsum.js', 'js/parser.js', 'js/wink-bundle.js', 'js/wink-integration.js', 'js/app.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(FILES.map(u => c.add(new Request(u, {cache: 'reload'})).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const cdn = url.hostname === 'cdnjs.cloudflare.com';
  if (!sameOrigin && !cdn) return;

  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, {ignoreSearch: sameOrigin}) || (req.mode === 'navigate' ? await c.match('index.html') : null);
    if (cdn && hit) return hit;                         // versioned CDN URLs never change
    const net = fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') c.put(req.mode === 'navigate' ? 'index.html' : req, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response('Offline', {status: 503});
  }));
});
