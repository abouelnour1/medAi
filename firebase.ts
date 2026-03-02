import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache,
  persistentSingleTabManager,
  Firestore,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

export const FIREBASE_DISABLED = false;

// authDomain لازم يبقى firebaseapp.com دايماً عشان Google OAuth يشتغل صح
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

try {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }

    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentSingleTabManager({ forceOwnership: false }),
            cacheSizeBytes: CACHE_SIZE_UNLIMITED
        }),
        experimentalForceLongPolling: true,
        ignoreUndefinedProperties: true
    });

    auth = getAuth(app);

    // ✅ نضمن إن الـ session يتحفظ حتى لو أغلق المتصفح
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    if (typeof window !== 'undefined') {
        getAnalytics(app);
    }
} catch (error) {
    console.error("Firebase Initialization Error:", error);
}

export { app, db, auth };
