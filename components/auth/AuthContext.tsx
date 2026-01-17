
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
  collection,
  getDocs,
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
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  const syncUserData = useCallback(async (firebaseUser: FirebaseUser) => {
      try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let userData: User;
          
          if (userDoc.exists()) {
              const data = userDoc.data();
              userData = {
                  id: firebaseUser.uid,
                  username: data.username || firebaseUser.email?.split('@')[0] || 'User',
                  role: data.role || 'premium',
                  companyName: data.companyName,
                  email: firebaseUser.email || '',
                  emailVerified: firebaseUser.emailVerified,
                  status: data.status || 'active',
                  aiRequestCount: data.aiRequestCount || 0,
                  customAiLimit: data.customAiLimit,
                  lastRequestDate: data.lastRequestDate || new Date().toISOString().split('T')[0],
                  prescriptionPrivilege: data.prescriptionPrivilege || false
              };
              if (data.emailVerified !== firebaseUser.emailVerified) {
                  await updateDoc(userDocRef, { emailVerified: firebaseUser.emailVerified });
              }
          } else {
              userData = {
                  id: firebaseUser.uid,
                  username: firebaseUser.email?.split('@')[0] || 'User',
                  role: 'premium',
                  email: firebaseUser.email || '',
                  emailVerified: firebaseUser.emailVerified,
                  status: 'active',
                  aiRequestCount: 0,
                  lastRequestDate: new Date().toISOString().split('T')[0],
                  prescriptionPrivilege: false
              };
              await setDoc(userDocRef, userData);
          }
          
          setUser(userData);
          localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(userData));
      } catch (err) {
          console.error("Error syncing user data:", err);
      } finally {
          setIsLoading(false);
      }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserData(firebaseUser);
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

  const register = async (email: string, password: string, role: 'premium' | 'company' = 'premium', companyName?: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const userDocRef = doc(db, 'users', result.user.uid);
    const userData: User = {
        id: result.user.uid,
        username: email.split('@')[0],
        role: role,
        companyName: companyName,
        email: email,
        emailVerified: false,
        status: 'active',
        aiRequestCount: 0,
        lastRequestDate: new Date().toISOString().split('T')[0],
        prescriptionPrivilege: role === 'company' ? true : false
    };
    await setDoc(userDocRef, userData);
    await sendEmailVerification(result.user);
    await syncUserData(result.user);
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
      if (auth.currentUser) {
          await sendEmailVerification(auth.currentUser);
      }
  };

  const resetPassword = async (email: string) => {
      await sendPasswordResetEmail(auth, email);
  };

  const getAllUsers = () => {
      return []; 
  };

  const updateUser = async (updatedUser: User) => {
      const userRef = doc(db, 'users', updatedUser.id);
      await setDoc(userRef, updatedUser, { merge: true });
  };

  const deleteUser = async (userId: string) => {
      await deleteDoc(doc(db, 'users', userId));
  };

  const getSettings = (): AppSettings => {
      return { aiRequestLimit: 5, isAiEnabled: true };
  };

  const updateSettings = async (settings: AppSettings) => {
      await setDoc(doc(db, 'settings', SETTINGS_DOC_ID), settings);
  };

  const requestAIAccess = useCallback((callback: () => void, t: TFunction) => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    const limit = user.customAiLimit || 5;

    if (user.lastRequestDate !== today) {
        const updatedUser = { ...user, aiRequestCount: 1, lastRequestDate: today };
        updateUser(updatedUser);
        callback();
    } else if (user.aiRequestCount < limit) {
        const updatedUser = { ...user, aiRequestCount: user.aiRequestCount + 1 };
        updateUser(updatedUser);
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
