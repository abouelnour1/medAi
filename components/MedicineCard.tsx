
import React, { useMemo } from 'react';
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
    }).join(', ');
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

const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, onShortPress, onLongPress, onFindAlternative, isFavorite, onToggleFavorite, t, language }) => {
  const price = parseFloat(medicine['Public price']);
  const pressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = React.useRef(false);
  const touchStartPos = React.useRef({ x: 0, y: 0 });

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

  const ingredientsString = useMemo(() => zipIngredients(medicine), [medicine]);
  const isControlled = medicine['Product Control']?.toLowerCase() === 'controlled';
  const isHumanMed = medicine['Product type'] === 'Human';
  const isGeneric = medicine.DrugType?.toLowerCase().includes('generic');
  const isRx = medicine['Legal Status'] === 'Prescription';
  const ar = language === 'ar';

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="animate-card bg-white dark:bg-dark-card rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-dark-border active:scale-[0.98] transition-all cursor-pointer overflow-hidden"
    >
      {/* الجزء العلوي - اسم + شارات */}
      <div className="flex items-start gap-3 p-4 pb-3">
        {/* صورة الدواء لو موجودة */}
        {medicine.imgBox && (
          <div className="flex-shrink-0 w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-dark-border p-1">
            <img src={medicine.imgBox} alt="" className="w-full h-full object-contain" />
          </div>
        )}

        <div className="flex-grow min-w-0">
          {/* الشركة */}
          <div className="flex items-center gap-1 mb-0.5">
            <div className="w-3 h-3 text-slate-400 flex-shrink-0"><FactoryIcon /></div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 truncate">{medicine['Manufacture Name']}</span>
          </div>

          {/* اسم الدواء - كامل مش مقطوع */}
          <h2 className="text-base font-black text-slate-800 dark:text-white leading-snug break-words">
            {medicine['Trade Name']}
          </h2>

          {/* المادة الفعالة */}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2" dir="ltr">
            {ingredientsString}
          </p>
        </div>

        {/* السعر */}
        <div className="flex-shrink-0 text-right">
          {price > 0 ? (
            <div className="bg-primary/8 dark:bg-primary/15 px-2.5 py-1.5 rounded-xl border border-primary/15">
              <span className="text-sm font-black text-primary">{price.toFixed(2)}</span>
              <span className="text-[8px] font-black text-primary/70 block leading-none">{ar ? 'ر.س' : 'SAR'}</span>
            </div>
          ) : (
            <span className="text-[9px] text-slate-300 dark:text-slate-600 font-bold">N/A</span>
          )}
        </div>
      </div>

      {/* الشريط السفلي */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
        {/* الشارات */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${isRx ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
            {isRx ? 'Rx' : 'OTC'}
          </span>
          {isHumanMed && medicine.DrugType && (
            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${isGeneric ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
              {isGeneric ? (ar ? 'جنيس' : 'Generic') : (ar ? 'أصيل' : 'Brand')}
            </span>
          )}
          {isControlled && <span className="bg-purple-600 text-white px-2 py-0.5 rounded-lg text-[8px] font-black">Ctrl</span>}
          {medicine.PharmaceuticalForm && (
            <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg truncate max-w-[80px]">
              {medicine.PharmaceuticalForm}
            </span>
          )}
        </div>

        {/* الأزرار */}
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(medicine.RegisterNumber); }}
            className={`p-1.5 rounded-xl transition-all ${isFavorite ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-300 dark:text-slate-600'}`}
          >
            <div className="w-4 h-4"><StarIcon isFilled={isFavorite} /></div>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onFindAlternative(medicine); }}
            className="p-1.5 text-slate-400 hover:text-primary rounded-xl transition-all"
          >
            <div className="w-4 h-4"><AlternativeIcon /></div>
          </button>
        </div>
      </div>
    </div>
  );
};
export default React.memo(MedicineCard);
