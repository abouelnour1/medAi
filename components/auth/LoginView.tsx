import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { TFunction } from '../../types';
import GoogleIcon from '../icons/GoogleIcon';
import AppleIcon from '../icons/AppleIcon';

interface LoginViewProps {
  onSwitchToRegister: () => void;
  onLoginSuccess: () => void;
  t: TFunction;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSwitchToRegister, onLoginSuccess, t }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<'google' | 'apple' | null>(null);
  const { login, loginWithGoogle, loginWithApple, resetPassword } = useAuth();

  const ar = t('language') === 'ar';
  const inputStyle = "w-full p-3 bg-slate-50 dark:bg-dark-card border-2 border-slate-100 dark:border-dark-border rounded-xl focus:border-teal-500 outline-none transition-all text-sm font-bold";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username.trim());
    if (!isEmail) {
      setError(ar ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    try {
      await login(username.trim(), password);
      onLoginSuccess();
    } catch {
      setError(ar ? 'خطأ في بيانات الدخول' : 'Invalid login credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsSocialLoading('google');
    try {
      await loginWithGoogle();
      onLoginSuccess();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(ar ? 'فشل تسجيل الدخول بجوجل' : 'Google sign-in failed');
      }
    } finally {
      setIsSocialLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    setError('');
    setIsSocialLoading('apple');
    try {
      await loginWithApple();
      onLoginSuccess();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(ar ? 'فشل تسجيل الدخول بـ Apple' : 'Apple sign-in failed');
      }
    } finally {
      setIsSocialLoading(null);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await resetPassword(resetEmail.trim());
      setSuccessMessage(ar ? 'تم إرسال رابط إعادة تعيين كلمة المرور.' : 'Password reset link sent!');
    } catch {
      setError(ar ? 'البريد الإلكتروني غير موجود' : 'Email not found');
    }
  };

  if (isResetMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-card">
        <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-[2.5rem] p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-slate-50 dark:border-dark-border">
          <button onClick={() => setIsResetMode(false)} className="text-slate-400 text-xs font-black flex items-center gap-1 mb-6">
            ← {ar ? 'رجوع' : 'Back'}
          </button>
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">{ar ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}</h2>
          <p className="text-xs text-slate-400 font-bold mb-6">{ar ? 'أدخل بريدك الإلكتروني وهنبعت لك رابط' : "Enter your email and we'll send you a link"}</p>
          <form onSubmit={handleReset} className="space-y-4">
            <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required placeholder="name@example.com" className={inputStyle} />
            {error && <p className="text-rose-500 text-[10px] font-black text-center bg-rose-50 p-2 rounded-lg">{error}</p>}
            {successMessage && <p className="text-emerald-600 text-[10px] font-black text-center bg-emerald-50 p-2 rounded-lg">{successMessage}</p>}
            <button type="submit" className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-teal-500/20 active:scale-95 transition-all">
              {ar ? 'إرسال الرابط' : 'Send Link'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-card">
      <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-[2.5rem] p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-slate-50 dark:border-dark-border">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">{t('login')}</h2>
          <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Access your account</p>
        </div>

        {/* Social Sign-In */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleGoogleLogin}
            disabled={!!isSocialLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black text-sm text-slate-700 dark:text-slate-200 active:scale-95 transition-all hover:border-slate-200 disabled:opacity-50 shadow-sm"
          >
            {isSocialLoading === 'google'
              ? <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              : <div className="w-5 h-5"><GoogleIcon /></div>
            }
            {ar ? 'تسجيل الدخول بـ Google' : 'Continue with Google'}
          </button>

          <button
            onClick={handleAppleLogin}
            disabled={!!isSocialLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-black dark:bg-slate-900 border-2 border-black dark:border-slate-700 rounded-2xl font-black text-sm text-white active:scale-95 transition-all disabled:opacity-50 shadow-sm"
          >
            {isSocialLoading === 'apple'
              ? <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
              : <div className="w-5 h-5"><AppleIcon /></div>
            }
            {ar ? 'تسجيل الدخول بـ Apple' : 'Continue with Apple'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
          <span className="text-[10px] font-black text-slate-300 uppercase">{ar ? 'أو' : 'or'}</span>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
        </div>

        {/* Email/Password Form */}
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

          {error && <p className="text-rose-500 text-[10px] font-black text-center bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg">{error}</p>}
          
          <button type="submit" disabled={isLoading} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50">
            {isLoading ? '...' : t('login')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-50 dark:border-slate-800 pt-6">
          <p className="text-xs text-slate-400 font-bold">
            {t('loginPrompt')} <button onClick={onSwitchToRegister} className="text-teal-600 font-black ml-1 hover:underline">{t('register')}</button>
          </p>
        </div>
      </div>
    </div>
  );
};
