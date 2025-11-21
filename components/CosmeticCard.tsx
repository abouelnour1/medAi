
import React from 'react';
import { Cosmetic, TFunction, Language } from '../types';
import CosmeticsIcon from './icons/CosmeticsIcon';

interface CosmeticCardProps {
  cosmetic: Cosmetic;
  t: TFunction;
  language: Language;
  onClick?: () => void;
}

const CosmeticCard: React.FC<CosmeticCardProps> = ({ cosmetic, t, language, onClick }) => {
  // Always display SpecificName (English) as requested
  const name = cosmetic.SpecificName;
  
  // Categories can remain localized for better UX
  const firstCategory = language === 'ar' ? cosmetic.FirstSubCategoryAr : cosmetic.FirstSubCategoryEn;
  const secondCategory = language === 'ar' ? cosmetic.SecondSubCategoryAr : cosmetic.SecondSubCategoryEn;

  return (
    <div 
      className="bg-light-card dark:bg-dark-card rounded-xl shadow-md overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg"
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-primary dark:text-primary-light font-semibold mb-1">
              <div className="h-4 w-4"><CosmeticsIcon /></div>
              <span className="truncate">{cosmetic.BrandName}</span>
            </div>
            
            {/* Force Left-to-Right direction for English Name */}
            <h2 className="text-base font-bold text-light-text dark:text-dark-text text-left" dir="ltr">
              {name}
            </h2>

            {/* Show Key Ingredients under the name */}
            {cosmetic["Key Ingredients"] && (
                <p className="mt-2 text-xs text-light-text-secondary dark:text-dark-text-secondary line-clamp-2 text-left" dir="ltr">
                    <span className="font-semibold text-light-text dark:text-dark-text">Key Ingredients:</span> {cosmetic["Key Ingredients"]}
                </p>
            )}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 text-xs">
          <span className="bg-slate-100 dark:bg-slate-800 text-light-text-secondary dark:text-dark-text-secondary px-2 py-1 rounded-full">
            {firstCategory}
          </span>
          {secondCategory && (
            <span className="bg-slate-100 dark:bg-slate-800 text-light-text-secondary dark:text-dark-text-secondary px-2 py-1 rounded-full">
              {secondCategory}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CosmeticCard;
