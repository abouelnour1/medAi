import { useMemo } from 'react';
import { Medicine } from '../types';

export function useAlternatives(selectedMedicine: Medicine | null, medicines: Medicine[]) {
  return useMemo(() => {
    if (!selectedMedicine) return { direct: [], therapeutic: [] };

    const isFood = selectedMedicine['Product type'] === 'Food';

    if (isFood) {
      // ── منطق خاص للـ Food ──────────────────────────────────────────────
      // الـ Food بيكون من مكونات كتير — نستخدم منطق مختلف:
      // ١. نفس المادة الفعالة (أي تركيز) → direct
      // ٢. 3 مواد مشتركة أو أكثر → therapeutic
      const sciName = String(selectedMedicine['Scientific Name'] || '').toLowerCase();
      const myIngredients = sciName.split(',').map(s => s.trim()).filter(Boolean);

      // Direct: نفس المادة الفعالة (بغض النظر عن التركيز)
      const direct = medicines.filter(m =>
        m.RegisterNumber !== selectedMedicine.RegisterNumber &&
        m['Product type'] === 'Food' &&
        String(m['Scientific Name'] || '').toLowerCase() === sciName
      ).slice(0, 20);

      const directIds = new Set(direct.map(m => m.RegisterNumber));

      // Therapeutic: 3 مواد مشتركة أو أكثر (بغض النظر عن التركيز)
      const therapeutic = medicines.filter(m => {
        if (m.RegisterNumber === selectedMedicine.RegisterNumber) return false;
        if (directIds.has(m.RegisterNumber)) return false;
        if (m['Product type'] !== 'Food') return false;
        const theirIngredients = String(m['Scientific Name'] || '').toLowerCase()
          .split(',').map(s => s.trim()).filter(Boolean);
        const shared = myIngredients.filter(i => theirIngredients.includes(i));
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
