
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
  const [selectedBrand, setSelectedBrand] = useState<string>(''); // Default is empty to hide results
  
  // Comparison State
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Extract unique brands
  const brands = useMemo(() => {
      const b = new Set(milkProducts.map(p => p.brand));
      return Array.from(b).sort();
  }, [milkProducts]);

  const filteredProducts = useMemo(() => {
    // Logic: Show nothing if no brand selected AND no search term
    if (!selectedBrand && !searchTerm) return [];

    return milkProducts.filter(product => {
      // 1. Brand Filter
      if (selectedBrand && selectedBrand !== 'All' && product.brand !== selectedBrand) {
          return false;
      }

      // 2. Text Search
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
              // Shift: remove first, add new one to become the second
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
    <div className="animate-fade-in pb-24 relative min-h-full">
      {/* Header Container */}
      <div className="bg-white dark:bg-dark-card pt-4 pb-4 shadow-sm border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20">
        
        {/* Brand Dropdown (List) */}
        <div className="px-4 mb-3">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Select Company / Filter
            </label>
            <div className="relative">
                <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:border-primary focus:outline-none appearance-none cursor-pointer"
                >
                    <option value="">Select a Brand...</option>
                    <option value="All">{t('all')}</option>
                    {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
        </div>

        {/* Search Bar */}
        <div className="relative px-4">
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchMilkPlaceholder')}
                className="w-full h-[45px] pl-10 pr-10 rtl:pr-10 rtl:pl-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary dark:focus:border-primary rounded-xl outline-none transition-all text-base"
            />
            <div className="absolute top-1/2 ltr:left-7 rtl:right-7 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary pointer-events-none h-5 w-5">
                <SearchIcon />
            </div>
            {searchTerm && (
                <button
                    onClick={() => setSearchTerm('')}
                    className="absolute top-1/2 ltr:right-6 rtl:left-6 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full"
                >
                    <ClearIcon />
                </button>
            )}
        </div>
      </div>

      <div className="space-y-3 mt-4 px-3">
        {filteredProducts.length > 0 ? (
            <div className="flex flex-col gap-3">
                {filteredProducts.map(product => {
                    const isSelected = selectedForCompare.includes(product.id);
                    // Check if this product is the SECOND item in the selection list
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
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                    <BabyBottleIcon />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-lg text-center">
                    {!selectedBrand && !searchTerm ? "Select a Company to start" : t('noResultsTitle')}
                </p>
                <p className="text-xs text-slate-400 text-center max-w-[200px] mt-1">
                    {!selectedBrand && !searchTerm ? "Choose from the dropdown list above or search by name" : ""}
                </p>
            </div>
        )}
      </div>

      {/* Comparison Floating Bar (Backup) - Only shows if 2 selected but user hasn't clicked Compare on card yet */}
      {selectedForCompare.length > 0 && (
          <div className="fixed bottom-[85px] left-4 right-4 z-40 animate-slide-up pointer-events-none">
              <div className="bg-slate-900/95 backdrop-blur-md dark:bg-slate-700/95 text-white rounded-2xl shadow-2xl p-3 flex justify-between items-center ring-1 ring-white/10 pointer-events-auto">
                  <div className="pl-2">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{t('compareSelected', {count: selectedForCompare.length})}</span>
                      <span className="text-sm font-bold">{selectedForCompare.length === 2 ? "Ready to Compare" : "Select 2 to Compare"}</span>
                  </div>
                  <div className="flex gap-2">
                      <button 
                        onClick={clearCompare}
                        className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                      >
                          {t('clearSelection')}
                      </button>
                      <button 
                        onClick={() => setIsCompareModalOpen(true)}
                        disabled={selectedForCompare.length < 2}
                        className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                      >
                          {t('compare')}
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
