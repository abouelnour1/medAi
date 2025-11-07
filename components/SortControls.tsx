import React from 'react';
import { SortByOption, TFunction } from '../types';

interface SortControlsProps {
  sortBy: SortByOption;
  setSortBy: (sortBy: SortByOption) => void;
  t: TFunction;
}

const SortControls: React.FC<SortControlsProps> = ({ sortBy, setSortBy, t }) => {
  return (
    <div className="flex items-center justify-end">
      <div className="relative">
        <select
          id="sort-by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortByOption)}
          className="h-9 px-3 py-1.5 ltr:pr-8 rtl:pl-8 text-sm bg-gray-100 dark:bg-slate-800 border-2 border-transparent focus:border-primary dark:focus:border-primary rounded-lg outline-none transition-colors appearance-none cursor-pointer"
          aria-label={t('sortBy')}
        >
          <option value="alphabetical">{t('alphabetical')}</option>
          <option value="scientificName">{t('scientificNameSort')}</option>
          <option value="priceAsc">{t('priceAsc')}</option>
          <option value="priceDesc">{t('priceDesc')}</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </div>
      </div>
    </div>
  );
};

export default SortControls;