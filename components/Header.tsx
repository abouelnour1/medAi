import React, { forwardRef } from 'react';
import BackIcon from './icons/BackIcon';
import { Language } from '../types';

interface HeaderProps {
  title: string;
  showBack: boolean;
  onBack: () => void;
}

const Header = forwardRef<HTMLElement, HeaderProps>(({ title, showBack, onBack }, ref) => {
  return (
    <header ref={ref} className="bg-primary text-white sticky top-0 z-20 flex-shrink-0">
      <div className="container mx-auto px-4 h-16 flex justify-between items-center max-w-2xl">
        <div className="w-10">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
              aria-label="Back"
            >
              <span className={document.documentElement.lang === 'en' ? 'inline-block' : 'inline-block transform scale-x-[-1]'}>
                 <BackIcon />
              </span>
            </button>
          )}
        </div>
        
        <h1 className="text-xl font-bold whitespace-nowrap truncate px-2 text-center">
          {title}
        </h1>

        <div className="w-10">
          {/* Placeholder for potential right-side actions */}
        </div>
      </div>
    </header>
  );
});

export default Header;