import { useMemo } from 'react';
import { Medicine, TextSearchMode, SortByOption, Filters } from '../types';
import { norm, prefixAlign } from '../utils/fuzzySearch';

const SEARCH_RESULT_LIMIT = 100;

function matchesWildcard(text: string, pattern: string): boolean {
  if (!pattern.includes('*')) return text.includes(pattern);
  // لو بيبدأ بـ * → يعني "في المنتصف أو الآخر" (مش في البداية)
  if (pattern.startsWith('*') && !pattern.endsWith('*')) {
    const sub = pattern.slice(1); // اشيل الـ * من الأول
    if (!sub) return false;
    return text.includes(sub) && !text.startsWith(sub);
  }
  // لو بيخلص بـ * → يعني "يبدأ بـ"
  if (pattern.endsWith('*') && !pattern.startsWith('*')) {
    const sub = pattern.slice(0, -1);
    return text.startsWith(sub);
  }
  // في المنتصف أو متعدد → عام
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(escaped, 'i').test(text);
}

function lcpLen(a: string, b: string): number {
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i;
}

function charAfterLcp(word: string, l: number): string {
  return l < word.length ? word[l] : '';
}

/**
 * classifyWord — المنطق الصح:
 *
 * نشوف أطول prefix متصل من الـ query موجود في بداية الكلمة
 * + هل الجزء الباقي من الـ query موجود (كـ substring) في باقي الكلمة
 *
 * مثال "fdol" على "fevadol":
 *   جرب "fdol" (4): fevadol يبدأ بـ "fdol"? لا
 *   جرب "fdo"  (3): fevadol يبدأ بـ "fdo"? لا
 *   جرب "fd"   (2): fevadol يبدأ بـ "fd"? لا
 *   جرب "f"    (1): fevadol يبدأ بـ "f"? نعم ✓
 *     rest = "dol", "dol" in "evadol"? نعم ✓ → restFound = true
 *     tier = 4 - 1 = 3, matchLen = 1, restFound = true
 *
 * مثال "fdol" على "fas":
 *   جرب "f" (1): fas يبدأ بـ "f"? نعم ✓
 *     rest = "dol", "dol" in "as"? لا → restFound = false
 *     tier = 3, matchLen = 1, restFound = false
 *
 * → fevadol يجي قبل fas في الترتيب (restFound = true > false)
 *
 * مثال "padol" على "panadol":
 *   جرب "padol" (5): panadol يبدأ بـ "padol"? لا
 *   جرب "pado"  (4): panadol يبدأ بـ "pado"? لا (panadol = p-a-n-a-d-o-l)
 *   جرب "pad"   (3): panadol يبدأ بـ "pad"? لا (بعد pa في يجي n مش d)
 *   جرب "pa"    (2): panadol يبدأ بـ "pa"? نعم ✓
 *     rest = "dol", "dol" in "nadol"? نعم ✓ → restFound = true
 *     tier = 5 - 2 = 3, matchLen = 2, restFound = true
 */
function classifyWord(
  nameWord: string,
  queryWord: string
): { tier: number; matchLen: number; restFound: boolean } {
  if (!nameWord || !queryWord) return { tier: 99, matchLen: 0, restFound: false };

  if (nameWord.startsWith(queryWord)) return { tier: 0, matchLen: queryWord.length, restFound: true };

  const qLen = queryWord.length;
  for (let subLen = qLen - 1; subLen >= 1; subLen--) {
    const sub = queryWord.substring(0, subLen);
    if (nameWord.startsWith(sub)) {
      const rest = queryWord.substring(subLen);
      const restFound = nameWord.substring(subLen).includes(rest);
      return { tier: qLen - subLen, matchLen: subLen, restFound };
    }
  }

  if (nameWord.includes(queryWord)) return { tier: 9, matchLen: queryWord.length, restFound: true };

  return { tier: 99, matchLen: 0, restFound: false };
}

/**
 * scoreQuery:
 * كل كلمة في الـ query لازم تتطابق مع كلمة من الاسم
 * tier     = أسوأ tier (max)
 * matchLen = مجموع أطوال المقاطع المتطابقة في البداية
 * restFoundAll = هل كل الكلمات عندها restFound = true
 */
function scoreQuery(
  tradeName: string,
  sciName: string,
  queryWords: string[],
  tradeOnly = false
): { tier: number; matchLen: number; restFoundAll: boolean } | null {
  const tradeWords = norm(tradeName).match(/[a-z0-9]+/g) || [];
  const sciWords   = tradeOnly ? [] : (norm(sciName || '').match(/[a-z0-9]+/g) || []);
  const allWords   = [...tradeWords, ...sciWords];
  if (!allWords.length || !queryWords.length) return null;

  let totalTier = 0;
  let totalMatchLen = 0;
  let allRestFound = true;
  const used = new Set<number>();

  for (const qw of queryWords) {
    let bestTier = 99, bestMatchLen = 0, bestRestFound = false, bestIdx = -1;
    for (let i = 0; i < allWords.length; i++) {
      if (used.has(i)) continue;
      const res = classifyWord(allWords[i], qw);
      if (
        res.tier < bestTier ||
        (res.tier === bestTier && res.restFound && !bestRestFound) ||
        (res.tier === bestTier && res.restFound === bestRestFound && res.matchLen > bestMatchLen)
      ) {
        bestTier = res.tier;
        bestMatchLen = res.matchLen;
        bestRestFound = res.restFound;
        bestIdx = i;
      }
    }
    if (bestTier === 99) return null;
    totalTier = Math.max(totalTier, bestTier);
    totalMatchLen += bestMatchLen;
    if (!bestRestFound) allRestFound = false;
    if (bestIdx >= 0) used.add(bestIdx);
  }

  return { tier: totalTier, matchLen: totalMatchLen, restFoundAll: allRestFound };
}

export function useSearch(
  medicines: Medicine[],
  debouncedSearchTerm: string,
  textSearchMode: TextSearchMode,
  filters: Filters,
  sortBy: SortByOption,
  fuzzyEnabled: boolean = false,
  isAdmin: boolean = false,
  indications: Record<string, { icd10Code: string; drugs: { s: string; a: string }[] }> = {}
) {
  const rawFull     = debouncedSearchTerm.toLowerCase().trim();
  const rawNoSpaces = rawFull.replace(/\s/g, '');
  const raw         = rawFull;
  const hasWildcard = raw.includes('*');
  const term        = raw.replace(/\*/g, '');
  const queryWords  = norm(term).match(/[a-z0-9]+/g) || [];
  const termNorm    = queryWords.join('');

  const searchTextResults = useMemo(() => {
    if (!medicines.length) return [];
    if (rawNoSpaces.length < 1) return textSearchMode === 'indication' ? [] : medicines;

    // بحث بالمرض — نجيب الـ scientific names من الـ indications ونفلتر
    if (textSearchMode === 'indication') {
      const termLower = raw.trim().toLowerCase();
      if (!termLower || Object.keys(indications).length === 0) return [];
      try {
        const matchedSciNames = new Set<string>();
        const entries = Object.entries(indications);
        // Early exit if too many matches to prevent freeze
        let matchCount = 0;
        for (const [indication, data] of entries) {
          if (!data) continue;
          if (indication.toLowerCase().includes(termLower) ||
              (data.icd10Code || '').toLowerCase().includes(termLower)) {
            (data.drugs || []).forEach(d => { if (d?.s) matchedSciNames.add(d.s.toLowerCase()); });
            matchCount++;
            if (matchCount > 50) break; // safety limit
          }
        }
        if (matchedSciNames.size === 0) return [];
        return medicines.filter(m =>
          matchedSciNames.has(String(m['Scientific Name'] || '').toLowerCase())
        ).slice(0, 300);
      } catch (e) {
        return [];
      }
    }

    return medicines.filter(m => {
      if (hasWildcard) return matchesWildcard(norm(String(m['Trade Name'] || '')), raw) || matchesWildcard(norm(String(m['Scientific Name'] || '')), raw);
      return scoreQuery(String(m['Trade Name'] || ''), String(m['Scientific Name'] || ''), queryWords, textSearchMode === 'tradeName') !== null;
    });
  }, [medicines, raw, debouncedSearchTerm, textSearchMode, indications]);

  const searchContextMedicines = useMemo(() => {
    if (!medicines.length) return [];
    let results = medicines;
    if (filters.productType !== 'all') {
      const map: Record<string, string> = { medicine: 'Human', supplement: 'Supplement', food: 'Food' };
      if (isAdmin || rawNoSpaces.length >= 1)
        results = results.filter(m => m['Product type'] === map[filters.productType]);
    }
    if (filters.priceMin)  results = results.filter(m => parseFloat(m['Public price'] || '0') >= parseFloat(filters.priceMin));
    if (filters.priceMax)  results = results.filter(m => parseFloat(m['Public price'] || '0') <= parseFloat(filters.priceMax));
    if (filters.pharmaceuticalForm?.length) results = results.filter(m =>
      Array.isArray(filters.pharmaceuticalForm)
        ? filters.pharmaceuticalForm.includes(m.PharmaceuticalForm || '')
        : m.PharmaceuticalForm?.toLowerCase().includes((filters.pharmaceuticalForm as string).toLowerCase())
    );
    if (filters.legalStatus) results = results.filter(m => m['Legal Status']?.toLowerCase() === filters.legalStatus.toLowerCase());
    if (filters.manufactureName?.length)  results = results.filter(m => filters.manufactureName.some(n => m['Manufacture Name']?.toLowerCase().includes(n.toLowerCase())));
    if (filters.marketingCompany?.length) results = results.filter(m => filters.marketingCompany.some(n => m['Marketing Company']?.toLowerCase().includes(n.toLowerCase())));
    if (filters.mainAgent?.length)        results = results.filter(m => filters.mainAgent.some(n => m['Main Agent']?.toLowerCase().includes(n.toLowerCase())));
    return results;
  }, [medicines, filters]);

  const hasActiveFilters =
    filters.productType !== 'all' || !!filters.priceMin || !!filters.priceMax ||
    !!filters.pharmaceuticalForm || !!filters.legalStatus ||
    filters.manufactureName.length > 0 || filters.marketingCompany.length > 0 || filters.mainAgent.length > 0;

  const finalFilteredMedicines = useMemo(() => {
    if (rawNoSpaces.length < 1 && !hasActiveFilters) return [];

    const sortFnAlpha = (a: Medicine, b: Medicine): number => {
      if (sortBy === 'priceAsc')     return (parseFloat(a['Public price']) || 0) - (parseFloat(b['Public price']) || 0);
      if (sortBy === 'priceDesc')    return (parseFloat(b['Public price']) || 0) - (parseFloat(a['Public price']) || 0);
      if (sortBy === 'strengthAsc')  return (parseFloat(a.Strength) || 0) - (parseFloat(b.Strength) || 0);
      if (sortBy === 'strengthDesc') return (parseFloat(b.Strength) || 0) - (parseFloat(a.Strength) || 0);
      if (sortBy === 'scientificName') return String(a['Scientific Name']).localeCompare(String(b['Scientific Name']));
      return String(a['Trade Name']).localeCompare(String(b['Trade Name']));
    };

    if (rawNoSpaces.length < 1 && hasActiveFilters) {
      const sorted = [...searchContextMedicines].sort(sortFnAlpha);
      return sorted.slice(0, 500); // limit to prevent freeze with large categories
    }

    // البحث النصي: 100 نتيجة للعاديين، 200 للأدمن (pagination يتحكم في البقية)
    const applyLimit = (arr: Medicine[]) =>
      hasActiveFilters ? arr : arr.slice(0, isAdmin ? 200 : SEARCH_RESULT_LIMIT);

    // indication mode — النتايج جاهزة من searchTextResults مباشرة
    if (textSearchMode === 'indication') {
      return applyLimit([...searchTextResults].sort(sortFnAlpha));
    }
    if (!fuzzyEnabled || textSearchMode === 'scientificName') {
      const isSci   = textSearchMode === 'scientificName';
      const isTrade = textSearchMode === 'tradeName';
      const qn = queryWords.join('');
      if (!qn) return [];

      // دالة مساعدة: هل النص فيه الـ term؟
      const fieldContains = (m: Medicine): boolean => {
        const tradNorm = norm(String(m['Trade Name'] || ''));
        const sciNorm  = norm(String(m['Scientific Name'] || ''));
        if (hasWildcard) {
          // wildcard — الاسم التجاري فقط
          return matchesWildcard(tradNorm, raw) || matchesWildcard(norm(String(m['Scientific Name'] || '')), raw);
        }
        if (isSci)   return sciNorm.includes(qn);
        if (isTrade) return tradNorm.includes(qn);
        // all: يشوف الاتنين
        return tradNorm.includes(qn) || sciNorm.includes(qn);
      };

      // دالة مساعدة: هل الاسم بيبدأ بالـ term؟
      const fieldStartsWith = (m: Medicine): boolean => {
        const tradNorm = norm(String(m['Trade Name'] || ''));
        const sciNorm  = norm(String(m['Scientific Name'] || ''));
        if (hasWildcard) return false; // wildcard مش بيعتمد على startsWith
        if (isSci)   return sciNorm.startsWith(qn);
        if (isTrade) return tradNorm.startsWith(qn);
        return tradNorm.startsWith(qn) || sciNorm.startsWith(qn);
      };

      const results = searchContextMedicines.filter(fieldContains);

      // ترتيب: اللي بيبدأ بالـ term أولاً، بعدين الباقي (وسط أو آخر)
      const t1 = results.filter(fieldStartsWith).sort(sortFnAlpha);
      const t2 = results.filter(m => !fieldStartsWith(m)).sort(sortFnAlpha);
      return applyLimit([...t1, ...t2]);
    }

    type Bucket = {
      m: Medicine;
      tier: number;
      matchLen: number;
      restFoundAll: boolean;
      tradeName: string;
      fuzzyDist?: number;
    };
    const buckets: Bucket[] = [];
    const addedIds = new Set<string>();

    for (const m of searchContextMedicines) {
      const trade = String(m['Trade Name'] || '');
      const sci   = String(m['Scientific Name'] || '');
      if (hasWildcard) {
        if (matchesWildcard(norm(trade), raw) || matchesWildcard(norm(String(m['Scientific Name'] || '')), raw))
          buckets.push({ m, tier: 3, matchLen: 0, restFoundAll: false, tradeName: norm(trade) });
        continue;
      }
      if (!queryWords.length) continue;
      const tradeOnly = textSearchMode === 'tradeName';
      const result = scoreQuery(trade, sci, queryWords, tradeOnly);
      if (result) {
        buckets.push({
          m,
          tier: result.tier,
          matchLen: result.matchLen,
          restFoundAll: result.restFoundAll,
          tradeName: norm(trade),
        });
        addedIds.add(m.RegisterNumber);
      }
    }

    // Fuzzy fallback
    if (!hasWildcard && queryWords.length > 0 && (queryWords[0]?.length ?? 0) >= 2) {
      const firstQ = queryWords[0]!;
      const maxErr = Math.min(2, Math.floor(firstQ.length / 3) + 1);
      for (const m of searchContextMedicines) {
        if (addedIds.has(m.RegisterNumber)) continue;
        const tn = norm(String(m['Trade Name'] || ''));
        if (!tn.startsWith(firstQ[0] ?? '')) continue;
        const dist = prefixAlign(firstQ, tn);
        if (dist <= maxErr) {
          buckets.push({
            m,
            tier: 50 + dist,
            matchLen: lcpLen(tn, firstQ),
            restFoundAll: false,
            tradeName: tn,
            fuzzyDist: dist,
          });
          addedIds.add(m.RegisterNumber);
        }
      }
    }

    buckets.sort((a, b) => {
      // 1. tier (أقل = أفضل = أطول prefix متصل من بداية الـ query)
      if (a.tier !== b.tier) return a.tier - b.tier;

      // 2. fuzzy distance
      if (a.fuzzyDist != null && b.fuzzyDist != null && a.fuzzyDist !== b.fuzzyDist)
        return a.fuzzyDist - b.fuzzyDist;

      // 3. restFoundAll: اللي فيه باقي الـ query يجي أولاً
      //    (fevadol vs fas عند بحث fdol)
      if (a.restFoundAll !== b.restFoundAll) return a.restFoundAll ? -1 : 1;

      // 4. أطول matchLen (أكبر prefix متطابق)
      if (b.matchLen !== a.matchLen) return b.matchLen - a.matchLen;

      // 5. LCP مع الـ termNorm الكاملة
      const aLcp = lcpLen(a.tradeName, termNorm);
      const bLcp = lcpLen(b.tradeName, termNorm);
      if (bLcp !== aLcp) return bLcp - aLcp;

      // 6. الحرف اللي بعد الـ LCP
      const aChar = charAfterLcp(a.tradeName, aLcp);
      const bChar = charAfterLcp(b.tradeName, bLcp);
      if (aChar !== bChar) return aChar.localeCompare(bChar);

      // 7. ترتيب أبجدي للاسم الكامل (يخلي نفس الاسم مع بعض)
      if (a.tradeName !== b.tradeName) return a.tradeName.localeCompare(b.tradeName);

      // 8. sort option (سعر وغيره) داخل نفس الاسم
      if (sortBy === 'priceAsc')  return (parseFloat(a.m['Public price']) || 0) - (parseFloat(b.m['Public price']) || 0);
      if (sortBy === 'priceDesc') return (parseFloat(b.m['Public price']) || 0) - (parseFloat(a.m['Public price']) || 0);
      return 0;
    });

    return isAdmin ? buckets.map(b => b.m) : applyLimit(buckets.map(b => b.m));
  }, [searchContextMedicines, debouncedSearchTerm, textSearchMode, sortBy, fuzzyEnabled]);

  // indication groups — مجموعات المادة الفعالة للعرض المقسم
  const indicationGroups = useMemo(() => {
    if (textSearchMode !== 'indication' || finalFilteredMedicines.length === 0) return [];
    const map = new Map<string, Medicine[]>();
    finalFilteredMedicines.forEach(m => {
      const key = String(m['Scientific Name'] || 'Other').trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return Array.from(map.entries())
      .map(([sciName, meds]) => ({ sciName, medicines: meds }))
      .sort((a, b) => a.sciName.localeCompare(b.sciName));
  }, [finalFilteredMedicines, textSearchMode]);

  return { finalFilteredMedicines, searchContextMedicines, searchTextResults, indicationGroups };
}
