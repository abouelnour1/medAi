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

// Returns true if the scientific name contains multiple active ingredients
// (joined by + / and / مع / و)
function isCompound(normalizedName: string): boolean {
  return /\b(and|with)\b|\+/.test(normalizedName) || normalizedName.split(/\s+/).length > 3;
}

// Split compound name into individual ingredient tokens for partial-match guard
function splitIngredients(normalizedName: string): string[] {
  return normalizedName
    .split(/\s*(\+|and|with)\s*/i)
    .map(s => s.trim())
    .filter(s => s.length > 3);
}

export function getInsurancePolicies(medicine: Medicine, insuranceData: InsuranceDrug[]): InsuranceDrug[] {
  if (!insuranceData.length) return [];
  const sciNorm = normalizeForMatch(String(medicine['Scientific Name'] || ''));
  const atc = String(medicine.AtcCode1 || '').trim();
  const compound = isCompound(sciNorm);
  const parts = compound ? splitIngredients(sciNorm) : [];

  return insuranceData.filter(p => {
    const pNorm = normalizeForMatch(p.scientificName);
    const atcMatch = atc && p.atcCode && (atc === p.atcCode || atc.startsWith(p.atcCode));

    // Exact or full-string match — always valid
    if (pNorm === sciNorm) return atcMatch || true;

    // For compound drugs: only allow substring match if the policy also covers
    // ALL parts (i.e. it's the same compound, not a single ingredient of it)
    if (compound && parts.length >= 2) {
      const policyIsCompound = isCompound(pNorm);
      if (!policyIsCompound) {
        // Policy is a single ingredient — reject partial substring matches
        // Only allow if there's an explicit ATC match
        return atcMatch;
      }
      // Both are compound — allow normal matching
      const nameMatch = sciNorm.length > 5 && (
        pNorm.includes(sciNorm) ||
        (pNorm.length > 5 && sciNorm.includes(pNorm))
      );
      return atcMatch || nameMatch;
    }

    // Single-ingredient drug: normal logic
    const nameMatch = sciNorm.length > 4 && (
      (sciNorm.length > 5 && pNorm.includes(sciNorm)) ||
      (pNorm.length > 5 && sciNorm.includes(pNorm))
    );
    return atcMatch || nameMatch;
  });
}
