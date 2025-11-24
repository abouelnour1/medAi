
import React, { forwardRef, useState, useRef, useEffect } from 'react';
import BackIcon from './icons/BackIcon';
import PillIcon from './icons/PillIcon'; // Used as fallback
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
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Scroll logic
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    
    const controlHeader = () => {
      if (scrollContainer) {
        const currentScrollY = scrollContainer.scrollTop;
        const diff = currentScrollY - lastScrollY.current;
        
        // 1. Check content height vs container height
        // If content is smaller than or equal to container, it can't scroll, so always show header.
        // Adding a small buffer (1px) for float precision issues.
        if (scrollContainer.scrollHeight <= scrollContainer.clientHeight + 1) {
            setIsVisible(true);
            return;
        }

        const isScrollable = scrollContainer.scrollHeight > scrollContainer.clientHeight + 50;

        // Only perform hide logic if there is actually content to scroll
        if (isScrollable) {
            // Reduced jitter threshold to avoid erratic hiding on small scrolls
            if (Math.abs(diff) < 15) return;

            if (diff > 0 && currentScrollY > 60) {
              // Scrolling Down -> Hide
              setIsVisible(false);
            } else if (diff < 0) {
              // Scrolling Up -> Show
              setIsVisible(true);
            }
        } else {
            // If not scrollable, always show
            setIsVisible(true);
        }
        
        lastScrollY.current = currentScrollY;
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', controlHeader);
      // Initial check in case content is short on load
      controlHeader();
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', controlHeader);
      }
    };
  }, [view]); // Re-run on view change to re-assess scrollability

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
  
  // Allow Logo Layout for: App Title, Insurance, Cosmetics, Prescriptions
  const isMainView = title === t('appTitle') || title === t('navInsurance') || title === t('navCosmetics') || title === t('navPrescriptions');

  return (
    <header 
        ref={ref} 
        className={`bg-gradient-to-r from-[#14b8a6] to-[#0f766e] text-white fixed top-0 left-0 right-0 z-40 flex-shrink-0 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 shadow-lg h-[80px] flex items-center border-b border-primary-dark/30 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center max-w-7xl w-full h-full overflow-hidden">
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
          {isMainView ? (
            <div className="flex flex-col items-center justify-center gap-0.5 animate-fade-in">
                <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="h-7 w-7 object-contain drop-shadow-md" 
                    onError={(e) => {
                        // Fallback if logo fails, but try to persist
                        // console.error("Logo load failed");
                        setImageError(true);
                    }}
                />
                <span className="text-base font-bold whitespace-nowrap tracking-wide drop-shadow-md text-white text-shadow-sm leading-normal pb-1">{title}</span>
            </div>
          ) : (
            <h1 className="text-lg font-bold whitespace-nowrap truncate text-center drop-shadow-md leading-normal pb-1 w-full">
              {title}
            </h1>
          )}
        </div>

        <div className="flex-1 flex justify-end items-center gap-1 min-w-0">
          {user ? (
            <div className="relative" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-1.5 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/20 flex items-center gap-1.5 active:scale-95 max-w-full">
                    <span className="font-medium text-xs max-w-[70px] truncate drop-shadow-md">{user.username}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 drop-shadow-md flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className={`absolute top-full ltr:right-0 rtl:left-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-xl shadow-xl ring-1 ring-black/5 py-1 transition-all duration-200 z-30 divide-y divide-slate-100 dark:divide-slate-700 origin-top-right ${isMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
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