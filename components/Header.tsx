import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import BackIcon from './icons/BackIcon';
import BellIcon from './icons/BellIcon';
import { TFunction, View } from '../types';
import { useAuth } from './auth/AuthContext';

// ── Brand colors ──────────────────────────────────────────────────────────────
const TEAL700 = '#006a60';
const TEAL500 = '#00a896';
const TEAL300 = '#7fd4c6';

// Inline mini mark (20px) للهيدر
function EDMarkMini() {
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
      <rect x="2" y="2" width="96" height="96" rx="22" fill={TEAL700}/>
      <g opacity="0.12">
        <rect x="22" y="22" width="56" height="56" fill="#fff"/>
        <rect x="22" y="22" width="56" height="56" fill="#fff" transform="rotate(45 50 50)"/>
      </g>
      <g fill="#fff">
        <rect x="42" y="24" width="16" height="52" rx="4"/>
        <rect x="24" y="42" width="52" height="16" rx="4"/>
      </g>
      <rect x="42" y="42" width="16" height="16" fill={TEAL500} opacity="0.85"/>
    </svg>
  );
}

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
  style?: React.CSSProperties;
  children?: React.ReactNode;
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
    <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.12em', color: '#ef4444', userSelect: 'none' }}>
      OFFLINE
    </span>
  );
};

const Header = forwardRef<HTMLElement, HeaderProps>(({ title, showBack, onBack, t, onLoginClick, onAdminClick, onNotificationsClick, onSettingsClick, onPediatricCalcClick, view, unreadCount = 0, isLoading = false, searchBarVisible, style, children }, ref) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const ar = t('language') === 'ar';

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
      className="fixed top-0 left-0 right-0 z-[60] px-4 pb-3"
      id="app-header"
      style={{
        paddingTop: Capacitor.getPlatform() === 'android'
          ? 'calc(var(--android-status, 30px) + 8px)'
          : 'calc(env(safe-area-inset-top, 44px) + 6px)',
        background: 'inherit',
        ...style,
      }}
    >
      <div className="absolute inset-0 bg-light-bg dark:bg-dark-bg" style={{ zIndex: -1 }} />

      <div className="flex items-center justify-between">

        {/* يسار: Back أو Notifications */}
        <div className="flex items-center gap-2 w-10">
          {showBack ? (
            <button onClick={onBack}
              className="w-9 h-9 flex items-center justify-center bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border active:scale-90 transition-transform">
              <div className="w-5 h-5 text-slate-600 dark:text-slate-200 ltr:rotate-0 rtl:rotate-180"><BackIcon /></div>
            </button>
          ) : (
            <button onClick={onNotificationsClick}
              className="w-9 h-9 flex items-center justify-center bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border active:scale-90 transition-transform relative">
              <BellIcon unreadCount={unreadCount} />
            </button>
          )}
        </div>

        {/* وسط: Brand lockup */}
        <div className="flex items-center gap-2">
          <EDMarkMini />
          <div className="flex items-center gap-1.5">
            {ar && (
              <span style={{
                fontFamily: "'IBM Plex Sans Arabic', 'Noto Naskh Arabic', serif",
                fontWeight: 700, fontSize: 15, color: TEAL700,
                direction: 'rtl', lineHeight: 1, letterSpacing: '-0.01em',
              }}>
                إيزي<span style={{ color: TEAL500 }}>درج</span>
              </span>
            )}
            {ar && <span style={{ width: 1, height: 12, background: '#c9cfcc', display: 'inline-block' }} />}
            <span style={{ fontWeight: 700, fontSize: 15, color: '#0e1a18', letterSpacing: '-0.02em', lineHeight: 1 }}
              className="dark:text-white">
              Easy<span style={{ color: TEAL700 }}>Drug</span>
            </span>
          </div>
          {isLoading && (
            <div className="w-3 h-3 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
          )}
          <OnlineIndicator />
        </div>

        {/* يمين: Avatar أو Login */}
        <div className="flex items-center gap-2 justify-end">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setIsMenuOpen(v => !v)}
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-white text-[11px] font-black shadow-sm active:scale-90 transition-transform"
                style={{ background: `linear-gradient(135deg, ${TEAL700}, ${TEAL500})` }}>
                {user.username.charAt(0).toUpperCase()}
              </button>

              <div className={`fixed right-4 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-[9990] overflow-hidden origin-top-right
                    ${isMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
                style={{ top: (ref as any)?.current?.getBoundingClientRect?.()?.bottom + 6 || 80 }}>
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-black text-sm text-slate-800 dark:text-white truncate">{user.username}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-black uppercase" style={{ color: TEAL700 }}>
                      {t(`${user.role}Role` as any)}
                    </span>
                    {(user.role === 'premium' || (user as any).subscriptionStatus === 'active') && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: '#faecd0', color: '#b8842a' }}>⭐ Premium</span>
                    )}
                  </div>
                </div>
                <button onClick={() => { onSettingsClick?.(); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  {t('navSettings')}
                </button>
                {user.role === 'admin' && (
                  <button onClick={() => { onAdminClick(); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    {t('adminDashboard')}
                  </button>
                )}
                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-3" />
                <button onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                  {t('logout')}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={onLoginClick}
              className="text-white px-4 py-2 rounded-2xl text-xs font-black shadow-sm active:scale-95 transition-all"
              style={{ background: `linear-gradient(135deg, ${TEAL700}, ${TEAL500})` }}>
              {t('login')}
            </button>
          )}
        </div>
      </div>
      {children}
    </header>
  );
});

export default Header;