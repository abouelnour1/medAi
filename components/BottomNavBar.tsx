import React, { useRef } from 'react';
import { Tab, TFunction } from '../types';
import SearchIcon from './icons/SearchIcon';
import HealthInsuranceIcon from './icons/HealthInsuranceIcon';
import ReceiptIcon from './icons/ReceiptIcon';
import StethoscopeIcon from './icons/StethoscopeIcon';
import SettingsIcon from './icons/SettingsIcon';

interface BottomNavBarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  t: TFunction;
  onPrescriptionLongPress: () => void;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  onLongPress?: () => void;
}> = ({ label, icon, isActive, onClick, onLongPress }) => {
  const activeClasses = isActive ? 'text-primary' : 'text-gray-400 dark:text-slate-500';
  
  const pressTimer = useRef<number | undefined>(undefined);
  const isLongPressTriggered = useRef(false);

  const handlePointerDown = () => {
    if (!onLongPress) return;
    isLongPressTriggered.current = false;
    pressTimer.current = window.setTimeout(() => {
      if (onLongPress) {
        onLongPress();
      }
      isLongPressTriggered.current = true;
    }, 700); // 700ms for long press
  };

  const handlePointerUp = () => {
    if (!onLongPress) return;
    if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = undefined;
    }
  };

  const handleClick = () => {
    // Prevent click if long press was triggered
    if (onLongPress && isLongPressTriggered.current) {
        return;
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp} // Cancel timer if pointer leaves
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu on long press
      className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${activeClasses} hover:text-primary dark:hover:text-primary-light`}
    >
      <div className="w-6 h-6 mb-1">{icon}</div>
      <span className={`text-xs font-semibold ${isActive ? 'text-primary dark:text-primary-light' : ''}`}>{label}</span>
    </button>
  );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, setActiveTab, t, onPrescriptionLongPress }) => {
  const navItems: { id: Tab; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'search', labelKey: t('navSearch'), icon: <SearchIcon /> },
    { id: 'insurance', labelKey: t('navInsurance'), icon: <HealthInsuranceIcon /> },
    { id: 'prescriptions', labelKey: t('navPrescriptions'), icon: <ReceiptIcon /> },
    { id: 'assistant', labelKey: t('navAssistant'), icon: <StethoscopeIcon /> },
    { id: 'settings', labelKey: t('navSettings'), icon: <SettingsIcon /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-lg border-t border-slate-200/50 dark:border-slate-800/50 z-30 max-w-2xl mx-auto">
      <div className="flex justify-around h-full">
        {navItems.map(item => (
          <NavItem
            key={item.id}
            label={item.labelKey}
            icon={item.icon}
            isActive={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
            onLongPress={item.id === 'prescriptions' ? onPrescriptionLongPress : undefined}
          />
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;