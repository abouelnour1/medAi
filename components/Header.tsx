import React, { forwardRef } from 'react';
import BackIcon from './icons/BackIcon';
import SunIcon from './SunIcon';
import MoonIcon from './MoonIcon';
import InstallIcon from './icons/InstallIcon';
import { TFunction } from '../types';

interface HeaderProps {
  title: string;
  showBack: boolean;
  onBack: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  showInstallButton: boolean;
  onInstallClick: () => void;
  t: TFunction;
}

const Header = forwardRef<HTMLElement, HeaderProps>(({ title, showBack, onBack, theme, toggleTheme, showInstallButton, onInstallClick, t }, ref) => {
  return (
    <header ref={ref} className="bg-primary text-white sticky top-0 z-20 flex-shrink-0">
      <div className="container mx-auto px-4 h-16 flex justify-between items-center max-w-2xl">
        <div className="flex-1 flex justify-start">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
              aria-label={t('back')}
            >
              <span className={document.documentElement.lang === 'en' ? 'inline-block' : 'inline-block transform scale-x-[-1]'}>
                 <BackIcon />
              </span>
            </button>
          )}
        </div>
        
        <h1 className="text-xl font-bold whitespace-nowrap truncate px-2 text-center flex-shrink">
          {title}
        </h1>

        <div className="flex-1 flex justify-end items-center gap-1">
           <button
            onClick={onInstallClick}
            disabled={!showInstallButton}
            className={`p-2 text-white/80 transition-all rounded-full ${
              showInstallButton
                ? 'hover:text-white hover:bg-white/10 cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            }`}
            aria-label={showInstallButton ? t('installApp') : t('installNotAvailable')}
            title={showInstallButton ? t('installApp') : t('installNotAvailable')}
          >
            <InstallIcon />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </div>
    </header>
  );
});

export default Header;