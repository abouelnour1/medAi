
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, Messaging, getToken, onMessage } from "firebase/messaging";
import { getFunctions, Functions } from "firebase/functions";

// تم إعادة الاتصال بـ Firebase للعمل كبرنامج سحابي متكامل
export const FIREBASE_DISABLED = false;

const firebaseWebConfig = {
  apiKey: "AIzaSyAazQzvW1KUFqj1wQYaUXXlogfp8lkU50s",
  authDomain: "medainew-fa6a2.firebaseapp.com",
  projectId: "medainew-fa6a2",
  storageBucket: "medainew-fa6a2.firebasestorage.app",
  messagingSenderId: "568872568132",
  appId: "1:568872568132:web:3b07d77360eb8f3d16c311",
  measurementId: "G-J06N12MDW0"
};

const firebaseAndroidConfig = {
  apiKey: "AIzaSyAazQzvW1KUFqj1wQYaUXXlogfp8lkU50s",
  authDomain: "medainew-fa6a2.firebaseapp.com",
  projectId: "medainew-fa6a2",
  storageBucket: "medainew-fa6a2.firebasestorage.app",
  messagingSenderId: "568872568132",
  appId: "1:568872568132:web:3b07d77360eb8f3d16c311", 
  measurementId: "G-J06N12MDW0"
};

let app: any = null;
let db: any = null;
let auth: any = null;
let analytics: any = null;
let messaging: any = null;
let functions: any = null;

const isAndroidEnvironment = () => {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const platform = (window as any).Capacitor.getPlatform();
      if (platform === 'android') return true;
  }
  if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('android') && (ua.includes('wv') || window.location.hostname === 'localhost')) {
          return true;
      }
  }
  return false;
};

try {
  let activeConfig = firebaseWebConfig;
  if (isAndroidEnvironment()) {
      activeConfig = firebaseAndroidConfig;
  }

  app = initializeApp(activeConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  functions = getFunctions(app);

  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
    } catch (e) {}

    if ('serviceWorker' in navigator) {
      messaging = getMessaging(app);
    }
  }

  // تفعيل التخزين المحلي للعمل في حال انقطاع الإنترنت المؤقت
  enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
          console.warn("Persistence failed: Multiple tabs open.");
      } else if (err.code === 'unimplemented') {
          console.warn("Persistence is not supported by this browser.");
      }
  });
} catch (e) {
  console.error("Firebase Init Error", e);
}

export { app, db, auth, analytics, messaging, functions, getToken, onMessage };
