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
  const sciNorm = normalizeForMatch(String(medicine['Scientific Name'] || ''));
  const atc = String(medicine.AtcCode1 || '').trim();

  return insuranceData.filter(p => {
    const pNorm = normalizeForMatch(p.scientificName);
    const atcMatch = atc && p.atcCode && (atc === p.atcCode || atc.startsWith(p.atcCode));
    const nameMatch = sciNorm.length > 4 && (
      pNorm === sciNorm ||
      (sciNorm.length > 5 && pNorm.includes(sciNorm)) ||
      (pNorm.length > 5 && sciNorm.includes(pNorm))
    );
    return atcMatch || nameMatch;
  });
}
