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
  const [successMessage, setSuccessMessage] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle, resetPassword } = useAuth() as any;

  const inputStyle = "w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-teal-500 outline-none transition-all text-sm font-bold";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username.trim());
    if (!isEmail) {
        setError(t('language') === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.');
        return;
    }
    setIsLoading(true);
    try {
      await login(username.trim(), password);
      onLoginSuccess();
    } catch (err: any) {
      setError(t('language') === 'ar' ? 'خطأ في بيانات الدخول' : 'Invalid login credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
      onLoginSuccess();
    } catch (err: any) {
      setError(t('language') === 'ar' ? 'فشل تسجيل الدخول بواسطة جوجل' : 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-card">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-slate-50 dark:border-slate-800">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-teal-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">{t('login')}</h2>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Access your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 mr-1">{t('email')}</label>
            <input type="email" value={username} onChange={e => setUsername(e.target.value)} required placeholder="name@example.com" className={inputStyle} />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-black uppercase text-slate-400 mr-1">{t('password')}</label>
                <button type="button" onClick={() => setIsResetMode(true)} className="text-[10px] font-black text-teal-600 hover:underline">{t('forgotPassword')}</button>
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputStyle} />
          </div>

          {error && <p className="text-rose-500 text-[10px] font-black text-center bg-rose-50 p-2 rounded-lg">{error}</p>}
          
          <button type="submit" disabled={isLoading} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50">
            {isLoading ? '...' : t('login')}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative flex items-center justify-center mb-6">
            <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('language') === 'ar' ? 'أو' : 'OR'}</span>
            <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
            className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.27l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t('googleLogin')}
          </button>
        </div>

        <div className="mt-8 text-center border-t border-slate-50 dark:border-slate-800 pt-6">
            <p className="text-xs text-slate-400 font-bold">
                {t('loginPrompt')} <button onClick={onSwitchToRegister} className="text-teal-600 font-black ml-1 hover:underline">{t('register')}</button>
            </p>
        </div>
      </div>
    </div>
  );
};
