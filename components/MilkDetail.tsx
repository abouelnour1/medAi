
import React from 'react';
import { MilkProduct, TFunction, Language } from '../types';
import BabyBottleIcon from './icons/BabyBottleIcon';
import CameraIcon from './icons/CameraIcon';
import BackIcon from './icons/BackIcon';
import MarkdownRenderer from './MarkdownRenderer';

interface MilkDetailProps {
  product: MilkProduct;
  t: TFunction;
  language: Language;
  onBack: () => void;
}

interface CompositionItem {
    label: string;
    value: string;
    subItems?: { label: string; value: string }[];
}

const MilkDetail: React.FC<MilkDetailProps> = ({ product, t, language, onBack }) => {
  const handleImageSearch = () => {
    const query = `${product.productName} milk formula`;
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  // Render a single row, forcing units/values to LTR
  // Fix: Added React.FC type to CompositionRow to correctly handle React props like 'key'
  const CompositionRow: React.FC<{ item: CompositionItem; isLast?: boolean }> = ({ item, isLast = false }) => (
      <div className={`py-4 px-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!isLast ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}>
          <div className="flex justify-between items-start">
            <span className="text-sm text-slate-600 dark:text-slate-400 font-black capitalize leading-tight pr-4">
                {item.label}
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-slate-100 whitespace-nowrap text-right" dir="ltr">
                {item.value}
            </span>
          </div>
          
          {/* Vertical Sub-items (Breakdown) */}
          {item.subItems && item.subItems.length > 0 && (
              <div className="mt-3 space-y-2 border-l-2 rtl:border-l-0 rtl:border-r-2 border-primary/20 ltr:pl-4 rtl:pr-4 py-1">
                  {item.subItems.map((sub, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[12px]">
                          <span className="text-slate-500 dark:text-slate-500 font-bold italic">{sub.label}</span>
                          <span className="text-slate-700 dark:text-slate-400 font-black" dir="ltr">{sub.value}</span>
                      </div>
                  ))}
              </div>
          )}
      </div>
  );

  const parseFullComposition = (str: string): CompositionItem[] => {
    if (!str) return [];
    
    // Split by commas that are NOT inside parentheses
    const mainParts = str.split(/,(?![^\(]*\))/);
    
    return mainParts.map(p => {
        const trimmed = p.trim();
        
        // Match breakdown: "Label Value (sub-item 1, sub-item 2)"
        // This regex handles labels with spaces and values starting with numbers/symbols
        const parenMatch = trimmed.match(/^(.*?)\s*\((.*?)\)$/);
        
        if (parenMatch) {
            const mainContent = parenMatch[1].trim();
            const subContent = parenMatch[2].trim();
            
            // Separate name from the value (value usually starts with a number)
            const mainMatch = mainContent.match(/^(.*?)\s*(\d.*)$/);
            const label = mainMatch ? mainMatch[1].trim() : mainContent;
            const value = mainMatch ? mainMatch[2].trim() : '';

            // Parse sub-items inside parentheses
            const subItems = subContent.split(',').map(s => {
                const sTrimmed = s.trim();
                const sMatch = sTrimmed.match(/^(.*?)\s*(\d.*)$/);
                return {
                    label: sMatch ? sMatch[1].trim() : sTrimmed,
                    value: sMatch ? sMatch[2].trim() : ''
                };
            }).filter(sub => sub.label !== '');

            return { label, value, subItems };
        } else {
            // Standard item without breakdown
            const match = trimmed.match(/^(.*?)\s*(\d.*)$/);
            if (match) {
                return { label: match[1].trim(), value: match[2].trim() };
            }
            return { label: trimmed, value: '' };
        }
    }).filter(item => item.label !== '');
  };

  const fullComposition = parseFullComposition(product.concentration || '');

  return (
    <div className="animate-fade-in bg-white dark:bg-dark-card min-h-full flex flex-col">
      {/* Premium Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-dark-card/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
            <BackIcon />
        </button>
        <div className="flex-grow">
            <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{product.productName}</h1>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{product.brand}</p>
        </div>
        <button onClick={handleImageSearch} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 transition-colors">
            <div className="w-5 h-5"><CameraIcon /></div>
        </button>
      </div>

      <div className="p-4 space-y-8 overflow-y-auto no-scrollbar pb-28">
        {/* Visual Hero Card */}
        <div className="rounded-[2.5rem] p-8 text-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/40 dark:to-dark-card border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <div className="w-32 h-32"><BabyBottleIcon /></div>
            </div>
            <div className="w-24 h-24 mx-auto rounded-3xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center mb-6 text-primary border border-slate-50 dark:border-slate-700">
                <div className="w-12 h-12"><BabyBottleIcon /></div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">{product.productName}</h2>
            <div className="flex justify-center gap-2">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20 uppercase">
                    {product.stageType}
                </span>
            </div>
        </div>

        {/* Nutritional Facts (Structured Table) */}
        <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('composition')}</h3>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-primary uppercase">Per 100g</span>
                  <span className="text-[9px] text-slate-400 font-bold italic">Dry Powder</span>
                </div>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {fullComposition.length > 0 ? (
                    fullComposition.map((item, idx) => (
                        <CompositionRow 
                            key={idx} 
                            item={item} 
                            isLast={idx === fullComposition.length - 1} 
                        />
                    ))
                ) : (
                    <div className="p-10 text-center text-slate-400 italic text-sm">No data available</div>
                )}
            </div>
        </div>

        {/* Ingredients (Directly under the composition table) */}
        {product.ingredients && (
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <div className="h-1 w-6 bg-primary rounded-full"></div>
                    <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">المكونات (Ingredients)</h3>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/30 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium shadow-inner" dir="ltr">
                    {product.ingredients}
                </div>
            </div>
        )}

        {/* Detailed Marketing/Pharmacy Notes */}
        {product.detailedMarkdown && (
            <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm" dir="rtl">
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed ai-response-content prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownRenderer content={product.detailedMarkdown} />
                </div>
            </div>
        )}

        {/* Practical Instructions */}
        <div className="grid grid-cols-1 gap-5">
            {product.preparation && (
                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl p-6 border border-blue-100 dark:border-blue-900/20 shadow-sm transition-transform hover:scale-[1.01]">
                    <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 mb-3 tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        طريقة التحضير
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium" dir="ltr">
                        {product.preparation}
                    </p>
                </div>
            )}
            {product.storage && (
                <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-3xl p-6 border border-orange-100 dark:border-orange-900/20 shadow-sm transition-transform hover:scale-[1.01]">
                    <h3 className="text-xs font-black uppercase text-orange-600 dark:text-orange-400 mb-3 tracking-widest flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        التخزين
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium" dir="ltr">
                        {product.storage}
                    </p>
                </div>
            )}
        </div>

        {/* Footer Manufacturing Info */}
        {product.manufacturer && (
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] mb-2">Manufacture Details</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-500">{product.manufacturer}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default MilkDetail;
