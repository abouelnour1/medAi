
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
        return s.trim() ? `${name} ${s.trim()}` : name;
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
  const hasPrice = price > 0 && !isNaN(price);

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border active:scale-[0.98] transition-all duration-150 cursor-pointer overflow-hidden"
    >
      {/* ══ Main row ══ */}
      <div className="flex items-start gap-3 px-3.5 pt-3.5 pb-2.5">

        {/* صورة */}
        {medicine.imgBox && (
          <div className="flex-shrink-0 w-11 h-11 bg-slate-50 dark:bg-slate-800/60 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700/40 p-1 mt-0.5">
            <img src={medicine.imgBox} alt="" className="w-full h-full object-contain" />
          </div>
        )}

        {/* Info */}
        <div className="flex-grow min-w-0">
          {/* Manufacturer */}
          <p className="text-[8px] font-medium text-slate-300 dark:text-slate-600 uppercase tracking-widest truncate mb-0.5 leading-none">
            {medicine['Manufacture Name']}
          </p>

          {/* Trade name */}
          <h2 className="text-[13px] font-black text-slate-800 dark:text-white leading-snug break-words">
            {medicine['Trade Name']}
          </h2>

          {/* Scientific name */}
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 mb-2 leading-relaxed line-clamp-1" dir="ltr">
            {ingredientsString}
          </p>

          {/* Badges - محايدة وهادئة */}
          <div className="flex items-center gap-1 flex-wrap">
            {/* Rx / OTC */}
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border ${
              isRx
                ? 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
            }`}>
              {isRx ? 'Rx' : 'OTC'}
            </span>

            {/* Generic / Brand */}
            {isHumanMed && medicine.DrugType && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                {isGeneric ? (ar ? 'جنيس' : 'Generic') : (ar ? 'أصيل' : 'Brand')}
              </span>
            )}

            {/* Controlled */}
            {isControlled && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                Ctrl
              </span>
            )}

            {/* Form */}
            {medicine.PharmaceuticalForm && (
              <span className="text-[8px] text-slate-400 dark:text-slate-600 truncate max-w-[70px]">
                {medicine.PharmaceuticalForm}
              </span>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0 self-stretch justify-between">
          {/* Price */}
          {hasPrice ? (
            <div className="text-right">
              <span className="text-sm font-black text-slate-700 dark:text-slate-200 leading-none">{price.toFixed(2)}</span>
              <span className="text-[7px] text-slate-400 block leading-none mt-0.5">{ar ? 'ر.س' : 'SAR'}</span>
            </div>
          ) : <div />}

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={e => { e.stopPropagation(); onFindAlternative(medicine); }}
              className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-primary dark:hover:text-primary rounded-lg transition-colors active:scale-90"
            >
              <div className="w-3.5 h-3.5"><AlternativeIcon /></div>
            </button>
            <button
              onClick={handleFavorite}
              className={`p-1.5 rounded-lg transition-colors ${isFavorite ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
              style={{ transform: starPop ? 'scale(1.4)' : 'scale(1)', transition: 'transform 150ms ease' }}
            >
              <div className="w-3.5 h-3.5"><StarIcon isFilled={isFavorite} /></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MedicineCard);
