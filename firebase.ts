
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";
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

// 2. Android Configuration (Provided by User)
// This will be used when running on an Android device via Capacitor
const firebaseAndroidConfig = {
  apiKey: "AIzaSyAazQzvW1KUFqj1wQYaUXXlogfp8lkU50s", // Usually same API Key
  authDomain: "medainew-fa6a2.firebaseapp.com",
  projectId: "medainew-fa6a2",
  storageBucket: "medainew-fa6a2.firebasestorage.app",
  messagingSenderId: "568872568132",
  appId: "1:568872568132:android:143c4fb5b2221b3416c311", // ANDROID SPECIFIC ID
  measurementId: "G-J06N12MDW0"
};

// SHA-1 Certificate Fingerprint (For Reference/Console Setup):
// 69:6c:05:61:da:e0:7f:ce:99:eb:37:f2:5e:42:25:de:63:3f:4f:79
// Ensure this SHA-1 is added to your Firebase Console -> Project Settings -> Android App

let app: any;
let db: Firestore;
let auth: Auth;
let analytics: any = null;
let messaging: Messaging | null = null;
let functions: Functions | null = null;

// Robust check for Capacitor Android Environment
const isAndroidEnvironment = () => {
  // 1. Check Capacitor Platform
  // @ts-ignore
  if (typeof window !== 'undefined' && window.Capacitor) {
      // @ts-ignore
      const platform = window.Capacitor.getPlatform();
      console.log('PharmaSource: Capacitor Platform detected:', platform);
      if (platform === 'android') return true;
  }

  // 2. Fallback: Check User Agent for Android AND specific webview indicators
  // This helps if Capacitor object isn't fully injected yet when this file runs
  if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      // Check for Android AND (wl = webview/wrapper indicators often present in hybrid apps)
      if (ua.includes('android') && (ua.includes('wv') || ua.includes('capacitor') || window.location.protocol.includes('http'))) {
          // If we are on http/https localhost on an Android device, it's likely the wrapper
          // Note: Capacitor often serves from https://localhost or http://localhost
          if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
              console.log('PharmaSource: Android Environment detected via UserAgent/Hostname');
              return true;
          }
      }
  }
  
  return false;
};

if (!FIREBASE_DISABLED) {
  try {
    let activeConfig = firebaseWebConfig;
    
    // Explicitly switch config if on Android
    if (isAndroidEnvironment()) {
        console.log("PharmaSource: Switching to Android Firebase Config (App ID: ...143c4fb5b2221b3416c311)");
        activeConfig = firebaseAndroidConfig;
    } else {
        console.log("PharmaSource: Using Web/iOS Firebase Config.");
    }

    app = initializeApp(activeConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    try {
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
      console.warn("Firebase Analytics failed to initialize:", e);
    }

    try {
      if ('serviceWorker' in navigator) {
        messaging = getMessaging(app);
      } else {
        console.warn("Service Workers not supported, Messaging disabled.");
      }
    } catch (e) {
      console.warn("Firebase Messaging failed to initialize:", e);
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
  app = null;
  db = null as unknown as Firestore;
  auth = null as unknown as Auth;
  analytics = null;
  messaging = null;
  functions = null;
}

export { app, db, auth, analytics, messaging, functions };
