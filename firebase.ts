
import { initializeApp } from "firebase/app";
import { 
  Firestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, Messaging } from "firebase/messaging";
import { getFunctions, Functions } from "firebase/functions";

// --- FIREBASE SWITCH ---
// Set this to TRUE to disconnect Firebase completely.
export const FIREBASE_DISABLED = false;

// 1. Web Configuration (Default for JS SDK)
const firebaseWebConfig = {
  apiKey: "AIzaSyAazQzvW1KUFqj1wQYaUXXlogfp8lkU50s",
  authDomain: "medainew-fa6a2.firebaseapp.com",
  projectId: "medainew-fa6a2",
  storageBucket: "medainew-fa6a2.firebasestorage.app",
  messagingSenderId: "568872568132",
  appId: "1:568872568132:web:3b07d77360eb8f3d16c311",
  measurementId: "G-J06N12MDW0"
};

// 2. Android Configuration
const firebaseAndroidConfig = {
  apiKey: "AIzaSyAazQzvW1KUFqj1wQYaUXXlogfp8lkU50s",
  authDomain: "medainew-fa6a2.firebaseapp.com",
  projectId: "medainew-fa6a2",
  storageBucket: "medainew-fa6a2.firebasestorage.app",
  messagingSenderId: "568872568132",
  appId: "1:568872568132:android:143c4fb5b2221b3416c311",
  measurementId: "G-J06N12MDW0"
};

let app: any;
let db: Firestore;
let auth: Auth;
let analytics: any = null;
let messaging: Messaging | null = null;
let functions: Functions | null = null;

// Robust check for Capacitor Android Environment
const isAndroidEnvironment = () => {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const platform = (window as any).Capacitor.getPlatform();
      if (platform === 'android') return true;
  }
  if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('android') && (ua.includes('wv') || ua.includes('capacitor') || window.location.protocol.includes('http'))) {
          if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
              return true;
          }
      }
  }
  return false;
};

if (!FIREBASE_DISABLED) {
  try {
    let activeConfig = firebaseWebConfig;
    
    if (isAndroidEnvironment()) {
        activeConfig = firebaseAndroidConfig;
    }

    app = initializeApp(activeConfig);
    
    // Modern Firestore Initialization with Persistent Cache
    // experimentalAutoDetectLongPolling helps resolve connection timeouts in restricted networks
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalAutoDetectLongPolling: true
    });

    auth = getAuth(app);
    
    try {
        functions = getFunctions(app);
    } catch (err) {
        console.error("Firebase Functions Initialization failed.", err);
    }

  } catch (e) {
    console.error("Firebase Core Initialization failed:", e);
  }

  if (typeof window !== 'undefined' && app) {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.warn("Firebase Analytics failed to initialize:", e);
    }

    try {
      if ('serviceWorker' in navigator) {
        messaging = getMessaging(app);
      }
    } catch (e) {
      console.warn("Firebase Messaging failed to initialize:", e);
    }
  }
} else {
  app = null;
  db = null as unknown as Firestore;
  auth = null as unknown as Auth;
  analytics = null;
  messaging = null;
  functions = null;
}

export { app, db, auth, analytics, messaging, functions };
