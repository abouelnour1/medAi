
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
    limit = 2000, 
    onLoadMore,
    onCosmeticLongPress,
    onSearchIconClick
}) => {
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
    
    if (!selectedBrand && trimmedTerm.length < 3) {
        return [];
    }

    if (trimmedTerm && trimmedTerm.length >= 3) {
      // Support advanced wildcard search with *
      if (trimmedTerm.includes('*')) {
          const parts = trimmedTerm.split('*').map(p => p.trim()).filter(Boolean);
          if (parts.length > 0) {
              const regexPattern = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
              const regex = new RegExp(regexPattern, 'i');
              results = results.filter(c => 
                  regex.test(c.SpecificName) || 
                  (c.SpecificNameAr && regex.test(c.SpecificNameAr)) || 
                  regex.test(c.BrandName)
              );
          }
      } else {
          const termParts = trimmedTerm.split(/\s+/).filter(Boolean);
          
          if (termParts.length >= 2) {
              const part1 = termParts[0];
              const part2 = termParts[1];
              results = results.filter(c => {
                  const nameEn = String(c.SpecificName).toLowerCase();
                  const nameAr = String(c.SpecificNameAr || '').toLowerCase();
                  const brand = String(c.BrandName).toLowerCase();
                  
                  const match1 = nameEn.startsWith(part1) || nameAr.startsWith(part1) || brand.startsWith(part1);
                  const match2 = nameEn.includes(part2) || nameAr.includes(part2) || brand.includes(part2);
                  return match1 && match2;
              });
          } else {
              results = results.filter(c => {
                  return c.SpecificName.toLowerCase().includes(trimmedTerm) || 
                         (c.SpecificNameAr && c.SpecificNameAr.toLowerCase().includes(trimmedTerm)) || 
                         c.BrandName.toLowerCase().includes(trimmedTerm);
              });
          }
      }
      
      results.sort((a, b) => {
        const aVal = String(a.SpecificName).toLowerCase();
        const bVal = String(b.SpecificName).toLowerCase();
        const aStarts = aVal.startsWith(trimmedTerm.replace(/\*/g, ''));
        const bStarts = bVal.startsWith(trimmedTerm.replace(/\*/g, ''));

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return aVal.localeCompare(bVal);
      });
    }
    
    return results;
  }, [cosmetics, selectedBrand, searchTerm]);
  
  const showResults = (selectedBrand || searchTerm.trim().length >= 3);
  const displayedCosmetics = filteredCosmetics;

  return (
    <div className="animate-fade-in pb-20 relative">
      <div className="bg-light-bg mb-4 space-y-3">
        <div>
            <label className="block text-xs font-bold text-light-text-secondary mb-1 uppercase tracking-wide">
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
                className="absolute top-1/2 left-3 rtl:right-3 transform -translate-y-1/2 text-gray-400 h-5 w-5 hover:text-primary transition-colors cursor-pointer z-10"
            >
                <SearchIcon />
            </button>
            <input
            id="cosmetic-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchCosmeticsPlaceholder')}
            className="w-full h-[45px] pl-10 pr-10 rtl:pr-10 rtl:pl-3 bg-white border border-slate-200 focus:border-pink-500 rounded-xl outline-none transition-all shadow-sm"
            />
            {searchTerm && (
                <button
                    onClick={() => setSearchTerm('')}
                    className="absolute top-1/2 ltr:right-3 rtl:left-3 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
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
        </div>
        ) : (
        <div className="text-center py-10 px-4 bg-white rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-light-text-secondary">{t('noResultsTitle')}</h3>
        </div>
        )
      ) : null}
    </div>
  );
};

export default CosmeticsView;
