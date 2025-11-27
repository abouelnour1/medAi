
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Cosmetic, TFunction, Language } from '../types';
import SearchableDropdown from './SearchableDropdown';
import CosmeticCard from './CosmeticCard';
import SearchIcon from './icons/SearchIcon';

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
    onLoadMore
}) => {
  const loaderRef = useRef<HTMLDivElement>(null);

  // Lazy Loading Observer
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

    const effectiveLength = searchTerm.replace(/%/g, '').trim().length;

    if (effectiveLength >= 3) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = lowerSearchTerm.split('%').map(escapeRegExp);
      const pattern = parts.join('.*');
      
      let searchRegex: RegExp;
      try {
          searchRegex = new RegExp(pattern, 'i');
      } catch (e) {
          searchRegex = new RegExp(escapeRegExp(lowerSearchTerm), 'i');
      }

      results = results.filter(c => {
        return searchRegex.test(c.SpecificName) || searchRegex.test(c.SpecificNameAr || '');
      });

      results.sort((a, b) => {
          const cleanTerm = lowerSearchTerm.replace(/%/g, '');
          const aName = a.SpecificName.toLowerCase();
          const bName = b.SpecificName.toLowerCase();
          const aStarts = aName.startsWith(cleanTerm);
          const bStarts = bName.startsWith(cleanTerm);

          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.SpecificName.localeCompare(b.SpecificName);
      });
    } else if (searchTerm && effectiveLength < 3 && !selectedBrand) {
        return []; 
    }
    
    return results;
  }, [cosmetics, selectedBrand, searchTerm]);
  
  const showResults = selectedBrand || searchTerm.replace(/%/g, '').trim().length >= 3;
  const displayedCosmetics = filteredCosmetics.slice(0, limit);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
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
        <div>
          <label htmlFor="cosmetic-search" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
            {t('productName')}
          </label>
          <div className="relative">
            <input
              id="cosmetic-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchCosmeticsPlaceholder')}
              className="w-full h-[42px] py-1.5 bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-colors ltr:pl-10 ltr:pr-3 rtl:pr-10 rtl:pl-3"
            />
            <div className="absolute top-1/2 ltr:left-3 rtl:right-3 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary pointer-events-none h-5 w-5">
               <SearchIcon />
            </div>
          </div>
        </div>
      </div>

      {showResults ? (
        displayedCosmetics.length > 0 ? (
          <div className="space-y-3">
            {displayedCosmetics.map(cosmetic => (
              <CosmeticCard 
                key={cosmetic.id} 
                cosmetic={cosmetic} 
                t={t} 
                language={language}
                onClick={() => onSelectCosmetic(cosmetic)}
              />
            ))}
            {filteredCosmetics.length > limit && (
                <div ref={loaderRef} className="py-4 text-center text-sm text-gray-400">{t('loadMore') || 'Loading more...'}</div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 px-4 bg-light-card dark:bg-dark-card rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary">{t('noResultsTitle')}</h3>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('noResultsSubtitle')}</p>
          </div>
        )
      ) : null}
    </div>
  );
};

export default CosmeticsView;
