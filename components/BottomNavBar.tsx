
import React, { useState, useEffect, useRef } from 'react';
import { Tab, TFunction, User, View } from '../types';
import SearchIcon from './icons/SearchIcon';
import HealthInsuranceIcon from './icons/HealthInsuranceIcon';
import ReceiptIcon from './icons/ReceiptIcon';
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
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    // Only apply auto-hide logic on main list views
    const isMainListView = ['search', 'results', 'insuranceSearch', 'cosmeticsSearch', 'prescriptions', 'chatHistory', 'settings'].includes(view);
    
    if (!isMainListView) {
        setIsVisible(true);
        return;
    }

    const scrollContainer = document.getElementById('main-scroll-container');

    const controlNavbar = () => {
      if (scrollContainer) {
        const currentScrollY = scrollContainer.scrollTop;
        const diff = currentScrollY - lastScrollY.current;
        
        // 1. Check content height vs container height
        // If content fits on screen, never hide the navbar
        if (scrollContainer.scrollHeight <= scrollContainer.clientHeight + 1) {
            setIsVisible(true);
            return;
        }

        // Check if page is actually scrollable (content height > viewport height + buffer)
        const isScrollable = scrollContainer.scrollHeight > scrollContainer.clientHeight + 50;

        if (isScrollable) {
            // Ignore small movements (jitter)
            if (Math.abs(diff) < 15) return;

            if (diff > 0 && currentScrollY > 60) {
              // Scrolling Down -> Hide
              setIsVisible(false);
            } else if (diff < 0) {
              // Scrolling Up -> Show
              setIsVisible(true);
            }
        } else {
            // Always show if not scrollable
            setIsVisible(true);
        }
        
        lastScrollY.current = currentScrollY;
      }
    };

    if (scrollContainer) {
        scrollContainer.addEventListener('scroll', controlNavbar);
        // Initial check
        controlNavbar();
    }
    return () => {
        if (scrollContainer) {
            scrollContainer.removeEventListener('scroll', controlNavbar);
        }
    };
  }, [activeTab, view]); // Add view to dependency to re-check on view switch

  const navItems = [
    { id: 'search', labelKey: t('navSearch'), icon: <SearchIcon /> },
    { id: 'insurance', labelKey: t('navInsurance'), icon: <HealthInsuranceIcon /> },
    ...(user?.role === 'admin' ? [{ id: 'prescriptions', labelKey: t('navPrescriptions'), icon: <ReceiptIcon /> }] : []),
    { id: 'cosmetics', labelKey: t('navCosmetics'), icon: <CosmeticsIcon /> },
    { id: 'settings', labelKey: t('navSettings'), icon: <SettingsIcon /> },
  ];

  return (
    <nav 
        className={`fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)] z-30 pb-[calc(env(safe-area-inset-bottom)+2px)] pt-1 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
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
