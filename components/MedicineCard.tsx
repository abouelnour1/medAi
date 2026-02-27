
import React, { useMemo, useState } from 'react';
import { hapticLight } from '../utils/haptics';
import { Medicine, TFunction, Language } from '../types';
import AlternativeIcon from './icons/AlternativeIcon';
import StarIcon from './icons/StarIcon';

export const getIngredientsList = (medicine: Medicine): { name: string; strength: string }[] => {
    const sciNames = String(medicine['Scientific Name'] || '').split(',').map(s => s.trim());
    const strengths = String(medicine.Strength || '').split(',').map(s => s.trim());
    if (sciNames.length === 0 || (sciNames.length === 1 && sciNames[0] === 'N/A')) return [];
    return sciNames.map((name, index) => ({ name, strength: strengths[index] || strengths[0] || '' }));
};

// الوحدات المعروفة — لو التركيز ينتهي بواحدة منهم ماتظهرش مرة تانية
const KNOWN_UNITS = /\b(mg|ml|g|mcg|ug|iu|unit|units|mmol|mol|meq|%|μg|µg|mcg\/ml|mg\/ml|mg\/g|g\/ml|mg\/dose|mg\/tab|mg\/cap|iu\/ml|iu\/dose)\b/i;

// يتحقق إن التركيز فيه وحدة مكتوبة صريحة
function strengthHasUnit(s: string): boolean {
    return KNOWN_UNITS.test(s);
}

export const zipIngredients = (medicine: Medicine): string => {
    const sciNames = String(medicine['Scientific Name'] || '').split(',').map(s => s.trim()).filter(Boolean);
    if (sciNames.length === 0 || (sciNames.length === 1 && sciNames[0].toUpperCase() === 'N/A')) return '';
    // لو أكتر من ٣ مواد: ماتظهرش برا (هتظهر جوه بس مع العدد)
    if (sciNames.length > 3) return '';
    return sciNames.join(' · ');
};

// للاستخدام جوه الكارت لما المواد أكتر من ٣
export const getIngredientsCount = (medicine: Medicine): number => {
    const sciNames = String(medicine['Scientific Name'] || '').split(',').map(s => s.trim()).filter(Boolean);
    if (sciNames.length === 1 && sciNames[0].toUpperCase() === 'N/A') return 0;
    return sciNames.length;
};

export const getAllIngredients = (medicine: Medicine): string => {
    const sciNames = String(medicine['Scientific Name'] || '').split(',').map(s => s.trim()).filter(Boolean);
    if (sciNames.length === 0 || (sciNames.length === 1 && sciNames[0].toUpperCase() === 'N/A')) return '';
    return sciNames.join(' · ');
};

// للاستخدام في أماكن تانية (MedicineDetail مثلاً) لو محتاجين التركيزات
export const zipIngredientsWithStrength = (medicine: Medicine): string => {
    const sciNames = String(medicine['Scientific Name'] || '').split(',').map(s => s.trim()).filter(Boolean);
    const strengths = String(medicine.Strength || '').split(',').map(s => s.trim());
    if (sciNames.length === 0 || (sciNames.length === 1 && sciNames[0].toUpperCase() === 'N/A')) return '';
    return sciNames.map((name, i) => {
        const s = (strengths[i] || strengths[0] || '').trim();
        if (!s) return name;
        // لو التركيز نفسه فيه وحدة مكتوبة (مثلاً "500mg") ماتضيفش وحدة تانية من StrengthUnit
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

  const ingredientsString  = useMemo(() => zipIngredients(medicine), [medicine]);
  const ingredientCount    = useMemo(() => getIngredientsCount(medicine), [medicine]);
  const allIngredientsStr  = useMemo(() => getAllIngredients(medicine), [medicine]);
  const isControlled = medicine['Product Control']?.toLowerCase() === 'controlled';
  const isHumanMed = medicine['Product type'] === 'Human';
  const isGeneric = medicine.DrugType?.toLowerCase().includes('generic');
  const isRx = medicine['Legal Status'] === 'Prescription';
  const ar = language === 'ar';
  const hasPrice = price > 0 && !isNaN(price);

  // Rx=أحمر | OTC=أخضر | Brand=سماوي | Generic=رمادي
  const rxStyle = isRx
    ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/25 dark:text-rose-400'
    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400';
  const typeStyle = isGeneric
    ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
    : 'bg-sky-50 text-sky-600 dark:bg-sky-900/25 dark:text-sky-400';

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm active:scale-[0.98] transition-all duration-150 cursor-pointer overflow-hidden"
    >
      {/* ══ Body ══ */}
      <div className="flex items-stretch gap-0 p-4 pb-3">

        {/* صورة */}
        {medicine.imgBox && (
          <div className="flex-shrink-0 w-14 h-14 bg-slate-50 dark:bg-slate-800/60 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700/40 p-1 mr-3 self-start">
            <img src={medicine.imgBox} alt="" className="w-full h-full object-contain" />
          </div>
        )}

        {/* Info */}
        <div className="flex-grow min-w-0">

          {/* Manufacturer */}
          <p className="text-[9px] font-semibold text-slate-300 dark:text-slate-600 uppercase tracking-widest truncate mb-1 leading-none">
            {medicine['Manufacture Name']}
          </p>

          {/* Trade name - أكبر وأوضح */}
          <h2 className="text-[15px] font-black text-slate-800 dark:text-white leading-tight break-words mb-1">
            {medicine['Trade Name']}
          </h2>

          {/* Scientific name */}
          {ingredientsString ? (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3 leading-snug line-clamp-2" dir="ltr">
              {ingredientsString}
            </p>
          ) : ingredientCount > 3 ? (
            <details className="mb-3 group">
              <summary className="text-[10px] font-bold text-primary/70 dark:text-primary/60 cursor-pointer list-none flex items-center gap-1 select-none">
                <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 5l7 7-7 7"/></svg>
                {ingredientCount} {ar ? 'مواد فعالة' : 'active ingredients'}
              </summary>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed" dir="ltr">
                {allIngredientsStr}
              </p>
            </details>
          ) : (
            <div className="mb-3" />
          )}

          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap">

            {/* Rx / OTC — لون مميز */}
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${rxStyle}`}>
              {isRx ? 'Rx' : 'OTC'}
            </span>

            {/* Brand / Generic — Brand قبل Generic */}
            {isHumanMed && medicine.DrugType && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${typeStyle}`}>
                {isGeneric ? (ar ? 'جنيس' : 'Generic') : (ar ? 'براند' : 'Brand')}
              </span>
            )}

            {/* Controlled */}
            {isControlled && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                {ar ? 'مضبوط' : 'Ctrl'}
              </span>
            )}

            {/* Form */}
            {medicine.PharmaceuticalForm && (
              <span className="text-[9px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-lg truncate max-w-[90px]">
                {medicine.PharmaceuticalForm}
              </span>
            )}
          </div>
        </div>

        {/* Right column - سعر + أزرار */}
        <div className="flex flex-col items-end justify-between flex-shrink-0 ml-3 self-stretch">

          {/* السعر - أكبر وأوضح */}
          {hasPrice ? (
            <div className="bg-primary/8 dark:bg-primary/15 px-3 py-2 rounded-xl text-center min-w-[58px]">
              <span className="text-base font-black text-primary dark:text-primary-light block leading-none">
                {price.toFixed(2)}
              </span>
              <span className="text-[8px] font-semibold text-primary/60 dark:text-primary-light/60 block mt-0.5">
                {ar ? 'ر.س' : 'SAR'}
              </span>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-xl min-w-[58px] text-center">
              <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>
            </div>
          )}

          {/* أزرار */}
          <div className="flex items-center gap-1">
            <button
              onClick={e => { e.stopPropagation(); onFindAlternative(medicine); }}
              className="p-2 text-slate-300 dark:text-slate-600 hover:text-primary dark:hover:text-primary rounded-xl transition-colors active:scale-90"
            >
              <div className="w-4 h-4"><AlternativeIcon /></div>
            </button>
            <button
              onClick={handleFavorite}
              className={`p-2 rounded-xl transition-colors ${isFavorite ? 'text-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-300 dark:text-slate-600'}`}
              style={{ transform: starPop ? 'scale(1.4)' : 'scale(1)', transition: 'transform 150ms ease' }}
            >
              <div className="w-4 h-4"><StarIcon isFilled={isFavorite} /></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MedicineCard);
