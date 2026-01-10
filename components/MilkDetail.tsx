
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

const MilkDetail: React.FC<MilkDetailProps> = ({ product, t, language, onBack }) => {
  const handleImageSearch = () => {
    const query = `${product.productName} milk formula`;
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  const FactRow = ({ label, value, unit, isLast = false }: { label: string, value: number, unit: string, isLast?: boolean }) => (
      <div className={`flex justify-between items-center py-3 ${!isLast ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{value} <span className="text-xs font-normal text-slate-400">{unit}</span></span>
      </div>
  );

  // Determine header color based on stage
  let headerBg = "bg-slate-50 dark:bg-slate-800";
  let iconColor = "text-slate-500";
  const lowerStage = product.stageType.toLowerCase();
  if (lowerStage.includes('1') && !lowerStage.includes('year')) { headerBg = "bg-blue-50 dark:bg-blue-900/20"; iconColor = "text-blue-500"; }
  else if (lowerStage.includes('2')) { headerBg = "bg-purple-50 dark:bg-purple-900/20"; iconColor = "text-purple-500"; }
  else if (lowerStage.includes('3') || lowerStage.includes('growing')) { headerBg = "bg-orange-50 dark:bg-orange-900/20"; iconColor = "text-orange-500"; }
  else { headerBg = "bg-teal-50 dark:bg-teal-900/20"; iconColor = "text-teal-500"; }

  const explanation = product.explanation?.type;

  return (
    <div className="animate-fade-in bg-white dark:bg-dark-card min-h-full flex flex-col">
      {/* Navbar Style Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-dark-card/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
        <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
        >
            <BackIcon />
        </button>
        <div className="flex-grow">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{product.productName}</h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{product.brand}</p>
        </div>
        <button
            onClick={handleImageSearch}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 transition-colors"
        >
            <div className="w-5 h-5"><CameraIcon /></div>
        </button>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Identity Card */}
        <div className={`rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-700 ${headerBg}`}>
            <div className={`w-20 h-20 mx-auto rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-4 ${iconColor}`}>
                <div className="w-10 h-10"><BabyBottleIcon /></div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{product.productName}</h2>
            {explanation?.title && (
                <p className="text-lg font-bold text-primary dark:text-primary-light mt-1" dir="rtl">{explanation.title}</p>
            )}
            <div className="flex justify-center gap-2 mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-sm text-slate-700 dark:text-slate-200">
                    {product.stageType}
                </span>
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">{product.ageRange}</p>
        </div>

        {/* Nutritional Facts - The Data Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    {t('composition')}
                </h3>
                <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">per 100ml</span>
            </div>
            <div className="px-4 py-1">
                <FactRow label={t('energy')} value={product.kcal} unit={t('kcal')} />
                <FactRow label={t('protein')} value={product.protein} unit={t('gm')} />
                <FactRow label={t('fat')} value={product.fat} unit={t('gm')} />
                <FactRow label={t('carb')} value={product.carb} unit={t('gm')} isLast />
            </div>
        </div>

        {/* Pharmacist Note / English USP (Always Visible in Details) */}
        <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
                <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 mb-2 tracking-widest">{t('keyFeatures')}</h3>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                    {product.keyFeatures}
                </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">{t('usp')} (Pharmacist Note)</h3>
                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed ai-response-content">
                    <MarkdownRenderer content={product.usp} />
                </div>
            </div>
        </div>

        {/* Pharmacist Explanation (Detailed Arabic/Bilingual) */}
        {explanation && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm" dir="rtl">
                <div className="bg-green-50 dark:bg-green-900/20 px-4 py-3 border-b border-green-100 dark:border-green-800/30">
                    <h3 className="font-bold text-green-800 dark:text-green-300">Detailed View</h3>
                </div>
                <div className="p-4 space-y-4 text-sm">
                    {explanation.description && (
                        <div>
                            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">الوصف:</p>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{explanation.description}</p>
                        </div>
                    )}
                    {explanation.when_to_use && (
                        <div>
                            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">متى يستخدم:</p>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{explanation.when_to_use}</p>
                        </div>
                    )}
                    {explanation.benefits && (
                        <div>
                            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">الفوائد:</p>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{explanation.benefits}</p>
                        </div>
                    )}
                    {explanation.side_effects && (
                        <div>
                            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">الآثار الجانبية / ملاحظات:</p>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{explanation.side_effects}</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MilkDetail;
