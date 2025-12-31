
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, AuthContextType, AppSettings, TFunction } from '../../types';
import { auth, db, FIREBASE_DISABLED } from '../../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  browserLocalPersistence,
  setPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const LOCAL_USER_STORAGE_KEY = 'medai_user_backup';
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (FIREBASE_DISABLED) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = { id: firebaseUser.uid, ...userDoc.data() } as User;
          setUser(userData);
          localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(userData));
        }
      } else {
        setUser(null);
        localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e: any) {
      throw new Error(e.code === 'auth/invalid-credential' ? 'بيانات الدخول خاطئة' : 'فشل تسجيل الدخول');
    }
  };

  const register = async (email: string, pass: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await sendEmailVerification(res.user);
      const newUser: User = {
        id: res.user.uid,
        username: email.split('@')[0],
        role: 'premium',
        email: email,
        emailVerified: false,
        status: 'pending',
        aiRequestCount: 0,
        lastRequestDate: new Date().toISOString().split('T')[0]
      };
      await setDoc(doc(db, 'users', res.user.uid), newUser);
      setUser(newUser);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') throw new Error('البريد مسجل مسبقاً');
      if (e.code === 'auth/operation-not-allowed') throw new Error('التسجيل معطل من لوحة التحكم');
      throw new Error('حدث خطأ أثناء التسجيل: ' + e.message);
    }
  };

  const logout = () => signOut(auth);

  const value = { user, login, register, logout, isLoading };
  return <AuthContext.Provider value={value as any}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
