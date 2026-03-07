import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { TFunction } from '../../types';
import GoogleIcon from '../icons/GoogleIcon';
import AppleIcon from '../icons/AppleIcon';

interface RegisterViewProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: () => void;
  t: TFunction;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onSwitchToLogin, onRegisterSuccess, t }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'premium' | 'company'>('premium');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<'google' | 'apple' | null>(null);
  const { register, loginWithGoogle, loginWithApple } = useAuth();

  const ar = t('language') === 'ar';
  const inputStyle = "mt-1 block w-full px-3 py-2.5 bg-slate-50 dark:bg-dark-card border-2 border-slate-100 dark:border-dark-border rounded-xl text-sm font-bold placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-all";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(ar ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' : 'Password must be at least 6 characters.');
      return;
    }
    if (!email.includes('@')) {
      setError(t('invalidEmailFormat'));
      return;
    }
    setIsLoading(true);
    try {
      await register(email, password, role);
      // رسالة تأكيد الإيميل
      alert(ar
        ? `✅ تم إنشاء حسابك!\n\nتم إرسال رسالة تأكيد إلى:\n${email}\n\nمن فضلك افتح بريدك وأكّد إيميلك قبل تسجيل الدخول.`
        : `✅ Account created!\n\nA verification email was sent to:\n${email}\n\nPlease check your inbox and verify your email before logging in.`
      );
      onRegisterSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setIsSocialLoading('google');
    try {
      await loginWithGoogle();
      onRegisterSuccess();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(ar ? 'فشل التسجيل بجوجل' : 'Google sign-up failed');
      }
    } finally {
      setIsSocialLoading(null);
    }
  };

  const handleAppleRegister = async () => {
    setError('');
    setIsSocialLoading('apple');
    try {
      await loginWithApple();
      onRegisterSuccess();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(ar ? 'فشل التسجيل بـ Apple' : 'Apple sign-up failed');
      }
    } finally {
      setIsSocialLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-card">
      <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-[2.5rem] p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-slate-50 dark:border-dark-border">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20 mb-3">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">{t('register')}</h2>
          <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Create your account</p>
        </div>

        {/* Account Type */}
        <div className="mb-5">
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 text-center">{t('accountType')}</label>
          <div className="flex bg-slate-100 dark:bg-dark-card p-1 rounded-xl border dark:border-dark-border">
            <button type="button" onClick={() => setRole('premium')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${role === 'premium' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`}>
              {t('individualAccount')}
            </button>
            <button type="button" onClick={() => setRole('company')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${role === 'company' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`}>
              {t('companyAccount')}
            </button>
          </div>
          {role === 'company' && (
            <p className="text-[10px] text-center text-slate-400 italic px-2 mt-2 animate-fade-in">
              {ar ? '* حساب الشركات يسمح لك باقتراح تعديلات على الأدوية تخضع لموافقة المسؤول.' : '* Company accounts allow you to suggest medicine updates subject to admin approval.'}
            </p>
          )}
        </div>

        {/* Social Sign-Up */}
        <div className="space-y-3 mb-5">
          <button
            onClick={handleGoogleRegister}
            disabled={!!isSocialLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black text-sm text-slate-700 dark:text-slate-200 active:scale-95 transition-all hover:border-slate-200 disabled:opacity-50 shadow-sm"
          >
            {isSocialLoading === 'google'
              ? <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              : <div className="w-5 h-5"><GoogleIcon /></div>
            }
            {ar ? 'التسجيل بـ Google' : 'Sign up with Google'}
          </button>

          <button
            onClick={handleAppleRegister}
            disabled={!!isSocialLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-black dark:bg-slate-900 border-2 border-black dark:border-slate-700 rounded-2xl font-black text-sm text-white active:scale-95 transition-all disabled:opacity-50 shadow-sm"
          >
            {isSocialLoading === 'apple'
              ? <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
              : <div className="w-5 h-5"><AppleIcon /></div>
            }
            {ar ? 'التسجيل بـ Apple' : 'Sign up with Apple'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
          <span className="text-[10px] font-black text-slate-300 uppercase">{ar ? 'أو بالبريد' : 'or with email'}</span>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-email" className="block text-[10px] font-black uppercase text-slate-400 mb-1">{t('email')}</label>
            <input type="email" id="reg-email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@example.com" className={inputStyle} />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-[10px] font-black uppercase text-slate-400 mb-1">{t('password')}</label>
            <input type="password" id="reg-password" value={password} onChange={e => setPassword(e.target.value)} required className={inputStyle} />
          </div>
          
          {error && <p className="text-red-500 text-[10px] text-center font-black bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
          
          <button type="submit" disabled={isLoading} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50">
            {isLoading ? '...' : t('register')}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-50 dark:border-slate-800 pt-5">
          <p className="text-xs text-slate-400 font-bold">
            {t('registerPrompt')}{' '}
            <button onClick={onSwitchToLogin} className="font-black text-teal-600 hover:underline ml-1">{t('login')}</button>
          </p>
        </div>
      </div>
    </div>
  );
};
