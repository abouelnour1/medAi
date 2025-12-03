
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
  signInWithPopup,
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
      return !localStorage.getItem(LOCAL_USER_STORAGE_KEY);
  });

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

  useEffect(() => {
    if (FIREBASE_DISABLED) {
        setIsLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserData(firebaseUser);
      } else {
        const cachedUser = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
        if (!isLoading) { 
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
      try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data();
            let emailVerified = firebaseUser.emailVerified;
            
            if (emailVerified && !firestoreData.emailVerified) {
                updateDoc(userDocRef, { emailVerified: true }).catch(e => console.log("Offline: Could not update verify status"));
            }

            const finalUser = { 
                id: firebaseUser.uid, 
                ...firestoreData, 
                emailVerified: emailVerified, 
                email: firebaseUser.email || '',
                prescriptionPrivilege: firestoreData.prescriptionPrivilege ?? false,
                customAiLimit: firestoreData.customAiLimit // Ensure this is synced
            } as User;

            setUser(finalUser);
            localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(finalUser));
          } else {
              const newUser: User = {
                  id: firebaseUser.uid,
                  username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                  role: 'premium',
                  aiRequestCount: 0,
                  lastRequestDate: new Date().toISOString().split('T')[0],
                  status: 'active', // Auto-active for social login usually
                  emailVerified: firebaseUser.emailVerified,
                  email: firebaseUser.email || '',
                  prescriptionPrivilege: false
              };
              await setDoc(userDocRef, newUser).catch(e => console.log("Offline: could not create doc"));
              
              setUser(newUser);
              localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(newUser));
          }
      } catch (e) {
          console.log("Network issue or offline: keeping existing cached user data.");
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
      try {
          await signInWithPopup(auth, googleProvider);
          // syncUserData is called automatically by onAuthStateChanged
      } catch (error: any) {
          console.error("Google Login Error:", error);
          if (error.code === 'auth/popup-closed-by-user') throw new Error('تم إغلاق النافذة من قبل المستخدم.');
          if (error.code === 'auth/unauthorized-domain') {
              const currentDomain = window.location.hostname;
              throw new Error(`النطاق الحالي غير مصرح به في Firebase.\n\nيرجى نسخ هذا الرابط وإضافته في Authorized Domains:\n\n${currentDomain}`);
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
            if (currentUser) {
                await syncUserData(currentUser);
            }
        } catch(e) {
            console.log("Offline: Cannot reload user from server.");
        }
    }
  }, []);
  
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
        // Priority: User Custom Limit -> Global Settings Limit -> Default 3
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
        // Update local state if the updated user is the current logged in user
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