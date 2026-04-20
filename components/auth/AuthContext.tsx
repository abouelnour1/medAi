import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
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
  signInWithRedirect,
  getRedirectResult,
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
const USER_SYNC_INTERVAL = 30 * 60 * 1000; // 30 دقيقة بين كل Firestore read

const AuthContext = createContext<AuthContextType | null>(null);

const toPlainObject = (user: any): User | null => {
    if (!user) return null;
    const obj: any = {
        id: String(user.id || user.uid || ''),
        username: String(user.username || user.displayName || user.email?.split('@')[0] || 'User'),
        role: (typeof user.role === 'string' ? user.role : 'free') as any,
        email: String(user.email || ''),
        emailVerified: Boolean(user.emailVerified),
        status: (typeof user.status === 'string' ? user.status : 'active') as any,
        aiRequestCount: Number(user.aiRequestCount || 0),
        customAiLimit: user.customAiLimit ? Number(user.customAiLimit) : undefined,
        lastRequestDate: String(user.lastRequestDate || new Date().toISOString().split('T')[0]),
        prescriptionPrivilege: Boolean(user.prescriptionPrivilege),
        // subscription
        subscriptionPlan: user.subscriptionPlan || null,
        subscriptionStatus: user.subscriptionStatus || null,
        subscriptionExpiresAt: user.subscriptionExpiresAt || null,
        subscriptionPurchaseToken: user.subscriptionPurchaseToken || null,
    };
    if (user.specialty) obj.specialty = user.specialty;
    if (user.subSpecialty) obj.subSpecialty = user.subSpecialty;
    return obj as User;
};

// ── Helper: read/write user cache ─────────────────────────────────────────────
const getCachedUser = (): User | null => {
  try {
    const s = localStorage.getItem(LOCAL_USER_STORAGE_KEY) || sessionStorage.getItem(LOCAL_USER_STORAGE_KEY);
    return s ? JSON.parse(s) as User : null;
  } catch { return null; }
};

const setCachedUser = (user: User) => {
  try {
    const s = JSON.stringify(user);
    localStorage.setItem(LOCAL_USER_STORAGE_KEY, s);
    sessionStorage.setItem(LOCAL_USER_STORAGE_KEY, s);
  } catch {}
};

const clearCachedUser = () => {
  try {
    localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
    sessionStorage.removeItem(LOCAL_USER_STORAGE_KEY);
  } catch {}
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appSettings, setAppSettings] = useState<AppSettings>({ aiRequestLimit: 3, isAiEnabled: true, isFeaturedEnabled: true });

  // نحمل الـ user من cache فوراً بدون أي network
  const [user, setUser] = useState<User | null>(() => getCachedUser());

  // لو في cache → مش loading، التطبيق يفتح فوراً
  const [isLoading, setIsLoading] = useState(() => !getCachedUser());

  // منع أي network call زيادة
  const activeUid = useRef<string | null>(null);
  const isSyncing = useRef(false);
  const loadingTimeoutRef = useRef<number | null>(null);

  // ── syncUserData: بيتشتغل بس لو مفيش cache أو فات 30 دقيقة ────────────────
  const syncUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    if (isSyncing.current) return;

    // لو نفس اليوزر → تحقق من الـ interval بس
    if (activeUid.current === firebaseUser.uid) {
      const lastSyncKey = `last_user_sync_${firebaseUser.uid}`;
      const lastSync = parseInt(localStorage.getItem(lastSyncKey) || '0');
      if (Date.now() - lastSync < USER_SYNC_INTERVAL) {
        // مش فاتت 30 دقيقة → الـ cache كافي، مش محتاجين Firestore
        setIsLoading(false);
        if (loadingTimeoutRef.current) window.clearTimeout(loadingTimeoutRef.current);
        return;
      }
    }

    // أول مرة أو فات الـ interval → اتحقق من cache الأول
    const cached = getCachedUser();
    if (cached && cached.id === firebaseUser.uid) {
      // عندنا cache صالح → استخدمه فوراً
      setUser(cached);
      setIsLoading(false);
      if (loadingTimeoutRef.current) window.clearTimeout(loadingTimeoutRef.current);
      activeUid.current = firebaseUser.uid;

      // الـ Firestore sync في الخلفية تماماً — مش بيأثر على الـ UI
      const lastSyncKey = `last_user_sync_${firebaseUser.uid}`;
      const lastSync = parseInt(localStorage.getItem(lastSyncKey) || '0');
      if (Date.now() - lastSync < USER_SYNC_INTERVAL) return; // مش فاتت 30 دقيقة
      localStorage.setItem(lastSyncKey, String(Date.now()));

      // background sync — لا loading ولا state change إلا لو في فرق فعلي
      (async () => {
        try {
          isSyncing.current = true;
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid)).catch(() => null);
          if (userDoc?.exists()) {
            const fresh = toPlainObject({
              ...userDoc.data(),
              id: firebaseUser.uid,
              email: firebaseUser.email,
              emailVerified: firebaseUser.emailVerified
            });
            if (fresh) {
              // نتحقق لو في فرق فعلي قبل ما نعمل setUser
              const cachedNow = getCachedUser();
              if (JSON.stringify(fresh) !== JSON.stringify(cachedNow)) {
                setUser(fresh);
                setCachedUser(fresh);
              }
            }
          }
        } catch {} finally {
          isSyncing.current = false;
        }
      })();
      return;
    }

    // مفيش cache صالح → أول تسجيل دخول، لازم نجيب من Firestore
    isSyncing.current = true;
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef).catch(() => null);
      let userData: User | null = null;

      if (userDoc?.exists()) {
        userData = toPlainObject({
          ...userDoc.data(),
          id: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified
        });
      } else {
        // مستخدم جديد → free by default
        userData = toPlainObject({
          id: firebaseUser.uid,
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          role: 'free',
          email: firebaseUser.email || '',
          emailVerified: firebaseUser.emailVerified,
          status: 'active',
          aiRequestCount: 0,
          lastRequestDate: new Date().toISOString().split('T')[0]
        });
        if (userData) await setDoc(userDocRef, userData);
      }

      if (userData) {
        setUser(userData);
        setCachedUser(userData);
        // لو فيه specialty من Firestore، احفظه في localStorage عشان متطلبش تاني في أي متصفح
        if ((userData as any).specialty) {
          localStorage.setItem('user_specialty_fallback_' + firebaseUser.uid, (userData as any).specialty);
        }
        activeUid.current = firebaseUser.uid;
        localStorage.setItem(`last_user_sync_${firebaseUser.uid}`, String(Date.now()));
      }
    } catch (err) {
      // Firestore فشل — نبني من Firebase auth مباشرة
      // نحتفظ بالـ specialty لو موجودة في cache أو localStorage عشان ميطلبهاش تاني
      const cachedForFallback = getCachedUser();
      const savedSpecialty = (cachedForFallback as any)?.specialty
        || localStorage.getItem('user_specialty_fallback_' + firebaseUser.uid)
        || undefined;
      const savedSubSpecialty = (cachedForFallback as any)?.subSpecialty || undefined;
      const fallback = toPlainObject({
        id: firebaseUser.uid,
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        role: 'free',
        email: firebaseUser.email || '',
        emailVerified: firebaseUser.emailVerified,
        status: 'active',
        aiRequestCount: 0,
        lastRequestDate: new Date().toISOString().split('T')[0],
        ...(savedSpecialty ? { specialty: savedSpecialty } : {}),
        ...(savedSubSpecialty ? { subSpecialty: savedSubSpecialty } : {})
      });
      if (fallback) { setUser(fallback); setCachedUser(fallback); }
    } finally {
      isSyncing.current = false;
      setIsLoading(false);
      if (loadingTimeoutRef.current) window.clearTimeout(loadingTimeoutRef.current);
    }
  }, []);

  // ── onAuthStateChanged: Firebase بيبعت event كل reconnect ────────────────
  useEffect(() => {
    loadingTimeoutRef.current = window.setTimeout(() => setIsLoading(false), 3000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (loadingTimeoutRef.current) window.clearTimeout(loadingTimeoutRef.current);

      if (firebaseUser) {
        syncUserData(firebaseUser as FirebaseUser);
      } else {
        getRedirectResult(auth).then((result) => {
          if (result?.user) {
            syncUserData(result.user as FirebaseUser);
          } else {
            clearCachedUser();
            activeUid.current = null;
            setUser(null);
            setIsLoading(false);
          }
        }).catch(() => { setUser(null); setIsLoading(false); });
      }
    }, () => setIsLoading(false));

    return () => {
      unsubscribe();
      if (loadingTimeoutRef.current) window.clearTimeout(loadingTimeoutRef.current);
    };
  }, [syncUserData]);

  const login = async (email: string, password: string) => {
    activeUid.current = null; // reset عشان يعمل full sync
    const result = await signInWithEmailAndPassword(auth, email, password);
    await syncUserData(result.user as FirebaseUser);
  };

  const loginWithGoogle = async () => {
    activeUid.current = null;
    if (Capacitor.isNativePlatform()) {
      try {
        // @ts-ignore
        const socialLoginModule = await import('@capgo/capacitor-social-login').catch(() => null);
        if (!socialLoginModule) throw new Error('SocialLogin plugin not available');
        const { SocialLogin } = socialLoginModule;
        await SocialLogin.initialize({ google: { 
          webClientId: '568872568132-cg6f7ea60arn5tgkoq9dms0he053p7l6.apps.googleusercontent.com',
          // @ts-ignore
          androidClientId: '568872568132-m434n8ol4u5tk1k7ern3kevn6snge628.apps.googleusercontent.com',
        } });
        const result = await SocialLogin.login({ provider: 'google', options: { scopes: ['email', 'profile'] } });
        const idToken = (result.result as any)?.idToken;
        if (!idToken) throw new Error('No idToken from Google');
        const { signInWithCredential } = await import('firebase/auth');
        const credential = GoogleAuthProvider.credential(idToken);
        const firebaseResult = await signInWithCredential(auth, credential);
        await syncUserData(firebaseResult.user as FirebaseUser);
      } catch (err: any) {
        console.error('Google Native Sign-In Error:', err?.message);
        throw err;
      }
    } else {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      await syncUserData(result.user as FirebaseUser);
    }
  };

  const loginWithApple = async () => {
    activeUid.current = null;
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
      id: result.user.uid, username: email.split('@')[0], email, role,
      emailVerified: false, status: 'active', aiRequestCount: 0,
      lastRequestDate: new Date().toISOString().split('T')[0]
    });
    if (userData) { await setDoc(doc(db, 'users', result.user.uid), userData); setUser(userData); }
  };

  const logout = async () => {
    await signOut(auth);
    clearCachedUser();
    activeUid.current = null;
    setUser(null);
  };

  const reloadUser = async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      activeUid.current = null; // force full sync
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
    await setDoc(doc(db, 'users', plain.id), plain, { merge: true }).catch(() => {});
    if (user?.id === plain.id) {
      setUser(plain);
      setCachedUser(plain);
    }
  };

  const deleteUser = async (userId: string) => { await deleteDoc(doc(db, 'users', userId)); };
  const getSettings = (): AppSettings => appSettings;
  const updateSettings = async (settings: AppSettings) => { await setDoc(doc(db, 'settings', SETTINGS_DOC_ID), settings); };

  const requestAIAccess = useCallback((callback: () => void, t: TFunction) => {
    if (!user) { alert(t('loginRequired') || 'يجب تسجيل الدخول أولاً'); return; }
    if (user.role === 'admin') { callback(); return; }
    const today = new Date().toISOString().split('T')[0];
    const limit = user.customAiLimit !== undefined ? user.customAiLimit : (appSettings.aiRequestLimit || 3);
    if (user.lastRequestDate !== today) {
      updateUser({ ...user, aiRequestCount: 1, lastRequestDate: today });
      callback();
    } else if (user.aiRequestCount < limit) {
      updateUser({ ...user, aiRequestCount: user.aiRequestCount + 1 });
      callback();
    } else {
      alert(
        (t('usageLimitReached') || 'وصلت للحد اليومي')
          .replace('{limit}', String(limit)).replace('%d', String(limit))
        + ` (${limit} يومياً / per day)`
      );
    }
  }, [user, appSettings]);


  const value = { 
    user, login, loginWithGoogle, loginWithApple, register, logout, requestAIAccess,
    resendVerificationEmail, reloadUser, resetPassword, isLoading, getAllUsers,
    updateUser, deleteUser, getSettings, updateSettings
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
