import { useState, useMemo, useRef, useEffect } from 'react';
import { Medicine, TextSearchMode, SortByOption, Filters } from '../types';
import { fuzzyMatch, fuzzyScore } from '../utils/fuzzySearch';

// Search Index - يتبنى مرة واحدة ويتخزن
interface MedicineIndex {
  id: string;
  tradeLower: string;
  sciLower: string;
  regNum: string;
}

function buildIndex(medicines: Medicine[]): MedicineIndex[] {
  return medicines.map(m => ({
    id: m.RegisterNumber,
    tradeLower: String(m['Trade Name'] || '').toLowerCase(),
    sciLower: String(m['Scientific Name'] || '').toLowerCase(),
    regNum: m.RegisterNumber,
  }));
}

function matchesWildcard(text: string, pattern: string): boolean {
  if (!pattern.includes('*')) return text.includes(pattern);
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(escaped).test(text);
}

// أقصى عدد نتائج تدخل fuzzyScore — بيحمي الأندرويد من الـ sliding window كتير
const FUZZY_SCORE_CAP = 120;

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

  // نتائج البحث النصي بدون فلاتر - تُستخدم كـ options source للـ FilterModal
  const searchTextResults = useMemo(() => {
    if (!medicines.length || rawNoSpaces.length < 3) return medicines;
    const field = debouncedSearchTerm ? (textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name') : 'Trade Name';
    if (raw.includes('*')) {
      return medicines.filter(m => matchesWildcard(String(m[field]).toLowerCase(), raw));
    }
    return medicines.filter(m => fuzzyMatch(String(m[field]).toLowerCase(), raw));
  }, [medicines, raw, textSearchMode, debouncedSearchTerm]);

  // نتائج مع تطبيق الفلاتر
  const searchContextMedicines = useMemo(() => {
    if (!medicines.length) return [];
    let results = medicines;

    if (filters.productType !== 'all') {
      const map: Record<string, string> = { medicine: 'Human', supplement: 'Supplement', food: 'Food' };
      if (isAdmin || rawNoSpaces.length >= 3) {
        results = results.filter(m => m['Product type'] === map[filters.productType]);
      }
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
    filters.productType !== 'all' ||
    !!filters.priceMin || !!filters.priceMax ||
    !!filters.pharmaceuticalForm || !!filters.legalStatus ||
    filters.manufactureName.length > 0 ||
    filters.marketingCompany.length > 0 ||
    filters.mainAgent.length > 0;

  const finalFilteredMedicines = useMemo(() => {
    // لو مفيش بحث ومفيش فلاتر → لا نتايج
    if (rawNoSpaces.length === 0 && !hasActiveFilters) return [];
    // لو بحث قصير أوي ومفيش فلاتر → لا نتايج
    if (rawNoSpaces.length < 3 && !hasActiveFilters) return [];

    const sortFnEarly = (a: Medicine, b: Medicine): number => {
      if (sortBy === 'priceAsc') return (parseFloat(a['Public price']) || 0) - (parseFloat(b['Public price']) || 0);
      if (sortBy === 'priceDesc') return (parseFloat(b['Public price']) || 0) - (parseFloat(a['Public price']) || 0);
      if (sortBy === 'strengthAsc') return (parseFloat(a.Strength) || 0) - (parseFloat(b.Strength) || 0);
      if (sortBy === 'strengthDesc') return (parseFloat(b.Strength) || 0) - (parseFloat(a.Strength) || 0);
      if (sortBy === 'scientificName') return String(a['Scientific Name']).localeCompare(String(b['Scientific Name']));
      return String(a['Trade Name']).localeCompare(String(b['Trade Name']));
    };

    // لو فيه فلتر نشط وبحث → نشغل البحث حتى لو حرف واحد
    if (rawNoSpaces.length < 3 && hasActiveFilters) {
      if (rawNoSpaces.length === 0) return [...searchContextMedicines].sort(sortFnEarly);
      // فيه حروف + فلتر → نكمل البحث على المفلترين
    }

    const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
    const isScientific = textSearchMode === 'scientificName';

    // ── المرحلة 1: exact matches (contains) — سريعة جداً ──────────
    const exactStart:   Medicine[] = [];
    const exactContain: Medicine[] = [];
    const fuzzyOnly:    Medicine[] = [];

    for (const m of searchContextMedicines) {
      const text = String(m[field]).toLowerCase();
      if (raw.includes('*')) {
        // raw هو النص الأصلي مع * — matchesWildcard تحوله لـ regex
        if (matchesWildcard(text, raw)) {
          // ترتيب: النتايج اللي بتبدأ بأول جزء قبل * تيجي أول
          const firstPart = raw.split('*')[0];
          firstPart && text.startsWith(firstPart) ? exactStart.push(m) : exactContain.push(m);
        }
      } else if (exactOnly || isScientific) {
        if (text.includes(term)) {
          text.startsWith(term) ? exactStart.push(m) : exactContain.push(m);
        }
      } else {
        if (text.startsWith(term)) {
          exactStart.push(m);
        } else if (text.includes(term)) {
          exactContain.push(m);
        } else if (!exactOnly) {
          // fuzzy candidates — هنحسب score عليهم بعدين
          fuzzyOnly.push(m);
        }
      }
    }

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

    exactStart.sort(sortFn);
    exactContain.sort(sortFn);

    if (exactOnly) return [...exactStart, ...exactContain];

    // ── المرحلة 2: fuzzy scoring — على FUZZY_SCORE_CAP بس ──────────
    // لو في exact matches كفاية، ممكن نتجاوز الـ fuzzy خالص
    const exactTotal = exactStart.length + exactContain.length;
    if (exactTotal >= FUZZY_SCORE_CAP) {
      return [...exactStart, ...exactContain];
    }

    // بنحسب fuzzyScore بس على أول FUZZY_SCORE_CAP من الـ candidates
    const candidatesSlice = fuzzyOnly.slice(0, FUZZY_SCORE_CAP - exactTotal);
    const scoredFuzzy = candidatesSlice
      .map(m => ({ m, score: fuzzyScore(String(m[field]), term) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.m);

    return [...exactStart, ...exactContain, ...scoredFuzzy];
  }, [searchContextMedicines, debouncedSearchTerm, textSearchMode, sortBy]);

  return { finalFilteredMedicines, searchContextMedicines, searchTextResults };
}
