
const CACHE_NAME = 'medai-cache-v13'; // Updated version to force refresh
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/logo.png', 
  // Add external resources critical for the first offline load
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Poppins:wght@400;500;700&family=Tajawal:wght@400;500;700&display=swap'
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(APP_SHELL_URLS).catch(error => {
          console.error('Failed to cache app shell:', error);
        });
      })
      .then(() => {
          // Force activation immediately
          return self.skipWaiting();
      })
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Force the new service worker to take control of the page immediately.
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy for Navigation Requests (HTML) -> Network First
  // This ensures that authentication redirects (which use URL params) are processed by the browser/server 
  // and not intercepted by a stale cache, fixing the Google Sign-in loop/crash issues.
  if (request.mode === 'navigate') {
      event.respondWith(
          fetch(request)
              .then(networkResponse => {
                  return caches.open(CACHE_NAME).then(cache => {
                      // Optionally cache the fresh index.html for offline use later
                      if (networkResponse.status === 200) {
                          cache.put(request, networkResponse.clone());
                      }
                      return networkResponse;
                  });
              })
              .catch(() => {
                  // Fallback to cache if network fails (offline mode)
                  return caches.match('/index.html');
              })
      );
      return;
  }

  // For app shell files (JS, CSS, Images), use Cache First for speed.
  if (url.origin === self.origin) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(networkResponse => {
            // Also cache local assets fetched at runtime
            if(networkResponse && networkResponse.status === 200) {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                });
            }
            return networkResponse;
        });
      })
    );
    return;
  }
  
  // For external resources (CDN, fonts), use Stale-While-Revalidate.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            console.warn(`Fetch failed for ${request.url}; will serve from cache if available.`);
        });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
