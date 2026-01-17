
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
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
        setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
        return;
    }
    if (!email.includes('@')) {
        setError('الرجاء إدخال بريد إلكتروني صحيح.');
        return;
    }
    if (role === 'company' && !companyName.trim()) {
        setError('الرجاء إدخال اسم الشركة.');
        return;
    }

    setIsLoading(true);
    try {
      await register(email, password, role, companyName);
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
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Type Selection */}
        <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('accountType')}</label>
            <div className="grid grid-cols-2 gap-2">
                <button 
                    type="button" 
                    onClick={() => setRole('premium')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${role === 'premium' ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                >
                    {t('individual')}
                </button>
                <button 
                    type="button" 
                    onClick={() => setRole('company')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${role === 'company' ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                >
                    {t('company')}
                </button>
            </div>
        </div>

        {role === 'company' && (
            <div className="animate-fade-in">
                <label htmlFor="comp-name" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{t('companyName')}</label>
                <input type="text" id="comp-name" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"/>
            </div>
        )}
        
        <div>
          <label htmlFor="reg-email"  className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{t('email')}</label>
          <input type="email" id="reg-email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"/>
        </div>
        
        <div>
          <label htmlFor="reg-password"  className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{t('password')}</label>
          <input type="password" id="reg-password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"/>
        </div>
        
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        
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
