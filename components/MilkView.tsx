
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

const FilterChip = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap
            ${isActive 
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md transform scale-105' 
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
    >
        {label}
    </button>
);

const MilkView: React.FC<MilkViewProps> = ({ milkProducts, t, language }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMilk, setSelectedMilk] = useState<MilkProduct | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | '1' | '2' | '3' | 'special'>('all');
  
  // Comparison State
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(milkProducts)) return [];

    return milkProducts.filter(product => {
      // 1. Text Search
      const lowerSearch = searchTerm.toLowerCase();
      const name = (product.productName || '').toLowerCase();
      const brand = (product.brand || '').toLowerCase();
      const features = (product.keyFeatures || '').toLowerCase();
      
      const matchesSearch = searchTerm === '' ||
        name.includes(lowerSearch) ||
        brand.includes(lowerSearch) ||
        features.includes(lowerSearch);

      if (!matchesSearch) return false;

      // 2. Stage Filter Logic
      const lowerStage = (product.stageType || '').toLowerCase();
      if (activeFilter === 'all') return true;
      
      if (activeFilter === '1') {
          return lowerStage.includes('1') && !lowerStage.includes('year') && !lowerStage.includes('ar') && !lowerStage.includes('ac') && !lowerStage.includes('comfort');
      }
      if (activeFilter === '2') {
          return lowerStage.includes('2') && !lowerStage.includes('ar') && !lowerStage.includes('ac');
      }
      if (activeFilter === '3') {
          return lowerStage.includes('3') || lowerStage.includes('growing') || lowerStage.includes('year');
      }
      if (activeFilter === 'special') {
          // Catch-all for specialized formulas
          return lowerStage.includes('ar') || lowerStage.includes('ac') || lowerStage.includes('comfort') || lowerStage.includes('lf') || lowerStage.includes('pre') || lowerStage.includes('post') || lowerStage.includes('it') || lowerStage.includes('ha');
      }

      return true;
    });
  }, [milkProducts, searchTerm, activeFilter]);

  const toggleCompare = (e: React.MouseEvent, productId: string) => {
      e.stopPropagation();
      setSelectedForCompare(prev => {
          if (prev.includes(productId)) {
              return prev.filter(id => id !== productId);
          }
          if (prev.length >= 2) {
              return [prev[1], productId]; // Keep selected count at 2 max by shifting
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
      <div className="bg-white dark:bg-dark-card pt-2 pb-1 shadow-sm border-b border-slate-100 dark:border-slate-800">
        {/* Search Bar */}
        <div className="relative px-4 mb-3">
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchMilkPlaceholder')}
                className="w-full h-[45px] pl-10 pr-10 rtl:pr-10 rtl:pl-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 rounded-xl outline-none transition-all text-base"
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

        {/* Filter Chips - Clean Look */}
        <div className="px-4 pb-3 overflow-x-auto no-scrollbar flex gap-2">
            <FilterChip label={t('all')} isActive={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
            <FilterChip label={t('stage1')} isActive={activeFilter === '1'} onClick={() => setActiveFilter('1')} />
            <FilterChip label={t('stage2')} isActive={activeFilter === '2'} onClick={() => setActiveFilter('2')} />
            <FilterChip label={t('stage3')} isActive={activeFilter === '3'} onClick={() => setActiveFilter('3')} />
            <FilterChip label={t('special')} isActive={activeFilter === 'special'} onClick={() => setActiveFilter('special')} />
        </div>
      </div>

      <div className="space-y-3 mt-4 px-3">
        {filteredProducts.length > 0 ? (
            <div className="flex flex-col gap-3">
                {filteredProducts.map(product => (
                    <MilkCard 
                        key={product.id} 
                        product={product} 
                        t={t} 
                        onClick={() => setSelectedMilk(product)}
                        isSelected={selectedForCompare.includes(product.id)}
                        onToggleSelect={(e) => toggleCompare(e, product.id)}
                    />
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-60">
                <div className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4">
                    <BabyBottleIcon />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-center">{t('noResultsTitle')}</p>
                <button onClick={() => {setSearchTerm(''); setActiveFilter('all');}} className="mt-4 text-primary font-bold text-sm">
                    {t('resetFilters')}
                </button>
            </div>
        )}
      </div>

      {/* Comparison Floating Bar */}
      {selectedForCompare.length > 0 && (
          <div className="fixed bottom-[85px] left-4 right-4 z-40 animate-slide-up">
              <div className="bg-slate-900/95 backdrop-blur-md dark:bg-slate-700/95 text-white rounded-2xl shadow-2xl p-3 flex justify-between items-center ring-1 ring-white/10">
                  <div className="pl-2">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{t('compareSelected', {count: selectedForCompare.length})}</span>
                      <span className="text-sm font-bold">Select 2 to Compare</span>
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
