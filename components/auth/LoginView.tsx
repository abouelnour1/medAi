import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { TFunction } from '../../types';
import GoogleIcon from '../icons/GoogleIcon';


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
  const [isSocialLoading, setIsSocialLoading] = useState<'google' | null>(null);
  const [showPass, setShowPass] = useState(false);
  const { login, loginWithGoogle, resetPassword } = useAuth();

  const ar = t('language') === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username.trim());
    if (!isEmail) { setError(ar ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.'); return; }
    setIsLoading(true);
    try { await login(username.trim(), password); onLoginSuccess(); }
    catch { setError(ar ? 'خطأ في بيانات الدخول' : 'Invalid login credentials'); }
    finally { setIsLoading(false); }
  };

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                    || (window.navigator as any).standalone === true;

  const handleGoogleLogin = async () => {
    setError('');
    if (isStandalone) {
      // ✅ افتح الموقع في Chrome — المستخدم يسجل هناك
      // Firebase IndexedDB مشترك بين Chrome والـ PWA
      // لما يرجع للـ PWA هيلاقي نفسه مسجل تلقائياً
      const siteUrl = window.location.origin + window.location.pathname;
      window.open(siteUrl, '_blank');
      return;
    }
    setIsSocialLoading('google');
    try {
      await loginWithGoogle();
      onLoginSuccess();
    }
    catch (err: any) { 
      console.error('Login Google Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(ar ? `فشل تسجيل الدخول بجوجل: ${err?.message || err?.code || 'خطأ غير معروف'}` : `Google sign-in failed: ${err?.message || err?.code || 'Unknown error'}`);
      }
    }
    finally { setIsSocialLoading(null); }
  };



  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try { await resetPassword(resetEmail.trim()); setSuccessMessage(ar ? 'تم إرسال رابط إعادة تعيين كلمة المرور.' : 'Password reset link sent!'); }
    catch { setError(ar ? 'البريد الإلكتروني غير موجود' : 'Email not found'); }
  };

  const inputBase = "w-full px-4 py-3.5 rounded-2xl text-sm font-semibold outline-none transition-all duration-200 bg-slate-50 dark:bg-slate-800/60 border-2 border-transparent focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600";

  if (isResetMode) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-5">
      <div className="w-full max-w-sm">
        <button onClick={() => setIsResetMode(false)} className="flex items-center gap-1.5 text-slate-400 text-xs font-black mb-8 active:scale-95 transition-transform">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          {ar ? 'رجوع' : 'Back'}
        </button>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-5">
          <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-1">{ar ? 'نسيت كلمة المرور؟' : 'Reset Password'}</h2>
        <p className="text-sm text-slate-400 mb-8">{ar ? 'أدخل بريدك وهنبعتلك رابط' : "We'll send you a reset link"}</p>
        <form onSubmit={handleReset} className="space-y-4">
          <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required placeholder="name@example.com" className={inputBase} />
          {error && <p className="text-rose-500 text-xs font-bold bg-rose-50 dark:bg-rose-900/20 px-4 py-2.5 rounded-xl">{error}</p>}
          {successMessage && <p className="text-emerald-600 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 rounded-xl">{successMessage}</p>}
          <button type="submit" className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-teal-500/25 active:scale-[0.98] transition-all">
            {ar ? 'إرسال الرابط' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-5">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="relative inline-flex mb-5">
            <img
              src="/logo.png"
              alt="PharmaSource"
              className="w-20 h-20 rounded-[1.5rem] object-cover shadow-xl shadow-teal-500/30"
              onError={(e) => {
                // fallback لو الصورة مش موجودة
                const t = e.currentTarget as HTMLImageElement;
                t.style.display = 'none';
                (t.nextElementSibling as HTMLElement).style.display = 'flex';
              }}
            />
            <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-teal-400 to-cyan-600 items-center justify-center shadow-xl shadow-teal-500/30 hidden">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-teal-400 to-cyan-600 blur-xl opacity-25 -z-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Pharma<span className="text-teal-500">Source</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium tracking-widest uppercase">
            {ar ? 'تسجيل الدخول' : 'Sign in to continue'}
          </p>
        </div>

        {/* Social */}
        <div className="space-y-3 mb-6">
          {isStandalone ? (
            // ✅ PWA: Google مش بيشتغل — سجّل في المتصفح وارجع
            <div className="w-full flex items-center gap-3 py-3.5 px-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-700 dark:text-amber-400 font-bold">
              <span className="text-lg">💡</span>
              <span>{ar ? 'لتسجيل الدخول بـ Google، افتح الموقع في المتصفح أولاً وسجّل، ثم ارجع للتطبيق' : 'To use Google Sign-In, open the site in your browser, sign in, then return to the app'}</span>
            </div>
          ) : (
            <button onClick={handleGoogleLogin} disabled={!!isSocialLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-200 active:scale-[0.98] transition-all shadow-sm hover:shadow-md disabled:opacity-60">
              {isSocialLoading === 'google' ? <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /> : <div className="w-5 h-5"><GoogleIcon /></div>}
              {ar ? 'متابعة بـ Google' : 'Continue with Google'}
            </button>
          )}

        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
          <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{ar ? 'أو بالإيميل' : 'or email'}</span>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">{t('email')}</label>
            <input type="email" value={username} onChange={e => setUsername(e.target.value)} required placeholder="name@example.com" className={inputBase} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t('password')}</label>
              <button type="button" onClick={() => setIsResetMode(true)} className="text-[10px] font-black text-teal-500 hover:text-teal-600 transition-colors">{t('forgotPassword')}</button>
            </div>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className={inputBase + ' pr-12'} />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors p-1">
                {showPass
                  ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 px-4 py-3 rounded-xl">
              <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-rose-500 text-xs font-bold">{error}</p>
            </div>
          )}

          <button type="submit" disabled={isLoading}
            className="w-full py-4 mt-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-teal-500/25 active:scale-[0.98] transition-all disabled:opacity-60">
            {isLoading
              ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>{ar ? 'جاري الدخول...' : 'Signing in...'}</span></div>
              : t('login')}
          </button>
        </form>

        {/* Register link */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            {t('loginPrompt')}{' '}
            <button onClick={onSwitchToRegister} className="text-teal-500 font-black hover:text-teal-600 transition-colors">{t('register')}</button>
          </p>
        </div>

      </div>
    </div>
    </>
  );
}