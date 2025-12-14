
import React, { useState, useMemo } from 'react';
import { MilkProduct, TFunction, Language } from '../types';
import MilkCard from './MilkCard';
import MilkDetail from './MilkDetail';
import SearchIcon from './icons/SearchIcon';
import ClearIcon from './icons/ClearIcon';
import BabyBottleIcon from './icons/BabyBottleIcon';

interface MilkViewProps {
  milkProducts: MilkProduct[];
  t: TFunction;
  language: Language;
}

const MilkView: React.FC<MilkViewProps> = ({ milkProducts, t, language }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Standard' | 'Special'>('All');
  const [selectedMilk, setSelectedMilk] = useState<MilkProduct | null>(null);

  const filteredProducts = useMemo(() => {
    const results = milkProducts.filter(product => {
      const matchesSearch = 
        searchTerm === '' ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.features.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.indication && product.indication.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.specialType && product.specialType.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilter = filterType === 'All' || product.type === filterType;

      return matchesSearch && matchesFilter;
    });

    return results;
  }, [milkProducts, searchTerm, filterType]);

  // Logic: Show results ONLY if there is a search term.
  const showResults = searchTerm.trim().length > 0;

  // If a milk product is selected, show detail view
  if (selectedMilk) {
      return (
          <MilkDetail 
            product={selectedMilk} 
            t={t} 
            language={language} 
            onBack={() => setSelectedMilk(null)} 
          />
      );
  }

  return (
    <div className="animate-fade-in pb-20 relative min-h-full">
      {/* Sticky Search Header with SOLID Background to prevent see-through */}
      <div className="sticky top-0 z-40 bg-white dark:bg-dark-card pt-2 pb-3 shadow-md border-b border-slate-200 dark:border-slate-800">
        <div className="relative mb-3 px-2">
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchMilkPlaceholder')}
                className="w-full h-[45px] pl-10 pr-10 rtl:pr-10 rtl:pl-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl outline-none transition-all shadow-sm text-base"
            />
            <div className="absolute top-1/2 ltr:left-5 rtl:right-5 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary pointer-events-none h-5 w-5">
                <SearchIcon />
            </div>
            {searchTerm && (
                <button
                    onClick={() => setSearchTerm('')}
                    className="absolute top-1/2 ltr:right-5 rtl:left-5 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full"
                >
                    <ClearIcon />
                </button>
            )}
        </div>

        {/* Improved Filter UI */}
        <div className="px-2">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                {['All', 'Standard', 'Special'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                            filterType === type 
                            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        {type === 'All' ? t('all') : type === 'Standard' ? t('standardFormula') : t('specialFormula')}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="space-y-4 mt-4 px-2">
        {showResults ? (
            filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                    <MilkCard 
                        key={product.id} 
                        product={product} 
                        t={t} 
                        onClick={() => setSelectedMilk(product)}
                    />
                ))
            ) : (
                <div className="text-center py-12 px-4">
                    <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <SearchIcon />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{t('noResultsTitle')}</p>
                </div>
            )
        ) : (
            // Empty State (Initial View - Prompts to Search)
            <div className="flex flex-col items-center justify-center py-24 opacity-70">
                <div className="w-20 h-20 text-slate-300 dark:text-slate-700 mb-4">
                    <BabyBottleIcon />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg text-center px-6">{t('searchMilkPlaceholder')}</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">ابدأ الكتابة للبحث عن أنواع الحليب</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default MilkView;
