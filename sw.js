
const CACHE_NAME = 'pharma-ksa-v20'; 

const APP_SHELL = [
  './',
  './index.html',
  './index.tsx',
  './manifest.json',
  './logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
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

  // السماح بطلبات Firebase والـ CDNs الخارجية بالمرور للشبكة
  if (
    url.hostname.includes('gstatic.com') || 
    url.hostname.includes('googleapis.com') || 
    url.hostname.includes('esm.sh') ||
    url.hostname.includes('cdn.tailwindcss.com')
  ) {
    return; 
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
