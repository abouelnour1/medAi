
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
  
  const getStageStyle = () => {
    const lowerStage = product.stageType.toLowerCase();
    if (lowerStage.includes('1') && !lowerStage.includes('year')) return { color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', label: '1' };
    if (lowerStage.includes('2')) return { color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', label: '2' };
    if (lowerStage.includes('3')) return { color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', label: '3' };
    return { color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-400', label: 'SP' };
  };

  const style = getStageStyle();

  return (
    <div 
        onClick={onClick}
        className={`relative bg-white dark:bg-dark-card rounded-2xl shadow-sm border transition-all duration-300 cursor-pointer overflow-hidden group
            ${isSelected ? 'ring-2 ring-primary border-primary bg-primary/[0.02]' : 'border-slate-100 dark:border-slate-800 hover:shadow-lg'}`}
    >
      {/* Decorative Background Icon - Smaller */}
      <div className="absolute -right-2 -top-2 w-16 h-16 text-slate-50 dark:text-slate-800/30 rotate-12 pointer-events-none opacity-40 group-hover:rotate-45 transition-transform duration-700">
          <BabyBottleIcon />
      </div>

      <div className="flex p-3.5 gap-4 relative z-10">
          {/* Compact Stage Indicator */}
          <div className="flex flex-col items-center shrink-0">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${style.color} shadow-md flex flex-col items-center justify-center text-white mb-2`}>
                  <span className="text-[7px] font-black uppercase opacity-80 leading-none mb-0.5">Stage</span>
                  <span className="text-lg font-black leading-none">{style.label}</span>
              </div>
              {onToggleSelect && (
                <button
                    onClick={onToggleSelect}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all border shadow-sm ${isSelected ? 'bg-primary border-primary text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-transparent hover:border-primary/50'}`}
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </button>
              )}
          </div>

          <div className="flex-grow min-w-0">
              <div className="flex justify-between items-start mb-1">
                  <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none">{product.brand}</p>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                            {product.ageRange}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white truncate leading-tight mt-1">
                          {product.productName}
                      </h3>
                  </div>
              </div>

              {/* Tighter Nutrition Grid */}
              <div className="flex gap-2 mt-2 pb-2 border-b border-slate-50 dark:border-slate-800/50">
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="text-[8px] text-slate-400 font-bold uppercase">{t('energy')}</span>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{product.kcal}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="text-[8px] text-slate-400 font-bold uppercase">{t('protein')}</span>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{product.protein}g</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="text-[8px] text-slate-400 font-bold uppercase">{t('fat')}</span>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{product.fat}g</span>
                  </div>
              </div>

              {/* Pharmaceutical Notes (Features) Section */}
              <div className="mt-2 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/30 rounded-lg transition-colors">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                      {t('keyFeatures')}
                  </p>
                  <div className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 ai-response-content line-clamp-2 italic">
                      <MarkdownRenderer content={product.usp} />
                  </div>
              </div>
          </div>
      </div>

      {isSecondSelection && onRunComparison && (
          <div className="px-3.5 pb-3.5">
              <button 
                onClick={(e) => { e.stopPropagation(); onRunComparison(); }}
                className="w-full bg-primary hover:bg-primary-dark text-white font-black py-2 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transform transition-all active:scale-95 group/btn"
              >
                  <span className="text-xs">{t('compare')}</span>
                  <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
          </div>
      )}
    </div>
  );
};

export default MilkCard;
