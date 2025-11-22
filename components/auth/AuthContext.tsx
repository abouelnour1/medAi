
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, AuthContextType, AppSettings, TFunction } from '../../types';
import { auth, db, FIREBASE_DISABLED } from '../../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

const SETTINGS_DOC_ID = 'app_settings';
const LOCAL_USER_STORAGE_KEY = 'medai_user_backup';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize State DIRECTLY from Local Storage (Synchronous)
  // This allows the app to open immediately without waiting for Firebase/Internet
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error("Failed to load user from cache", e);
      return null;
    }
  });

  // 2. Loading is false if we already have a user from cache
  const [isLoading, setIsLoading] = useState(() => {
      // If we found a user in local storage, we are NOT loading, we render the app immediately.
      // If no user in cache, we wait for Firebase to tell us (loading = true).
      return !localStorage.getItem(LOCAL_USER_STORAGE_KEY);
  });

  // Enforce local persistence on mount
  useEffect(() => {
     if (FIREBASE_DISABLED) return;
     const initAuth = async () => {
         try {
             await setPersistence(auth, browserLocalPersistence);
         } catch (e) {
             console.error("Error setting persistence:", e);
         }
     };
     initAuth();
  }, []);

  // Sync user state with Firebase Auth (Background Check)
  useEffect(() => {
    if (FIREBASE_DISABLED) {
        setIsLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Update local state with fresh data from server (Silent Update)
        await syncUserData(firebaseUser);
      } else {
        // Only clear user if we were previously logged in and Firebase explicitly says signed out
        // We only clear if we don't have a cached user OR if firebase explicitly signs out (null)
        // Ideally, if offline, onAuthStateChanged might trigger with null if persistence fails, 
        // but with browserLocalPersistence it should restore.
        
        const cachedUser = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
        // Only force logout if we were previously loading (fresh start) or if explicit logout action happened elsewhere.
        // But to be safe and match standard auth flow:
        if (!isLoading) { 
             // If we were already loaded (from cache), and now firebase says null, it usually means token expired or logout.
             setUser(null);
             localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
        } else {
             setUser(null);
        }
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const syncUserData = async (firebaseUser: FirebaseUser) => {
      // If offline, this fetch might fail or hang. We wrap in try/catch
      // and rely on the cached user we already set in the state initializer.
      try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data();
            let emailVerified = firebaseUser.emailVerified;
            
            if (emailVerified && !firestoreData.emailVerified) {
                // Attempt to update firestore, but don't block if offline
                updateDoc(userDocRef, { emailVerified: true }).catch(e => console.log("Offline: Could not update verify status"));
            }

            const finalUser = { 
                id: firebaseUser.uid, 
                ...firestoreData, 
                emailVerified: emailVerified, 
                email: firebaseUser.email || '',
            } as User;

            // Update state and cache with fresh data
            setUser(finalUser);
            localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(finalUser));
          } else {
              // Create new user logic...
              const newUser: User = {
                  id: firebaseUser.uid,
                  username: firebaseUser.email?.split('@')[0] || 'User',
                  role: 'premium',
                  aiRequestCount: 0,
                  lastRequestDate: new Date().toISOString().split('T')[0],
                  status: 'pending',
                  emailVerified: firebaseUser.emailVerified,
                  email: firebaseUser.email || ''
              };
              // Only block on this if we really have to, otherwise set state
              setDoc(userDocRef, newUser).catch(e => console.log("Offline: could not create doc"));
              
              setUser(newUser);
              localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(newUser));
          }
      } catch (e) {
          console.log("Network issue or offline: keeping existing cached user data.");
          // We don't need to do anything because 'user' state was already set from localStorage in the useState initializer.
      } finally {
          setIsLoading(false);
      }
  };

  const login = useCallback(async (usernameInput: string, password: string): Promise<void> => {
    if (FIREBASE_DISABLED) throw new Error("Firebase unavailable (Disconnected mode)");

    let email = usernameInput.trim();
    if (email.toLowerCase() === 'admin') {
        email = 'admin@medai.com'; 
    }

    try {
        await setPersistence(auth, browserLocalPersistence);
        await signInWithEmailAndPassword(auth, email, password);
        // syncUserData will be called by the onAuthStateChanged listener
    } catch (error: any) {
        console.error("Login error:", error);
        let errorMessage = 'خطأ في تسجيل الدخول. تأكد من البريد الإلكتروني وكلمة المرور.';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
             errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        } else if (error.code === 'auth/too-many-requests') {
             errorMessage = 'تم تعليق الدخول مؤقتاً بسبب تكرار المحاولة. حاول لاحقاً.';
        } else if (error.code === 'auth/invalid-email') {
             errorMessage = 'البريد الإلكتروني غير صالح.';
        } else if (error.code === 'auth/network-request-failed') {
             errorMessage = 'لا يوجد اتصال بالإنترنت. يرجى التحقق من الاتصال.';
        }
        throw new Error(errorMessage);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
     if (FIREBASE_DISABLED) throw new Error("Firebase unavailable");
     if (!email) throw new Error('الرجاء إدخال البريد الإلكتروني.');
     try {
         await sendPasswordResetEmail(auth, email);
     } catch (error: any) {
         console.error("Reset password error:", error);
         let msg = 'حدث خطأ أثناء إرسال الرابط.';
         if (error.code === 'auth/user-not-found') msg = 'البريد الإلكتروني غير مسجل.';
         if (error.code === 'auth/invalid-email') msg = 'البريد الإلكتروني غير صالح.';
         throw new Error(msg);
     }
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<void> => {
    if (FIREBASE_DISABLED) throw new Error("Firebase unavailable");
    const cleanEmail = email.trim().toLowerCase();
    const defaultUsername = cleanEmail.split('@')[0];

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await sendEmailVerification(userCredential.user);

      const newUser: User = {
        id: userCredential.user.uid,
        username: defaultUsername,
        role: 'premium',
        aiRequestCount: 0,
        lastRequestDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        emailVerified: false,
        email: cleanEmail
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      setUser(newUser);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(newUser));

    } catch (error: any) {
        console.error("Registration error:", error);
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('البريد الإلكتروني هذا مسجل بالفعل.');
        }
        throw new Error('فشل إنشاء الحساب. ' + error.message);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
        if (!FIREBASE_DISABLED) await signOut(auth);
        setUser(null);
        localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
    } catch (error) {
        console.error("Logout error:", error);
    }
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (FIREBASE_DISABLED) throw new Error("Firebase unavailable");
    if (auth.currentUser && !auth.currentUser.emailVerified) {
        try {
            await sendEmailVerification(auth.currentUser);
        } catch (e) {
            console.error("Error sending verification email", e);
            throw e;
        }
    }
  }, []);

  const reloadUser = useCallback(async () => {
    if (FIREBASE_DISABLED) return;
    if (auth.currentUser) {
        try {
            await auth.currentUser.reload();
            const currentUser = auth.currentUser;
            if (currentUser) {
                await syncUserData(currentUser);
            }
        } catch(e) {
            console.log("Offline: Cannot reload user from server.");
        }
    }
  }, []);
  
  const getSettings = useCallback((): AppSettings => {
    // Try to get from local storage cache first to be fast
    try {
      const stored = localStorage.getItem('mock_app_settings');
      if (stored) return JSON.parse(stored);
    } catch (e) {
        // ignore
    }
    // Return default if nothing found
    return { aiRequestLimit: 10, isAiEnabled: true };
  }, []);

  const updateSettings = useCallback(async (settings: AppSettings) => {
    try {
        // Update local immediately
        localStorage.setItem('mock_app_settings', JSON.stringify(settings));
        
        if (!FIREBASE_DISABLED) {
            const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
            await setDoc(settingsRef, settings, { merge: true });
        }
    } catch (e) {
        console.error("Error saving settings:", e);
    }
  }, []);

  // Fetch settings on mount to ensure we have latest limits
  useEffect(() => {
      if (FIREBASE_DISABLED) return;
      const fetchSettings = async () => {
          try {
              const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
              const docSnap = await getDoc(settingsRef);
              if (docSnap.exists()) {
                  const data = docSnap.data() as AppSettings;
                  localStorage.setItem('mock_app_settings', JSON.stringify(data));
              }
          } catch(e) {
              console.log("Could not fetch settings");
          }
      }
      fetchSettings();
  }, []);

  const requestAIAccess = useCallback(async (callback: () => void, t: TFunction) => {
    if (!user) {
        alert(t('loginRequired'));
        return;
    }

    if (user.role !== 'admin' && !user.emailVerified) {
        alert(t('emailVerificationRequired'));
        return;
    }
    
    if (user.role === 'admin') {
        callback();
        return;
    }
    
    if (user.role === 'premium') {
        if (user.status === 'pending') {
            alert(t('aiAccessPendingError'));
            return;
        }

        // FORCE SYNC SETTINGS IF ONLINE TO ENSURE LIMITS ARE UP TO DATE
        // Use a race condition to prevent blocking UI for too long on slow networks
        if (!FIREBASE_DISABLED && navigator.onLine) {
            try {
                const fetchPromise = (async () => {
                    const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
                    const docSnap = await getDoc(settingsRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data() as AppSettings;
                        localStorage.setItem('mock_app_settings', JSON.stringify(data));
                    }
                })();
                
                // Wait maximum 2 seconds for settings sync, then proceed with cached
                const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));
                await Promise.race([fetchPromise, timeoutPromise]);
            } catch(e) {
                console.log("Failed to sync settings before request (using cache)");
            }
        }

        // Check against Global Settings Limit
        const currentSettings = getSettings();
        const limit = currentSettings.aiRequestLimit || 10;
        const isAiEnabled = currentSettings.isAiEnabled !== false; // Default true if undefined

        if (!isAiEnabled) {
            alert(t('aiUnavailableMessage'));
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        let currentUserState = { ...user };
        
        // Reset counter if new day
        if (currentUserState.lastRequestDate !== today) {
            currentUserState.aiRequestCount = 0;
            currentUserState.lastRequestDate = today;
        }
        
        // Check Limit
        if (currentUserState.aiRequestCount >= limit) {
            alert(t('usageLimitReached', { limit }));
            return;
        }
        
        // Proceed
        currentUserState.aiRequestCount += 1;
        setUser(currentUserState);
        localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(currentUserState));
        
        if (!FIREBASE_DISABLED) {
            try {
                const userRef = doc(db, 'users', user.id);
                updateDoc(userRef, {
                    aiRequestCount: currentUserState.aiRequestCount,
                    lastRequestDate: currentUserState.lastRequestDate
                }).catch(e => console.log("Offline update failed (non-critical)"));
            } catch (e) {
                // Silent fail
            }
        }
        callback();
    }
  }, [user, getSettings]);

  const getAllUsers = useCallback(() => {
    return [] as User[]; 
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    try {
        if (!FIREBASE_DISABLED) {
            const userRef = doc(db, 'users', updatedUser.id);
            await updateDoc(userRef, { ...updatedUser });
        }
        if (user && user.id === updatedUser.id) {
            setUser(updatedUser);
            localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(updatedUser));
        }
    } catch (e) {
        console.error("Error updating user:", e);
    }
  }, [user]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
        if (!FIREBASE_DISABLED) await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
        console.error("Error deleting user:", e);
    }
  }, []);


  const value = { 
      user, 
      login, 
      register, 
      logout, 
      requestAIAccess, 
      resendVerificationEmail, 
      reloadUser, 
      resetPassword, 
      isLoading, 
      getAllUsers, 
      updateUser, 
      deleteUser, 
      getSettings, 
      updateSettings 
    };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
