
import React from 'react';
import { Cosmetic, TFunction, Language } from '../types';
import CosmeticsIcon from './icons/CosmeticsIcon';

interface CosmeticCardProps {
  cosmetic: Cosmetic;
  t: TFunction;
  language: Language;
  onClick?: () => void;
  onLongPress?: (cosmetic: Cosmetic) => void;
}

const CosmeticCard: React.FC<CosmeticCardProps> = ({ cosmetic, t, language, onClick, onLongPress }) => {
  // Categories can remain localized for better UX
  const firstCategory = language === 'ar' ? cosmetic.FirstSubCategoryAr : cosmetic.FirstSubCategoryEn;
  const secondCategory = language === 'ar' ? cosmetic.SecondSubCategoryAr : cosmetic.SecondSubCategoryEn;

  return (
    <div 
      className="bg-light-card dark:bg-dark-card rounded-xl shadow-md overflow-hidden cursor-pointer border border-slate-100 dark:border-slate-800 active:scale-[0.98] transition-transform duration-100"
      onClick={onClick}
      onContextMenu={(e) => {
          e.preventDefault();
          if (onLongPress) onLongPress(cosmetic);
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-grow min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-primary dark:text-primary-light font-bold uppercase tracking-wider mb-1">
              <div className="h-4 w-4"><CosmeticsIcon /></div>
              <span className="truncate">{cosmetic.BrandName}</span>
            </div>
            
            {/* 1. English Name (Primary) */}
            <h2 className="text-base font-bold text-light-text dark:text-dark-text text-left leading-tight" dir="ltr">
              {cosmetic.SpecificName}
            </h2>

            {/* 2. Arabic Name (Secondary) */}
            {cosmetic.SpecificNameAr && (
               <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-right font-medium" dir="rtl">
                 {cosmetic.SpecificNameAr}
               </p>
            )}

            {/* Key Ingredients */}
            {cosmetic["Key Ingredients"] && (
                <p className="mt-2 pt-2 text-xs text-light-text-secondary dark:text-dark-text-secondary line-clamp-2 text-left border-t border-dashed border-slate-200 dark:border-slate-700" dir="ltr">
                    <span className="font-semibold text-light-text dark:text-dark-text">Active:</span> {cosmetic["Key Ingredients"]}
                </p>
            )}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 text-[10px] font-medium">
          <span className="bg-slate-100 dark:bg-slate-800 text-light-text-secondary dark:text-dark-text-secondary px-2 py-1 rounded-md">
            {firstCategory}
          </span>
          {secondCategory && (
            <span className="bg-slate-100 dark:bg-slate-800 text-light-text-secondary dark:text-dark-text-secondary px-2 py-1 rounded-md">
              {secondCategory}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CosmeticCard;
