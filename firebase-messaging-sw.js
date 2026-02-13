
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
  
  const notificationTitle = payload.notification.title || 'PharmaSource';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: 'logo.png',
    badge: 'logo.png',
    vibrate: [200, 100, 200],
    tag: 'pharmasource-update',
    renotify: true,
    // Critical for Android Head-up display
    priority: 'high',
    requireInteraction: true,
    data: {
      url: self.location.origin
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
