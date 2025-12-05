
const CACHE_NAME = 'medai-cache-v12'; // Version updated to force refresh
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/logo.png', // Cached the correct icon file
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

  // For app shell files and local assets, use a cache-first strategy.
  // This serves the app instantly from the cache if available.
  if (url.origin === self.origin) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(networkResponse => {
            // Also cache local assets fetched at runtime
            return caches.open(CACHE_NAME).then(cache => {
                cache.put(request, networkResponse.clone());
                return networkResponse;
            });
        });
      })
    );
    return;
  }
  
  // For external resources (CDN, fonts), use a stale-while-revalidate strategy.
  // This provides a fast response from the cache while updating it in the background.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          // If we got a valid response, update the cache.
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            // If the network fails, and we already have a cached response, that's fine.
            console.warn(`Fetch failed for ${request.url}; will serve from cache if available.`);
            // If we don't have a cached response and the network fails, the promise will reject, 
            // and the browser will show its offline error for this specific resource. This is acceptable.
        });

        // Return the cached response if available, and let the fetch happen in the background.
        // If not cached, wait for the network response.
        return cachedResponse || fetchPromise;
      });
    })
  );
});