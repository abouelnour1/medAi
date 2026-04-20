import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { TFunction } from '../../types';
import BrandHeader from '../BrandHeader';

interface RegisterViewProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: () => void;
  t: TFunction;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onSwitchToLogin, onRegisterSuccess, t }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

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
      await register(email, password);
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



  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-card">
      <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-[2.5rem] p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-slate-50 dark:border-dark-border">

        {/* Brand Header */}
        <BrandHeader subtitle={ar ? 'إنشاء حساب جديد' : 'Create your account'} size="sm" />

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
