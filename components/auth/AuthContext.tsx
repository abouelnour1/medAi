
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
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const LOCAL_USER_STORAGE_KEY = 'medai_user_backup';
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = { 
          ...userDoc.data(), 
          id: firebaseUser.uid,
          emailVerified: firebaseUser.emailVerified 
        } as User;
        setUser(userData);
        localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(userData));
      }
    } catch (e) {
      console.error("Error fetching user doc:", e);
    }
  }, []);

  useEffect(() => {
    if (FIREBASE_DISABLED) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      } else {
        setUser(null);
        localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, [fetchUserData]);

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e: any) {
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found') throw new Error('بيانات الدخول غير صحيحة');
      throw new Error('فشل تسجيل الدخول: ' + e.message);
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
        status: 'active',
        aiRequestCount: 0,
        lastRequestDate: new Date().toISOString().split('T')[0],
      };
      await setDoc(doc(db, 'users', res.user.uid), newUser);
      setUser(newUser);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') throw new Error('البريد مسجل مسبقاً');
      throw new Error('حدث خطأ أثناء التسجيل: ' + e.message);
    }
  };

  const updateUser = async (updatedUser: User) => {
      if (FIREBASE_DISABLED) return;
      try {
          const { id, ...data } = updatedUser;
          await updateDoc(doc(db, 'users', id), data);
          // إذا كان المستخدم يحدث بياناته هو شخصياً، نحدث الحالة المحلية
          if (user && user.id === id) {
              setUser(updatedUser);
              localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(updatedUser));
          }
      } catch (e) {
          console.error("Error updating user:", e);
          throw e;
      }
  };

  const deleteUserRecord = async (userId: string) => {
      if (FIREBASE_DISABLED) return;
      try {
          await deleteDoc(doc(db, 'users', userId));
      } catch (e) {
          console.error("Error deleting user:", e);
          throw e;
      }
  };

  const logout = () => signOut(auth);

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
  };

  const reloadUser = async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      await fetchUserData(auth.currentUser);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = { 
    user, 
    login, 
    register, 
    logout, 
    isLoading, 
    resendVerificationEmail, 
    reloadUser,
    resetPassword,
    updateUser,
    deleteUser: deleteUserRecord,
    getSettings: () => ({ aiRequestLimit: 10, isAiEnabled: true }), // Placeholder
    updateSettings: () => {}, // Placeholder
    verifyOTP: async () => {} 
  };
  
  return <AuthContext.Provider value={value as any}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
