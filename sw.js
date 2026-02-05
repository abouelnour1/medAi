const CACHE_NAME = 'pharma-source-v16'; 
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL_URLS))
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

  // استثناء روابط Firebase و Google APIs من الـ Service Worker تماماً
  // هذا يحل مشكلة "Could not reach Cloud Firestore backend"
  if (
    url.hostname.includes('firestore.googleapis.com') || 
    url.hostname.includes('firebaseio.com') || 
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebase.google.com')
  ) {
    return; // دع المتصفح يتعامل معها مباشرة دون تدخل الـ Cache
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clonedResponse));
        }
        return networkResponse;
      }).catch(() => null);
    })
  );
});