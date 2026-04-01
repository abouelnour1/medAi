import { useMemo } from 'react';
import { Medicine } from '../types';

// ── Helper: استخراج مكونات الغذاء من الاسم العلمي ───────────────────────────
// بينقّي الأرقام والتركيزات ويجيب اسم المادة الفعلية بس
function extractFoodIngredients(scientificName: string): string[] {
  return scientificName
    .toLowerCase()
    .split(/[,،+&\/]+/)
    .map(s => s.replace(/\d+(\.\d+)?\s*(mg|g|mcg|iu|%|ml|µg)?/gi, '').trim())
    .filter(s => s.length > 2);
}

// ── Helper: عدد المكونات المشتركة بين منتجين (بغض النظر عن التركيز) ─────────
function countShared(a: string[], b: string[]): number {
  const setB = new Set(b);
  return a.filter(x => setB.has(x)).length;
}

// ── Hook: البدائل المباشرة والعلاجية ────────────────────────────────────────
export function useAlternatives(selectedMedicine: Medicine | null, medicines: Medicine[]) {
  return useMemo(() => {
    if (!selectedMedicine) return { direct: [], therapeutic: [] };

    const isFood = selectedMedicine['Product type'] === 'Food';

    if (isFood) {
      const myIngredients = extractFoodIngredients(String(selectedMedicine['Scientific Name'] || ''));
      if (myIngredients.length === 0) return { direct: [], therapeutic: [] };

      const candidates = medicines.filter(m =>
        m.RegisterNumber !== selectedMedicine.RegisterNumber &&
        m['Product type'] === 'Food' &&
        String(m['Scientific Name'] || '').length > 3
      );

      const directList:     { m: Medicine; shared: number }[] = [];
      const therapeuticList: { m: Medicine; shared: number }[] = [];
      const directIds = new Set<string>();

      for (const m of candidates) {
        const theirIngredients = extractFoodIngredients(String(m['Scientific Name'] || ''));
        if (theirIngredients.length === 0) continue;
        const shared = countShared(myIngredients, theirIngredients);

        // Direct: مادتين مشتركتين أو أكثر — بغض النظر عن التركيز
        if (shared >= 2) {
          directList.push({ m, shared });
          directIds.add(m.RegisterNumber);
        }
        // Therapeutic: 3 مواد مشتركة أو أكثر (ومش موجود في direct)
        else if (shared >= 3 && !directIds.has(m.RegisterNumber)) {
          therapeuticList.push({ m, shared });
        }
      }

      // رتب بعدد المشتركات تنازلياً
      directList.sort((a, b) => b.shared - a.shared);
      therapeuticList.sort((a, b) => b.shared - a.shared);

      return {
        direct:      directList.slice(0, 20).map(x => x.m),
        therapeutic: therapeuticList.slice(0, 20).map(x => x.m),
      };
    }

    // ── الأدوية والمكملات ────────────────────────────────────────────────────
    const sciName  = String(selectedMedicine['Scientific Name']).toLowerCase();
    const strength = String(selectedMedicine.Strength).toLowerCase();
    const form     = String(selectedMedicine.PharmaceuticalForm).toLowerCase();
    const atc      = String(selectedMedicine.AtcCode1 || '').substring(0, 4);

    const direct = medicines.filter(m =>
      m.RegisterNumber !== selectedMedicine.RegisterNumber &&
      String(m['Scientific Name']).toLowerCase() === sciName &&
      String(m.Strength).toLowerCase() === strength &&
      String(m.PharmaceuticalForm).toLowerCase() === form
    );

    const directIds = new Set(direct.map(m => m.RegisterNumber));

    const therapeutic = medicines.filter(m =>
      m.RegisterNumber !== selectedMedicine.RegisterNumber &&
      !directIds.has(m.RegisterNumber) &&
      atc && String(m.AtcCode1 || '').substring(0, 4) === atc
    ).slice(0, 20);

    return { direct, therapeutic };
  }, [selectedMedicine, medicines]);
}

// ── Hook: آخر عمليات البحث ──────────────────────────────────────────────────
export function useRecentSearches(recentSearchIds: string[], medicines: Medicine[]) {
  return useMemo(() =>
    recentSearchIds.map(id => medicines.find(m => m.RegisterNumber === id)).filter(Boolean) as Medicine[]
  , [recentSearchIds, medicines]);
}
