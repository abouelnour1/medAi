const CACHE_NAME = 'pharma-ksa-offline-v5'; 

const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;900&family=Poppins:wght@300;400;500;600;700&display=swap'
];

const APP_SHELL = [
  './',
  './index.html',
  './tailwind.css',
  './index.tsx',
  './manifest.json',
  './logo.png',
  ...EXTERNAL_ASSETS
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching assets for offline use...');
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // السماح لـ Firebase بالمرور دائماً للإنترنت (لأن بياناته حية)
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    if (!request.url.includes('fonts')) return; 
  }

  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clonedResponse));
        }
        return networkResponse;
      }).catch(() => null);
    })
  );
});