
import React, { useMemo } from 'react';
import { Medicine, TFunction, Language } from '../types';
import PillIcon from './icons/PillIcon';
import AlternativeIcon from './icons/AlternativeIcon';
import FactoryIcon from './icons/FactoryIcon';
import StarIcon from './icons/StarIcon';

/**
 * Fix: Added and exported getIngredientsList to provide structured scientific name and strength data.
 */
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
  const ingredientsString = useMemo(() => zipIngredients(medicine), [medicine]);
  const isControlled = medicine['Product Control']?.toLowerCase() === 'controlled';
  const isRestricted = medicine['Product Control']?.toLowerCase() === 'restricted';

  return (
    <div onClick={onShortPress} className="animate-card bg-white dark:bg-dark-card rounded-3xl p-4 shadow-premium border border-slate-50 dark:border-slate-800/50 flex flex-col gap-3 active:scale-[0.98] transition-all cursor-pointer group">
      <div className="flex justify-between items-start gap-3">
        {medicine.imgBox && (
            <div className="flex-shrink-0 w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 p-1">
                <img src={medicine.imgBox} alt="" className="w-full h-full object-contain" />
            </div>
        )}
        <div className="flex-grow min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 opacity-60">
                <div className="w-3 h-3"><FactoryIcon /></div>
                <span className="text-[8px] font-black uppercase tracking-widest truncate dark:text-slate-400">{medicine['Manufacture Name']}</span>
            </div>
            <h2 className="text-[15px] font-black text-slate-800 dark:text-white leading-tight group-hover:text-primary transition-colors truncate">
                {medicine['Trade Name']}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold italic line-clamp-1 mt-0.5" dir="ltr">
                {ingredientsString}
            </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
            {price > 0 ? (
                <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-xl border border-orange-100 dark:border-orange-800/50 shadow-sm">
                    <span className="text-sm font-black">{price.toFixed(2)}</span>
                    <span className="text-[8px] font-bold mr-1">{t('sar')}</span>
                </div>
            ) : <div className="text-[9px] font-black text-slate-300">N/A</div>}
            <div className="flex flex-col items-end gap-1">
                <span className={`px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase ${medicine['Legal Status'] === 'Prescription' ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/20 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                    {medicine['Legal Status'] === 'Prescription' ? 'Rx' : 'OTC'}
                </span>
                {isControlled && <span className="bg-purple-600 text-white px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-tighter shadow-sm">Controlled</span>}
                {isRestricted && <span className="bg-orange-600 text-white px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-tighter shadow-sm">Restricted</span>}
            </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/40 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 max-w-[70%]">
            <div className="w-3.5 h-3.5 text-primary shrink-0"><PillIcon /></div>
            <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 truncate">{medicine.PharmaceuticalForm}</span>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(medicine.RegisterNumber); }} className={`p-1.5 rounded-full ${isFavorite ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-300 hover:bg-slate-50'}`}>
                <div className="w-4 h-4"><StarIcon isFilled={isFavorite} /></div>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onFindAlternative(medicine); }} className="p-1.5 text-slate-300 hover:text-primary rounded-full transition-all">
                <div className="w-4 h-4"><AlternativeIcon /></div>
            </button>
        </div>
      </div>
    </div>
  );
};
export default React.memo(MedicineCard);
