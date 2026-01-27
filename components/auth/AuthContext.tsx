
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
const LOCAL_USER_STORAGE_KEY = 'medai_user_backup_v2';

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * وظيفة لتنظيف الكائن من أي مراجع دائرية أو خصائص غير قابلة للتسلسل (Serialization)
 * لضمان عدم حدوث خطأ "Converting circular structure to JSON"
 */
const toPlainObject = (user: any): User => {
    if (!user) return null as any;
    return {
        id: String(user.id || user.uid || ''),
        username: String(user.username || user.email?.split('@')[0] || 'User'),
        role: (user.role as any) || 'premium',
        email: String(user.email || ''),
        emailVerified: Boolean(user.emailVerified),
        status: (user.status as any) || 'active',
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
      return cached ? toPlainObject(JSON.parse(cached)) : null;
    } catch (e) {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  const syncUserData = useCallback(async (firebaseUser: FirebaseUser) => {
      try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          let userData: User;
          
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
                  // إنشاء مستخدم جديد في قاعدة البيانات إذا لم يوجد
                  userData = toPlainObject({
                      id: firebaseUser.uid,
                      username: firebaseUser.email?.split('@')[0] || 'User',
                      role: 'premium',
                      email: firebaseUser.email || '',
                      emailVerified: firebaseUser.emailVerified,
                      status: 'active',
                      aiRequestCount: 0,
                      lastRequestDate: new Date().toISOString().split('T')[0]
                  });
                  await setDoc(userDocRef, userData).catch(() => {});
              }
          } catch (err: any) {
              // التعامل مع حالات عدم الاتصال
              console.warn("Sync error (Offline?):", err.message);
              if (user && user.id === firebaseUser.uid) return;
              userData = toPlainObject(firebaseUser);
          }
          
          setUser(userData);
          localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(userData));
      } catch (err) {
          console.error("Critical Auth Sync Error:", err);
      } finally {
          setIsLoading(false);
      }
  }, [user]);

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
    await setDoc(doc(db, 'users', result.user.uid), userData);
    setUser(userData);
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
