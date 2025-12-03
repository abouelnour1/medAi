
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, Messaging } from "firebase/messaging";
import { getFunctions, Functions } from "firebase/functions";

// --- FIREBASE SWITCH ---
// Set this to TRUE to disconnect Firebase completely.
// Set this to FALSE to enable Firebase connection.
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

let app: any;
let db: Firestore;
let auth: Auth;
let googleProvider: GoogleAuthProvider;
let analytics: any = null;
let messaging: Messaging | null = null;
let functions: Functions | null = null;

if (!FIREBASE_DISABLED) {
  // Initialize Firebase
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Initialize Providers
    googleProvider = new GoogleAuthProvider();
    
    // Initialize Functions specifically
    try {
        // Explicitly initializing functions with the app instance
        functions = getFunctions(app);
        console.log("Firebase Functions initialized successfully");
    } catch (err) {
        console.error("Firebase Functions Initialization failed.", err);
    }

  } catch (e) {
    console.error("Firebase Core Initialization failed:", e);
  }

  // Initialize Analytics only in browser environment
  if (typeof window !== 'undefined' && app) {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.warn("Firebase Analytics failed to initialize (likely blocked by ad-blocker or non-supported env):", e);
    }

    try {
      // Only attempt to initialize messaging if Service Workers are supported
      if ('serviceWorker' in navigator) {
        messaging = getMessaging(app);
      } else {
        console.warn("Service Workers not supported, Messaging disabled.");
      }
    } catch (e) {
      console.warn("Firebase Messaging failed to initialize (Service messaging is not available in this context):", e);
    }
  }

  // Enable offline persistence
  if (typeof window !== 'undefined' && db) {
      enableIndexedDbPersistence(db)
        .catch((err) => {
          if (err.code == 'failed-precondition') {
              console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
          } else if (err.code == 'unimplemented') {
              console.warn('The current browser does not support all of the features required to enable persistence');
          }
        });
  }
} else {
  console.log("Firebase is currently DISABLED by configuration.");
  // Export dummies to prevent import crashes, but logic must check FIREBASE_DISABLED
  app = null;
  db = null as unknown as Firestore;
  auth = null as unknown as Auth;
  googleProvider = null as unknown as GoogleAuthProvider;
  analytics = null;
  messaging = null;
  functions = null;
}

export { app, db, auth, googleProvider, analytics, messaging, functions };