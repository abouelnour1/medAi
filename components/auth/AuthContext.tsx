import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, AuthContextType, AppSettings, TFunction } from '../../types';

// Mock user database in localStorage
const MOCK_USERS_DB_KEY = 'mock_users_db';
const MOCK_SETTINGS_KEY = 'mock_app_settings';
const CURRENT_USER_SESSION_KEY = 'current_user_session';

const getMockUsers = (): (User & { password?: string })[] => {
  try {
    const users = localStorage.getItem(MOCK_USERS_DB_KEY);
    return users ? JSON.parse(users) : [];
  } catch {
    return [];
  }
};

const saveMockUsers = (users: (User & { password?: string })[]) => {
  localStorage.setItem(MOCK_USERS_DB_KEY, JSON.stringify(users));
};

const getMockSettings = (): AppSettings => {
  try {
    const settings = localStorage.getItem(MOCK_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : { aiRequestLimit: 3 };
  } catch {
    return { aiRequestLimit: 3 };
  }
};

const saveMockSettings = (settings: AppSettings) => {
  localStorage.setItem(MOCK_SETTINGS_KEY, JSON.stringify(settings));
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem(CURRENT_USER_SESSION_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // ignore parsing errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserSession = (userData: User | null) => {
    setUser(userData);
    if (userData) {
      sessionStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(userData));
    } else {
      sessionStorage.removeItem(CURRENT_USER_SESSION_KEY);
    }
  };

  const login = useCallback(async (username: string, password: string): Promise<void> => {
    // @ts-ignore
    const adminPassword = process.env.VITE_APP_ADMIN_PASSWORD;

    if (username.toLowerCase() === 'admin') {
      if (adminPassword && password === adminPassword) {
        const adminUser: User = {
          id: 'admin-user',
          username: 'admin',
          role: 'admin',
          aiRequestCount: 0,
          lastRequestDate: new Date().toISOString().split('T')[0],
          status: 'active',
        };
        updateUserSession(adminUser);
        return;
      }
    }
    
    const users = getMockUsers();
    const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (foundUser && foundUser.password === password) {
      const { password: _password, ...userToSave } = foundUser;
      updateUserSession(userToSave);
      return;
    }
    
    throw new Error('Invalid credentials');
  }, []);

  const register = useCallback(async (username: string, password: string): Promise<void> => {
    const users = getMockUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('Username already exists');
    }
    
    const newUser: User & { password?: string } = {
      id: `user-${Date.now()}`,
      username: username,
      role: 'premium',
      aiRequestCount: 0,
      lastRequestDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      password: password, // Storing password for mock login
    };
    
    saveMockUsers([...users, newUser]);
  }, []);

  const logout = useCallback(() => {
    updateUserSession(null);
    window.location.reload(); // Reload to reset all component states
  }, []);
  
  const requestAIAccess = useCallback((callback: () => void, t: TFunction) => {
    if (!user) {
        alert(t('loginRequired'));
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

        const settings = getMockSettings();
        const today = new Date().toISOString().split('T')[0];
        let currentUserState = { ...user };
        
        if (currentUserState.lastRequestDate !== today) {
            currentUserState.aiRequestCount = 0;
            currentUserState.lastRequestDate = today;
        }
        
        // The user has requested to remove the AI usage limit.
        // The check is commented out, but we continue to count requests for admin tracking purposes.
        /*
        if (currentUserState.aiRequestCount >= settings.aiRequestLimit) {
            alert(t('usageLimitReached', { limit: settings.aiRequestLimit }));
            return;
        }
        */

        currentUserState.aiRequestCount += 1;
        updateUserSession(currentUserState);
        
        const users = getMockUsers();
        const userIndex = users.findIndex(u => u.id === currentUserState.id);
        if (userIndex !== -1) {
            users[userIndex].aiRequestCount = currentUserState.aiRequestCount;
            users[userIndex].lastRequestDate = currentUserState.lastRequestDate;
            saveMockUsers(users);
        }
        
        callback();
    }
  }, [user]);

  // Admin functions
  const getAllUsers = (): User[] => {
    const users = getMockUsers();
    return users.map(({ password, ...user }) => user);
  };

  const updateUser = (updatedUser: User) => {
    let users = getMockUsers();
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updatedUser };
      saveMockUsers(users);
    }
  };

  const deleteUser = (userId: string) => {
    let users = getMockUsers();
    const updatedUsers = users.filter(u => u.id !== userId);
    saveMockUsers(updatedUsers);
  };

  const getSettings = (): AppSettings => {
    return getMockSettings();
  };

  const updateSettings = (settings: AppSettings) => {
    saveMockSettings(settings);
  };


  const value = { user, login, register, logout, requestAIAccess, isLoading, getAllUsers, updateUser, deleteUser, getSettings, updateSettings };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};