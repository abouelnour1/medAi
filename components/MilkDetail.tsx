
import React from 'react';
import { MilkProduct, TFunction, Language } from '../types';
import BabyBottleIcon from './icons/BabyBottleIcon';
import CameraIcon from './icons/CameraIcon';
import BackIcon from './icons/BackIcon';

interface MilkDetailProps {
  product: MilkProduct;
  t: TFunction;
  language: Language;
  onBack: () => void;
}

const MilkDetail: React.FC<MilkDetailProps> = ({ product, t, language, onBack }) => {
  const isStandard = product.type === 'Standard';
  const badgeBg = isStandard ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200';

  const handleImageSearch = () => {
    const query = `${product.name} ${product.stage ? `Stage ${product.stage}` : ''} ${product.specialType || ''} milk formula`;
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="animate-fade-in pb-20 bg-white dark:bg-dark-card min-h-full rounded-none sm:rounded-xl">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-dark-card/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 flex-grow min-w-0">
            <button 
                onClick={onBack}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 text-slate-600 dark:text-slate-300"
            >
                <BackIcon />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate">
                {product.name}
            </h2>
        </div>
        
        {/* Google Image Search Button - ICON ONLY */}
        <button
            onClick={handleImageSearch}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            title="بحث صورة في جوجل"
        >
            <div className="w-5 h-5"><CameraIcon /></div>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Top Info */}
        <div className="flex flex-col items-center text-center space-y-3">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${badgeBg} shadow-inner mb-2 border-4 border-white dark:border-dark-card ring-2 ring-slate-100 dark:ring-slate-800`}>
                {isStandard ? (
                    <span className="text-5xl font-black">{product.stage}</span>
                ) : (
                    <div className="w-12 h-12"><BabyBottleIcon /></div>
                )}
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{product.name}</h1>
            
            <div className="flex flex-wrap justify-center gap-2">
                {!isStandard && product.specialType && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                        {product.specialType}
                    </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {isStandard ? product.ageRange : product.indication}
                </span>
            </div>

            {product.price && (
                <div className="text-xl font-bold text-accent">
                    {product.price} <span className="text-sm font-normal text-slate-500">{t('sar')}</span>
                </div>
            )}
        </div>

        <hr className="border-slate-100 dark:border-slate-800" />

        {/* Detailed Sections */}
        <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    {isStandard ? t('keyFeatures') : t('composition')}
                </h3>
                <p className="text-base leading-relaxed text-slate-800 dark:text-slate-200">
                    {product.features}
                </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    {t('keyDifferences')}
                </h3>
                <p className="text-base leading-relaxed text-slate-800 dark:text-slate-200">
                    {product.differences}
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MilkDetail;
