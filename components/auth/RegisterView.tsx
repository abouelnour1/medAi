
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { TFunction } from '../../types';

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
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
        setError(t('language') === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' : 'Password must be at least 6 characters.');
        return;
    }
    if (!email.includes('@')) {
        setError(t('invalidEmailFormat'));
        return;
    }

    setIsLoading(true);
    try {
      await register(email, password, role);
      onRegisterSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md space-y-6 max-w-md mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-light-text dark:text-dark-text">{t('register')}</h2>
      
      {/* Account Type Selector */}
      <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest text-center">{t('accountType')}</label>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button 
                type="button"
                onClick={() => setRole('premium')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${role === 'premium' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`}
              >
                  {t('individualAccount')}
              </button>
              <button 
                type="button"
                onClick={() => setRole('company')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${role === 'company' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`}
              >
                  {t('companyAccount')}
              </button>
          </div>
          {role === 'company' && (
              <p className="text-[10px] text-center text-slate-400 italic px-2 animate-fade-in">
                 {t('language') === 'ar' ? '* حساب الشركات يسمح لك باقتراح تعديلات على الأدوية تخضع لموافقة المسؤول.' : '* Company accounts allow you to suggest medicine updates subject to admin approval.'}
              </p>
          )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reg-email"  className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{t('email')}</label>
          <input type="email" id="reg-email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"/>
        </div>
        
        <div>
          <label htmlFor="reg-password"  className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{t('password')}</label>
          <input type="password" id="reg-password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"/>
        </div>
        
        {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
        
        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed">
          {isLoading ? '...' : t('register')}
        </button>
      </form>
      <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
        {t('registerPrompt')}{' '}
        <button onClick={onSwitchToLogin} className="font-medium text-primary hover:text-primary-dark">{t('login')}</button>
      </p>
    </div>
  );
};
