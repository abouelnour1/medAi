
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
    if (FIREBASE_DISABLED) {
        setIsLoading(false);
        return;
    }

    let mounted = true;

    const safetyTimeout = setTimeout(() => {
        if (mounted && isLoading) {
            setIsLoading(false);
        }
    }, 5000);

    const initAuth = async () => {
        try {
            await setPersistence(auth, browserLocalPersistence);
            try {
                const result = await getRedirectResult(auth);
                if (result && mounted) {
                    await syncUserData(result.user);
                }
            } catch (redirectError: any) {
                console.warn("Auth Redirect Error:", redirectError.code);
            }
        } catch (e) {
            console.error("Auth Init Error:", e);
        }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
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
              return { ...prev, emailVerified: firebaseUser.emailVerified };
          }
          return optimisticUser;
      });

      try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data();
            const finalUser = { 
                id: firebaseUser.uid, 
                ...firestoreData, 
                emailVerified: firebaseUser.emailVerified, 
                email: firebaseUser.email || '',
            } as User;

            setUser(finalUser);
            localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(finalUser));
          } else {
              await setDoc(userDocRef, optimisticUser);
              setUser(optimisticUser);
              localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(optimisticUser));
          }
      } catch (e) {
          console.log("Firestore sync failed (Network/Rules?):", e);
      } finally {
          setIsLoading(false);
      }
  };

  const login = useCallback(async (usernameInput: string, password: string): Promise<void> => {
    if (FIREBASE_DISABLED) throw new Error("Firebase is disabled");

    let email = usernameInput.trim();
    if (email.toLowerCase() === 'admin' && !email.includes('@')) {
        email = 'admin@medai.com'; 
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        console.error("Login Error Details:", error.code, error.message);
        let msg = 'فشل تسجيل الدخول.';
        if (error.code === 'auth/invalid-credential') msg = 'بيانات الدخول غير صحيحة.';
        else if (error.code === 'auth/user-not-found') msg = 'المستخدم غير موجود.';
        else if (error.code === 'auth/wrong-password') msg = 'كلمة المرور خاطئة.';
        else if (error.code === 'auth/network-request-failed') msg = 'خطأ في الاتصال بالإنترنت.';
        throw new Error(`${msg} (${error.code})`);
    }
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<void> => {
    if (FIREBASE_DISABLED) throw new Error("Firebase is disabled");
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await sendEmailVerification(userCredential.user);

      const newUser: User = {
        id: userCredential.user.uid,
        username: email.split('@')[0],
        role: 'premium',
        aiRequestCount: 0,
        lastRequestDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        emailVerified: false,
        email: email.trim().toLowerCase(),
        prescriptionPrivilege: false
      };
      
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      } catch (dbErr) {
        console.warn("Auth success but Firestore profile creation failed:", dbErr);
      }
      
      setUser(newUser);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(newUser));
    } catch (error: any) {
        console.error("Registration Error Details:", error.code, error.message);
        let msg = 'فشل إنشاء الحساب.';
        if (error.code === 'auth/email-already-in-use') msg = 'هذا البريد الإلكتروني مسجل بالفعل.';
        else if (error.code === 'auth/invalid-email') msg = 'صيغة البريد الإلكتروني غير صحيحة.';
        else if (error.code === 'auth/weak-password') msg = 'كلمة المرور ضعيفة جداً.';
        else if (error.code === 'auth/operation-not-allowed') msg = 'تسجيل الحسابات معطل في الإعدادات.';
        throw new Error(`${msg} (${error.code})`);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
        await signOut(auth);
        setUser(null);
        localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
    } catch (error) {
        console.error("Logout error:", error);
    }
  }, []);

  const value = { 
    user, login, register, logout, isLoading, 
    requestAIAccess: (cb: any) => cb(), 
    resendVerificationEmail: async () => {},
    reloadUser: async () => {},
    resetPassword: async (e: string) => {},
    getAllUsers: () => [],
    updateUser: async (u: User) => {},
    deleteUser: async (id: string) => {},
    getSettings: () => ({ aiRequestLimit: 10, isAiEnabled: true }),
    updateSettings: async () => {}
  };

  return <AuthContext.Provider value={value as any}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
