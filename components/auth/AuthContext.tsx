
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, AuthContextType, AppSettings, TFunction } from '../../types';
import { auth, db, googleProvider, FIREBASE_DISABLED } from '../../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  signInWithRedirect, 
  signInWithPopup,
  getRedirectResult,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  collection
} from 'firebase/firestore';

const SETTINGS_DOC_ID = 'app_settings';
const LOCAL_USER_STORAGE_KEY = 'medai_user_backup';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize State DIRECTLY from Local Storage (Synchronous)
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error("Failed to load user from cache", e);
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
      // If we have a user, we aren't "loading" initially, we are optimistically showing content.
      return !localStorage.getItem(LOCAL_USER_STORAGE_KEY);
  });

  // Handle Redirect Result immediately on mount
  useEffect(() => {
    if (FIREBASE_DISABLED) {
        setIsLoading(false);
        return;
    }

    const initAuth = async () => {
        try {
            // Force persistence to LOCAL to survive redirects on mobile
            await setPersistence(auth, browserLocalPersistence);
            
            // Check for redirect result (Coming back from Google)
            const result = await getRedirectResult(auth).catch(error => {
                console.error("Redirect Result Error:", error);
                if (error.code === 'auth/network-request-failed') {
                    console.warn("Network error during redirect result.");
                }
                return null;
            });

            if (result && result.user) {
                console.log("Successfully returned from redirect login:", result.user.email);
                await syncUserData(result.user);
            }
        } catch (e) {
            console.error("Auth Init Error:", e);
        }
    };

    initAuth();

    // Listen for auth state changes (This handles normal login and session restoration)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserData(firebaseUser);
      } else {
        const cachedUser = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
        if (cachedUser) {
             setUser(null);
             localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
        }
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const syncUserData = async (firebaseUser: FirebaseUser) => {
      // 1. Optimistic Update (Immediate UI Feedback)
      const optimisticUser: User = {
          id: firebaseUser.uid,
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          role: 'premium', // Assume premium/default initially
          email: firebaseUser.email || '',
          emailVerified: firebaseUser.emailVerified,
          status: 'active',
          aiRequestCount: 0,
          lastRequestDate: new Date().toISOString().split('T')[0],
          prescriptionPrivilege: false
      };

      // Set user immediately to unblock UI while we fetch details
      setUser(prev => {
          // If we already have a user with same ID (e.g. from cache), keep it to avoid flicker
          // unless the new one is "verified" and old one wasn't
          if (prev && prev.id === optimisticUser.id) {
              if (optimisticUser.emailVerified && !prev.emailVerified) {
                  return { ...prev, emailVerified: true };
              }
              return prev;
          }
          return optimisticUser;
      });

      // 2. Fetch Full Profile from Firestore
      try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data();
            let emailVerified = firebaseUser.emailVerified;
            
            // Sync verification status to Firestore if changed
            if (emailVerified && !firestoreData.emailVerified) {
                updateDoc(userDocRef, { emailVerified: true }).catch(e => console.log("Offline: Could not update verify status"));
            }

            const finalUser = { 
                id: firebaseUser.uid, 
                ...firestoreData, 
                emailVerified: emailVerified, 
                email: firebaseUser.email || '',
                prescriptionPrivilege: firestoreData.prescriptionPrivilege ?? false,
                customAiLimit: firestoreData.customAiLimit
            } as User;

            setUser(finalUser);
            localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(finalUser));
          } else {
              // Create new user doc if it doesn't exist
              const newUser: User = {
                  ...optimisticUser,
                  role: 'premium', // Ensure default role is set
                  status: 'active'
              };
              await setDoc(userDocRef, newUser).catch(e => console.log("Offline: could not create doc"));
              
              setUser(newUser);
              localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(newUser));
          }
      } catch (e) {
          console.log("Network issue or offline: keeping existing/optimistic user data.", e);
          // We already set the optimistic user, so we are good to go for offline usage
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

  const loginWithGoogle = useCallback(async (): Promise<void> => {
      if (FIREBASE_DISABLED) throw new Error("Firebase unavailable");
      setIsLoading(true);
      try {
          await setPersistence(auth, browserLocalPersistence);
          // Use signInWithPopup instead of redirect. 
          // This avoids the "Failed to load localhost" navigation error on Android WebViews
          // because it handles auth in a separate window/tab and messages back, keeping the main app alive.
          await signInWithPopup(auth, googleProvider);
      } catch (error: any) {
          console.error("Google Login Error:", error);
          setIsLoading(false);
          
          if (error.code === 'auth/popup-closed-by-user') {
              throw new Error('تم إلغاء تسجيل الدخول.');
          }
          if (error.code === 'auth/popup-blocked') {
              throw new Error('تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لتسجيل الدخول.');
          }
          if (error.code === 'auth/unauthorized-domain') {
              const currentDomain = window.location.hostname;
              throw new Error(`النطاق الحالي (${currentDomain}) غير مصرح به في Firebase.\n\nيرجى إضافته في إعدادات Firebase.`);
          }
          throw new Error('فشل تسجيل الدخول بواسطة جوجل: ' + (error.message || 'خطأ غير معروف'));
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
        email: cleanEmail,
        prescriptionPrivilege: false
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
            if (currentUser.emailVerified && user && !user.emailVerified) {
                await syncUserData(currentUser);
            }
        } catch(e) {
            console.log("Offline: Cannot reload user from server.");
        }
    }
  }, [user]);
  
  const getSettings = useCallback((): AppSettings => {
    try {
      const stored = localStorage.getItem('mock_app_settings');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { aiRequestLimit: 3, isAiEnabled: true };
  }, []);

  const updateSettings = useCallback(async (settings: AppSettings) => {
    try {
        localStorage.setItem('mock_app_settings', JSON.stringify(settings));
        if (!FIREBASE_DISABLED) {
            const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
            await setDoc(settingsRef, settings, { merge: true });
        }
    } catch (e) {
        console.error("Error saving settings:", e);
    }
  }, []);

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

        const currentSettings = getSettings();
        const limit = user.customAiLimit ?? (currentSettings.aiRequestLimit ?? 3);
        const isAiEnabled = currentSettings.isAiEnabled !== false;

        if (!isAiEnabled) {
            alert(t('aiUnavailableMessage'));
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        let currentUserState = { ...user };
        
        if (currentUserState.lastRequestDate !== today) {
            currentUserState.aiRequestCount = 0;
            currentUserState.lastRequestDate = today;
        }
        
        if (currentUserState.aiRequestCount >= limit) {
            alert(t('usageLimitReached', { limit }));
            return;
        }
        
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
            } catch (e) {}
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
      loginWithGoogle,
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
