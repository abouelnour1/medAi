
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { 
  initializeFirestore, 
  memoryLocalCache,
  Firestore,
  getFirestore
} from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, Messaging, getToken, onMessage } from "firebase/messaging";
import { getFunctions, Functions } from "firebase/functions";

export const FIREBASE_DISABLED = false;

const firebaseConfig = {
  apiKey: "AIzaSyAazQzvW1KUFqj1wQYaUXXlogfp8lkU50s",
  authDomain: "medainew-fa6a2.firebaseapp.com",
  projectId: "medainew-fa6a2",
  storageBucket: "medainew-fa6a2.firebasestorage.app",
  messagingSenderId: "568872568132",
  appId: "1:568872568132:web:3b07d77360eb8f3d16c311",
  measurementId: "G-J06N12MDW0"
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let analytics: any = null;
let messaging: Messaging = null as any;
let functions: Functions = null as any;

const getSafeFirestore = (firebaseApp: FirebaseApp): Firestore => {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    try {
      return getFirestore(firebaseApp);
    } catch (e) {
      console.warn("Re-initializing Firestore...");
    }
  }

  // استخدام الذاكرة فقط للتخزين المؤقت (memoryLocalCache) لضمان عدم حدوث تعارضات في الأندرويد
  const firestore = initializeFirestore(firebaseApp, {
    localCache: memoryLocalCache(),
    experimentalForceLongPolling: true, 
    experimentalAutoDetectLongPolling: false, 
    ignoreUndefinedProperties: true,
  });

  return firestore;
};

try {
  const apps = getApps();
  app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  
  db = getSafeFirestore(app);
  auth = getAuth(app);
  functions = getFunctions(app);

  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
    } catch (e) {}

    if ('serviceWorker' in navigator) {
      try {
        messaging = getMessaging(app);
      } catch (e) {}
    }
  }
} catch (e) {
  console.error("Critical Firebase Initialization Error", e);
  db = { type: 'firestore' } as any; 
  auth = {} as any;
}

export { app, db, auth, analytics, messaging, functions, getToken, onMessage };
