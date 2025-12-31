
import React, { useState, useEffect } from 'react';
import { TFunction, User } from '../../types';
import { useAuth } from './AuthContext';

interface VerifyEmailViewProps {
  user: User;
  t: TFunction;
}

export const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({ user, t }) => {
  const { resendVerificationEmail, logout, reloadUser } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReload = async () => {
    setIsReloading(true);
    setError('');
    try {
      await reloadUser();
    } catch (err: any) {
      setError(t('invalidCodeError'));
    } finally {
      setIsReloading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setMessage('');
    setError('');
    try {
      await resendVerificationEmail();
      setMessage(t('verificationEmailSent'));
    } catch (error: any) {
      setError('حدث خطأ أثناء الإرسال.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-fade-in">
      <div className="bg-white dark:bg-dark-card p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-8 border border-slate-100 dark:border-slate-800">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        </div>
        
        <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">{t('verifyEmailTitle')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('verifyEmailDesc')} <br/>
                <span className="font-bold text-slate-800 dark:text-white block mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">{user.email}</span>
            </p>
        </div>

        <div className="space-y-4">
            <button 
                onClick={handleReload}
                disabled={isReloading}
                className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
                {isReloading ? t('verifyingCode') : t('iHaveVerified')}
            </button>
            
            <button 
                onClick={handleResend}
                disabled={isResending || isReloading}
                className="text-sm font-bold text-primary hover:underline transition-all disabled:opacity-50"
            >
                {isResending ? '...' : t('resendVerificationEmail')}
            </button>
        </div>

        {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/30">{error}</div>}
        {message && <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl text-xs font-bold border border-green-100 dark:border-green-900/30">{message}</div>}
        
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
             <button onClick={logout} className="text-xs text-slate-400 hover:text-red-500 font-bold uppercase tracking-widest">
                 {t('logout')}
             </button>
        </div>
      </div>
    </div>
  );
};
