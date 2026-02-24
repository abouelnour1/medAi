import { useState, useMemo } from 'react';
import { Medicine, TextSearchMode, SortOption, FilterState } from '../types';
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
  filters: FilterState,
  sortBy: SortOption
) {
  const raw = debouncedSearchTerm.toLowerCase().trim();
  const term = raw.replace(/\*/g, '');

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

  const finalFilteredMedicines = useMemo(() => {
    if (raw.length < 3) return searchContextMedicines;

    const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
    let results = searchContextMedicines.filter(m => {
      const text = String(m[field]).toLowerCase();
      if (raw.includes('*')) return matchesWildcard(text, term);
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
      return aName.localeCompare(bName);
    };

    const exactStart   = results.filter(m => String(m[field]).toLowerCase().startsWith(term));
    const exactContain = results.filter(m => { const n = String(m[field]).toLowerCase(); return !n.startsWith(term) && n.includes(term); });
    const fuzzyOnly    = results.filter(m => !String(m[field]).toLowerCase().includes(term))
                                .sort((a, b) => fuzzyScore(String(b[field]), term) - fuzzyScore(String(a[field]), term));

    exactStart.sort(sortFn);
    exactContain.sort(sortFn);
    return [...exactStart, ...exactContain, ...fuzzyOnly];
  }, [searchContextMedicines, debouncedSearchTerm, textSearchMode, sortBy]);

  return { finalFilteredMedicines, searchContextMedicines };
}
