import React from 'react';
import { createRoot } from 'react-dom/client';

// Silent console in production
if ((import.meta as any).env?.PROD) {
  const noop = () => {};
  console.log = noop;
  console.warn = noop;
  console.info = noop;
}

import App from './App';
import { AuthProvider } from './components/auth/AuthContext';
import './tailwind.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find root element');

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// Capacitor App State
if ((window as any).Capacitor?.isNativePlatform?.()) {
  import('@capacitor/app').then(({ App }) => {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) console.log('App resumed');
    });
  }).catch(() => {});
}

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {});
  });
}
