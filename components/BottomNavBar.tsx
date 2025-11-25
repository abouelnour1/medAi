
import React from 'react';
import { Tab, TFunction, User, View } from '../types';
import SearchIcon from './icons/SearchIcon';
import HealthInsuranceIcon from './icons/HealthInsuranceIcon';
import CosmeticsIcon from './icons/CosmeticsIcon';
import SettingsIcon from './icons/SettingsIcon';

interface BottomNavBarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  t: TFunction;
  user: User | null;
  view: View;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 group py-1 ${
        isActive 
          ? 'text-primary dark:text-primary-light scale-105' 
          : 'text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300'
      }`}
    >
      <div className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${isActive ? 'drop-shadow-md -translate-y-0.5' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'font-bold' : ''} leading-none`}>
        {label}
      </span>
    </button>
  );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, setActiveTab, t, user, view }) => {
  const navItems = [
    { id: 'search', labelKey: t('navSearch'), icon: <SearchIcon /> },
    { id: 'insurance', labelKey: t('navInsurance'), icon: <HealthInsuranceIcon /> },
    { id: 'cosmetics', labelKey: t('navCosmetics'), icon: <CosmeticsIcon /> },
    { id: 'settings', labelKey: t('navSettings'), icon: <SettingsIcon /> },
  ];

  return (
    <nav 
        className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)] z-30 pb-[calc(env(safe-area-inset-bottom)+2px)] pt-1"
    >
      <div className="flex justify-around items-center h-auto min-h-[50px] max-w-2xl mx-auto px-2">
        {navItems.map(item => (
          <NavItem
            key={item.id}
            label={item.labelKey}
            icon={item.icon}
            isActive={activeTab === item.id}
            onClick={() => setActiveTab(item.id as Tab)}
          />
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;
