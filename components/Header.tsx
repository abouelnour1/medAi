
import React, { forwardRef, useState, useRef, useEffect } from 'react';
import BackIcon from './icons/BackIcon';
import { TFunction, View } from '../types';
import { useAuth } from './auth/AuthContext';

interface HeaderProps {
  title: string;
  showBack: boolean;
  onBack: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  t: TFunction;
  onLoginClick: () => void;
  onAdminClick: () => void;
  view: View;
}

const Header = forwardRef<HTMLElement, HeaderProps>(({ title, showBack, onBack, theme, toggleTheme, t, onLoginClick, onAdminClick, view }, ref) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // Always display "PharmaSource" as requested by the user ("fixed in the whole app")
  const displayTitle = 'PharmaSource';
  
  return (
    <header 
        ref={ref} 
        className="bg-gradient-to-b from-[#2dd4bf] to-[#0f766e] text-white fixed top-0 left-0 right-0 z-40 flex-shrink-0 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 shadow-lg h-[80px] flex items-center border-b border-primary-dark/30"
    >
      <div className="container mx-auto px-4 flex justify-between items-center max-w-7xl w-full h-full">
        <div className="flex-1 flex justify-start min-w-0">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/20 active:scale-95 flex-shrink-0"
              aria-label={t('back')}
            >
              <span className={document.documentElement.lang === 'en' ? 'inline-block' : 'inline-block transform scale-x-[-1]'}>
                 <BackIcon />
              </span>
            </button>
          )}
        </div>
        
        <div className="flex-[2] flex justify-center items-center min-w-0 px-2"> 
            <h1 className="text-xl font-bold whitespace-nowrap truncate text-center drop-shadow-md leading-normal pb-1 w-full font-poppins">
              {displayTitle}
            </h1>
        </div>

        <div className="flex-1 flex justify-end items-center gap-1 min-w-0">
          {user ? (
            <div className="relative" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-1.5 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/20 flex items-center gap-1.5 active:scale-95 max-w-full">
                    <span className="font-medium text-xs max-w-[70px] truncate drop-shadow-md">{user.username}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 drop-shadow-md flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className={`absolute top-full ltr:right-0 rtl:left-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-xl shadow-xl ring-1 ring-black/5 py-1 transition-all duration-200 z-50 divide-y divide-slate-100 dark:divide-slate-700 origin-top-right ${isMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="px-4 py-2">
                        <div className="text-[10px] text-light-text-secondary dark:text-dark-text-secondary uppercase">{t('role')}</div>
                        <div className="font-semibold text-xs text-light-text dark:text-dark-text">{user.role === 'admin' ? t('adminRole') : t('premiumRole')}</div>
                    </div>
                    <div className="py-1">
                        {user.role === 'admin' && (
                             <button onClick={() => { onAdminClick(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-slate-100 dark:hover:bg-slate-700">{t('adminDashboard')}</button>
                        )}
                        <button onClick={logout} className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700">{t('logout')}</button>
                    </div>
                </div>
            </div>
          ) : (
            <button onClick={onLoginClick} className="px-3 py-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 rounded-lg transition-all shadow-sm backdrop-blur-sm whitespace-nowrap">{t('login')}</button>
          )}
        </div>
      </div>
    </header>
  );
});

export default Header;