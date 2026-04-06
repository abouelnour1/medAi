import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Tab, TFunction, User, View } from '../types';
import SearchIcon from './icons/SearchIcon';
import HealthInsuranceIcon from './icons/HealthInsuranceIcon';
import StarIcon from './icons/StarIcon';

interface BottomNavBarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  t: TFunction;
  user: User | null;
  view: View;
  onPediatricCalc?: () => void;
  onDrugTestCheck?: () => void;
  onFavoritesClick?: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab, setActiveTab, t, user, view, onPediatricCalc, onFavoritesClick, onDrugTestCheck
}) => {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const ar = t('language') === 'ar';

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const onShow = () => setKeyboardOpen(true);
    const onHide = () => setKeyboardOpen(false);
    window.addEventListener('keyboardWillShow', onShow);
    window.addEventListener('keyboardWillHide', onHide);
    window.addEventListener('keyboardDidShow', onShow);
    window.addEventListener('keyboardDidHide', onHide);
    return () => {
      window.removeEventListener('keyboardWillShow', onShow);
      window.removeEventListener('keyboardWillHide', onHide);
      window.removeEventListener('keyboardDidShow', onShow);
      window.removeEventListener('keyboardDidHide', onHide);
    };
  }, []);

  // اقفل لما يضغط خارج
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const t = setTimeout(() => document.addEventListener('click', close, { once: true }), 50);
    return () => { clearTimeout(t); document.removeEventListener('click', close); };
  }, [open]);

  if (keyboardOpen) return null;

  const isSearchActive = activeTab === 'search';
  const isInsuranceActive = activeTab === 'insurance';
  const isFavActive = view === 'favorites';
  const isSettingsActive = activeTab === 'settings';

  const items: { label: string; active: boolean; color: string; icon: React.ReactNode; onClick: () => void }[] = [
    {
      label: ar ? 'بحث' : 'Search',
      active: isSearchActive,
      color: 'teal',
      icon: <div className="w-5 h-5"><SearchIcon /></div>,
      onClick: () => { setActiveTab('search' as Tab); setOpen(false); },
    },
    {
      label: ar ? 'تأمين' : 'Insurance',
      active: isInsuranceActive,
      color: 'teal',
      icon: <div className="w-5 h-5"><HealthInsuranceIcon /></div>,
      onClick: () => { setActiveTab('insurance' as Tab); setOpen(false); },
    },
    {
      label: ar ? 'جرعات' : 'Pedi',
      active: false,
      color: 'teal',
      icon: <span className="text-lg">👶</span>,
      onClick: () => { onPediatricCalc?.(); setOpen(false); },
    },
    {
      label: ar ? 'تحليل' : 'Drug Test',
      active: false,
      color: 'teal',
      icon: <span className="text-lg">🧪</span>,
      onClick: () => { onDrugTestCheck?.(); setOpen(false); },
    },
    {
      label: ar ? 'مفضلة' : 'Saved',
      active: isFavActive,
      color: 'amber',
      icon: <div className="w-5 h-5"><StarIcon isFilled={isFavActive} /></div>,
      onClick: () => { onFavoritesClick?.(); setOpen(false); },
    },
    {
      label: ar ? 'إعدادات' : 'Settings',
      active: isSettingsActive,
      color: 'teal',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ),
      onClick: () => { setActiveTab('settings' as Tab); setOpen(false); },
    },
  ];

  // أي تاب نشط؟ عشان نحدد أيقونة الزر
  const activeItem = items.find(i => i.active);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>

      {/* القايمة المنبثقة */}
      <div className={`absolute left-1/2 -translate-x-1/2 pointer-events-auto
        ${open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}`}
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-700 shadow-2xl rounded-[2rem] px-3 py-2 flex gap-1">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl active:scale-90
                ${item.active
                  ? item.color === 'amber'
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500'
                    : 'bg-teal-50 dark:bg-teal-900/20 text-teal-600'
                  : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              {item.icon}
              <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* شريط التنقل الأساسي */}
      <div className="pointer-events-auto mx-4">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700 shadow-xl rounded-[1.5rem] px-2 py-1.5 flex items-center justify-around">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center flex-1 py-2 rounded-xl active:scale-90
                ${item.active
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-slate-400'
                }`}
            >
              {item.icon}
              <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">{item.label}</span>
            </button>
          ))}
          {/* زر القايمة */}
          <button
            onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
            className={`flex flex-col items-center justify-center flex-1 py-2 rounded-xl active:scale-90 ${open ? 'text-primary' : 'text-slate-400'}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 6h14M5 18h14"/>
              }
            </svg>
            <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">{ar ? 'المزيد' : 'More'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomNavBar;

