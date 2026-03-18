
import React, { useState, useEffect, useMemo } from 'react';
import { Filters, ProductTypeFilter, TFunction, Medicine } from '../types';
import SearchableDropdown from './SearchableDropdown';
import { groupPharmaceuticalForms } from '../utils/formHelpers';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: Filters;
    onApply: (newFilters: Filters) => void;
    onClearFilters: () => void;
    allMedicines: Medicine[];
    t: TFunction;
    headerBottom?: number;
    isAdmin?: boolean;
}

// Collapsible Section
const Section: React.FC<{
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  activeCount?: number;
  children: React.ReactNode;
}> = ({ title, icon, isOpen, onToggle, activeCount, children }) => (
  <div className={`rounded-2xl transition-all duration-200 ${isOpen ? 'bg-slate-50 dark:bg-slate-800/60' : 'bg-transparent'}`}>
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3.5 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center gap-3">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{title}</span>
        {activeCount ? (
          <span className="bg-teal-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {activeCount}
          </span>
        ) : null}
      </div>
      <svg
        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {isOpen && (
      <div className="px-4 pb-4">
        {children}
      </div>
    )}
  </div>
);

// Product Type Chips
const TypeChips: React.FC<{
  value: ProductTypeFilter;
  onChange: (v: ProductTypeFilter) => void;
  t: TFunction;
  isAdmin?: boolean;
}> = ({ value, onChange, t, isAdmin = false }) => {
  const options: { key: ProductTypeFilter; label: string; emoji: string }[] = [
    ...(isAdmin ? [{ key: 'all' as ProductTypeFilter, label: t('allProductTypes'), emoji: '🔍' }] : []),
    { key: 'medicine',   label: t('medicines'),       emoji: '💊' },
    ...(isAdmin ? [{ key: 'supplement' as ProductTypeFilter, label: t('supplements'), emoji: '🌿' }] : []),
    ...(isAdmin ? [{ key: 'food' as ProductTypeFilter,       label: t('food'),        emoji: '🥗' }] : []),
  ];
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${
            value === o.key
              ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25'
              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
          }`}
        >
          <span>{o.emoji}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
};

const FilterModal: React.FC<FilterModalProps> = ({
    isOpen, onClose, filters, onApply, onClearFilters, allMedicines, t, headerBottom = 80, isAdmin = false
}) => {
    const [localFilters, setLocalFilters] = useState<Filters>(filters);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
      type: true, form: false, manufacturer: false, marketing: false, agent: false, price: false, legal: false
    });
    const dragY = React.useRef(0);
    const dragging = React.useRef(false);
    const sheetRef = React.useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
      dragY.current = e.touches[0].clientY;
      dragging.current = true;
    };
    const handleTouchMove = (e: React.TouchEvent) => {
      if (!dragging.current || !sheetRef.current) return;
      const dy = e.touches[0].clientY - dragY.current;
      if (dy > 0) sheetRef.current.style.transform = `translateY(${dy}px)`;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
      if (!dragging.current || !sheetRef.current) return;
      dragging.current = false;
      const dy = e.changedTouches[0].clientY - dragY.current;
      if (dy > 80) {
        sheetRef.current.style.transition = 'transform 0.25s ease';
        sheetRef.current.style.transform = 'translateY(100%)';
        setTimeout(onClose, 250);
      } else {
        sheetRef.current.style.transition = 'transform 0.2s ease';
        sheetRef.current.style.transform = 'translateY(0)';
        setTimeout(() => { if (sheetRef.current) sheetRef.current.style.transition = ''; }, 200);
      }
    };

    useEffect(() => {
        if (isOpen) setLocalFilters(filters);
    }, [isOpen, filters]);

    const getFilteredList = (medicines: Medicine[], currentFilters: Filters, excludeKey?: keyof Filters) => {
        return medicines.filter(m => {
            if (excludeKey !== 'productType' && currentFilters.productType !== 'all') {
                const type = currentFilters.productType === 'medicine' ? 'Human' : currentFilters.productType === 'supplement' ? 'Supplement' : 'Food';
                if (m['Product type'] !== type) return false;
            }
            const price = parseFloat(m['Public price']) || 0;
            if (currentFilters.priceMin && price < parseFloat(currentFilters.priceMin)) return false;
            if (currentFilters.priceMax && price > parseFloat(currentFilters.priceMax)) return false;
            if (excludeKey !== 'pharmaceuticalForm' && currentFilters.pharmaceuticalForm && (Array.isArray(currentFilters.pharmaceuticalForm) ? currentFilters.pharmaceuticalForm.length > 0 && !currentFilters.pharmaceuticalForm.includes(m.PharmaceuticalForm) : m.PharmaceuticalForm !== currentFilters.pharmaceuticalForm)) return false;
            if (excludeKey !== 'legalStatus' && currentFilters.legalStatus) {
              const raw = (m['Legal Status'] || '').toLowerCase();
              const isOTC = raw.includes('otc') || raw.includes('over') || raw.includes('بدون');
              const normalized = isOTC ? 'OTC' : 'Prescription';
              if (normalized !== currentFilters.legalStatus) return false;
            }
            if (excludeKey !== 'manufactureName' && currentFilters.manufactureName.length > 0 && !currentFilters.manufactureName.includes(m['Manufacture Name'])) return false;
            if (excludeKey !== 'marketingCompany' && currentFilters.marketingCompany.length > 0 && !currentFilters.marketingCompany.includes(m['Marketing Company'])) return false;
            if (excludeKey !== 'mainAgent' && currentFilters.mainAgent.length > 0 && !currentFilters.mainAgent.includes(m['Main Agent'])) return false;
            return true;
        });
    };

    const dynamicOptions = useMemo(() => {
        const getUnique = (list: Medicine[], key: keyof Medicine) =>
            Array.from(new Set(list.map(m => String(m[key] || '')).filter(Boolean))).sort();
        return {
            manufacturers:      getUnique(getFilteredList(allMedicines, localFilters, 'manufactureName'),  'Manufacture Name'),
            marketingCompanies: getUnique(getFilteredList(allMedicines, localFilters, 'marketingCompany'), 'Marketing Company'),
            agents:             getUnique(getFilteredList(allMedicines, localFilters, 'mainAgent'),        'Main Agent'),
            forms:              groupPharmaceuticalForms(getUnique(getFilteredList(allMedicines, localFilters, 'pharmaceuticalForm'), 'PharmaceuticalForm'), t),
            legalStatuses: (() => {
              const raw = getUnique(getFilteredList(allMedicines, localFilters, 'legalStatus'), 'Legal Status');
              // نجمّع كل الحالات في OTC أو Prescription بس
              const normalized = new Set<string>();
              raw.forEach(s => {
                const lower = (s || '').toLowerCase();
                if (lower.includes('otc') || lower.includes('over') || lower.includes('بدون')) {
                  normalized.add('OTC');
                } else {
                  normalized.add('Prescription');
                }
              });
              return Array.from(normalized).sort();
            })(),
        };
    }, [allMedicines, localFilters, t]);

    const expectedCount = useMemo(() => getFilteredList(allMedicines, localFilters).length, [allMedicines, localFilters]);

    const handleFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) =>
        setLocalFilters(prev => ({ ...prev, [key]: value } as Filters));

    const handleApply = () => { onApply(localFilters); onClose(); };

    const handleReset = () => {
        const empty: Filters = { productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: [], manufactureName: [], marketingCompany: [], mainAgent: [], legalStatus: '' };
        onClearFilters();
        setLocalFilters(empty);
    };

    const toggleSection = (key: string) =>
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

    // Count active filters per section
    const activeCounts = {
      type:         localFilters.productType !== 'all' ? 1 : 0,
      form:         Array.isArray(localFilters.pharmaceuticalForm) ? localFilters.pharmaceuticalForm.length : localFilters.pharmaceuticalForm ? 1 : 0,
      manufacturer: localFilters.manufactureName.length,
      marketing:    localFilters.marketingCompany.length,
      agent:        localFilters.mainAgent.length,
      price:        (localFilters.priceMin || localFilters.priceMax) ? 1 : 0,
      legal:        localFilters.legalStatus ? 1 : 0,
    };
    const totalActive = Object.values(activeCounts).reduce((a, b) => a + b, 0);

    if (!isOpen) return null;

    return (
        <div
          className="fixed inset-0 z-[500] flex items-end justify-center"
          onClick={onClose}
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
            <div
              ref={sheetRef}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2rem] flex flex-col overflow-hidden"
              style={{ maxHeight: '85vh', marginBottom: 'env(safe-area-inset-bottom)', animation: 'slideUp 0.28s cubic-bezier(0.22,1,0.36,1)' }}
              onClick={e => e.stopPropagation()}
            >
              <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

              {/* Handle — drag to close */}
              <div
                className="flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-base font-black text-slate-800 dark:text-white">{t('filters')}</span>
                    {totalActive > 0 && (
                      <span className="ml-2 text-[10px] font-black text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">
                        {totalActive} active
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && <span className="text-xs font-bold text-slate-400">{expectedCount} results</span>}
                  <button onClick={onClose} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-transform">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100 dark:bg-slate-800 mx-5 flex-shrink-0" />

              {/* Sections */}
              <div className="flex-grow overflow-y-auto no-scrollbar px-4 py-3 space-y-1.5" style={{ overflowX: 'visible' }}>

                <Section title={t('filterByProductType')} icon="🏷️" isOpen={openSections.type} onToggle={() => toggleSection('type')} activeCount={activeCounts.type}>
                  <TypeChips value={localFilters.productType} onChange={v => handleFilterChange('productType', v)} t={t} isAdmin={isAdmin} />
                </Section>

                <Section title={t('pharmaceuticalForm')} icon="💊" isOpen={openSections.form} onToggle={() => toggleSection('form')} activeCount={activeCounts.form}>
                  <SearchableDropdown ariaLabel={t('pharmaceuticalForm')} headerBottom={headerBottom} value={localFilters.pharmaceuticalForm || []} onChange={v => handleFilterChange('pharmaceuticalForm', v)} options={dynamicOptions.forms} placeholder={t('all')} mode="multi" t={t} compact />
                </Section>

                <Section title={t('marketingCompany')} icon="🏢" isOpen={openSections.marketing} onToggle={() => toggleSection('marketing')} activeCount={activeCounts.marketing}>
                  <SearchableDropdown ariaLabel={t('marketingCompany')} headerBottom={headerBottom} value={localFilters.marketingCompany} onChange={v => handleFilterChange('marketingCompany', Array.isArray(v) ? v : [])} options={dynamicOptions.marketingCompanies} placeholder={t('pleaseSelectOrAdd')} t={t} mode="multi" compact />
                </Section>

                <Section title={t('filterByManufacturer')} icon="🏭" isOpen={openSections.manufacturer} onToggle={() => toggleSection('manufacturer')} activeCount={activeCounts.manufacturer}>
                  <SearchableDropdown ariaLabel={t('filterByManufacturer')} headerBottom={headerBottom} value={localFilters.manufactureName} onChange={v => handleFilterChange('manufactureName', Array.isArray(v) ? v : [])} options={dynamicOptions.manufacturers} placeholder={t('allManufacturers')} t={t} mode="multi" compact />
                </Section>

                <Section title={t('agents')} icon="👤" isOpen={openSections.agent} onToggle={() => toggleSection('agent')} activeCount={activeCounts.agent}>
                  <SearchableDropdown ariaLabel={t('agents')} headerBottom={headerBottom} value={localFilters.mainAgent} onChange={v => handleFilterChange('mainAgent', Array.isArray(v) ? v : [])} options={dynamicOptions.agents} placeholder={t('pleaseSelectOrAdd')} t={t} mode="multi" compact />
                </Section>

                <Section title={t('filterByLegalStatus')} icon="⚖️" isOpen={openSections.legal} onToggle={() => toggleSection('legal')} activeCount={activeCounts.legal}>
                  <div className="flex gap-2 flex-wrap">
                    {['', 'OTC', 'Prescription'].map(opt => (
                      <button key={opt}
                        onClick={() => handleFilterChange('legalStatus', opt)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${
                          localFilters.legalStatus === opt
                            ? 'bg-teal-500 text-white shadow-md'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {opt === '' ? t('all') : opt}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title={t('priceRange')} icon="💰" isOpen={openSections.price} onToggle={() => toggleSection('price')} activeCount={activeCounts.price}>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input type="number" value={localFilters.priceMin} onChange={e => handleFilterChange('priceMin', e.target.value)} placeholder="0"
                        className="w-full h-11 px-3 pr-12 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 focus:border-teal-400 rounded-xl outline-none text-sm font-bold dark:text-white transition-colors" min="0" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Min</span>
                    </div>
                    <div className="flex items-center text-slate-300 font-black text-sm">—</div>
                    <div className="flex-1 relative">
                      <input type="number" value={localFilters.priceMax} onChange={e => handleFilterChange('priceMax', e.target.value)} placeholder="∞"
                        className="w-full h-11 px-3 pr-12 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 focus:border-teal-400 rounded-xl outline-none text-sm font-bold dark:text-white transition-colors" min="0" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Max</span>
                    </div>
                  </div>
                </Section>

              </div>

              {/* Footer */}
              <div className="flex gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
                <button
                  onClick={handleReset}
                  className="px-5 py-3 rounded-2xl text-sm font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 active:scale-95 transition-all"
                >
                  {t('resetFilters')}
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-teal-500/25 active:scale-[0.98] transition-all"
                >
                  {t('showResults')} {expectedCount > 0 && `(${expectedCount})`}
                </button>
              </div>

            </div>
        </div>
    );
};

export default FilterModal;
