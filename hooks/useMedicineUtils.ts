import { useMemo } from 'react';
import { Medicine } from '../types';

export function useAlternatives(selectedMedicine: Medicine | null, medicines: Medicine[]) {
  return useMemo(() => {
    if (!selectedMedicine) return { direct: [], therapeutic: [] };
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
