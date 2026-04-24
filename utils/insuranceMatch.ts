import { InsuranceDrug, Medicine } from '../types';

const JUNK = new Set(['mg','ml','g','mcg','iu','kg','tab','caps','solution','suspension','oral','vial','ampoule','tablet','capsule']);

export function normalizeForMatch(name: string): string {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\d+\s*(mg|ml|g|mcg|iu|kg|tablet|capsule|cap|tab|softgel)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(s => s.length > 1 && !JUNK.has(s))
    .join(' ')
    .trim();
}

export function getInsurancePolicies(medicine: Medicine, insuranceData: InsuranceDrug[]): InsuranceDrug[] {
  if (!insuranceData.length) return [];

  // Skip supplements and food — never covered
  const ptype = String((medicine as any)['Product type'] || '').toLowerCase();
  if (ptype === 'supplement' || ptype === 'food' || ptype === 'supplements') return [];

  const JUNK = new Set(['mg','ml','g','mcg','iu','kg','tab','caps','solution','suspension','oral','vial','ampoule','tablet','capsule','hard','soft']);

  const normSci = (s: string) => s.toLowerCase()
    .replace(/\d+(\.\d+)?\s*(mg|ml|g|mcg|iu|kg|tablet|capsule|cap|tab|softgel|%)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/).filter(t => t.length > 1 && !JUNK.has(t))
    .join(' ').trim();

  const atc = String((medicine as any).AtcCode1 || '').trim();
  const sciNorm = normSci(String((medicine as any)['Scientific Name'] || ''));

  return insuranceData.filter(p => {
    // 1. ATC descriptor code match (most reliable)
    if (atc && p.atcCode) {
      const pAtc = p.atcCode.trim();
      if (pAtc.length >= 4 && (atc === pAtc || atc.startsWith(pAtc.substring(0, 4)))) return true;
    }
    // 2. Scientific name exact normalized match only (no partial)
    if (sciNorm.length >= 4 && p.scientificName) {
      const pNorm = normSci(p.scientificName);
      if (pNorm === sciNorm) return true;
    }
    return false;
  });
}
