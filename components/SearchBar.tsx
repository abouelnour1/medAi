

import React from 'react';
import { TFunction, TextSearchMode } from '../types';
import SearchIcon from './icons/SearchIcon';
import ClearIcon from './icons/ClearIcon';
import BarcodeIcon from './icons/BarcodeIcon';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  textSearchMode: TextSearchMode;
  setTextSearchMode: (mode: TextSearchMode) => void;
  isSearchActive: boolean;
  onClearSearch: () => void;
  onForceSearch: () => void;
  onBarcodeScanClick: () => void;
  t: TFunction;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, 
  setSearchTerm,
  textSearchMode,
  setTextSearchMode,
  isSearchActive,
  onClearSearch,
  onForceSearch,
  onBarcodeScanClick,
  t,
}) => {

  return (
    <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-sm animate-fade-in transition-all duration-300 p-3 space-y-3">
      {/* Primary Text Search */}
      <div className="relative">
        <label htmlFor="search-term" className="sr-only">
          {t('search')}
        </label>
         <div className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary pointer-events-none h-4 w-4">
             <SearchIcon />
         </div>
        <input
          id="search-term"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onForceSearch();
            }
          }}
          placeholder={t('searchPlaceholder')}
          className={`w-full bg-transparent py-2 text-base pl-9 pr-16 border-b-2 border-gray-200 dark:border-slate-700 focus:border-primary dark:focus:border-primary outline-none transition-colors`}
          aria-label="Search term"
        />
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 flex items-center">
          {isSearchActive && (
             <button
              onClick={onClearSearch}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-dark-text-secondary dark:hover:text-dark-text rounded-full"
              aria-label={t('clearSearch')}
            >
              <ClearIcon />
            </button>
          )}
          <div className="h-5 w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>
          <button
            type="button"
            onClick={onBarcodeScanClick}
            className="p-2 text-gray-500 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary transition-colors rounded-full"
            aria-label={t('scanBarcode')}
          >
            <BarcodeIcon />
          </button>
        </div>
      </div>
      {/* Search Mode Toggle */}
       <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 space-x-1 rtl:space-x-reverse">
        <button 
          onClick={() => setTextSearchMode('tradeName')}
          className={`w-full text-center px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-300 ${textSearchMode === 'tradeName' ? 'bg-white dark:bg-dark-card shadow-md text-light-text dark:text-dark-text' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}
        >
          {t('tradeName')}
        </button>
        <button 
          onClick={() => setTextSearchMode('scientificName')}
          className={`w-full text-center px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-300 ${textSearchMode === 'scientificName' ? 'bg-white dark:bg-dark-card shadow-md text-light-text dark:text-dark-text' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}
        >
          {t('scientificName')}
        </button>
      </div>
    </div>
  );
};

export default SearchBar;