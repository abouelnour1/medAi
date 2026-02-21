import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { ChevronLeft, Bell, Settings, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TFunction, View } from '../types';
import { useAuth } from './auth/AuthContext';

interface HeaderProps {
  title: string;
  showBack: boolean;
  onBack: () => void;
  t: TFunction;
  onLoginClick: () => void;
  onAdminClick: () => void;
  onNotificationsClick: () => void;
  view: View;
  unreadCount?: number;
}

const Header = forwardRef<HTMLElement, HeaderProps>(({ title, showBack, onBack, t, onLoginClick, onAdminClick, onNotificationsClick, view, unreadCount = 0 }, ref) => {
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
        className="fixed top-0 left-0 right-0 z-40 px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-4 transition-all"
    >
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[2rem] px-4 h-16 flex justify-between items-center max-w-7xl mx-auto">
        
        <div className="flex-1 flex justify-start items-center gap-2">
          {showBack ? (
            <button
              onClick={onBack}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-full active:scale-90 transition-transform"
            >
              <ChevronLeft className="w-5 h-5 ltr:rotate-0 rtl:rotate-180" />
            </button>
          ) : (
             <button 
                onClick={onNotificationsClick}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-full active:scale-90 transition-transform relative"
              >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                  )}
              </button>
          )}
        </div>
        
        <div className="flex-[2] flex justify-center"> 
            <h1 className="text-lg font-black text-slate-800 dark:text-white font-poppins tracking-tight">
              Pharma<span className="text-primary">Source</span>
            </h1>
        </div>

        <div className="flex-1 flex justify-end items-center">
          {user ? (
            <div className="relative" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-full active:scale-95 transition-all">
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-[10px] font-black">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                </button>
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute top-full ltr:right-0 rtl:left-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl ring-1 ring-black/5 py-2 transition-all origin-top-right"
                    >
                        <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-700 mb-1">
                            <p className="font-black text-sm text-slate-800 dark:text-white truncate">{user.username}</p>
                            <p className="text-[10px] font-bold text-primary uppercase">{t(`${user.role}Role` as any)}</p>
                        </div>
                        {user.role === 'admin' && (
                             <button onClick={() => { onAdminClick(); setIsMenuOpen(false); }} className="w-full text-right px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                 <Shield className="w-4 h-4 opacity-50" />
                                 {t('adminDashboard')}
                             </button>
                        )}
                        <button onClick={logout} className="w-full text-right px-4 py-2.5 text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2">
                            <LogOut className="w-4 h-4" />
                            {t('logout')}
                        </button>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          ) : (
            <button onClick={onLoginClick} className="bg-primary text-white px-5 py-2 rounded-full text-xs font-black shadow-lg shadow-primary/30 active:scale-95 transition-all">
                {t('login')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
});

export default Header;
