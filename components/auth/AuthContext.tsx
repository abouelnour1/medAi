
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
  reload,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
} from 'firebase/firestore';

const SETTINGS_DOC_ID = 'app_settings';
const LOCAL_USER_STORAGE_KEY = 'medai_user_backup_v3';

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * وظيفة محسنة جداً لتنظيف الكائن من أي مراجع دائرية أو خصائص خفية من مكتبة Firebase
 */
const toPlainObject = (user: any): User | null => {
    if (!user) return null;
    
    // نقوم ببناء كائن جديد تماماً بقيم بسيطة فقط (Primitive Types)
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
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
      if (cached) {
          const parsed = JSON.parse(cached);
          return toPlainObject(parsed);
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  const syncUserData = useCallback(async (firebaseUser: FirebaseUser) => {
      try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          let userData: User | null = null;
          
          try {
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                  const data = userDoc.data();
                  userData = toPlainObject({
                      ...data,
                      id: firebaseUser.uid,
                      email: firebaseUser.email,
                      emailVerified: firebaseUser.emailVerified
                  });
                  
                  if (data.emailVerified !== firebaseUser.emailVerified) {
                      await updateDoc(userDocRef, { emailVerified: firebaseUser.emailVerified }).catch(() => {});
                  }
              } else {
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
                  if (userData) await setDoc(userDocRef, userData).catch(() => {});
              }
          } catch (err: any) {
              console.warn("Sync error (Offline or Permission?):", err.message);
              userData = toPlainObject({
                  id: firebaseUser.uid,
                  email: firebaseUser.email,
                  emailVerified: firebaseUser.emailVerified,
                  username: firebaseUser.displayName || firebaseUser.email?.split('@')[0]
              });
          }
          
          if (userData) {
              setUser(userData);
              try {
                  // نضمن أننا نخزن كائن "نظيف" تم تنظيفه عبر toPlainObject
                  localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(userData));
              } catch (storageErr) {
                  console.error("Local storage save error:", storageErr);
              }
          }
      } catch (err) {
          console.error("Critical Auth Sync Error:", err);
      } finally {
          setIsLoading(false);
      }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        syncUserData(firebaseUser);
      } else {
        localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [syncUserData]);

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await syncUserData(result.user);
  };

  const register = async (email: string, password: string, role: 'premium' | 'company' = 'premium') => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(result.user);
    
    const userData = toPlainObject({
        id: result.user.uid,
        username: email.split('@')[0],
        email: email,
        role: role,
        emailVerified: false,
        status: 'active',
        aiRequestCount: 0,
        lastRequestDate: new Date().toISOString().split('T')[0]
    });
    if (userData) {
        await setDoc(doc(db, 'users', result.user.uid), userData);
        setUser(userData);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
  };

  const reloadUser = async () => {
      if (auth.currentUser) {
          await reload(auth.currentUser);
          await syncUserData(auth.currentUser);
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
      await setDoc(userRef, plain, { merge: true });
      if (user?.id === plain.id) setUser(plain);
  };

  const deleteUser = async (userId: string) => {
      await deleteDoc(doc(db, 'users', userId));
  };

  const getSettings = (): AppSettings => ({ aiRequestLimit: 5, isAiEnabled: true });

  const updateSettings = async (settings: AppSettings) => {
      await setDoc(doc(db, 'settings', SETTINGS_DOC_ID), settings);
  };

  const requestAIAccess = useCallback((callback: () => void, t: TFunction) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const limit = user.customAiLimit || 5;

    if (user.lastRequestDate !== today) {
        updateUser({ ...user, aiRequestCount: 1, lastRequestDate: today });
        callback();
    } else if (user.aiRequestCount < limit) {
        updateUser({ ...user, aiRequestCount: user.aiRequestCount + 1 });
        callback();
    } else {
        alert(t('usageLimitReached', { limit }));
    }
  }, [user]);

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
