
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
  appId: "1:568872568132:android:143c4fb5b2221b3416c311",
  measurementId: "G-J06N12MDW0"
};

let app: any;
let db: Firestore;
let auth: Auth;
let analytics: any = null;
let messaging: Messaging | null = null;
let functions: Functions | null = null;

const isAndroidEnvironment = () => {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
      return (window as any).Capacitor.getPlatform() === 'android';
  }
  return false;
};

if (!FIREBASE_DISABLED) {
  try {
    const activeConfig = isAndroidEnvironment() ? firebaseAndroidConfig : firebaseWebConfig;
    app = initializeApp(activeConfig);
    
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalAutoDetectLongPolling: true
    });

    auth = getAuth(app);
    functions = getFunctions(app);

    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
      if ('serviceWorker' in navigator) {
        messaging = getMessaging(app);
      }
    }
  } catch (e) {
    console.error("Firebase Initialization failed:", e);
  }
} else {
  db = null as any;
  auth = null as any;
}

export { app, db, auth, analytics, messaging, functions };
