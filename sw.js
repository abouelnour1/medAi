
const CACHE_NAME = 'pharma-source-v18'; 
const APP_SHELL_URLS = [
  './',
  './index.html',
  './index.tsx',
  './manifest.json',
  './logo.png'
];

const EXTERNAL_RESOURCES = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;900&family=Poppins:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // تحميل ملفات البرنامج الأساسية
      cache.addAll(APP_SHELL_URLS);
      // محاولة تخزين الخطوط ومحرك Tailwind للعمل بدون إنترنت
      EXTERNAL_RESOURCES.forEach(url => {
        fetch(url, { mode: 'no-cors' }).then(res => cache.put(url, res)).catch(() => {});
      });
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

  // استثناء روابط Firebase و Analytics من الـ Cache لضمان استقرار مزامنة البيانات
  if (
    url.hostname.includes('firestore.googleapis.com') || 
    url.hostname.includes('firebaseio.com') || 
    url.hostname.includes('googleapis.com') && !url.pathname.includes('css2') || // استثناء الخطوط والسماح بباقي جوجل
    url.hostname.includes('firebase.google.com')
  ) {
    return; 
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('./index.html'))
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
