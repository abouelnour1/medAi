import React from 'react';
import { TFunction } from '../types';
import FilterIcon from './icons/FilterIcon';

interface FilterButtonProps {
  onClick: () => void;
  activeCount: number;
  t: TFunction;
}

const FilterButton: React.FC<FilterButtonProps> = ({ onClick, activeCount, t }) => {
  const hasActiveFilters = activeCount > 0;
  return (
    <button
      onClick={onClick}
      className={`h-9 flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors
        ${hasActiveFilters
          ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light font-semibold'
          : 'bg-slate-100 dark:bg-slate-800 text-light-text-secondary dark:text-dark-text-secondary hover:bg-slate-200 dark:hover:bg-slate-700'
        }
      `}
    >
      <FilterIcon />
      <span className="font-medium">{t('filters')}</span>
      {hasActiveFilters && (
        <span className="bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {activeCount}
        </span>
      )}
    </button>
  );
};

export default FilterButton;