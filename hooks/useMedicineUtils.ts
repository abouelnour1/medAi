import { useMemo } from 'react';
import { Medicine } from '../types';

// ── Helper: تنظيف اسم مكون واحد ─────────────────────────────────────────────
function normalizeIngredient(s: string): string {
  return s
    .toLowerCase()
    .replace(/[-_]/g, ' ')                                                          // hyphen -> space  (Omega-3 = Omega 3)
    .replace(/\d+(\.\d+)?\s*(mg|g|mcg|ug|µg|iu|ui|%|ml|international\s*unit)?/gi, '') // شيل الأرقام والوحدات
    .replace(/\s+/g, ' ')                                                           // collapse spaces
    .trim();
}

// ── Helper: استخراج مكونات منتج غذائي من الاسم العلمي ───────────────────────
function extractFoodIngredients(scientificName: string): string[] {
  return scientificName
    .split(/[,،+&\/|;]+/)
    .map(normalizeIngredient)
    .filter(s => s.length > 2);
}

// ── Helper: عدد المكونات المشتركة ────────────────────────────────────────────
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
        String(m['Scientific Name'] || '').length > 2
      );

      const directList:     { m: Medicine; shared: number }[] = [];
      const therapeuticList: { m: Medicine; shared: number }[] = [];
      const directIds = new Set<string>();

      for (const m of candidates) {
        const theirIngredients = extractFoodIngredients(String(m['Scientific Name'] || ''));
        if (theirIngredients.length === 0) continue;
        const shared = countShared(myIngredients, theirIngredients);

        /**
         * منطق البدائل المباشرة للـ Food:
         *
         * القاعدة: لو المادة الفعالة في المنتجين واحدة (أو أكتر) وكل
         *          مكونات المنتج الأصغر موجودة في المنتج التاني
         *
         * مثال 1: A=[omega3]  + B=[omega3]         → shared=1, min=1 → direct ✓
         * مثال 2: A=[vit-c, zinc] + B=[vit-c, zinc] → shared=2, min=2 → direct ✓
         * مثال 3: A=[vit-c, zinc] + B=[vit-c]       → shared=1, min(2,1)=1 → direct ✓
         *         (لأن B جزء من A أو العكس)
         * مثال 4: A=[vit-c, zinc, mg] + B=[vit-c, zinc, mg, vit-d] → shared=3, min=3 → direct ✓
         * مثال 5: A=[vit-c] + B=[zinc]              → shared=0 → لا
         * مثال 6: A=[vit-c, zinc] + B=[zinc, mg]    → shared=1 < min(2,2)=2 → therapeutic
         *
         * الشرط: shared >= min(myCount, theirCount)
         *        يضمن إن المنتج الأصغر مكوناته كلها موجودة في الأكبر
         */
        const minCount = Math.min(myIngredients.length, theirIngredients.length);

        if (shared >= minCount && shared > 0) {
          directList.push({ m, shared });
          directIds.add(m.RegisterNumber);
        } else if (shared >= 2 && !directIds.has(m.RegisterNumber)) {
          // Therapeutic: مكونان مشتركان على الأقل لكن مش كل مكونات الأصغر
          therapeuticList.push({ m, shared });
        }
      }

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
