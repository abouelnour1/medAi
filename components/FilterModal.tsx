
import React, { useState, useEffect } from 'react';
import { Filters, ProductTypeFilter, TFunction } from '../types';
import SearchableDropdown from './SearchableDropdown';
import ClearIcon from './icons/ClearIcon';

// Icons
const FormIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 3h5"/><path d="M9.5 21h5"/><path d="M14 3v2a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V3"/><path d="M14 21v-2a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2"/><line x1="9" x2="15" y1="12" y2="12"/></svg>;
const FactoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20"/><path d="M20 13.29V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="m14 13.29 6 3.42V22"/><path d="M18 16.71v.01"/><path d="M12 13.29V22"/><path d="m6 13.29 6 3.42"/><path d="M10 9.71v.01"/><path d="M14 9.71v.01"/><path d="M10 16.71v.01"/></svg>;
const ScaleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.432 0l6.568-6.568a2.426 2.426 0 0 0 0-3.432L12.586 2.586Z"/><path d="M8 8h.01"/></svg>;
const MoneyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;

const FilterItem: React.FC<{icon: React.ReactNode, label: string, children: React.ReactNode}> = ({ icon, label, children }) => (
    <div className="space-y-2">
      <label className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 tracking-widest">
            {icon}
            <span>{label}</span>
        </div>
      </label>
      {children}
    </div>
);

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: Filters;
    onApply: (newFilters: Filters) => void;
    onClearFilters: () => void;
    groupedPharmaceuticalForms: { label: string; options: string[] }[];
    uniqueManufactureNames: string[];
    uniqueMarketingCompanies: string[];
    uniqueMainAgents: string[];
    uniqueLegalStatuses: string[];
    t: TFunction;
}

const FilterModal: React.FC<FilterModalProps> = ({
    isOpen,
    onClose,
    filters,
    onApply,
    onClearFilters,
    groupedPharmaceuticalForms,
    uniqueManufactureNames,
    uniqueMarketingCompanies,
    uniqueMainAgents,
    uniqueLegalStatuses,
    t
}) => {
    const [localFilters, setLocalFilters] = useState<Filters>(filters);

    useEffect(() => {
        if (isOpen) {
            setLocalFilters(filters);
        }
    }, [isOpen, filters]);

    const handleFilterChange = <K extends keyof Filters>(filterName: K, value: Filters[K]) => {
        setLocalFilters(prev => ({ ...prev, [filterName]: value } as Filters));
    };

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleReset = () => {
        onClearFilters();
        setLocalFilters({ 
            productType: 'all', 
            priceMin: '', 
            priceMax: '', 
            pharmaceuticalForm: '', 
            manufactureName: [], 
            marketingCompany: [], 
            mainAgent: [], 
            legalStatus: '' 
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
            <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <header className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('filters')}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><ClearIcon/></button>
                </header>

                {/* Body */}
                <div className="flex-grow p-6 space-y-6 overflow-y-auto no-scrollbar bg-white dark:bg-dark-card">
                    
                    <FilterItem icon={<TagIcon />} label={t('filterByProductType')}>
                      <select
                        value={localFilters.productType}
                        onChange={(e) => handleFilterChange('productType', e.target.value as ProductTypeFilter)}
                        className="w-full h-11 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-primary rounded-xl outline-none transition-all font-bold text-sm"
                      >
                        <option value="all">{t('allProductTypes')}</option>
                        <option value="medicine">{t('medicines')}</option>
                        <option value="supplement">{t('supplements')}</option>
                      </select>
                    </FilterItem>

                    <FilterItem icon={<FactoryIcon />} label={t('filterByManufacturer')}>
                      <SearchableDropdown
                        ariaLabel={t('filterByManufacturer')}
                        value={localFilters.manufactureName}
                        onChange={(value) => handleFilterChange('manufactureName', Array.isArray(value) ? value : [])}
                        options={uniqueManufactureNames}
                        placeholder={t('allManufacturers')}
                        t={t}
                        mode="multi"
                      />
                    </FilterItem>

                    <FilterItem icon={<FactoryIcon />} label={t('marketingCompany') || 'الشركة المسوقة'}>
                      <SearchableDropdown
                        ariaLabel={t('marketingCompany')}
                        value={localFilters.marketingCompany}
                        onChange={(value) => handleFilterChange('marketingCompany', Array.isArray(value) ? value : [])}
                        options={uniqueMarketingCompanies}
                        placeholder={t('pleaseSelectOrAdd')}
                        t={t}
                        mode="multi"
                      />
                    </FilterItem>

                    <FilterItem icon={<FactoryIcon />} label={t('agents') || 'الوكلاء'}>
                      <SearchableDropdown
                        ariaLabel={t('agents')}
                        value={localFilters.mainAgent}
                        onChange={(value) => handleFilterChange('mainAgent', Array.isArray(value) ? value : [])}
                        options={uniqueMainAgents}
                        placeholder={t('pleaseSelectOrAdd')}
                        t={t}
                        mode="multi"
                      />
                    </FilterItem>

                    <FilterItem icon={<FormIcon />} label={t('pharmaceuticalForm')}>
                       <SearchableDropdown
                        ariaLabel={t('pharmaceuticalForm')}
                        value={localFilters.pharmaceuticalForm}
                        onChange={(value) => handleFilterChange('pharmaceuticalForm', Array.isArray(value) ? '' : value)}
                        options={groupedPharmaceuticalForms}
                        placeholder={t('all')}
                        t={t}
                      />
                    </FilterItem>

                    <FilterItem icon={<ScaleIcon />} label={t('filterByLegalStatus')}>
                      <SearchableDropdown
                        ariaLabel={t('filterByLegalStatus')}
                        value={localFilters.legalStatus}
                        onChange={(value) => handleFilterChange('legalStatus', Array.isArray(value) ? '' : value)}
                        options={uniqueLegalStatuses}
                        placeholder={t('allLegalStatuses')}
                        t={t}
                      />
                    </FilterItem>

                    <FilterItem icon={<MoneyIcon />} label={t('priceRange')}>
                      <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                            type="number"
                            value={localFilters.priceMin}
                            onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                            placeholder={t('priceFrom')}
                            className="w-full h-11 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-primary rounded-xl outline-none transition-all text-sm"
                            min="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Min</span>
                        </div>
                        <div className="flex-1 relative">
                            <input
                            type="number"
                            value={localFilters.priceMax}
                            onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                            placeholder={t('priceTo')}
                            className="w-full h-11 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-primary rounded-xl outline-none transition-all text-sm"
                            min="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Max</span>
                        </div>
                      </div>
                    </FilterItem>
                </div>

                {/* Footer */}
                <footer className="flex items-center justify-between p-5 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                        onClick={handleReset}
                        className="px-5 py-2.5 text-sm font-bold rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                    >
                        {t('resetFilters')}
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-8 py-2.5 bg-primary hover:bg-primary-dark text-white font-black rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        {t('showResults')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default FilterModal;
