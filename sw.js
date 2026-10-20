/**
 * WHIP & WHISK - PWA SERVICE WORKER
 * Enables instant mobile app installation, fast offline caching & background sync
 */

const CACHE_NAME = 'whip-whisk-v1.4';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/style.css',
  '/admin.css',
  '/script.js',
  '/admin.js',
  '/manifest.json',
  '/assets/images/logo.jpg',
  '/assets/images/cookie_tin.jpg',
  '/assets/images/bento_cake.jpg',
  '/assets/images/heart_brownie_pops.jpg',
  '/assets/images/fudge_brownies_box.jpg',
  '/assets/images/brownie_skewers.jpg',
  '/assets/images/hero_bakery_display.jpg'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('PWA Precache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event (Clean old caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network first for API, Cache first for assets)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls: Network only (or fallback)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});
