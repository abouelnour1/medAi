
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

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
let analytics: any;

if (!FIREBASE_DISABLED) {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  // Initialize Analytics only in browser environment
  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.error("Firebase Analytics failed to initialize", e);
    }
  }

  // Enable offline persistence
  if (typeof window !== 'undefined') {
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
}

export { app, db, auth, analytics };
