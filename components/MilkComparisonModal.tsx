
import React, { useEffect } from 'react';
import { MilkProduct, TFunction } from '../types';
import ClearIcon from './icons/ClearIcon';
import MarkdownRenderer from './MarkdownRenderer';

interface MilkComparisonModalProps {
  products: MilkProduct[];
  isOpen: boolean;
  onClose: () => void;
  t: TFunction;
}

const MilkComparisonModal: React.FC<MilkComparisonModalProps> = ({ products, isOpen, onClose, t }) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Prevent scrolling on the root element as well for mobile safari
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

  if (!isOpen || products.length < 2) return null;

  const [p1, p2] = products;

  const Row = ({ label, val1, val2, highlight = false, unit = '', isHeader = false }: { label: string, val1: any, val2: any, highlight?: boolean, unit?: string, isHeader?: boolean }) => (
      <tr className={`border-b border-slate-100 dark:border-slate-700 ${highlight ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}>
          <td className={`p-3 text-xs text-slate-500 w-1/3 ${isHeader ? 'font-black uppercase tracking-wider' : 'font-semibold'}`}>
              {label}
          </td>
          <td className={`p-3 text-sm text-slate-800 dark:text-slate-200 text-center w-1/3 border-l border-slate-100 dark:border-slate-700 ${isHeader ? 'font-bold' : 'font-medium'}`}>
              {val1} <span className="text-[10px] text-slate-400 font-normal">{unit}</span>
          </td>
          <td className={`p-3 text-sm text-slate-800 dark:text-slate-200 text-center w-1/3 border-l border-slate-100 dark:border-slate-700 ${isHeader ? 'font-bold' : 'font-medium'}`}>
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
        <div className="overflow-y-auto flex-grow bg-white dark:bg-dark-card relative overscroll-contain">
            <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 shadow-md">
                    <tr className="bg-white dark:bg-dark-card">
                        <th className="p-4 w-1/3 bg-slate-50 dark:bg-slate-900 text-left align-bottom pb-4 border-b-2 border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Product Details</span>
                        </th>
                        <th className="p-4 w-1/3 text-center border-l border-slate-100 dark:border-slate-700 align-bottom pb-4 border-b-2 border-blue-500 dark:border-blue-400 bg-blue-50/10 dark:bg-blue-900/10">
                            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">{p1.brand}</div>
                            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">{p1.productName}</div>
                            <div className="mt-2 inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">{p1.stageType.split(' ')[0]}</div>
                        </th>
                        <th className="p-4 w-1/3 text-center border-l border-slate-100 dark:border-slate-700 align-bottom pb-4 border-b-2 border-purple-500 dark:border-purple-400 bg-purple-50/10 dark:bg-purple-900/10">
                            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">{p2.brand}</div>
                            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">{p2.productName}</div>
                            <div className="mt-2 inline-block px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">{p2.stageType.split(' ')[0]}</div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {/* General Section */}
                    <tr className="bg-slate-100 dark:bg-slate-800">
                        <td colSpan={3} className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-y border-slate-200 dark:border-slate-700">
                            General Information
                        </td>
                    </tr>
                    <Row label={t('age')} val1={p1.ageRange} val2={p2.ageRange} />
                    <Row label={t('pharmaceuticalForm')} val1="Powder" val2="Powder" highlight />

                    {/* Nutrition Section */}
                    <tr className="bg-slate-100 dark:bg-slate-800">
                        <td colSpan={3} className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-y border-slate-200 dark:border-slate-700 mt-4">
                            {t('composition')} <span className="font-normal text-[10px] normal-case opacity-70">(per 100ml)</span>
                        </td>
                    </tr>
                    
                    <Row label={t('energy')} val1={p1.kcal} val2={p2.kcal} unit={t('kcal')} />
                    <Row label={t('protein')} val1={p1.protein} val2={p2.protein} unit={t('gm')} highlight />
                    <Row label={t('fat')} val1={p1.fat} val2={p2.fat} unit={t('gm')} />
                    <Row label={t('carb')} val1={p1.carb} val2={p2.carb} unit={t('gm')} highlight />

                    {/* Features Section */}
                    <tr className="bg-slate-100 dark:bg-slate-800">
                        <td colSpan={3} className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-y border-slate-200 dark:border-slate-700 mt-4">
                            Advanced Features & Claims
                        </td>
                    </tr>
                    
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                        <td className="p-3 text-xs font-bold text-slate-500 uppercase w-1/3 align-top pt-4">Key Highlights</td>
                        <td className="p-3 text-xs text-slate-700 dark:text-slate-300 w-1/3 border-l align-top pt-4">
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-2 rounded-lg border border-green-100 dark:border-green-800">
                                {p1.keyFeatures}
                            </div>
                        </td>
                        <td className="p-3 text-xs text-slate-700 dark:text-slate-300 w-1/3 border-l align-top pt-4">
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-2 rounded-lg border border-green-100 dark:border-green-800">
                                {p2.keyFeatures}
                            </div>
                        </td>
                    </tr>

                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                        <td className="p-3 text-xs font-bold text-slate-500 uppercase w-1/3 align-top pt-4">{t('usp')}</td>
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
      </div>
    </div>
  );
};

export default MilkComparisonModal;
