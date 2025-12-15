
import React from 'react';
import { MilkProduct, TFunction } from '../types';
import BabyBottleIcon from './icons/BabyBottleIcon';

interface MilkCardProps {
  product: MilkProduct;
  t: TFunction;
  onClick: () => void;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
}

const MilkCard: React.FC<MilkCardProps> = ({ product, t, onClick, isSelected, onToggleSelect }) => {
  
  // Determine visual style based on stage/type
  let stageColorClass = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
  let iconColor = "text-slate-400";
  let stageLabel = "";

  const lowerStage = product.stageType.toLowerCase();

  // Strict Stage Logic for Visuals
  if (lowerStage.includes('1') && !lowerStage.includes('year')) {
      stageColorClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800";
      iconColor = "text-blue-500";
      stageLabel = "1";
  } else if (lowerStage.includes('2')) {
      stageColorClass = "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800";
      iconColor = "text-purple-500";
      stageLabel = "2";
  } else if (lowerStage.includes('3') || lowerStage.includes('growing')) {
      stageColorClass = "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800";
      iconColor = "text-orange-500";
      stageLabel = "3";
  } else {
      // Special Formulas (AR, AC, LF, Pre, etc)
      stageColorClass = "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800";
      iconColor = "text-teal-500";
      // Extract 2 letters for the badge if possible, e.g., AR, LF, AC
      const match = product.productName.match(/\b(AR|AC|LF|HA|IT|PDF|Pre)\b/i);
      stageLabel = match ? match[0].toUpperCase() : "SP";
  }

  return (
    <div 
        onClick={onClick}
        className={`relative bg-white dark:bg-dark-card rounded-xl shadow-sm border transition-all duration-200 cursor-pointer group flex items-center p-3 gap-3
            ${isSelected ? 'ring-2 ring-primary ring-opacity-70 border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}
    >
      {/* 1. Stage Badge (Left) */}
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border-2 ${stageColorClass} shadow-sm`}>
          <span className="text-xl font-black">{stageLabel}</span>
      </div>

      {/* 2. Main Info (Middle) */}
      <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
             <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">{product.brand}</span>
             {/* Tiny features summary if needed, or keeping it clean */}
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight truncate">
              {product.productName}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {product.ageRange}
          </p>
      </div>

      {/* 3. Action / Selection (Right) */}
      <div className="flex-shrink-0 flex items-center pl-2 border-l border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        {onToggleSelect && (
            <button
                onClick={onToggleSelect}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-white shadow-md' : 'text-slate-300 hover:text-slate-500 dark:text-slate-600'}`}
            >
                {isSelected ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                ) : (
                    <span className="text-[10px] font-bold uppercase tracking-tighter">VS</span>
                )}
            </button>
        )}
      </div>
    </div>
  );
};

export default MilkCard;
