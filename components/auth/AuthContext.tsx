
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, AuthContextType, AppSettings, TFunction } from '../../types';
import { auth, db } from '../../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Enforce local persistence on mount
  useEffect(() => {
     const initAuth = async () => {
         try {
             await setPersistence(auth, browserLocalPersistence);
         } catch (e) {
             console.error("Error setting persistence:", e);
         }
     };
     initAuth();
  }, []);

  // Sync user state with Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserData(firebaseUser);
      } else {
        setUser(null);
        localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const syncUserData = async (firebaseUser: FirebaseUser) => {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      try {
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data();
            
            // Check if verify status changed in Auth but not in Firestore
            // Priority: Auth Object > Firestore Object
            let emailVerified = firebaseUser.emailVerified;
            
            if (emailVerified && !firestoreData.emailVerified) {
                await updateDoc(userDocRef, { emailVerified: true });
            }

            const finalUser = { 
                id: firebaseUser.uid, 
                ...firestoreData, 
                emailVerified: emailVerified, 
                email: firebaseUser.email || '',
            } as User;

            setUser(finalUser);
            localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(finalUser));
          } else {
              // Handle case where auth exists but firestore doc doesn't
              const newUser: User = {
                  id: firebaseUser.uid,
                  username: firebaseUser.email?.split('@')[0] || 'User',
                  role: 'premium', // Default role
                  aiRequestCount: 0,
                  lastRequestDate: new Date().toISOString().split('T')[0],
                  status: 'pending',
                  emailVerified: firebaseUser.emailVerified,
                  email: firebaseUser.email || ''
              };
              await setDoc(userDocRef, newUser);
              setUser(newUser);
              localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(newUser));
          }
      } catch (e) {
          console.error("Error fetching user profile:", e);
          // Try loading from Local Storage backup if Firestore fails (Offline mode)
          const cachedUserStr = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
          if (cachedUserStr) {
              try {
                  const cachedUser = JSON.parse(cachedUserStr);
                  if (cachedUser.id === firebaseUser.uid) {
                       setUser(cachedUser);
                       setIsLoading(false);
                       return;
                  }
              } catch (parseErr) {
                  console.error("Failed to parse cached user", parseErr);
              }
          }

          // Fallback if no cache available
          const fallbackUser: User = {
              id: firebaseUser.uid,
              username: firebaseUser.email?.split('@')[0] || 'User',
              role: 'premium',
              aiRequestCount: 0,
              lastRequestDate: new Date().toISOString().split('T')[0],
              status: 'pending',
              emailVerified: firebaseUser.emailVerified,
              email: firebaseUser.email || ''
          };
          setUser(fallbackUser);
      }
      setIsLoading(false);
  };

  const login = useCallback(async (usernameInput: string, password: string): Promise<void> => {
    let email = usernameInput.trim();

    // Special Exception: Map 'admin' username to the admin email
    // This allows the user to just type "admin" to login.
    if (email.toLowerCase() === 'admin') {
        email = 'admin@medai.com'; 
    }

    try {
        // Ensure session persistence is set to LOCAL (survives app restart)
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
             // If mapping failed or input was bad
             errorMessage = 'البريد الإلكتروني غير صالح.';
        }
        throw new Error(errorMessage);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
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
    const cleanEmail = email.trim().toLowerCase();
    const defaultUsername = cleanEmail.split('@')[0];

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      
      // Send Verification Email
      await sendEmailVerification(userCredential.user);

      const newUser: User = {
        id: userCredential.user.uid,
        username: defaultUsername,
        role: 'premium',
        aiRequestCount: 0,
        lastRequestDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        emailVerified: false, // Initially false
        email: cleanEmail
      };
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      
      // Update local state immediately to reflect the new user
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
        await signOut(auth);
        setUser(null);
        localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
    } catch (error) {
        console.error("Logout error:", error);
    }
  }, []);

  const resendVerificationEmail = useCallback(async () => {
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
    if (auth.currentUser) {
        // 1. Force reload from Firebase Auth server
        await auth.currentUser.reload();
        // 2. Get the refreshed object (important!)
        const currentUser = auth.currentUser;
        // 3. Sync with app state
        if (currentUser) {
            await syncUserData(currentUser);
        }
    }
  }, []);
  
  const requestAIAccess = useCallback(async (callback: () => void, t: TFunction) => {
    if (!user) {
        alert(t('loginRequired'));
        return;
    }

    // Allow admins bypass even if email not verified (though they should verify)
    // Enforce email verification for others
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

        const today = new Date().toISOString().split('T')[0];
        let currentUserState = { ...user };
        
        if (currentUserState.lastRequestDate !== today) {
            currentUserState.aiRequestCount = 0;
            currentUserState.lastRequestDate = today;
        }
        
        // Optimistic update
        currentUserState.aiRequestCount += 1;
        setUser(currentUserState);
        localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(currentUserState));
        
        // Update in Firestore
        try {
             const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, {
                aiRequestCount: currentUserState.aiRequestCount,
                lastRequestDate: currentUserState.lastRequestDate
            });
        } catch (e) {
            console.error("Failed to update usage stats", e);
            // Silent fail, allow usage
        }
        callback();
    }
  }, [user]);

  // Admin functions
  const getAllUsers = useCallback(() => {
    return [] as User[]; 
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    try {
        const userRef = doc(db, 'users', updatedUser.id);
        await updateDoc(userRef, { ...updatedUser });
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
        await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
        console.error("Error deleting user:", e);
    }
  }, []);

  const getSettings = useCallback((): AppSettings => {
    return { aiRequestLimit: 10, isAiEnabled: true };
  }, []);

  const updateSettings = useCallback(async (settings: AppSettings) => {
    try {
        const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
        await setDoc(settingsRef, settings, { merge: true });
    } catch (e) {
        console.error("Error saving settings:", e);
    }
  }, []);


  const value = { 
      user, 
      login, 
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
