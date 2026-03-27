import { useMemo } from 'react';
import { Medicine, TextSearchMode, SortByOption, Filters } from '../types';
import { fuzzyScore } from '../utils/fuzzySearch';

const SEARCH_RESULT_LIMIT = 100;

function matchesWildcard(text: string, pattern: string): boolean {
  if (!pattern.includes('*')) return text.includes(pattern);
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(escaped).test(text);
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[-\s.,/]+/g, '');
}

export function useSearch(
  medicines: Medicine[],
  debouncedSearchTerm: string,
  textSearchMode: TextSearchMode,
  filters: Filters,
  sortBy: SortByOption,
  exactOnly: boolean = false,
  isAdmin: boolean = false
) {
  const rawFull = debouncedSearchTerm.toLowerCase().trim();
  const rawNoSpaces = rawFull.replace(/\s/g, '');
  const raw = rawFull;
  const term = raw.replace(/\*/g, '');
  const termNorm = norm(term);

  const searchTextResults = useMemo(() => {
    if (!medicines.length || rawNoSpaces.length < 3) return medicines;
    const field = debouncedSearchTerm ? (textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name') : 'Trade Name';
    return medicines.filter(m => fuzzyScore(String(m[field]).toLowerCase(), raw) > 0);
  }, [medicines, raw, textSearchMode, debouncedSearchTerm]);

  const searchContextMedicines = useMemo(() => {
    if (!medicines.length) return [];
    let results = medicines;
    if (filters.productType !== 'all') {
      const map: Record<string, string> = { medicine: 'Human', supplement: 'Supplement', food: 'Food' };
      if (isAdmin || rawNoSpaces.length >= 3) results = results.filter(m => m['Product type'] === map[filters.productType]);
    }
    if (filters.priceMin) results = results.filter(m => parseFloat(m['Public price'] || '0') >= parseFloat(filters.priceMin));
    if (filters.priceMax) results = results.filter(m => parseFloat(m['Public price'] || '0') <= parseFloat(filters.priceMax));
    if (filters.pharmaceuticalForm && filters.pharmaceuticalForm.length > 0) results = results.filter(m => Array.isArray(filters.pharmaceuticalForm) ? filters.pharmaceuticalForm.includes(m.PharmaceuticalForm || '') : m.PharmaceuticalForm?.toLowerCase().includes((filters.pharmaceuticalForm as string).toLowerCase()));
    if (filters.legalStatus) results = results.filter(m => m['Legal Status']?.toLowerCase() === filters.legalStatus.toLowerCase());
    if (filters.manufactureName?.length) results = results.filter(m => filters.manufactureName.some(n => m['Manufacture Name']?.toLowerCase().includes(n.toLowerCase())));
    if (filters.marketingCompany?.length) results = results.filter(m => filters.marketingCompany.some(n => m['Marketing Company']?.toLowerCase().includes(n.toLowerCase())));
    if (filters.mainAgent?.length) results = results.filter(m => filters.mainAgent.some(n => m['Main Agent']?.toLowerCase().includes(n.toLowerCase())));
    return results;
  }, [medicines, filters]);

  const hasActiveFilters =
    filters.productType !== 'all' || !!filters.priceMin || !!filters.priceMax ||
    !!filters.pharmaceuticalForm || !!filters.legalStatus ||
    filters.manufactureName.length > 0 || filters.marketingCompany.length > 0 || filters.mainAgent.length > 0;

  const finalFilteredMedicines = useMemo(() => {
    if (rawNoSpaces.length < 3 && !hasActiveFilters) return [];

    const sortFnAlpha = (a: Medicine, b: Medicine): number => {
      if (sortBy === 'priceAsc') return (parseFloat(a['Public price']) || 0) - (parseFloat(b['Public price']) || 0);
      if (sortBy === 'priceDesc') return (parseFloat(b['Public price']) || 0) - (parseFloat(a['Public price']) || 0);
      if (sortBy === 'strengthAsc') return (parseFloat(a.Strength) || 0) - (parseFloat(b.Strength) || 0);
      if (sortBy === 'strengthDesc') return (parseFloat(b.Strength) || 0) - (parseFloat(a.Strength) || 0);
      if (sortBy === 'scientificName') return String(a['Scientific Name']).localeCompare(String(b['Scientific Name']));
      return String(a['Trade Name']).localeCompare(String(b['Trade Name']));
    };

    if (rawNoSpaces.length < 3 && hasActiveFilters) return [...searchContextMedicines].sort(sortFnAlpha);

    const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
    const isScientific = textSearchMode === 'scientificName';

    if (exactOnly || isScientific) {
      const results = searchContextMedicines.filter(m => {
        const t = String(m[field]).toLowerCase();
        return raw.includes('*') ? matchesWildcard(t, term) : t.includes(term);
      });
      const t1 = results.filter(m => String(m[field]).toLowerCase().startsWith(term)).sort(sortFnAlpha);
      const t2 = results.filter(m => !String(m[field]).toLowerCase().startsWith(term)).sort(sortFnAlpha);
      return [...t1, ...t2].slice(0, SEARCH_RESULT_LIMIT);
    }

    // 4 طبقات — الحرف الأول لازم يتطابق دايماً
    const tier1: Medicine[] = []; // يبدأ بالـ term بالظبط
    const tier2: Medicine[] = []; // يحتوي الـ term في أي مكان
    const tier3: Medicine[] = []; // fuzzy قريب score >= 0.6
    const tier4: Medicine[] = []; // fuzzy بعيد score > 0

    for (const m of searchContextMedicines) {
      const text = String(m[field]).toLowerCase();
      const textNorm = norm(text);

      if (raw.includes('*')) {
        if (matchesWildcard(text, term)) tier2.push(m);
        continue;
      }

      // الشرط الصارم: الحرف الأول لازم يتطابق
      const firstChar = text.replace(/^[\s\-.,/]+/, '')[0];
      if (firstChar !== termNorm[0]) continue;

      const firstWord = text.split(/[\s\-,./]+/)[0];

      if (firstWord.startsWith(term) || textNorm.startsWith(termNorm)) {
        tier1.push(m);
      } else if (text.includes(term) || textNorm.includes(termNorm)) {
        tier2.push(m);
      } else {
        const score = fuzzyScore(text, term);
        if (score >= 0.6) tier3.push(m);
        else if (score > 0) tier4.push(m);
      }
    }

    tier1.sort(sortFnAlpha);
    tier2.sort(sortFnAlpha);
    tier3.sort((a, b) => {
      const diff = fuzzyScore(String(b[field]), term) - fuzzyScore(String(a[field]), term);
      if (diff !== 0) return diff;
      const aw = String(a[field]).toLowerCase().split(/[\s]+/)[0];
      const bw = String(b[field]).toLowerCase().split(/[\s]+/)[0];
      return aw.length !== bw.length ? aw.length - bw.length : String(a[field]).localeCompare(String(b[field]));
    });
    tier4.sort((a, b) => fuzzyScore(String(b[field]), term) - fuzzyScore(String(a[field]), term));

    return [...tier1, ...tier2, ...tier3, ...tier4].slice(0, SEARCH_RESULT_LIMIT);
  }, [searchContextMedicines, debouncedSearchTerm, textSearchMode, sortBy]);

  return { finalFilteredMedicines, searchContextMedicines, searchTextResults };
}
