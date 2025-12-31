
import React, { useState, useMemo } from 'react';
import { MilkProduct, TFunction, Language } from '../types';
import MilkCard from './MilkCard';
import MilkDetail from './MilkDetail';
import SearchIcon from './icons/SearchIcon';
import ClearIcon from './icons/ClearIcon';
import BabyBottleIcon from './icons/BabyBottleIcon';
import MilkComparisonModal from './MilkComparisonModal';

interface MilkViewProps {
  milkProducts: MilkProduct[];
  t: TFunction;
  language: Language;
}

const MilkView: React.FC<MilkViewProps> = ({ milkProducts, t, language }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMilk, setSelectedMilk] = useState<MilkProduct | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>(''); 
  
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const brands = useMemo(() => {
      const b = new Set(milkProducts.map(p => p.brand));
      return Array.from(b).sort();
  }, [milkProducts]);

  const filteredProducts = useMemo(() => {
    if (!selectedBrand && !searchTerm) return [];

    return milkProducts.filter(product => {
      if (selectedBrand && selectedBrand !== 'All' && product.brand !== selectedBrand) {
          return false;
      }
      if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          const name = (product.productName || '').toLowerCase();
          const brand = (product.brand || '').toLowerCase();
          const features = (product.keyFeatures || '').toLowerCase();
          return name.includes(lowerSearch) || brand.includes(lowerSearch) || features.includes(lowerSearch);
      }
      return true;
    });
  }, [milkProducts, searchTerm, selectedBrand]);

  const toggleCompare = (e: React.MouseEvent, productId: string) => {
      e.stopPropagation();
      setSelectedForCompare(prev => {
          if (prev.includes(productId)) {
              return prev.filter(id => id !== productId);
          }
          if (prev.length >= 2) {
              return [prev[1], productId]; 
          }
          return [...prev, productId];
      });
  };

  const clearCompare = () => setSelectedForCompare([]);

  const compareProductsData = useMemo(() => {
      return milkProducts.filter(p => selectedForCompare.includes(p.id));
  }, [milkProducts, selectedForCompare]);

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
    <div className="animate-fade-in pb-32 relative min-h-full">
      {/* Condensed & Stylish Search Header */}
      <div className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-md pt-3 pb-3 shadow-sm border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20">
        <div className="px-4 mb-2 flex justify-between items-center">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('navMilk')}</h2>
            <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{milkProducts.length} formulas</span>
            </div>
        </div>

        <div className="px-4">
            <div className="grid grid-cols-12 gap-2">
                {/* Brand Selector - Slimmed down */}
                <div className="col-span-5 relative">
                    <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="w-full h-10 px-3 bg-slate-100 dark:bg-slate-800 border border-transparent dark:text-slate-100 rounded-xl font-bold text-[11px] focus:border-primary/50 focus:bg-white dark:focus:bg-slate-700 outline-none appearance-none cursor-pointer transition-all"
                    >
                        <option value="">Brand...</option>
                        <option value="All">{t('all')}</option>
                        {brands.map(brand => (
                            <option key={brand} value={brand}>{brand}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>

                {/* Search Input - Compact version */}
                <div className="col-span-7 relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('search').replace(':', '') + '...'}
                        className="w-full h-10 pl-8 pr-8 rtl:pr-8 rtl:pl-2 bg-slate-100 dark:bg-slate-800 border border-transparent dark:text-slate-100 rounded-xl font-bold text-[11px] focus:border-primary/50 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all"
                    />
                    <div className="absolute top-1/2 ltr:left-3 rtl:right-3 transform -translate-y-1/2 text-slate-400 pointer-events-none h-4 w-4">
                        <SearchIcon />
                    </div>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute top-1/2 ltr:right-2 rtl:left-2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                        >
                            <ClearIcon />
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>

      <div className="space-y-4 mt-4 px-4">
        {filteredProducts.length > 0 ? (
            <div className="flex flex-col gap-4">
                {filteredProducts.map(product => {
                    const isSelected = selectedForCompare.includes(product.id);
                    const isSecondSelection = selectedForCompare.length === 2 && selectedForCompare[1] === product.id;

                    return (
                        <MilkCard 
                            key={product.id} 
                            product={product} 
                            t={t} 
                            onClick={() => setSelectedMilk(product)}
                            isSelected={isSelected}
                            onToggleSelect={(e) => toggleCompare(e, product.id)}
                            isSecondSelection={isSecondSelection}
                            onRunComparison={() => setIsCompareModalOpen(true)}
                        />
                    );
                })}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-60">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 text-slate-200 dark:text-slate-700 shadow-inner">
                    <div className="w-10 h-10"><BabyBottleIcon /></div>
                </div>
                <p className="text-slate-400 dark:text-slate-500 font-black text-lg text-center uppercase tracking-tighter">
                    {!selectedBrand && !searchTerm ? "Select to Explore" : t('noResultsTitle')}
                </p>
            </div>
        )}
      </div>

      {/* Comparison Floating Bar */}
      {selectedForCompare.length > 0 && (
          <div className="fixed bottom-[100px] left-4 right-4 z-40 animate-fade-in pointer-events-none">
              <div className="bg-slate-900/95 backdrop-blur-2xl dark:bg-slate-800/95 text-white rounded-[2rem] shadow-2xl p-3 flex justify-between items-center ring-1 ring-white/10 pointer-events-auto">
                  <div className="flex items-center gap-3 ml-2">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center font-black shadow-lg shadow-primary/20">
                            {selectedForCompare.length}
                        </div>
                        {selectedForCompare.length === 1 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />}
                      </div>
                      <div>
                          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider leading-none mb-1">{t('compareSelected', {count: selectedForCompare.length})}</span>
                          <span className="text-xs font-bold">{selectedForCompare.length === 2 ? "Ready!" : "Select 1 more"}</span>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button 
                        onClick={clearCompare}
                        className="px-3 py-2 text-[10px] font-black text-slate-400 hover:text-white transition-colors uppercase"
                      >
                          {t('clearSelection')}
                      </button>
                      <button 
                        onClick={() => setIsCompareModalOpen(true)}
                        disabled={selectedForCompare.length < 2}
                        className="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-[11px] font-black rounded-xl shadow-lg shadow-primary/20 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-2"
                      >
                          {t('compare')}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </button>
                  </div>
              </div>
          </div>
      )}

      <MilkComparisonModal 
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        products={compareProductsData}
        t={t}
      />
    </div>
  );
};

export default MilkView;
