
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
    
    return sciNames.map((name, index) => ({
        name,
        strength: strengths[index] || strengths[0] || ''
    }));
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
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress(medicine);
    }, 700); // 700ms عشان ما يتفعلش بالغلط
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // لو اتحرك أكتر من 10px اعتبره scroll مش long press
    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) {
      if (pressTimer.current) clearTimeout(pressTimer.current);
      isLongPress.current = false;
    }
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleClick = () => {
    if (!isLongPress.current) onShortPress();
  };
  const ingredientsString = useMemo(() => zipIngredients(medicine), [medicine]);
  const isControlled = medicine['Product Control']?.toLowerCase() === 'controlled';
  
  // إظهار التصنيف فقط للأدوية البشرية (Human)
  const isHumanMed = medicine['Product type'] === 'Human';
  const isGeneric = medicine.DrugType?.toLowerCase().includes('generic');
  const drugTypeLabel = isGeneric ? (language === 'ar' ? 'جنيس' : 'Generic') : (language === 'ar' ? 'أصيل' : 'Brand');

  return (
    <div 
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="animate-card bg-white dark:bg-dark-card rounded-[1.75rem] p-5 shadow-sm border border-slate-100 dark:border-dark-border flex flex-col gap-4 active:scale-[0.98] transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start gap-4">
        {medicine.imgBox && (
            <div className="flex-shrink-0 w-16 h-16 bg-slate-50 dark:bg-dark-card rounded-2xl overflow-hidden border border-slate-100 dark:border-dark-border p-1.5 shadow-sm">
                <img src={medicine.imgBox} alt="" className="w-full h-full object-contain" />
            </div>
        )}
        <div className="flex-grow min-w-0">
            <div className="flex items-center gap-1.5 mb-1 text-slate-400 dark:text-slate-500">
                <div className="w-3 h-3"><FactoryIcon /></div>
                <span className="text-[9px] font-bold uppercase tracking-widest truncate">{medicine['Manufacture Name']}</span>
            </div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight group-hover:text-primary transition-colors truncate">
                {medicine['Trade Name']}
            </h2>
            
            <div className="mt-2 inline-flex items-center gap-2 bg-slate-100/70 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 max-w-full">
                <div className="w-3 h-3 text-primary shrink-0"><PillIcon /></div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold leading-none truncate" dir="ltr">
                    {ingredientsString}
                </p>
            </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 shrink-0">
            {price > 0 ? (
                <div className="bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary-light px-3 py-1.5 rounded-2xl border border-primary/10 dark:border-primary/20 shadow-sm">
                    <span className="text-base font-black">{price.toFixed(2)}</span>
                    <span className="text-[9px] font-black">{language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
            ) : <div className="text-[10px] font-black text-slate-300 dark:text-slate-700">N/A</div>}
            
            <div className="flex flex-wrap justify-end gap-1">
                {isHumanMed && medicine.DrugType && (
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase shadow-sm ${isGeneric ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                        {drugTypeLabel}
                    </span>
                )}
                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase shadow-sm ${medicine['Legal Status'] === 'Prescription' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {medicine['Legal Status'] === 'Prescription' ? 'Rx' : 'OTC'}
                </span>
                {isControlled && <span className="bg-purple-600 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase shadow-sm">Controlled</span>}
            </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800/60">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold bg-slate-50 dark:bg-slate-900/40 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                {medicine.PharmaceuticalForm}
            </span>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(medicine.RegisterNumber); }} 
                className={`p-2 rounded-xl transition-all ${isFavorite ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
                <div className="w-5 h-5"><StarIcon isFilled={isFavorite} /></div>
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onFindAlternative(medicine); }} 
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary-light hover:bg-primary/5 rounded-xl transition-all"
            >
                <div className="w-5 h-5"><AlternativeIcon /></div>
            </button>
        </div>
      </div>
    </div>
  );
};
export default React.memo(MedicineCard);
