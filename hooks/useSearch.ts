import { useState, useMemo } from 'react';
import { Medicine, TextSearchMode, SortByOption, Filters } from '../types';
import { fuzzyMatch, fuzzyScore } from '../utils/fuzzySearch';

function matchesWildcard(text: string, pattern: string): boolean {
  if (!pattern.includes('*')) return text.includes(pattern);
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(escaped).test(text);
}

export function useSearch(
  medicines: Medicine[],
  debouncedSearchTerm: string,
  textSearchMode: TextSearchMode,
  filters: Filters,
  sortBy: SortByOption,
  exactOnly: boolean = false
) {
  const raw = debouncedSearchTerm.toLowerCase().trim();
  const term = raw.replace(/\*/g, '');

  // نتائج البحث النصي بدون فلاتر - تُستخدم كـ options source للـ FilterModal
  const searchTextResults = useMemo(() => {
    if (!medicines.length || raw.length < 1) return medicines;
    const field = debouncedSearchTerm ? (textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name') : 'Trade Name';
    return medicines.filter(m => fuzzyMatch(String(m[field]).toLowerCase(), raw));
  }, [medicines, raw, textSearchMode, debouncedSearchTerm]);

  // نتائج مع تطبيق الفلاتر - تُستخدم كـ context للعرض
  const searchContextMedicines = useMemo(() => {
    if (!medicines.length) return [];
    let results = medicines;

    // تطبيق الـ filters
    if (filters.productType !== 'all') {
      const map: Record<string, string> = { medicine: 'Human', supplement: 'Supplement', food: 'Food' };
      results = results.filter(m => m['Product type'] === map[filters.productType]);
    }
    if (filters.priceMin) results = results.filter(m => parseFloat(m['Public price'] || '0') >= parseFloat(filters.priceMin));
    if (filters.priceMax) results = results.filter(m => parseFloat(m['Public price'] || '0') <= parseFloat(filters.priceMax));
    if (filters.pharmaceuticalForm) results = results.filter(m => m.PharmaceuticalForm?.toLowerCase().includes(filters.pharmaceuticalForm.toLowerCase()));
    if (filters.legalStatus) results = results.filter(m => m['Legal Status']?.toLowerCase() === filters.legalStatus.toLowerCase());
    if (filters.manufactureName?.length) results = results.filter(m => filters.manufactureName.some(n => m['Manufacture Name']?.toLowerCase().includes(n.toLowerCase())));
    if (filters.marketingCompany?.length) results = results.filter(m => filters.marketingCompany.some(n => m['Marketing Company']?.toLowerCase().includes(n.toLowerCase())));
    if (filters.mainAgent?.length) results = results.filter(m => filters.mainAgent.some(n => m['Main Agent']?.toLowerCase().includes(n.toLowerCase())));

    return results;
  }, [medicines, filters]);

  // هل في فلاتر نشطة؟
  const hasActiveFilters = 
    filters.productType !== 'all' ||
    !!filters.priceMin || !!filters.priceMax ||
    !!filters.pharmaceuticalForm || !!filters.legalStatus ||
    filters.manufactureName.length > 0 ||
    filters.marketingCompany.length > 0 ||
    filters.mainAgent.length > 0;

  const finalFilteredMedicines = useMemo(() => {
    // لو مش في بحث ومش في فلاتر → لا ترجع نتائج
    if (raw.length < 1 && !hasActiveFilters) return [];

    // sortFn مشترك
    const sortFnEarly = (a: Medicine, b: Medicine): number => {
      if (sortBy === 'priceAsc') return (parseFloat(a['Public price']) || 0) - (parseFloat(b['Public price']) || 0);
      if (sortBy === 'priceDesc') return (parseFloat(b['Public price']) || 0) - (parseFloat(a['Public price']) || 0);
      if (sortBy === 'strengthAsc') return (parseFloat(a.Strength) || 0) - (parseFloat(b.Strength) || 0);
      if (sortBy === 'strengthDesc') return (parseFloat(b.Strength) || 0) - (parseFloat(a.Strength) || 0);
      if (sortBy === 'scientificName') return String(a['Scientific Name']).localeCompare(String(b['Scientific Name']));
      return String(a['Trade Name']).localeCompare(String(b['Trade Name']));
    };

    // لو في فلاتر بس بدون بحث → رجّع الفلاتر مع sort
    if (raw.length < 1 && hasActiveFilters) return [...searchContextMedicines].sort(sortFnEarly);

    const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
    let results = searchContextMedicines.filter(m => {
      const text = String(m[field]).toLowerCase();
      if (raw.includes('*')) return matchesWildcard(text, term);
      // exactOnly = بحث حرفي: الحروف لازم تكون موجودة بالترتيب متتالية
      if (exactOnly) return text.includes(term);
      return fuzzyMatch(text, term);
    });

    const sortFn = (a: Medicine, b: Medicine): number => {
      const aName = String(a[field]).toLowerCase();
      const bName = String(b[field]).toLowerCase();
      if (sortBy === 'priceAsc') return (parseFloat(a['Public price']) || 0) - (parseFloat(b['Public price']) || 0);
      if (sortBy === 'priceDesc') return (parseFloat(b['Public price']) || 0) - (parseFloat(a['Public price']) || 0);
      if (sortBy === 'strengthAsc') return (parseFloat(a.Strength) || 0) - (parseFloat(b.Strength) || 0);
      if (sortBy === 'strengthDesc') return (parseFloat(b.Strength) || 0) - (parseFloat(a.Strength) || 0);
      if (sortBy === 'scientificName') return String(a['Scientific Name']).localeCompare(String(b['Scientific Name']));
      return aName.localeCompare(bName); // alphabetical default
    };

    const exactStart   = results.filter(m => String(m[field]).toLowerCase().startsWith(term));
    const exactContain = results.filter(m => { const n = String(m[field]).toLowerCase(); return !n.startsWith(term) && n.includes(term); });
    
    exactStart.sort(sortFn);
    exactContain.sort(sortFn);

    if (exactOnly) {
      // وضع التدقيق: حرفي فقط - مش fuzzy
      return [...exactStart, ...exactContain];
    }

    const fuzzyOnly = results.filter(m => !String(m[field]).toLowerCase().includes(term))
                             .sort((a, b) => fuzzyScore(String(b[field]), term) - fuzzyScore(String(a[field]), term));
    return [...exactStart, ...exactContain, ...fuzzyOnly];
  }, [searchContextMedicines, debouncedSearchTerm, textSearchMode, sortBy]);

  return { finalFilteredMedicines, searchContextMedicines, searchTextResults };
}
