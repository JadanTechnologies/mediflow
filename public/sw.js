// MediFlow ERP - Service Worker for Offline POS & Inventory
const CACHE_NAME = 'mediflow-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Install Event: Pre-cache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline app shell');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[Service Worker] Non-critical precache notice:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache version:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Smart Cache Strategy (Network-First for navigation, Cache-First for static assets)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip cross-origin chrome extensions / browser devtools
  if (!url.protocol.startsWith('http')) return;

  // Navigation requests (HTML pages): Network-First, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          console.log('[Service Worker] Offline navigation detected. Serving cached app shell index.html');
          return caches.match('/index.html').then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): Cache-First with Network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update for cache freshness
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {/* Offline background update silence */});
        return cachedResponse;
      }

      // Not in cache: fetch from network & cache if successful
      return fetch(event.request).then((networkResponse) => {
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== 'basic'
        ) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((fetchErr) => {
        console.log('[Service Worker] Network request failed for:', event.request.url);
        // Fallback for image requests if offline
        if (event.request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24"><text y="12" font-size="10">Offline</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      });
    })
  );
});

// 4. Background Sync Event (When internet connection recovers)
self.addEventListener('sync', (event) => {
  const recognizedTags = ['sync-offline-sales', 'sync-mediflow-pos', 'sync-credit-sales', 'sync-held-invoices'];
  if (recognizedTags.includes(event.tag)) {
    console.log(`[Service Worker] Background sync triggered (${event.tag}): Reconciling queued transactions...`);
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'MEDIFLOW_SYNC_OFFLINE_SALES',
            tag: event.tag,
            timestamp: new Date().toISOString()
          });
        });
      })
    );
  }
});

// 5. Message Event: Receive requests from client app
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'REGISTER_BACKGROUND_SYNC') {
    if ('sync' in self.registration) {
      self.registration.sync.register(event.data.tag || 'sync-offline-sales')
        .then(() => console.log('[Service Worker] Background sync tag registered:', event.data.tag || 'sync-offline-sales'))
        .catch((err) => console.warn('[Service Worker] Sync registration error:', err));
    }
  }
});
