import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { TFunction } from '../../types';

interface LoginViewProps {
  onSwitchToRegister: () => void;
  onLoginSuccess: () => void;
  t: TFunction;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSwitchToRegister, onLoginSuccess, t }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md space-y-6 max-w-md mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-light-text dark:text-dark-text">{t('login')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{t('username')}</label>
          <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"/>
        </div>
        
        <div>
          <label htmlFor="password"  className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{t('password')}</label>
          <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"/>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
          {t('login')}
        </button>
      </form>
      <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
        {t('loginPrompt')}{' '}
        <button onClick={onSwitchToRegister} className="font-medium text-primary hover:text-primary-dark">{t('register')}</button>
      </p>
    </div>
  );
};