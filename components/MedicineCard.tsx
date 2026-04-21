import { abbreviateForm } from '../utils/formAbbrev';
import React, { useMemo, useState } from 'react';
import { Medicine, TFunction, Language } from '../types';
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
}

const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine, onShortPress, onLongPress, onFindAlternative,
  isFavorite, onToggleFavorite, onToggleCompare, isInCompare = false, onImageClick, t, language,
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

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        border: '1.5px solid var(--border)',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.975)' : 'scale(1)',
        transition: 'transform 140ms cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: pressed ? 'none' : 'var(--shadow-sm)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* brand top accent */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, var(--primary), var(--primary-light))', opacity: 0.45 }} />

      <div style={{ display: 'flex', gap: 10, padding: '10px 12px 12px' }}>

        {/* Image */}
        {medicine.imgBox ? (
          <div
            style={{ flexShrink: 0, width: 60, height: 60, background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)', padding: 4, alignSelf: 'flex-start', cursor: onImageClick ? 'zoom-in' : 'default', [ar ? 'marginLeft' : 'marginRight']: 'auto' } as React.CSSProperties}
            onClick={onImageClick ? (e) => { e.stopPropagation(); onImageClick(); } : undefined}
          >
            <img src={medicine.imgBox} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        ) : (
          <div style={{ flexShrink: 0, width: 60, height: 60, background: 'var(--primary-ultra)', borderRadius: 12, border: '1px solid rgba(0,106,96,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', [ar ? 'marginLeft' : 'marginRight']: 'auto' } as React.CSSProperties}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--primary-mid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
            </svg>
          </div>
        )}

        {/* Info */}
        <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1 }}>
            {medicine['Manufacture Name'] || ''}
          </p>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {medicine['Trade Name']}
          </h2>
          {ingredientsString ? (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 2 } as React.CSSProperties} dir="ltr">
              {ingredientsString}
            </p>
          ) : ingredientCount > 3 ? (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'var(--primary-ultra)', color: 'var(--primary)', display: 'inline-block', marginBottom: 2 }}>
              {ingredientCount} {ar ? 'مواد فعالة' : 'ingredients'}
            </span>
          ) : <div style={{ minHeight: 4 }} />}
          {medicine.PharmaceuticalForm && (
            <span style={{ fontSize: 10, color: 'var(--text-subtle)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 6, display: 'inline-block', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {medicine.PackageSize ? `${medicine.PackageSize}${medicine.SizeUnit ? ' ' + medicine.SizeUnit : ''} · ${abbreviateForm(medicine.PharmaceuticalForm)}` : abbreviateForm(medicine.PharmaceuticalForm)}
            </span>
          )}
        </div>

        {/* Right: price + buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0, width: 62, minWidth: 62 }}>
          {hasPrice ? (
            <div style={{ background: 'linear-gradient(135deg, rgba(0,106,96,0.08), rgba(0,168,150,0.05))', border: '1px solid rgba(0,106,96,0.12)', borderRadius: 10, padding: '5px 6px', textAlign: 'center', width: 60 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--primary)', display: 'block', lineHeight: 1, whiteSpace: 'nowrap' }}>{price.toFixed(2)}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--primary)', opacity: 0.6, display: 'block', marginTop: 1 }}>{ar ? 'ر.س' : 'SAR'}</span>
            </div>
          ) : <div style={{ width: 60, height: 36 }} />}

          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button onClick={e => { e.stopPropagation(); onFindAlternative(medicine); }}
              style={{ padding: 8, borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--text-subtle)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
              <div style={{ width: 18, height: 18 }}><AlternativeIcon /></div>
            </button>
            <button onClick={handleFavorite}
              style={{ padding: 8, borderRadius: 10, border: 'none', cursor: 'pointer', background: isFavorite ? 'rgba(245,158,11,0.1)' : 'transparent', color: isFavorite ? '#f59e0b' : 'var(--text-subtle)', transform: starPop ? 'scale(1.35)' : 'scale(1)', transition: 'transform 100ms cubic-bezier(0.34,1.56,0.64,1)', WebkitTapHighlightColor: 'transparent' }}>
              <div style={{ width: 18, height: 18 }}><StarIcon isFilled={isFavorite} /></div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default React.memo(MedicineCard);
