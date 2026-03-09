import React from 'react';
import { createRoot } from 'react-dom/client';

// Silent console in production
if ((import.meta as any).env?.PROD) {
  const noop = () => {};
  console.log = noop;
  console.warn = noop;
  console.info = noop;
  // نحتفظ بـ console.error فقط لأي أخطاء مهمة
}
import App from './App';
import { AuthProvider } from './components/auth/AuthContext';
import './tailwind.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// منع إعادة التحميل لما التطبيق يرجع من app تاني
document.addEventListener('visibilitychange', () => {
  // مش بنعمل حاجة - بس نمنع أي default behavior
});

// Capacitor App State - منع reload
if ((window as any).Capacitor?.isNativePlatform?.()) {
  import('@capacitor/app').then(({ App }) => {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // التطبيق رجع — مش هنعمل حاجة
        console.log('App resumed');
      }
    });
  }).catch(() => {});
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(err => {
        console.log('SW registration failed:', err);
      });
  });
}
