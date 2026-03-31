import { useMemo } from 'react';
import { Medicine } from '../types';

export function useAlternatives(selectedMedicine: Medicine | null, medicines: Medicine[]) {
  return useMemo(() => {
    if (!selectedMedicine) return { direct: [], therapeutic: [] };

    const isFood = selectedMedicine['Product type'] === 'Food';

    if (isFood) {
      // ── منطق Food: المكونات بغض النظر عن التركيز ──────────────────────
      // نقسم المادة الفعالة على فاصلة ونشيل التركيزات الرقمية
      function extractIngredients(sciName: string): string[] {
        return String(sciName || '')
          .split(',')
          .map(s => s.trim().toLowerCase().replace(/[\d.,]+\s*(mg|mcg|iu|g|ml|%|μg|µg|units?)?(\s|$)/gi, '').trim())
          .filter(s => s.length > 2);
      }

      const myIngredients = extractIngredients(selectedMedicine['Scientific Name']);

      // Direct: نفس المواد الفعالة بالاسم (بغض النظر عن التركيز)
      const direct = medicines.filter(m => {
        if (m.RegisterNumber === selectedMedicine.RegisterNumber) return false;
        if (m['Product type'] !== 'Food') return false;
        const theirIngredients = extractIngredients(m['Scientific Name']);
        // نفس العدد من المكونات الرئيسية
        if (myIngredients.length === 0 || theirIngredients.length === 0) return false;
        const shared = myIngredients.filter(i => theirIngredients.some(t => t.includes(i) || i.includes(t)));
        // لو عندهم على الأقل أعلى 2 مواد مشتركة → direct
        return shared.length >= Math.min(2, myIngredients.length);
      }).slice(0, 20);

      const directIds = new Set(direct.map(m => m.RegisterNumber));

      // Therapeutic: 3 مواد مشتركة أو أكثر (بغض النظر عن التركيز)
      const therapeutic = medicines.filter(m => {
        if (m.RegisterNumber === selectedMedicine.RegisterNumber) return false;
        if (directIds.has(m.RegisterNumber)) return false;
        if (m['Product type'] !== 'Food') return false;
        const theirIngredients = extractIngredients(m['Scientific Name']);
        if (theirIngredients.length === 0) return false;
        const shared = myIngredients.filter(i => theirIngredients.some(t => t.includes(i) || i.includes(t)));
        return shared.length >= 3;
      }).slice(0, 20);

      return { direct, therapeutic };
    }

    // ── المنطق العادي للأدوية والمكملات ─────────────────────────────────
    const sciName = String(selectedMedicine['Scientific Name']).toLowerCase();
    const strength = String(selectedMedicine.Strength).toLowerCase();
    const form = String(selectedMedicine.PharmaceuticalForm).toLowerCase();
    const atc = String(selectedMedicine.AtcCode1 || '').substring(0, 4);

    const direct = medicines.filter(m =>
      m.RegisterNumber !== selectedMedicine.RegisterNumber &&
      String(m['Scientific Name']).toLowerCase() === sciName &&
      String(m.Strength).toLowerCase() === strength &&
      String(m.PharmaceuticalForm).toLowerCase() === form
    );

    const therapeutic = medicines.filter(m =>
      m.RegisterNumber !== selectedMedicine.RegisterNumber &&
      !direct.find(d => d.RegisterNumber === m.RegisterNumber) &&
      atc && String(m.AtcCode1 || '').substring(0, 4) === atc
    ).slice(0, 20);

    return { direct, therapeutic };
  }, [selectedMedicine, medicines]);
}

export function useRecentSearches(recentSearchIds: string[], medicines: Medicine[]) {
  return useMemo(() =>
    recentSearchIds.map(id => medicines.find(m => m.RegisterNumber === id)).filter(Boolean) as Medicine[]
  , [recentSearchIds, medicines]);
}
