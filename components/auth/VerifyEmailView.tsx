
import React, { useState, useEffect } from 'react';
import { TFunction, User } from '../../types';
import { useAuth } from './AuthContext';

interface VerifyEmailViewProps {
  user: User;
  t: TFunction;
}

export const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({ user, t }) => {
  const { resendVerificationEmail, reloadUser, logout } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');

  // Automatically check for verification periodically and on window focus
  useEffect(() => {
      // 1. Check immediately on mount
      reloadUser();

      // 2. Check every 3 seconds
      const interval = setInterval(() => {
          reloadUser();
      }, 3000);

      // 3. Check when the user switches back to this tab
      const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
              reloadUser();
          }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
          clearInterval(interval);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
  }, [reloadUser]);

  const handleResend = async () => {
    setIsResending(true);
    setMessage('');
    try {
      await resendVerificationEmail();
      setMessage(t('verificationEmailSent'));
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests') {
          setMessage('الرجاء الانتظار قليلاً قبل إعادة الإرسال.');
      } else {
          setMessage('حدث خطأ أثناء الإرسال.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleReload = async () => {
      await reloadUser();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-fade-in">
      <div className="bg-white dark:bg-dark-card p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto text-yellow-600 dark:text-yellow-400 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        </div>
        
        <div>
            <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">{t('verifyEmailTitle')}</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
                {t('verifyEmailDesc')} <span className="font-semibold text-light-text dark:text-dark-text">{user.email}</span>
            </p>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
                يتم التحقق تلقائياً...
            </p>
        </div>

        <div className="space-y-3">
            <button 
                onClick={handleReload}
                className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors shadow-md hover:shadow-lg"
            >
                {t('iHaveVerified')}
            </button>
            
            <button 
                onClick={handleResend}
                disabled={isResending}
                className="w-full py-2 px-4 text-primary hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
                {isResending ? '...' : t('resendVerificationEmail')}
            </button>
        </div>

        {message && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                {message}
            </div>
        )}
        
        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
             <button onClick={logout} className="text-sm text-red-500 hover:text-red-600 font-medium">
                 {t('logout')}
             </button>
        </div>
      </div>
    </div>
  );
};
