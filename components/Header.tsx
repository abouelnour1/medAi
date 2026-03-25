import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import BackIcon from './icons/BackIcon';
import BellIcon from './icons/BellIcon';
import { TFunction, View } from '../types';
import { useAuth } from './auth/AuthContext';

interface HeaderProps {
  title: string;
  showBack: boolean;
  onBack: () => void;
  t: TFunction;
  onLoginClick: () => void;
  onAdminClick: () => void;
  onPediatricCalcClick?: () => void;
  onNotificationsClick: () => void;
  onSettingsClick?: () => void;
  view: View;
  unreadCount?: number;
  isLoading?: boolean;
  searchBarVisible?: boolean;
}

const OnlineIndicator: React.FC = () => {
  const [online, setOnline] = React.useState(navigator.onLine);
  React.useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (online) return null;

  return (
    <span style={{
      fontSize: '9px', fontWeight: 900, letterSpacing: '0.12em',
      color: '#ef4444', userSelect: 'none'
    }}>
      OFFLINE
    </span>
  );
};

const Header = forwardRef<HTMLElement, HeaderProps>(({ title, showBack, onBack, t, onLoginClick, onAdminClick, onNotificationsClick, onSettingsClick, onPediatricCalcClick, view, unreadCount = 0, isLoading = false, searchBarVisible }, ref) => {
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  return (
    <header 
        ref={ref} 
        className={`fixed top-0 left-0 right-0 z-[60] px-3 pb-2 transition-all ${Capacitor.getPlatform() === 'android' ? 'pt-[28px]' : 'pt-[calc(env(safe-area-inset-top)+4px)]'}`}
        style={{ background: 'inherit' }}
    >
      {/* Safe area shield — يمنع أي محتوى يعدي من وراء الهيدر */}
      <div className="absolute inset-0 bg-light-bg dark:bg-dark-bg" style={{ zIndex: -1 }} />
      <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border shadow-[0_2px_16px_0_rgba(0,0,0,0.08)] rounded-[1.5rem] px-3 h-11 flex justify-between items-center max-w-7xl mx-auto">
        
        <div className="flex-1 flex justify-start items-center gap-2">
          {showBack ? (
            <button
              onClick={onBack}
              className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-full active:scale-90 transition-transform"
            >
              <div className="w-5 h-5 ltr:rotate-0 rtl:rotate-180"><BackIcon /></div>
            </button>
          ) : (
             <button 
                onClick={onNotificationsClick}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-full active:scale-90 transition-transform relative"
              >
                  <BellIcon unreadCount={unreadCount} />
              </button>
          )}
        </div>
        
        <div className="flex-[2] flex justify-center items-center gap-2"> 
            <h1 className="text-base font-black text-slate-800 dark:text-white font-poppins tracking-tight">
              Pharma<span className="text-primary">Source</span>
            </h1>
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin flex-shrink-0" title="Loading data..." />
            )}
        </div>

        <div className="flex-1 flex justify-end items-center gap-2">
          <OnlineIndicator />
          {user ? (
            <div className="relative" ref={menuRef}>
                {/* Avatar — يفتح mini menu */}
                <button
                  onClick={() => setIsMenuOpen(v => !v)}
                  className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-full active:scale-95 transition-all"
                >
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-[9px] font-black">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                </button>

                {/* Mini popup menu */}
                <div className={`fixed right-3 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-[9990] overflow-hidden
                      transition-all duration-200 ease-out origin-top-right
                      ${isMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
                  style={{ top: (ref as any)?.current?.getBoundingClientRect?.()?.bottom + 8 || 80 }}>
                  
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-black text-sm text-slate-800 dark:text-white truncate">{user.username}</p>
                    <p className="text-[10px] font-bold text-primary uppercase">{t(`${user.role}Role` as any)}</p>
                  </div>

                  {/* Settings */}
                  <button onClick={() => { onSettingsClick?.(); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    {t('navSettings')}
                  </button>

                  {/* Stock Tracker */}
                  <button onClick={() => { (onSettingsClick as any)?.('stockTracker'); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Stock Tracker
                  </button>

                  {/* Order List */}
                  <button onClick={() => { (onSettingsClick as any)?.('orderList'); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Order List
                  </button>

                  {/* Pedia Dose Calc */}
                  <button onClick={() => { onPediatricCalcClick?.(); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                    Pedia Dose Calc
                  </button>

                  {/* Admin */}
                  {user.role === 'admin' && (
                    <button onClick={() => { onAdminClick(); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      {t('adminDashboard')}
                    </button>
                  )}

                  {/* Divider */}
                  <div className="h-px bg-slate-100 dark:bg-slate-800 mx-3" />

                  {/* Logout */}
                  <button onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                    {t('logout')}
                  </button>
                </div>
            </div>
          ) : (
            <button onClick={onLoginClick} className="bg-primary text-white px-5 py-2 rounded-full text-xs font-black shadow-lg shadow-primary/30 active:scale-95 transition-all">
                {t('login')}
            </button>
          )}
        </div>
      </div>

      {/* SearchBar slot — يظهر جوّا الهيدر لما يكون في search/results */}

    </header>
  );
});

export default Header;