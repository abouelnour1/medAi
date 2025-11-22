
import React from 'react';
import { Filters, ProductTypeFilter, TFunction } from '../types';
import SearchableDropdown from './SearchableDropdown';
import ClearIcon from './icons/ClearIcon';

// Icons from SearchBar
const FormIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 3h5"/><path d="M9.5 21h5"/><path d="M14 3v2a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V3"/><path d="M14 21v-2a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2"/><line x1="9" x2="15" y1="12" y2="12"/></svg>;
const FactoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20"/><path d="M20 13.29V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="m14 13.29 6 3.42V22"/><path d="M18 16.71v.01"/><path d="M12 13.29V22"/><path d="m6 13.29 6 3.42"/><path d="M10 9.71v.01"/><path d="M14 9.71v.01"/><path d="M10 16.71v.01"/></svg>;
const ScaleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.432 0l6.568-6.568a2.426 2.426 0 0 0 0-3.432L12.586 2.586Z"/><path d="M8 8h.01"/></svg>;
const MoneyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;

const FilterItem: React.FC<{icon: React.ReactNode, label: string, children: React.ReactNode}> = ({ icon, label, children }) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary">
        {icon}
        <span>{label}</span>
      </label>
      {children}
    </div>
);


interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: Filters;
    onFilterChange: <K extends keyof Filters>(filterName: K, value: Filters[K]) => void;
    onClearFilters: () => void;
    groupedPharmaceuticalForms: { label: string; options: string[] }[];
    uniqueManufactureNames: string[];
    uniqueLegalStatuses: string[];
    t: TFunction;
}

const FilterModal: React.FC<FilterModalProps> = ({
    isOpen,
    onClose,
    filters,
    onFilterChange,
    onClearFilters,
    groupedPharmaceuticalForms,
    uniqueManufactureNames,
    uniqueLegalStatuses,
    t
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden m-4 max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <h2 className="text-lg font-bold text-light-text dark:text-dark-text">{t('filters')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-light-text-secondary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><ClearIcon/></button>
                </header>

                {/* Body */}
                <div className="flex-grow p-3 space-y-3 overflow-y-auto">
                    {/* Pharmaceutical Form Filter Removed */}

                    <FilterItem icon={<FactoryIcon />} label={t('filterByManufacturer')}>
                      <SearchableDropdown
                        ariaLabel={t('filterByManufacturer')}
                        value={filters.manufactureName}
                        onChange={(value) => onFilterChange('manufactureName', Array.isArray(value) ? value : [])}
                        options={uniqueManufactureNames}
                        placeholder={t('allManufacturers')}
                        t={t}
                        mode="multi"
                      />
                    </FilterItem>
                    
                    <FilterItem icon={<ScaleIcon />} label={t('filterByLegalStatus')}>
                      <SearchableDropdown
                        ariaLabel={t('filterByLegalStatus')}
                        value={filters.legalStatus}
                        onChange={(value) => onFilterChange('legalStatus', Array.isArray(value) ? '' : value)}
                        options={uniqueLegalStatuses}
                        placeholder={t('allLegalStatuses')}
                        t={t}
                      />
                    </FilterItem>

                    <FilterItem icon={<TagIcon />} label={t('filterByProductType')}>
                      <select
                        id="product-type-filter"
                        value={filters.productType}
                        onChange={(e) => onFilterChange('productType', e.target.value as ProductTypeFilter)}
                        className="w-full h-[42px] px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-colors"
                      >
                        <option value="all">{t('allProductTypes')}</option>
                        <option value="medicine">{t('medicines')}</option>
                        <option value="supplement">{t('supplements')}</option>
                      </select>
                    </FilterItem>

                    <FilterItem icon={<MoneyIcon />} label={t('priceRange')}>
                      <div className="flex gap-2">
                        <input
                          id="price-min"
                          type="number"
                          value={filters.priceMin}
                          onChange={(e) => onFilterChange('priceMin', e.target.value)}
                          placeholder={t('priceFrom')}
                          className="w-full h-[42px] px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-colors"
                          min="0"
                        />
                        <input
                          id="price-max"
                          type="number"
                          value={filters.priceMax}
                          onChange={(e) => onFilterChange('priceMax', e.target.value)}
                          placeholder={t('priceTo')}
                          className="w-full h-[42px] px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-colors"
                          min="0"
                        />
                      </div>
                    </FilterItem>
                </div>

                {/* Footer */}
                <footer className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <button
                        onClick={onClearFilters}
                        className="px-4 py-2 text-sm font-semibold rounded-lg text-light-text-secondary dark:text-dark-text-secondary hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        {t('resetFilters')}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        {t('showResults')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default FilterModal;
