
import React, { useMemo, useState } from 'react';
import { Medicine, TFunction, Language } from '../types';
import PillIcon from './icons/PillIcon';
import AlternativeIcon from './icons/AlternativeIcon';
import FactoryIcon from './icons/FactoryIcon';
import StarIcon from './icons/StarIcon';

export const getIngredientsList = (medicine: Medicine): { name: string; strength: string }[] => {
    const sciNames = String(medicine['Scientific Name'] || '').split(',').map(s => s.trim());
    const strengths = String(medicine.Strength || '').split(',').map(s => s.trim());
    if (sciNames.length === 0 || (sciNames.length === 1 && sciNames[0] === 'N/A')) return [];
    return sciNames.map((name, index) => ({ name, strength: strengths[index] || strengths[0] || '' }));
};

export const zipIngredients = (medicine: Medicine): string => {
    const sciNames = String(medicine['Scientific Name'] || '').split(',').map(s => s.trim());
    const strengths = String(medicine.Strength || '').split(',').map(s => s.trim());
    if (sciNames.length === 0 || (sciNames.length === 1 && sciNames[0] === 'N/A')) return 'N/A';
    return sciNames.map((name, index) => {
        const s = strengths[index] || strengths[0] || '';
        return s.trim() ? `${name} (${s.trim()})` : name;
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
  const isControlled = medicine['Product Control']?.toLowerCase() === 'controlled';
  const isHumanMed = medicine['Product type'] === 'Human';
  const isGeneric = medicine.DrugType?.toLowerCase().includes('generic');
  const isRx = medicine['Legal Status'] === 'Prescription';
  const ar = language === 'ar';

  // ── Accent bar color
  const accentColor = isControlled
    ? 'bg-purple-500'
    : isRx ? 'bg-rose-500' : 'bg-emerald-500';

  // ── Rx/OTC badge
  const rxBadge = isRx
    ? { text: 'Rx',  bg: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',    dot: 'bg-rose-500' }
    : { text: 'OTC', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', dot: 'bg-emerald-500' };

  // ── Generic/Brand badge
  const typeBadge = isHumanMed && medicine.DrugType
    ? isGeneric
      ? { text: ar ? 'جنيس' : 'Generic', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-400' }
      : { text: ar ? 'أصيل' : 'Brand',   bg: 'bg-sky-50 text-sky-700 dark:bg-sky-900/25 dark:text-sky-400' }
    : null;

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="animate-card relative bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border active:scale-[0.98] transition-all duration-150 cursor-pointer overflow-hidden flex"
    >
      {/* ══ Accent Bar ══ */}
      <div className={`w-1 flex-shrink-0 ${accentColor}`} />

      {/* ══ Card Body ══ */}
      <div className="flex-grow min-w-0 flex flex-col">

        {/* Top */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-3">

          {/* صورة الدواء */}
          {medicine.imgBox && (
            <div className="flex-shrink-0 w-12 h-12 bg-slate-50 dark:bg-slate-800/60 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700/50 p-1 self-start mt-0.5">
              <img src={medicine.imgBox} alt="" className="w-full h-full object-contain" />
            </div>
          )}

          {/* Info column */}
          <div className="flex-grow min-w-0">

            {/* Manufacturer — خفي */}
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2.5 h-2.5 text-slate-300 dark:text-slate-600 flex-shrink-0"><FactoryIcon /></div>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-350 dark:text-slate-600 truncate leading-none">
                {medicine['Manufacture Name']}
              </span>
            </div>

            {/* ★ Trade Name — الملك */}
            <h2 className="text-[15px] font-black text-slate-800 dark:text-white leading-snug break-words mb-2">
              {medicine['Trade Name']}
            </h2>

            {/* Badges — مباشرة تحت الاسم */}
            <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide ${rxBadge.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${rxBadge.dot}`} />
                {rxBadge.text}
              </span>
              {typeBadge && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${typeBadge.bg}`}>
                  {typeBadge.text}
                </span>
              )}
              {isControlled && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-50 text-purple-700 dark:bg-purple-900/25 dark:text-purple-400">
                  {ar ? 'مضبوط' : 'Ctrl'}
                </span>
              )}
            </div>

            {/* Active ingredient chip */}
            <div className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/70 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700/50 max-w-full">
              <div className="w-2.5 h-2.5 text-primary/70 flex-shrink-0"><PillIcon /></div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-none truncate" dir="ltr">
                {ingredientsString}
              </p>
            </div>
          </div>

          {/* Price bubble */}
          <div className="flex-shrink-0 self-start">
            {price > 0 ? (
              <div className="bg-white dark:bg-slate-800/80 shadow-sm border border-slate-100 dark:border-slate-700/60 px-2.5 py-2 rounded-xl text-center min-w-[52px]">
                <span className="text-sm font-black text-slate-800 dark:text-white block leading-none">
                  {price.toFixed(2)}
                </span>
                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 block mt-0.5">
                  {ar ? 'ر.س' : 'SAR'}
                </span>
              </div>
            ) : (
              <span className="text-[9px] text-slate-200 dark:text-slate-700 font-bold">—</span>
            )}
          </div>
        </div>

        {/* ══ Bottom Strip ══ */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-50 dark:border-slate-800/70">

          {/* Form pill */}
          {medicine.PharmaceuticalForm ? (
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg truncate max-w-[45%] leading-none">
              {medicine.PharmaceuticalForm}
            </span>
          ) : <span />}

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={e => { e.stopPropagation(); onFindAlternative(medicine); }}
              className="p-2 text-slate-300 dark:text-slate-600 hover:text-primary dark:hover:text-primary rounded-xl transition-colors active:scale-90"
            >
              <div className="w-4 h-4"><AlternativeIcon /></div>
            </button>

            {/* Star با micro-interaction */}
            <button
              onClick={handleFavorite}
              className={`p-2 rounded-xl transition-all ${
                isFavorite
                  ? 'text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                  : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
              }`}
              style={{ transform: starPop ? 'scale(1.35)' : 'scale(1)', transition: starPop ? 'transform 80ms ease-out' : 'transform 200ms ease-in-out, color 200ms, background 200ms' }}
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
