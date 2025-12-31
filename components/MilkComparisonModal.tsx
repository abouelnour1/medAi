import React, { useEffect, useMemo } from 'react';
import { MilkProduct, TFunction } from '../types';
import ClearIcon from './icons/ClearIcon';
import MarkdownRenderer from './MarkdownRenderer';

interface MilkComparisonModalProps {
  products: MilkProduct[];
  isOpen: boolean;
  onClose: () => void;
  t: TFunction;
}

interface CompositionMapItem {
    label: string;
    val1: string;
    val2: string;
}

const MilkComparisonModal: React.FC<MilkComparisonModalProps> = ({ products, isOpen, onClose, t }) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  // Utility to parse composition string into a Map of { Label: Value }
  const parseToMap = (str: string): Map<string, string> => {
    const map = new Map<string, string>();
    if (!str) return map;
    
    // Split by commas not inside parentheses
    const parts = str.split(/,(?![^\(]*\))/);
    parts.forEach(p => {
        const trimmed = p.trim();
        // Regex to separate name from value (value usually starts with number)
        const match = trimmed.match(/^(.*?)\s*(\d.*)$/);
        if (match) {
            const label = match[1].trim().toLowerCase(); // Use lowercase for consistent mapping
            const originalLabel = match[1].trim();
            map.set(label, trimmed.replace(originalLabel, '').trim());
            // Store the original label as metadata if needed, but here we just map
            map.set(`display_${label}`, originalLabel);
        } else {
            map.set(trimmed.toLowerCase(), '');
            map.set(`display_${trimmed.toLowerCase()}`, trimmed);
        }
    });
    return map;
  };

  const detailedComparison = useMemo(() => {
    if (products.length < 2) return [];
    
    const map1 = parseToMap(products[0].concentration || '');
    const map2 = parseToMap(products[1].concentration || '');
    
    // Get unique labels from both maps (excluding display metadata keys)
    const allLabels = Array.from(new Set([
        ...Array.from(map1.keys()).filter(k => !k.startsWith('display_')),
        ...Array.from(map2.keys()).filter(k => !k.startsWith('display_'))
    ])).sort();

    return allLabels.map(labelKey => ({
        label: map1.get(`display_${labelKey}`) || map2.get(`display_${labelKey}`) || labelKey,
        val1: map1.get(labelKey) || '-',
        val2: map2.get(labelKey) || '-'
    }));
  }, [products]);

  if (!isOpen || products.length < 2) return null;

  const [p1, p2] = products;

  // Fix: Explicitly type Row as React.FC to properly handle 'key' prop and avoid TS error in list rendering
  const Row: React.FC<{ label: string, val1: any, val2: any, highlight?: boolean, unit?: string, isHeader?: boolean, isFullWidth?: boolean }> = ({ label, val1, val2, highlight = false, unit = '', isHeader = false, isFullWidth = false }) => (
      <tr className={`border-b border-slate-100 dark:border-slate-700 ${highlight ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}>
          <td className={`p-3 text-xs text-slate-500 w-1/3 ${isHeader ? 'font-black uppercase tracking-wider' : 'font-semibold capitalize'}`}>
              {label}
          </td>
          <td className={`p-3 text-sm text-slate-800 dark:text-slate-200 text-center w-1/3 border-l border-slate-100 dark:border-slate-700 ${isHeader ? 'font-bold' : 'font-black'}`} dir="ltr">
              {val1} <span className="text-[10px] text-slate-400 font-normal">{unit}</span>
          </td>
          <td className={`p-3 text-sm text-slate-800 dark:text-slate-200 text-center w-1/3 border-l border-slate-100 dark:border-slate-700 ${isHeader ? 'font-bold' : 'font-black'}`} dir="ltr">
              {val2} <span className="text-[10px] text-slate-400 font-normal">{unit}</span>
          </td>
      </tr>
  );

  return (
    <div 
        className="fixed top-0 left-0 right-0 bottom-0 z-[9999] bg-black/80 flex items-center justify-center p-2 sm:p-4 animate-fade-in backdrop-blur-sm touch-none" 
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-dark-card w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] h-full sm:h-auto overflow-hidden border border-slate-200 dark:border-slate-700" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 flex-shrink-0">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="bg-primary text-white text-xs px-2 py-1 rounded-md font-black">VS</span> {t('compareTitle')}
            </h3>
            <button onClick={onClose} className="p-2 rounded-full bg-white dark:bg-slate-800 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700 transition-all shadow-sm">
                <ClearIcon />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-grow bg-white dark:bg-dark-card relative overscroll-contain no-scrollbar">
            <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 shadow-sm">
                    <tr className="bg-white dark:bg-dark-card">
                        <th className="p-4 w-1/3 bg-slate-50 dark:bg-slate-900 text-left align-bottom pb-4 border-b-2 border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Components</span>
                        </th>
                        <th className="p-4 w-1/3 text-center border-l border-slate-100 dark:border-slate-700 align-bottom pb-4 border-b-2 border-blue-500 dark:border-blue-400 bg-blue-50/10 dark:bg-blue-900/10">
                            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">{p1.brand}</div>
                            <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight truncate">{p1.productName}</div>
                        </th>
                        <th className="p-4 w-1/3 text-center border-l border-slate-100 dark:border-slate-700 align-bottom pb-4 border-b-2 border-purple-500 dark:border-purple-400 bg-purple-50/10 dark:bg-purple-900/10">
                            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">{p2.brand}</div>
                            <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight truncate">{p2.productName}</div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {/* General Section */}
                    <tr className="bg-slate-100 dark:bg-slate-800/80">
                        <td colSpan={3} className="px-4 py-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-y border-slate-200 dark:border-slate-700">
                            General Info
                        </td>
                    </tr>
                    <Row label={t('age')} val1={p1.ageRange} val2={p2.ageRange} />
                    
                    {/* Nutrition Summary */}
                    <tr className="bg-slate-100 dark:bg-slate-800/80">
                        <td colSpan={3} className="px-4 py-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-y border-slate-200 dark:border-slate-700 mt-4">
                            Core Nutrition <span className="font-normal text-[9px] normal-case opacity-70">(per 100g)</span>
                        </td>
                    </tr>
                    <Row label={t('energy')} val1={p1.kcal} val2={p2.kcal} unit={t('kcal')} highlight />
                    <Row label={t('protein')} val1={p1.protein} val2={p2.protein} unit={t('gm')} />
                    <Row label={t('fat')} val1={p1.fat} val2={p2.fat} unit={t('gm')} highlight />
                    <Row label={t('carb')} val1={p1.carb} val2={p2.carb} unit={t('gm')} />

                    {/* FULL COMPOSITION SECTION - THE NEW PART */}
                    <tr className="bg-slate-100 dark:bg-slate-800/80">
                        <td colSpan={3} className="px-4 py-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-y border-slate-200 dark:border-slate-700 mt-4">
                            Full Composition & Vitamins
                        </td>
                    </tr>
                    
                    {detailedComparison.length > 0 ? (
                        detailedComparison.map((item, idx) => (
                            <Row 
                                key={idx} 
                                label={item.label} 
                                val1={item.val1} 
                                val2={item.val2} 
                                highlight={idx % 2 === 0}
                            />
                        ))
                    ) : (
                        <tr>
                            <td colSpan={3} className="p-10 text-center text-slate-400 italic text-sm">No detailed composition data available for side-by-side comparison.</td>
                        </tr>
                    )}

                    {/* Marketing & Features */}
                    <tr className="bg-slate-100 dark:bg-slate-800/80">
                        <td colSpan={3} className="px-4 py-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-y border-slate-200 dark:border-slate-700 mt-4">
                            Key Features & Claims
                        </td>
                    </tr>
                    
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                        <td className="p-3 text-xs font-bold text-slate-500 uppercase w-1/3 align-top pt-4">Highlights</td>
                        <td className="p-3 text-xs text-slate-700 dark:text-slate-300 w-1/3 border-l align-top pt-4">
                            <div className="bg-blue-50/50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-2 rounded-lg border border-blue-100/50 dark:border-blue-800">
                                {p1.keyFeatures}
                            </div>
                        </td>
                        <td className="p-3 text-xs text-slate-700 dark:text-slate-300 w-1/3 border-l align-top pt-4">
                            <div className="bg-purple-50/50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 p-2 rounded-lg border border-purple-100/50 dark:border-purple-800">
                                {p2.keyFeatures}
                            </div>
                        </td>
                    </tr>

                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20">
                        <td className="p-3 text-xs font-bold text-slate-500 uppercase w-1/3 align-top pt-4">Expert Note</td>
                        <td className="p-3 text-xs text-slate-600 dark:text-slate-400 w-1/3 border-l align-top ai-response-content">
                            <MarkdownRenderer content={p1.usp} />
                        </td>
                        <td className="p-3 text-xs text-slate-600 dark:text-slate-400 w-1/3 border-l align-top ai-response-content">
                            <MarkdownRenderer content={p2.usp} />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Values based on standard 100g powder measurements</p>
        </div>
      </div>
    </div>
  );
};

export default MilkComparisonModal;