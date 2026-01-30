
import React, { useMemo, useRef, useEffect } from 'react';
import { Cosmetic, TFunction, Language } from '../types';
import SearchableDropdown from './SearchableDropdown';
import CosmeticCard from './CosmeticCard';
import SearchIcon from './icons/SearchIcon';
import ClearIcon from './icons/ClearIcon';

interface CosmeticsViewProps {
  cosmetics: Cosmetic[];
  t: TFunction;
  language: Language;
  onSelectCosmetic: (cosmetic: Cosmetic) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  limit?: number;
  onLoadMore?: () => void;
  onCosmeticLongPress?: (cosmetic: Cosmetic) => void;
  onSearchIconClick?: () => void;
}

const CosmeticsView: React.FC<CosmeticsViewProps> = ({ 
    cosmetics, 
    t, 
    language, 
    onSelectCosmetic,
    searchTerm,
    setSearchTerm,
    selectedBrand,
    setSelectedBrand,
    limit = 20,
    onLoadMore,
    onCosmeticLongPress,
    onSearchIconClick
}) => {
  const loaderRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && onLoadMore) {
            onLoadMore();
        }
    }, { threshold: 0.1 });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => { if (loaderRef.current) observer.unobserve(loaderRef.current); }
  }, [onLoadMore]);

  const uniqueBrands = useMemo(() => {
    const brands = new Set(cosmetics.map(c => c.BrandName));
    return Array.from(brands).sort();
  }, [cosmetics]);

  const filteredCosmetics = useMemo(() => {
    let results = cosmetics;

    if (selectedBrand) {
      results = results.filter(c => c.BrandName === selectedBrand);
    }

    const trimmedTerm = searchTerm.trim().toLowerCase();
    const effectiveLength = trimmedTerm.replace(/%/g, '').length;

    if (effectiveLength >= 2) {
      const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = trimmedTerm.split('%').map(escapeRegExp);
      const pattern = parts.join('.*');
      
      let searchRegex: RegExp;
      try {
          searchRegex = new RegExp(pattern, 'i');
      } catch (e) {
          searchRegex = new RegExp(escapeRegExp(trimmedTerm), 'i');
      }

      results = results.filter(c => {
        return searchRegex.test(c.SpecificName) || searchRegex.test(c.SpecificNameAr || '') || searchRegex.test(c.BrandName);
      });
      
      // Sorting: Starts with text first
      results.sort((a, b) => {
        const aVal = String(a.SpecificName).toLowerCase();
        const bVal = String(b.SpecificName).toLowerCase();
        const aStarts = aVal.startsWith(trimmedTerm);
        const bStarts = bVal.startsWith(trimmedTerm);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aVal.localeCompare(bVal);
      });
    }
    
    if (!selectedBrand && effectiveLength < 2) {
        return [];
    }
    
    return results;
  }, [cosmetics, selectedBrand, searchTerm]);
  
  const showResults = (selectedBrand || searchTerm.trim().length >= 2);
  const displayedCosmetics = filteredCosmetics.slice(0, limit);
  const hasMore = filteredCosmetics.length > limit;

  return (
    <div className="animate-fade-in pb-20 relative">
      <div className="bg-light-bg dark:bg-dark-bg mb-4 space-y-3">
        <div>
            <label className="block text-xs font-bold text-light-text-secondary dark:text-dark-text-secondary mb-1 uppercase tracking-wide">
                {t('brandName')}
            </label>
            <SearchableDropdown
                ariaLabel={t('brandName')}
                options={uniqueBrands}
                value={selectedBrand}
                onChange={(value) => setSelectedBrand(Array.isArray(value) ? '' : value)}
                placeholder={t('allBrands')}
                t={t}
            />
        </div>

        <div className="relative">
            <button 
                onClick={onSearchIconClick}
                className="absolute top-1/2 left-3 rtl:right-3 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary h-5 w-5 hover:text-primary transition-colors cursor-pointer z-10"
            >
                <SearchIcon />
            </button>
            <input
            id="cosmetic-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchCosmeticsPlaceholder')}
            className="w-full h-[45px] pl-10 pr-10 rtl:pr-10 rtl:pl-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-pink-500 dark:focus:border-pink-500 rounded-xl outline-none transition-all shadow-sm"
            />
            {searchTerm && (
                <button
                    onClick={() => setSearchTerm('')}
                    className="absolute top-1/2 ltr:right-3 rtl:left-3 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full"
                >
                    <ClearIcon />
                </button>
            )}
        </div>
      </div>

      {showResults ? (
        displayedCosmetics.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
            {displayedCosmetics.map(cosmetic => (
            <CosmeticCard 
                key={cosmetic.id} 
                cosmetic={cosmetic} 
                t={t} 
                language={language}
                onClick={() => onSelectCosmetic(cosmetic)}
                onLongPress={onCosmeticLongPress}
            />
            ))}
            
            {hasMore && (
                <div className="flex flex-col items-center pt-4 pb-8 space-y-3">
                    <div ref={loaderRef} className="h-6 w-full flex justify-center items-center">
                        <div className="w-5 h-5 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
                    </div>
                </div>
            )}
        </div>
        ) : (
        <div className="text-center py-10 px-4 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary">{t('noResultsTitle')}</h3>
        </div>
        )
      ) : null}
    </div>
  );
};

export default CosmeticsView;
