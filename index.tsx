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

// ── اجلب الـ status bar height قبل أي render ──────────────────────────────
// لازم يكون أول حاجة عشان --android-status يكون صح من Frame 0
async function initStatusBar() {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    // اقرأ القيمة المحفوظة أولاً (تشتغل من أول frame)
    const saved = parseInt(localStorage.getItem('_sb') || '0', 10);
    if (saved >= 15 && saved <= 120) {
      document.documentElement.style.setProperty('--android-status', saved + 'px');
    }

    // اجلب القيمة الحقيقية من Capacitor
    const { StatusBar } = await import('@capacitor/status-bar');
    const info = await StatusBar.getInfo();

    // احسب الـ status bar height من الـ safe area
    const root = document.documentElement;
    // استنى لحد ما الـ CSS يتحمل
    await new Promise(r => requestAnimationFrame(r));

    // قيس من header مباشرة - الأدق
    const headerEl = document.getElementById('app-header');
    if (headerEl) {
      const cs = window.getComputedStyle(headerEl);
      const pt = parseFloat(cs.paddingTop) || 0;
      // padding-top = status bar + 8px
      const sbH = Math.round(pt - 8);
      if (sbH >= 15 && sbH <= 120) {
        root.style.setProperty('--android-status', sbH + 'px');
        localStorage.setItem('_sb', String(sbH));
        // حدث --header-h بناءً على القياس الجديد
        const headerH = Math.ceil(headerEl.getBoundingClientRect().height);
        if (headerH >= 40) {
          root.style.setProperty('--header-h', headerH + 'px');
          localStorage.setItem('_hh', String(headerH));
        }
      }
    }
  } catch {}
}

// شغل قبل render
initStatusBar();

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
    // نستخدم absolute path عشان يشتغل صح على Vercel
    const swUrl = '/sw.js';
    navigator.serviceWorker.register(swUrl)
      .then(registration => {
        console.error('SW registered OK:', registration.scope);
      })
      .catch(err => {
        console.error('SW registration FAILED:', err);
      });

    // Firebase Messaging SW
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(reg => console.error('FCM SW registered OK:', reg.scope))
      .catch(err => console.error('FCM SW FAILED:', err));
  });
}
