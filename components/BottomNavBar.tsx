import React from 'react';
import { Tab, TFunction, User, View } from '../types';
import SearchIcon from './icons/SearchIcon';
import HealthInsuranceIcon from './icons/HealthInsuranceIcon';
import SettingsIcon from './icons/SettingsIcon';

interface BottomNavBarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  t: TFunction;
  user: User | null;
  view: View;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, setActiveTab, t, user, view }) => {
  const navItems = [
    { id: 'search', label: t('navSearch'), icon: <SearchIcon /> },
    { id: 'insurance', label: t('navInsurance'), icon: <HealthInsuranceIcon /> },
    { id: 'settings', label: t('navSettings'), icon: <SettingsIcon /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[2.5rem] h-20 flex justify-around items-center max-w-2xl mx-auto px-2">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`relative flex flex-col items-center justify-center w-20 h-full transition-all duration-300 group ${isActive ? 'text-teal-600' : 'text-slate-400'}`}
            >
              {isActive && (
                  <span className="absolute top-2 w-1.5 h-1.5 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.8)]"></span>
              )}
              <div className={`w-6 h-6 mb-1 transition-transform duration-300 flex items-center justify-center ${isActive ? 'scale-110 -translate-y-1' : 'group-hover:scale-105'}`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;