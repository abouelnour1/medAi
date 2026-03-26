import { useMemo } from 'react';
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
  // نحسب الحروف بدون مسافات للـ minimum check
  const rawNoSpaces = rawFull.replace(/\s/g, '');
  const raw = rawFull; // نستخدم الكلمة كاملة في البحث
  const term = raw.replace(/\*/g, '');

  // نتائج البحث النصي بدون فلاتر - تُستخدم كـ options source للـ FilterModal
  const searchTextResults = useMemo(() => {
    if (!medicines.length || rawNoSpaces.length < 3) return medicines;
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

  // هل في فلاتر نشطة؟
  const hasActiveFilters = 
    filters.productType !== 'all' ||
    !!filters.priceMin || !!filters.priceMax ||
    !!filters.pharmaceuticalForm || !!filters.legalStatus ||
    filters.manufactureName.length > 0 ||
    filters.marketingCompany.length > 0 ||
    filters.mainAgent.length > 0;

  const finalFilteredMedicines = useMemo(() => {
    if (rawNoSpaces.length < 3 && !hasActiveFilters) return [];

    const sortFnEarly = (a: Medicine, b: Medicine): number => {
      if (sortBy === 'priceAsc') return (parseFloat(a['Public price']) || 0) - (parseFloat(b['Public price']) || 0);
      if (sortBy === 'priceDesc') return (parseFloat(b['Public price']) || 0) - (parseFloat(a['Public price']) || 0);
      if (sortBy === 'strengthAsc') return (parseFloat(a.Strength) || 0) - (parseFloat(b.Strength) || 0);
      if (sortBy === 'strengthDesc') return (parseFloat(b.Strength) || 0) - (parseFloat(a.Strength) || 0);
      if (sortBy === 'scientificName') return String(a['Scientific Name']).localeCompare(String(b['Scientific Name']));
      return String(a['Trade Name']).localeCompare(String(b['Trade Name']));
    };

    if (rawNoSpaces.length < 3 && hasActiveFilters) return [...searchContextMedicines].sort(sortFnEarly);

    const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
    const isScientific = textSearchMode === 'scientificName';

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

    if (exactOnly || isScientific) {
      // وضع التدقيق: حرفي فقط
      const results = searchContextMedicines.filter(m => {
        const text = String(m[field]).toLowerCase();
        if (raw.includes('*')) return matchesWildcard(text, term);
        return text.includes(term);
      });
      const tier1 = results.filter(m => String(m[field]).toLowerCase().startsWith(term));
      const tier2 = results.filter(m => !String(m[field]).toLowerCase().startsWith(term));
      tier1.sort(sortFn);
      tier2.sort(sortFn);
      return [...tier1, ...tier2];
    }

    // وضع الـ fuzzy العادي — 4 طبقات أولوية
    // الطبقة 1: يبدأ بنفس الحروف بالظبط  → "Fixtral" عند بحث "fixt"
    // الطبقة 2: يحتوي الحروف في نصه      → "Cefixtine"
    // الطبقة 3: fuzzy قريب جداً (score عالي)
    // الطبقة 4: fuzzy بعيد (score منخفض)

    const tier1: Medicine[] = [];
    const tier2: Medicine[] = [];
    const tier3: Medicine[] = [];
    const tier4: Medicine[] = [];

    for (const m of searchContextMedicines) {
      const text = String(m[field]).toLowerCase();

      if (raw.includes('*')) {
        if (matchesWildcard(text, term)) tier2.push(m);
        continue;
      }

      if (text.startsWith(term)) {
        tier1.push(m);
      } else if (text.includes(term)) {
        tier2.push(m);
      } else {
        const score = fuzzyScore(text, term);
        if (score >= 0.6) {
          tier3.push(m);
        } else if (score > 0) {
          tier4.push(m);
        }
      }
    }

    tier1.sort(sortFn);
    tier2.sort(sortFn);
    // الطبقة 3 و 4 تترتب بالـ score تنازلياً
    tier3.sort((a, b) => fuzzyScore(String(b[field]), term) - fuzzyScore(String(a[field]), term));
    tier4.sort((a, b) => fuzzyScore(String(b[field]), term) - fuzzyScore(String(a[field]), term));

    return [...tier1, ...tier2, ...tier3, ...tier4];
  }, [searchContextMedicines, debouncedSearchTerm, textSearchMode, sortBy]);

  return { finalFilteredMedicines, searchContextMedicines, searchTextResults };
}
