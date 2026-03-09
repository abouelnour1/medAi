
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { User, AuthContextType, AppSettings, TFunction } from '../../types';
import { auth, db, FIREBASE_DISABLED } from '../../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
} from 'firebase/firestore';

const SETTINGS_DOC_ID = 'app_settings';
const LOCAL_USER_STORAGE_KEY = 'medai_user_backup_v4';

const AuthContext = createContext<AuthContextType | null>(null);

const toPlainObject = (user: any): User | null => {
    if (!user) return null;
    return {
        id: String(user.id || user.uid || ''),
        username: String(user.username || user.displayName || user.email?.split('@')[0] || 'User'),
        role: (typeof user.role === 'string' ? user.role : 'premium') as any,
        email: String(user.email || ''),
        emailVerified: Boolean(user.emailVerified),
        status: (typeof user.status === 'string' ? user.status : 'active') as any,
        aiRequestCount: Number(user.aiRequestCount || 0),
        customAiLimit: user.customAiLimit ? Number(user.customAiLimit) : undefined,
        lastRequestDate: String(user.lastRequestDate || new Date().toISOString().split('T')[0]),
        prescriptionPrivilege: Boolean(user.prescriptionPrivilege)
    };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appSettings, setAppSettings] = useState<AppSettings>({ aiRequestLimit: 3, isAiEnabled: true, isFeaturedEnabled: true });
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_USER_STORAGE_KEY) 
                  || sessionStorage.getItem(LOCAL_USER_STORAGE_KEY);
      if (cached) return toPlainObject(JSON.parse(cached));
    } catch (e) {}
    return null;
  });

  // ✅ isLoading = true دايماً — Firebase هيتحقق من IndexedDB (يشتغل في PWA + متصفح)
  const [isLoading, setIsLoading] = useState(true);
  const isSyncing = useRef(false);
  const loadingTimeoutRef = useRef<number | null>(null);

  const syncUserData = useCallback(async (firebaseUser: FirebaseUser) => {
      // ✅ منع double sync
      if (isSyncing.current) return;
      isSyncing.current = true;

      try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          let userData: User | null = null;
          
          const userDoc = await getDoc(userDocRef).catch(() => null);
          if (userDoc?.exists()) {
              const data = userDoc.data();
              userData = toPlainObject({
                  ...data,
                  id: firebaseUser.uid,
                  email: firebaseUser.email,
                  emailVerified: firebaseUser.emailVerified
              });
          } else {
              // مستخدم جديد - ننشئ له doc
              userData = toPlainObject({
                  id: firebaseUser.uid,
                  username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                  role: 'premium',
                  email: firebaseUser.email || '',
                  emailVerified: firebaseUser.emailVerified,
                  status: 'active',
                  aiRequestCount: 0,
                  lastRequestDate: new Date().toISOString().split('T')[0]
              });
              if (userData) {
                  await setDoc(userDocRef, userData);
              }
          }
          
          if (userData) {
              setUser(userData);
              const serialized = JSON.stringify(userData);
              try { localStorage.setItem(LOCAL_USER_STORAGE_KEY, serialized); } catch {}
              try { sessionStorage.setItem(LOCAL_USER_STORAGE_KEY, serialized); } catch {}
          }
      } catch (err) {
          console.error("Critical Auth Sync Error:", err);
          // ✅ لو فشل Firestore، نبني من Firebase user مباشرة
          const fallback = toPlainObject({
              id: firebaseUser.uid,
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              role: 'premium',
              email: firebaseUser.email || '',
              emailVerified: firebaseUser.emailVerified,
              status: 'active',
              aiRequestCount: 0,
              lastRequestDate: new Date().toISOString().split('T')[0]
          });
          if (fallback) {
              setUser(fallback);
              const serialized = JSON.stringify(fallback);
              try { localStorage.setItem(LOCAL_USER_STORAGE_KEY, serialized); } catch {}
              try { sessionStorage.setItem(LOCAL_USER_STORAGE_KEY, serialized); } catch {}
          }
      } finally {
          isSyncing.current = false;
          setIsLoading(false);
          if (loadingTimeoutRef.current) window.clearTimeout(loadingTimeoutRef.current);
      }
  }, []);

  useEffect(() => {
    // ✅ لو في cached user → timeout قصير (500ms) — Firebase هيجيب الـ session من IndexedDB بسرعة
    const hasCached = (() => { try { return !!localStorage.getItem(LOCAL_USER_STORAGE_KEY); } catch { return false; } })();
    loadingTimeoutRef.current = window.setTimeout(() => {
        setIsLoading(false);
    }, hasCached ? 500 : 5000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        syncUserData(firebaseUser as FirebaseUser);
      } else {
        localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
        try { sessionStorage.removeItem(LOCAL_USER_STORAGE_KEY); } catch {}
        setUser(null);
        setIsLoading(false);
        if (loadingTimeoutRef.current) window.clearTimeout(loadingTimeoutRef.current);
      }
    }, (error) => {
        console.error("Auth State Change Error:", error);
        setIsLoading(false);
    });

    return () => {
        unsubscribe();
        if (loadingTimeoutRef.current) window.clearTimeout(loadingTimeoutRef.current);
    };
  }, [syncUserData]);

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await syncUserData(result.user as FirebaseUser);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    // ✅ popup فقط - بدون redirect عشان مايعملش صفحة بيضاء
    const result = await signInWithPopup(auth, provider);
    await syncUserData(result.user as FirebaseUser);
  };

  const loginWithApple = async () => {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    const result = await signInWithPopup(auth, provider);
    await syncUserData(result.user as FirebaseUser);
  };

  const register = async (email: string, password: string, role: 'premium' | 'company' = 'premium') => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(result.user);
    const userData = toPlainObject({
        id: result.user.uid, username: email.split('@')[0], email: email, role: role,
        emailVerified: false, status: 'active', aiRequestCount: 0, lastRequestDate: new Date().toISOString().split('T')[0]
    });
    if (userData) {
        await setDoc(doc(db, 'users', result.user.uid), userData);
        setUser(userData);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    try { localStorage.removeItem(LOCAL_USER_STORAGE_KEY); } catch {}
    try { sessionStorage.removeItem(LOCAL_USER_STORAGE_KEY); } catch {}
  };

  const reloadUser = async () => {
      if (auth.currentUser) {
          await reload(auth.currentUser);
          await syncUserData(auth.currentUser as FirebaseUser);
      }
  };

  const resendVerificationEmail = async () => {
      if (auth.currentUser) await sendEmailVerification(auth.currentUser);
  };

  const resetPassword = async (email: string) => {
      await sendPasswordResetEmail(auth, email);
  };

  const getAllUsers = () => [];
  const updateUser = async (updatedUser: User) => {
      const plain = toPlainObject(updatedUser);
      if (!plain) return;
      const userRef = doc(db, 'users', plain.id);
      await setDoc(userRef, plain, { merge: true }).catch(() => {});
      if (user?.id === plain.id) setUser(plain);
  };
  const deleteUser = async (userId: string) => { await deleteDoc(doc(db, 'users', userId)); };
  const getSettings = (): AppSettings => appSettings;
  const updateSettings = async (settings: AppSettings) => { await setDoc(doc(db, 'settings', SETTINGS_DOC_ID), settings); };

  const requestAIAccess = useCallback((callback: () => void, t: TFunction) => {
    if (!user) {
      alert(t('loginRequired') || 'يجب تسجيل الدخول أولاً');
      return;
    }
    if (user.role === 'admin') {
      callback();
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const globalLimit = appSettings.aiRequestLimit || 3;
    const limit = user.customAiLimit !== undefined ? user.customAiLimit : globalLimit;
    
    if (user.lastRequestDate !== today) {
      updateUser({ ...user, aiRequestCount: 1, lastRequestDate: today });
      callback();
    } else if (user.aiRequestCount < limit) {
      updateUser({ ...user, aiRequestCount: user.aiRequestCount + 1 });
      callback();
    } else {
      alert(
        (t('usageLimitReached') || 'وصلت للحد اليومي')
          .replace('{limit}', String(limit))
          .replace('%d', String(limit))
        + ` (${limit} يومياً / per day)`
      );
    }
  }, [user, appSettings]);

  const value = { 
      user, login, loginWithGoogle, loginWithApple, register, logout, requestAIAccess, resendVerificationEmail, 
      reloadUser, resetPassword, isLoading, getAllUsers, updateUser, deleteUser, getSettings, updateSettings 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
