
import { TFunction } from '../types';
import { getPharmGroup, PHARM_GROUP_LABELS } from './pharmaceuticalGroups';

interface FormGroup {
  label: string;
  keywords: string[];
}

export const groupPharmaceuticalForms = (forms: string[], _t: TFunction) => {
  const grouped: Record<string, Set<string>> = {};

  forms.forEach(form => {
    const group = getPharmGroup(form);
    const meta  = PHARM_GROUP_LABELS[group];
    const label = `${meta.icon} ${meta.ar}`;
    if (!grouped[label]) grouped[label] = new Set();
    grouped[label].add(form);
  });

  const ORDER = ['💊','🧪','💉','🧴','🫁','🔵','👁️','👃','🔴','📦'];
  return Object.entries(grouped)
    .sort(([a],[b]) => {
      const ai = ORDER.findIndex(o => a.startsWith(o));
      const bi = ORDER.findIndex(o => b.startsWith(o));
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([label, opts]) => ({ label, options: Array.from(opts).sort() }));
};


/**
 * تنسيق السعر برمز الريال ﷼
 * مثال: 25.50 → "25.50 ﷼"
 */
export function formatPrice(price: string | number | undefined | null, language?: string): string {
  const p = parseFloat(String(price || '0'));
  if (!p || isNaN(p)) return '';
  return `${p.toFixed(2)} ﷼`;
}

export function formatPriceOrDash(price: string | number | undefined | null): string {
  const p = parseFloat(String(price || '0'));
  if (!p || isNaN(p)) return '—';
  return `${p.toFixed(2)} ﷼`;
}
