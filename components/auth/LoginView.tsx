
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { TFunction } from '../../types';

interface LoginViewProps {
  onSwitchToRegister: () => void;
  onLoginSuccess: () => void;
  t: TFunction;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSwitchToRegister, onLoginSuccess, t }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.includes('@')) {
        setError('الرجاء إدخال بريد إلكتروني صحيح');
        return;
    }
    
    if (!password) {
        setError(t('incorrectPasswordError'));
        return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-2xl shadow-xl space-y-6 max-w-md mx-auto animate-fade-in border border-slate-100 dark:border-slate-800">
      <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('login')}</h2>
          <p className="text-xs text-slate-500">مرحباً بك مجدداً في PharmaSource</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('email')}</label>
          <input 
            type="email" 
            id="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="example@mail.com"
            required 
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
        
        <div>
          <label htmlFor="password"  className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('password')}</label>
          <input 
            type="password" 
            id="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="••••••••"
            required
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>

        {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg border border-red-100 dark:border-red-900/30 text-center">{error}</div>}
        
        <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full flex justify-center py-3 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : t('login')}
        </button>
      </form>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500">
            {t('loginPrompt')}{' '}
            <button onClick={onSwitchToRegister} className="font-bold text-primary hover:underline">{t('register')}</button>
          </p>
      </div>
    </div>
  );
};
