
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
  getRedirectResult,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc
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
      // If we have a user locally, we don't show loading initially
      return !localStorage.getItem(LOCAL_USER_STORAGE_KEY);
  });

  // Handle Auth State Changes & Redirect Results
  useEffect(() => {
    if (FIREBASE_DISABLED) {
        setIsLoading(false);
        return;
    }

    let mounted = true;

    // Safety Timeout: Force loading to stop after 5 seconds to prevent infinite white screen on mobile
    const safetyTimeout = setTimeout(() => {
        if (mounted && isLoading) {
            console.warn("Auth check timed out - forcing UI load");
            setIsLoading(false);
        }
    }, 5000);

    const initAuth = async () => {
        try {
            await setPersistence(auth, browserLocalPersistence);
            
            // Check for redirect result (In case we fell back to redirect flow)
            try {
                const result = await getRedirectResult(auth);
                if (result && mounted) {
                    await syncUserData(result.user);
                }
            } catch (redirectError: any) {
                // CRITICAL FIX: Ignore 'missing initial state' or 'user cancel' errors
                // This prevents the white screen crash loop on Android
                console.warn("Redirect non-critical error (handled):", redirectError.code);
            }
        } catch (e) {
            console.error("Auth Init Error:", e);
        }
    };

    initAuth();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
      
      // Clear timeout as we got a response
      clearTimeout(safetyTimeout);

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

    return () => {
        mounted = false;
        clearTimeout(safetyTimeout);
        unsubscribe();
    };
  }, []);

  const syncUserData = async (firebaseUser: FirebaseUser) => {
      // 1. Optimistic Update (Immediate UI Feedback)
      const optimisticUser: User = {
          id: firebaseUser.uid,
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          role: 'premium', 
          email: firebaseUser.email || '',
          emailVerified: firebaseUser.emailVerified,
          status: 'active',
          aiRequestCount: 0,
          lastRequestDate: new Date().toISOString().split('T')[0],
          prescriptionPrivilege: false
      };

      setUser(prev => {
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
            
            if (emailVerified && !firestoreData.emailVerified) {
                updateDoc(userDocRef, { emailVerified: true }).catch(() => {});
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
              const newUser: User = {
                  ...optimisticUser,
                  role: 'premium',
                  status: 'active'
              };
              await setDoc(userDocRef, newUser).catch(() => {});
              setUser(newUser);
              localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(newUser));
          }
      } catch (e) {
          console.log("Network issue: keeping optimistic user data.");
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
        let errorMessage = 'خطأ في تسجيل الدخول.';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
             errorMessage = 'بيانات الدخول غير صحيحة.';
        } else if (error.code === 'auth/network-request-failed') {
             errorMessage = 'تحقق من الاتصال بالإنترنت.';
        }
        throw new Error(errorMessage);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
     if (FIREBASE_DISABLED) throw new Error("Firebase unavailable");
     try {
         await sendPasswordResetEmail(auth, email);
     } catch (error: any) {
         throw new Error('حدث خطأ أثناء إرسال الرابط.');
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
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('البريد الإلكتروني مسجل بالفعل.');
        }
        throw new Error('فشل إنشاء الحساب.');
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
    if (auth.currentUser && !auth.currentUser.emailVerified) {
        await sendEmailVerification(auth.currentUser);
    }
  }, []);

  const reloadUser = useCallback(async () => {
    if (FIREBASE_DISABLED) return;
    if (auth.currentUser) {
        try {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified && user && !user.emailVerified) {
                await syncUserData(auth.currentUser);
            }
        } catch(e) {}
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
            await setDoc(doc(db, 'settings', SETTINGS_DOC_ID), settings, { merge: true });
        }
    } catch (e) {}
  }, []);

  const requestAIAccess = useCallback(async (callback: () => void, t: TFunction) => {
    if (!user) { alert(t('loginRequired')); return; }
    if (user.role !== 'admin' && !user.emailVerified) { alert(t('emailVerificationRequired')); return; }
    if (user.role === 'admin') { callback(); return; }
    
    if (user.role === 'premium') {
        const currentSettings = getSettings();
        const limit = user.customAiLimit ?? (currentSettings.aiRequestLimit ?? 3);
        
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
            updateDoc(doc(db, 'users', user.id), {
                aiRequestCount: currentUserState.aiRequestCount,
                lastRequestDate: currentUserState.lastRequestDate
            }).catch(() => {});
        }
        callback();
    }
  }, [user, getSettings]);

  const getAllUsers = useCallback(() => [] as User[], []);
  const updateUser = useCallback(async (u: User) => {}, []);
  const deleteUser = useCallback(async (id: string) => {}, []);

  const value = { 
      user, login, register, logout, requestAIAccess, resendVerificationEmail, 
      reloadUser, resetPassword, isLoading, getAllUsers, updateUser, deleteUser, getSettings, updateSettings 
    };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
