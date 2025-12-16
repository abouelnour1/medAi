
import React from 'react';
import { MilkProduct, TFunction } from '../types';
import BabyBottleIcon from './icons/BabyBottleIcon';
import MarkdownRenderer from './MarkdownRenderer';

interface MilkCardProps {
  product: MilkProduct;
  t: TFunction;
  onClick: () => void;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
  isSecondSelection?: boolean;
  onRunComparison?: () => void;
}

const MilkCard: React.FC<MilkCardProps> = ({ product, t, onClick, isSelected, onToggleSelect, isSecondSelection, onRunComparison }) => {
  
  // Determine visual style based on stage/type
  let stageColorClass = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
  let stageLabel = "";

  const lowerStage = product.stageType.toLowerCase();

  // Strict Stage Logic for Visuals
  if (lowerStage.includes('1') && !lowerStage.includes('year')) {
      stageColorClass = "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
      stageLabel = "1";
  } else if (lowerStage.includes('2')) {
      stageColorClass = "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800";
      stageLabel = "2";
  } else if (lowerStage.includes('3') || lowerStage.includes('growing')) {
      stageColorClass = "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800";
      stageLabel = "3";
  } else {
      // Special Formulas (AR, AC, LF, Pre, etc)
      stageColorClass = "bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800";
      const match = product.productName.match(/\b(AR|AC|LF|HA|IT|PDF|Pre)\b/i);
      stageLabel = match ? match[0].toUpperCase() : "SP";
  }

  return (
    <div 
        onClick={onClick}
        className={`relative bg-white dark:bg-dark-card rounded-xl shadow-sm border transition-all duration-200 cursor-pointer group flex flex-col p-3 gap-2 overflow-hidden
            ${isSelected ? 'ring-2 ring-primary ring-opacity-70 border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}
    >
      <div className="flex items-start gap-3 relative z-10">
          {/* 1. Selection Checkbox (Left) - easier access */}
          <div className="flex-shrink-0 pt-1" onClick={e => e.stopPropagation()}>
            {onToggleSelect && (
                <button
                    onClick={onToggleSelect}
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all border ${isSelected ? 'bg-primary border-primary text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent hover:border-primary'}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </button>
            )}
          </div>

          {/* 2. Main Info */}
          <div className="flex-grow min-w-0">
              <div className="flex justify-between items-start">
                  <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-0.5">{product.brand}</span>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight truncate max-w-[200px]">
                          {product.productName}
                      </h3>
                  </div>
                  {/* Stage Badge */}
                  <div className={`flex-shrink-0 px-2 py-1 rounded-lg flex items-center justify-center border ${stageColorClass}`}>
                      <span className="text-lg font-black leading-none">{stageLabel}</span>
                  </div>
              </div>
              
              {/* Key Features (Visible Outside) */}
              {product.keyFeatures && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-md border border-slate-100 dark:border-slate-700">
                      <span className="font-bold text-slate-600 dark:text-slate-300">Features: </span>
                      {product.keyFeatures}
                  </div>
              )}
          </div>
      </div>

      {/* 3. Nutrition Strip (New - Visible on Card) */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col items-center flex-1 border-r border-slate-200 dark:border-slate-700 last:border-0 px-1">
              <span className="font-bold text-slate-800 dark:text-slate-200">{product.kcal}</span>
              <span className="text-[8px] uppercase tracking-wide opacity-70">{t('kcal')}</span>
          </div>
          <div className="flex flex-col items-center flex-1 border-r border-slate-200 dark:border-slate-700 last:border-0 px-1">
              <span className="font-bold text-slate-800 dark:text-slate-200">{product.protein}g</span>
              <span className="text-[8px] uppercase tracking-wide opacity-70">{t('protein')}</span>
          </div>
          <div className="flex flex-col items-center flex-1 border-r border-slate-200 dark:border-slate-700 last:border-0 px-1">
              <span className="font-bold text-slate-800 dark:text-slate-200">{product.fat}g</span>
              <span className="text-[8px] uppercase tracking-wide opacity-70">{t('fat')}</span>
          </div>
          <div className="flex flex-col items-center flex-1 px-1">
              <span className="font-bold text-slate-800 dark:text-slate-200">{product.carb}g</span>
              <span className="text-[8px] uppercase tracking-wide opacity-70">{t('carb')}</span>
          </div>
      </div>

      {/* 4. Pharmacist Note / USP (English ONLY on Card) */}
      {(!isSecondSelection) && product.usp && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 relative z-10">
              <div className="flex items-start gap-1.5" dir="ltr">
                  <span className="text-yellow-500 mt-0.5 text-[10px]">★</span>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium ai-response-content">
                      <MarkdownRenderer content={product.usp} />
                  </div>
              </div>
          </div>
      )}

      {/* 5. Instant Compare Action (Overlay on Card) */}
      {isSecondSelection && onRunComparison && (
          <div className="mt-2 pt-2 border-t border-primary/20 relative z-20 animate-fade-in">
              <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onRunComparison();
                }}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transform transition-all active:scale-95"
              >
                  <span>{t('compare')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
          </div>
      )}
    </div>
  );
};

export default MilkCard;
