const CACHE_NAME = 'pharma-ksa-offline-v6'; 

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;900&family=Poppins:wght@300;400;500;600;700&display=swap'
];

// Install event - caching the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching app shell...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // self.skipWaiting(); // disabled to prevent reload on app return
});

// Activate event - cleaning up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Fetch event - Cache First for assets, Network First for others
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // For Firebase and other dynamic APIs, try network first
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebaseio.com') || url.hostname.includes('firestore.googleapis.com')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // For app assets, try cache first
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(networkResponse => {
        // Cache new successful GET requests
        if (networkResponse && networkResponse.status === 200) {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clonedResponse));
        }
        return networkResponse;
      }).catch(() => {
        // If both fail and it's a navigation request, return the cached index.html
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
        return null;
      });
    })
  );
});
