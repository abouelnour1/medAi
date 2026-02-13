
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Configuration must match firebase.ts
firebase.initializeApp({
  apiKey: "AIzaSyAazQzvW1KUFqj1wQYaUXXlogfp8lkU50s",
  authDomain: "medainew-fa6a2.firebaseapp.com",
  projectId: "medainew-fa6a2",
  storageBucket: "medainew-fa6a2.firebasestorage.app",
  messagingSenderId: "568872568132",
  appId: "1:568872568132:web:3b07d77360eb8f3d16c311",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received', payload);
  
  const notificationTitle = payload.notification.title || 'PharmaSource KSA';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: 'logo.png',
    badge: 'logo.png',
    vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40],
    tag: 'pharmasource-update',
    renotify: true,
    // إعدادات ضرورية لظهور الإشعار منبثقاً (Head-up) في أندرويد
    priority: 'high',
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'فتح التطبيق' }
    ],
    data: {
      url: self.location.origin
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('./');
    })
  );
});
