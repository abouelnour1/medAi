
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, Messaging } from "firebase/messaging";
import { getFunctions, Functions } from "firebase/functions";

// --- FIREBASE SWITCH ---
// Set this to TRUE to disconnect Firebase completely.
// Set this to FALSE to enable Firebase connection.
export const FIREBASE_DISABLED = false;

// 1. WEB CONFIGURATION (Your existing config)
const firebaseConfigWeb = {
  apiKey: "AIzaSyAazQzvW1KUFqj1wQYaUXXlogfp8lkU50s",
  authDomain: "medainew-fa6a2.firebaseapp.com",
  projectId: "medainew-fa6a2",
  storageBucket: "medainew-fa6a2.firebasestorage.app",
  messagingSenderId: "568872568132",
  appId: "1:568872568132:web:3b07d77360eb8f3d16c311",
  measurementId: "G-J06N12MDW0"
};

// 2. ANDROID CONFIGURATION
// Updated with values provided by user
const firebaseConfigAndroid = {
  apiKey: "AIzaSyAazQzvW1KUFqj1wQYaUXXlogfp8lkU50s",
  authDomain: "medainew-fa6a2.firebaseapp.com",
  projectId: "medainew-fa6a2",
  storageBucket: "medainew-fa6a2.firebasestorage.app",
  messagingSenderId: "568872568132",
  appId: "1:568872568132:android:143c4fb5b2221b3416c311",
  measurementId: "G-J06N12MDW0" // Using same measurement ID or can be left blank if not set up for Android stream
};

// Helper to detect if running in a Native Environment (Capacitor, Cordova, or Android WebView)
const isNativePlatform = () => {
  // Check for Capacitor
  // @ts-ignore
  if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNative) {
    return true;
  }
  
  // Check for generic Android WebView (often contains 'Wv' or 'Version/4.0 Chrome...')
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
      if (navigator.userAgent.includes('Wv') || (navigator.userAgent.includes('Android') && navigator.userAgent.includes('Version/'))) {
          return true;
      }
  }
  
  return false;
};

// Toggle this manually to 'true' if you want to force test the Android config in the browser
const FORCE_ANDROID_CONFIG = false; 

// Select the correct config based on environment
const firebaseConfig = (isNativePlatform() || FORCE_ANDROID_CONFIG) 
  ? firebaseConfigAndroid 
  : firebaseConfigWeb;

let app: any;
let db: Firestore;
let auth: Auth;
let analytics: any = null;
let messaging: Messaging | null = null;
let functions: Functions | null = null;

if (!FIREBASE_DISABLED) {
  // Initialize Firebase
  try {
    const platformName = (isNativePlatform() || FORCE_ANDROID_CONFIG) ? 'ANDROID' : 'WEB';
    console.log(`[Firebase] Initializing with ${platformName} config...`);
    
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Initialize Functions specifically
    try {
        // Explicitly initializing functions with the app instance
        functions = getFunctions(app);
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
  analytics = null;
  messaging = null;
  functions = null;
}

export { app, db, auth, analytics, messaging, functions };
