import { abbreviateForm } from '../utils/formAbbrev';
import React, { useMemo, useState } from 'react';
import { Medicine, TFunction, Language, InsuranceDrug } from '../types';
import AlternativeIcon from './icons/AlternativeIcon';
import StarIcon from './icons/StarIcon';

export const getIngredientsList = (medicine: Medicine): { name: string; strength: string }[] => {
    const sciNames = String(medicine['Scientific Name'] || '').split(',').map(s => s.trim());
    const strengths = String(medicine.Strength || '').split(',').map(s => s.trim());
    if (sciNames.length === 0 || (sciNames.length === 1 && sciNames[0] === 'N/A')) return [];
    return sciNames.map((name, index) => ({ name, strength: strengths[index] || strengths[0] || '' }));
};
const KNOWN_UNITS_RE = /\b(mg|ml|g|mcg|ug|iu|units?|mmol|%|mcg\/ml|mg\/ml|mg\/g|g\/ml|mg\/dose|iu\/ml)\b/i;
export const parseIngredients = (medicine: Medicine): { name: string; strength: string }[] => {
    const sciNames = String(medicine['Scientific Name'] || '').split(',').map(s => s.trim()).filter(Boolean);
    const strengths = String(medicine.Strength || '').split(',').map(s => s.trim());
    const unit = String(medicine.StrengthUnit || '').trim();
    if (sciNames.length === 0 || (sciNames.length === 1 && sciNames[0].toUpperCase() === 'N/A')) return [];
    return sciNames.map((name, i) => {
        const s = (strengths[i] || strengths[0] || '').trim();
        if (!s) return { name, strength: '' };
        const display = (!KNOWN_UNITS_RE.test(s) && unit) ? `${s} ${unit}` : s;
        return { name, strength: display };
    });
};
export const zipIngredients = (medicine: Medicine): string => {
    const items = parseIngredients(medicine);
    if (items.length === 0 || items.length > 3) return '';
    return items.map(i => i.strength ? `${i.name} ${i.strength}` : i.name).join(' · ');
};
export const getIngredientsCount = (medicine: Medicine): number => parseIngredients(medicine).length;
export const getAllIngredients = (medicine: Medicine): string => {
    return parseIngredients(medicine).map(i => i.strength ? `${i.name} ${i.strength}` : i.name).join(' · ');
};
export const zipIngredientsWithStrength = (medicine: Medicine): string => {
    const sciNames = String(medicine['Scientific Name'] || '').split(',').map(s => s.trim()).filter(Boolean);
    const strengths = String(medicine.Strength || '').split(',').map(s => s.trim());
    if (sciNames.length === 0 || (sciNames.length === 1 && sciNames[0].toUpperCase() === 'N/A')) return '';
    return sciNames.map((name, i) => {
        const s = (strengths[i] || strengths[0] || '').trim();
        if (!s) return name;
        return `${name} ${s}`;
    }).join(' · ');
};

interface MedicineCardProps {
  medicine: Medicine;
  onShortPress: () => void;
  onLongPress: (medicine: Medicine) => void;
  onFindAlternative: (medicine: Medicine) => void;
  isFavorite: boolean;
  onToggleFavorite: (medicineId: string) => void;
  onToggleCompare?: (medicine: Medicine) => void;
  isInCompare?: boolean;
  onImageClick?: () => void;
  t: TFunction;
  language: Language;
  imageRight?: boolean;
  coveredAtcSet?: Set<string>;
  coveredSciNorms?: Set<string>;
}

const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine, onShortPress, onLongPress, onFindAlternative,
  isFavorite, onToggleFavorite, onToggleCompare, isInCompare = false, onImageClick, t, language,
  coveredAtcSet, coveredSciNorms,
}) => {
  const price = parseFloat(medicine['Public price']);
  const pressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = React.useRef(false);
  const touchStartPos = React.useRef({ x: 0, y: 0 });
  const [starPop, setStarPop] = useState(false);
  const [pressed, setPressed] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    isLongPress.current = false;
    setPressed(true);
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    pressTimer.current = setTimeout(() => { isLongPress.current = true; setPressed(false); onLongPress(medicine); }, 700);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) { if (pressTimer.current) clearTimeout(pressTimer.current); isLongPress.current = false; setPressed(false); }
  };
  const handleTouchEnd = () => { if (pressTimer.current) clearTimeout(pressTimer.current); setPressed(false); };
  const handleClick = () => { if (!isLongPress.current) onShortPress(); };
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStarPop(true);
    setTimeout(() => setStarPop(false), 300);
    onToggleFavorite(medicine.RegisterNumber);
  };

  const ingredientsString = useMemo(() => zipIngredients(medicine), [medicine]);
  const ingredientCount = useMemo(() => getIngredientsCount(medicine), [medicine]);
  const ar = language === 'ar';
  const hasPrice = price > 0 && !isNaN(price);

  // Insurance coverage — O(1) exact match only, no supplements/food
  const isCovered = useMemo(() => {
    if (!coveredAtcSet && !coveredSciNorms) return null;
    // Supplements and food are never covered
    const ptype = String(medicine['Product type'] || '').toLowerCase();
    if (ptype === 'supplement' || ptype === 'food' || ptype === 'supplements') return false;

    const JUNK = new Set(['mg','ml','g','mcg','iu','kg','tab','caps','solution','suspension','oral','vial','ampoule','tablet','capsule']);
    const norm = (s: string) => s.toLowerCase()
      .replace(/\d+(\.\d+)?\s*(mg|ml|g|mcg|iu|kg|tablet|capsule|cap|tab|softgel|%)\b/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/).filter(t => t.length > 1 && !JUNK.has(t))
      .join(' ').trim();

    // ATC exact prefix match
    const atc = String(medicine.AtcCode1 || '').trim();
    if (atc && coveredAtcSet) {
      for (const code of coveredAtcSet) {
        if (code.length >= 4 && (atc === code || atc.startsWith(code.substring(0, 4)))) return true;
      }
    }

    // Scientific name — exact normalized match only (no partial)
    if (coveredSciNorms) {
      const sciNorm = norm(String(medicine['Scientific Name'] || ''));
      if (sciNorm.length >= 4 && coveredSciNorms.has(sciNorm)) return true;
    }

    return false;
  }, [medicine, coveredAtcSet, coveredSciNorms]);

  const initial1 = (medicine['Trade Name'] || '?')[0].toUpperCase();
  const initial2 = (medicine['Trade Name'] || '??')[1]?.toUpperCase() || '';

  // Deterministic pastel from name
  const colorPairs = [
    ['#e8f4f0', '#006a60'], ['#eef2ff', '#4338ca'], ['#fdf4ff', '#9333ea'],
    ['#fff7ed', '#c2410c'], ['#f0f9ff', '#0369a1'], ['#fefce8', '#a16207'],
    ['#fdf2f8', '#be185d'], ['#f0fdf4', '#15803d'],
  ];
  const ci = medicine['Trade Name'].charCodeAt(0) % colorPairs.length;
  const [avatarBg, avatarFg] = colorPairs[ci] as [string, string];

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        background: 'var(--surface)',
        borderRadius: 18,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.986)' : 'scale(1)',
        transition: 'transform 120ms ease-out, box-shadow 120ms ease',
        boxShadow: pressed
          ? 'none'
          : '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ display: 'flex', gap: 12, padding: '12px 14px 12px' }}>

        {/* Image / Letter Avatar */}
        {medicine.imgBox ? (
          <div
            onClick={onImageClick ? e => { e.stopPropagation(); onImageClick(); } : undefined}
            style={{
              flexShrink: 0, width: 56, height: 56,
              background: '#f8f9fa',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: onImageClick ? 'zoom-in' : 'default',
              overflow: 'hidden',
            }}
          >
            <img src={medicine.imgBox} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
          </div>
        ) : (
          <div style={{
            flexShrink: 0, width: 56, height: 56,
            background: avatarBg,
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontSize: 17, fontWeight: 900, color: avatarFg,
              letterSpacing: '-0.02em', lineHeight: 1,
              fontFamily: "'IBM Plex Sans', system-ui",
            }}>
              {initial1}{initial2}
            </span>
          </div>
        )}

        {/* Info */}
        <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
          {medicine['Manufacture Name'] && (
            <p style={{
              fontSize: 9.5, fontWeight: 600, color: 'var(--text-subtle)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1,
            }}>
              {medicine['Manufacture Name']}
            </p>
          )}
          <h2 style={{
            fontSize: 15, fontWeight: 800, color: 'var(--text)',
            lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}>
            {medicine['Trade Name']}
          </h2>
          {/* Insurance badge */}
          {isCovered !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '2px 7px', borderRadius: 20,
                background: isCovered ? 'rgba(21,128,61,0.08)' : 'rgba(190,18,60,0.07)',
                border: `1px solid ${isCovered ? 'rgba(21,128,61,0.2)' : 'rgba(190,18,60,0.18)'}`,
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: isCovered ? '#15803d' : '#be123c',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 9.5, fontWeight: 700,
                  color: isCovered ? '#15803d' : '#be123c',
                  letterSpacing: '0.01em',
                }}>
                  {isCovered
                    ? (ar ? 'مغطى تأمينياً' : 'Covered')
                    : (ar ? 'غير مغطى' : 'Not covered')}
                </span>
              </div>
            </div>
          )}
          {ingredientsString ? (
            <p style={{
              fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: '100%',
            }} dir="ltr">
              {ingredientsString}
            </p>
          ) : ingredientCount > 3 ? (
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 6,
              background: 'var(--surface-2)', color: 'var(--text-muted)',
              display: 'inline-block',
            }}>
              {ingredientCount} {ar ? 'مكونات' : 'ingredients'}
            </span>
          ) : null}
          {medicine.PharmaceuticalForm && (
            <p style={{
              fontSize: 10.5, color: 'var(--text-subtle)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              lineHeight: 1,
            }}>
              {medicine.PackageSize
                ? `${medicine.PackageSize}${medicine.SizeUnit ? ' ' + medicine.SizeUnit : ''} · ${abbreviateForm(medicine.PharmaceuticalForm)}`
                : abbreviateForm(medicine.PharmaceuticalForm)}
            </p>
          )}
        </div>

        {/* Right: price + actions */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', justifyContent: 'space-between',
          flexShrink: 0, gap: 4,
        }}>
          {/* Price */}
          {hasPrice ? (
            <div style={{ textAlign: 'center', minWidth: 48 }}>
              <span style={{
                fontSize: 15, fontWeight: 900, color: '#0369a1',
                display: 'block', lineHeight: 1, letterSpacing: '-0.02em',
              }}>
                {price.toFixed(2)}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 600,
                color: '#0369a1', opacity: 0.65,
                display: 'block', marginTop: 2,
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {ar ? 'ر.س' : 'SAR'}
              </span>
            </div>
          ) : <div />}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 0 }}>
            <button
              onClick={e => { e.stopPropagation(); onFindAlternative(medicine); }}
              style={{
                width: 32, height: 32, borderRadius: 10, border: 'none',
                background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-subtle)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{ width: 17, height: 17 }}><AlternativeIcon /></div>
            </button>
            <button
              onClick={handleFavorite}
              style={{
                width: 32, height: 32, borderRadius: 10, border: 'none',
                background: isFavorite ? 'rgba(245,158,11,0.08)' : 'transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isFavorite ? '#f59e0b' : 'var(--text-subtle)',
                transform: starPop ? 'scale(1.4)' : 'scale(1)',
                transition: 'transform 120ms cubic-bezier(0.34,1.56,0.64,1)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{ width: 17, height: 17 }}><StarIcon isFilled={isFavorite} /></div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default React.memo(MedicineCard);
