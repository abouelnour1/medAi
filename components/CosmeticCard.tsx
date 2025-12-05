
import React from 'react';
import { Cosmetic, TFunction, Language } from '../types';
import SparkleIcon from './icons/SparkleIcon';
import FactoryIcon from './icons/FactoryIcon';

interface CosmeticCardProps {
  cosmetic: Cosmetic;
  t: TFunction;
  language: Language;
  onClick?: () => void;
  onLongPress?: (cosmetic: Cosmetic) => void;
}

const CosmeticCard: React.FC<CosmeticCardProps> = ({ cosmetic, t, language, onClick, onLongPress }) => {
  return (
    <div 
      className="group relative bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md active:scale-[0.99]"
      onClick={onClick}
      onContextMenu={(e) => {
          e.preventDefault();
          if (onLongPress) onLongPress(cosmetic);
      }}
    >
      {/* Thinner Header Accent */}
      <div className="h-0.5 w-full bg-gradient-to-r from-pink-300 to-purple-300 dark:from-pink-800 dark:to-purple-800"></div>

      <div className="p-3">
        {/* Top Row: Brand & Origin */}
        <div className="flex justify-between items-start mb-2">
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 rounded-md">
                {cosmetic.BrandName}
            </span>
            {(cosmetic.manufacturerCountryEn || cosmetic.manufacturerNameEn) && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 max-w-[50%] truncate">
                    <FactoryIcon />
                    <span className="truncate">
                        {cosmetic.manufacturerNameEn} 
                        {cosmetic.manufacturerCountryEn && ` (${cosmetic.manufacturerCountryEn})`}
                    </span>
                </div>
            )}
        </div>

        {/* Product Name */}
        <div className="mb-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug font-serif group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors" dir="ltr">
              {cosmetic.SpecificName}
            </h2>
            {cosmetic.SpecificNameAr && (
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans" dir="rtl">
                 {cosmetic.SpecificNameAr}
               </p>
            )}
        </div>

        {/* Ingredients & Details - Compact List */}
        <div className="space-y-1.5 text-[10px] leading-tight text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700/50 pt-2">
            {cosmetic["Active ingredient"] && (
                <div className="flex flex-col sm:flex-row sm:gap-1">
                    <span className="font-bold text-slate-500 uppercase shrink-0 min-w-[70px]">Active:</span>
                    <span className="line-clamp-2">{cosmetic["Active ingredient"]}</span>
                </div>
            )}
            
            {cosmetic["Key Ingredients"] && (
                <div className="flex flex-col sm:flex-row sm:gap-1">
                    <span className="font-bold text-pink-500/80 uppercase shrink-0 min-w-[70px]">Key Ing:</span>
                    <span className="line-clamp-2">{cosmetic["Key Ingredients"]}</span>
                </div>
            )}

            {cosmetic.Highlights && (
                <div className="flex items-start gap-1 pt-1">
                    <div className="w-3 h-3 text-pink-400 shrink-0 mt-0.5"><SparkleIcon /></div>
                    <span className="italic text-slate-500">{cosmetic.Highlights}</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CosmeticCard;
