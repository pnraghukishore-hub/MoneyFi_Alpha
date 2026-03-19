// MoneyFi Service Worker v4.2.42
// Fixes: chrome-extension cache errors, POST cache errors, failed network response errors

const CACHE_NAME = 'moneyfi-v4.2.42';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ── Install: precache app shell ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW] Precache skip:', url, err.message);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for app shell, network-first for API calls ──
self.addEventListener('fetch', event => {
  const req = event.request;

  // ── Guard: skip non-cacheable requests ──
  // 1. Only cache GET requests (POST, PUT, DELETE etc. cannot be cached)
  if (req.method !== 'GET') return;

  // 2. Only cache http/https — skip chrome-extension://, data:, blob: etc.
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 3. Skip external API calls that have CORS issues — let them go direct
  const skipDomains = [
    'data-asg.goldprice.org',    // CORS blocked
    'api.metals.live',            // sometimes fails
    'firestore.googleapis.com',   // Firebase handles its own caching
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'api.anthropic.com',          // AI API — never cache
    'cdn.jsdelivr.net',           // CDN — network only
  ];
  if (skipDomains.some(d => url.hostname.includes(d))) return;

  // 4. Skip Firebase POST/streaming endpoints
  if (url.hostname.includes('googleapis.com')) return;

  // ── Strategy: Cache-first for same-origin, network-first for CDN assets ──
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // Cache-first: serve from cache, update in background
    event.respondWith(
      caches.match(req).then(cached => {
        const networkFetch = fetch(req)
          .then(response => {
            // Only cache valid, non-opaque GET responses
            if (
              response &&
              response.status === 200 &&
              response.type !== 'opaque' &&
              req.method === 'GET'          // POST requests cannot be cached
            ) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(req, clone).catch(() => {});  // silently ignore
              });
            }
            return response;
          })
          .catch(() => null); // Network failed — fall back to cache

        return cached || networkFetch;
      })
    );
  } else {
    // Network-first for external CDN resources (fonts, Chart.js, etc.)
    event.respondWith(
      fetch(req)
        .then(response => {
          if (
            response &&
            response.status === 200 &&
            response.type !== 'opaque'
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(req, clone).catch(() => {});
            });
          }
          return response;
        })
        .catch(() => caches.match(req)) // Network failed — try cache
    );
  }
});
