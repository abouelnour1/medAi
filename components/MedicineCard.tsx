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

const KNOWN_UNITS_RE = /\b(mg|ml|g|mcg|ug|iu|units?|mmol|%|μg|µg|mcg\/ml|mg\/ml|mg\/g|g\/ml|mg\/dose|iu\/ml)\b/i;

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
  t: TFunction;
  language: Language;
}

const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine, onShortPress, onLongPress, onFindAlternative,
  isFavorite, onToggleFavorite, t, language
}) => {
  const price = parseFloat(medicine['Public price']);
  const pressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = React.useRef(false);
  const touchStartPos = React.useRef({ x: 0, y: 0 });
  const [starPop, setStarPop] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    isLongPress.current = false;
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    pressTimer.current = setTimeout(() => { isLongPress.current = true; onLongPress(medicine); }, 700);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) { if (pressTimer.current) clearTimeout(pressTimer.current); isLongPress.current = false; }
  };
  const handleTouchEnd = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };
  const handleClick = () => { if (!isLongPress.current) onShortPress(); };
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStarPop(true);
    setTimeout(() => setStarPop(false), 300);
    onToggleFavorite(medicine.RegisterNumber);
  };

  const ingredientsString = useMemo(() => zipIngredients(medicine), [medicine]);
  const ingredientCount   = useMemo(() => getIngredientsCount(medicine), [medicine]);
  const isControlled = medicine['Product Control']?.toLowerCase() === 'controlled';
  const isHumanMed   = medicine['Product type'] === 'Human';
  const isGeneric    = medicine.DrugType?.toLowerCase().includes('generic');
  const isRx         = medicine['Legal Status'] === 'Prescription';
  const ar           = language === 'ar';
  const hasPrice     = price > 0 && !isNaN(price);

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm active:scale-[0.98] transition-all duration-150 cursor-pointer overflow-hidden"
    >
      <div className="flex gap-3 p-4">

        {/* ── صورة العلبة ── */}
        {medicine.imgBox ? (
          <div className="flex-shrink-0 w-[72px] h-[72px] bg-slate-50 dark:bg-slate-800/60 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700/40 p-1.5 self-start">
            <img src={medicine.imgBox} alt="" className="w-full h-full object-contain" />
          </div>
        ) : (
          /* placeholder لو مفيش صورة — يحافظ على المحاذاة */
          <div className="flex-shrink-0 w-[72px] h-[72px] bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/20 dark:to-teal-900/10 rounded-2xl border border-teal-100/60 dark:border-teal-800/30 flex items-center justify-center self-start">
            <svg className="w-7 h-7 text-teal-300 dark:text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
            </svg>
          </div>
        )}

        {/* ── المعلومات الرئيسية ── */}
        <div className="flex-grow min-w-0 flex flex-col justify-between">

          {/* الصف الأول: اسم الشركة */}
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate leading-none mb-1.5">
            {medicine['Manufacture Name'] || '—'}
          </p>

          {/* الاسم التجاري — أكبر وأوضح */}
          <h2 className="text-[17px] font-black text-slate-800 dark:text-white leading-snug break-words mb-1">
            {medicine['Trade Name']}
          </h2>

          {/* المادة الفعالة */}
          {ingredientsString ? (
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-2.5 leading-snug line-clamp-2" dir="ltr">
              {ingredientsString}
            </p>
          ) : ingredientCount > 3 ? (
            <div className="mb-2.5">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400">
                {ingredientCount} {ar ? 'مواد فعالة' : 'ingredients'}
              </span>
            </div>
          ) : (
            <div className="mb-2.5" />
          )}

          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">

            {/* Rx / OTC */}
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
              isRx
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/25 dark:text-rose-400'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400'
            }`}>
              {isRx ? 'Rx' : 'OTC'}
            </span>

            {/* Brand / Generic */}
            {isHumanMed && medicine.DrugType && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                isGeneric
                  ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  : 'bg-sky-50 text-sky-600 dark:bg-sky-900/25 dark:text-sky-400'
              }`}>
                {isGeneric ? (ar ? 'جنيس' : 'Generic') : (ar ? 'براند' : 'Brand')}
              </span>
            )}

            {/* Controlled */}
            {isControlled && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                {ar ? 'مضبوط' : 'Controlled'}
              </span>
            )}

            {/* الشكل الصيدلاني + حجم العبوة */}
            {medicine.PharmaceuticalForm && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg truncate max-w-[100px]">
                {medicine.PackageSize
                  ? `${medicine.PackageSize}${medicine.SizeUnit ? ' ' + medicine.SizeUnit : ''} · ${medicine.PharmaceuticalForm}`
                  : medicine.PharmaceuticalForm}
              </span>
            )}

            {/* الطعم */}
            {medicine.liquidTaste && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 flex items-center gap-1">
                👅 {medicine.liquidTaste}
              </span>
            )}
          </div>
        </div>

        {/* ── العمود اليمين: السعر + الأزرار ── */}
        <div className="flex flex-col items-end justify-between flex-shrink-0 self-stretch ml-1">

          {/* السعر */}
          {hasPrice ? (
            <div className="bg-primary/8 dark:bg-primary/15 px-3 py-2.5 rounded-xl text-center min-w-[64px]">
              <span className="text-[17px] font-black text-primary dark:text-primary-light block leading-none">
                {price.toFixed(2)}
              </span>
              <span className="text-[9px] font-semibold text-primary/60 dark:text-primary-light/60 block mt-0.5">
                {ar ? 'ر.س' : 'SAR'}
              </span>
            </div>
          ) : (
            <div className="px-3 py-2.5 rounded-xl min-w-[64px] text-center">
              <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
            </div>
          )}

          {/* أزرار البديل والمفضلة */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={e => { e.stopPropagation(); onFindAlternative(medicine); }}
              className="p-2.5 text-slate-300 dark:text-slate-600 hover:text-primary dark:hover:text-primary rounded-xl transition-colors active:scale-90"
            >
              <div className="w-5 h-5"><AlternativeIcon /></div>
            </button>
            <button
              onClick={handleFavorite}
              className={`p-2.5 rounded-xl transition-colors ${
                isFavorite
                  ? 'text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                  : 'text-slate-300 dark:text-slate-600'
              }`}
              style={{ transform: starPop ? 'scale(1.45)' : 'scale(1)', transition: 'transform 150ms ease' }}
            >
              <div className="w-5 h-5"><StarIcon isFilled={isFavorite} /></div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default React.memo(MedicineCard);
