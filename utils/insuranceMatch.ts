import { InsuranceDrug, Medicine } from '../types';

const JUNK = new Set(['mg','ml','g','mcg','iu','kg','tab','caps','solution','suspension','oral','vial','ampoule','tablet','capsule','hard','soft','softgel','injection','infusion','powder','cream','gel','ointment','syrup','drops']);

export function normalizeForMatch(name: string): string {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\d+(\.\d+)?\s*(mg|ml|g|mcg|iu|kg|tablet|capsule|cap|tab|softgel)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(s => s.length > 1 && !JUNK.has(s))
    .join(' ')
    .trim();
}

// Normalize scientific name: lowercase, remove dosage numbers, remove punctuation
function normSci(s: string): string {
  if (!s) return '';
  return s.toLowerCase()
    .replace(/[,\/+&]/g, ' ')   // split combinaton drugs: AMOXICILLIN,CLAVULANIC → amoxicillin clavulanic
    .replace(/\d+(\.\d+)?\s*(mg|ml|g|mcg|iu|kg|%)\b/gi, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/).filter(t => t.length > 1 && !JUNK.has(t))
    .join(' ').trim();
}

// First active ingredient only (before comma/slash/plus)
function firstIngredient(s: string): string {
  return s.toLowerCase().split(/[,\/+&]/)[0].trim()
    .replace(/\d+(\.\d+)?\s*(mg|ml|g|mcg|iu|kg|%)\b/gi, '')
    .replace(/[^a-z\s]/g, ' ').trim()
    .split(/\s+/).filter(t => t.length > 2 && !JUNK.has(t)).join(' ').trim();
}

export function getInsurancePolicies(medicine: Medicine, insuranceData: InsuranceDrug[]): InsuranceDrug[] {
  if (!insuranceData.length) return [];

  const ptype = String((medicine as any)['Product type'] || '').toLowerCase();
  if (ptype === 'supplement' || ptype === 'food' || ptype === 'supplements') return [];

  const medAtc    = String((medicine as any).AtcCode1 || '').trim().toUpperCase();
  const medSci    = normSci(String((medicine as any)['Scientific Name'] || ''));
  const medFirst  = firstIngredient(String((medicine as any)['Scientific Name'] || ''));
  const medDesc   = String((medicine as any)['Description Code'] || '').trim();

  return insuranceData.filter(p => {
    // 1. Description Code exact match (most precise)
    if (medDesc && p.descriptionCode && p.descriptionCode.trim() === medDesc) return true;

    // 2. Full ATC code exact match (7 chars) — NOT prefix
    if (medAtc && p.atcCode) {
      const pAtc = p.atcCode.trim().toUpperCase();
      if (medAtc === pAtc) return true;
    }

    // 3. Scientific name: full normalized match
    if (medSci.length >= 4 && p.scientificName) {
      const pSci = normSci(p.scientificName);
      if (pSci === medSci) return true;
    }

    // 4. First active ingredient exact match (for combo drugs)
    if (medFirst.length >= 4 && p.scientificName) {
      const pFirst = firstIngredient(p.scientificName);
      if (pFirst === medFirst && pFirst.length >= 4) return true;
    }

    return false;
  });
}
