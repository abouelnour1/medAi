
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Medicine, TFunction, Language } from '../types';
import MedicineCard from './MedicineCard';

interface ResultsListProps {
  medicines: Medicine[];
  onMedicineSelect: (medicine: Medicine) => void;
  onMedicineLongPress: (medicine: Medicine) => void;
  onFindAlternative: (medicine: Medicine) => void;
  favorites: string[];
  onToggleFavorite: (medicineId: string) => void;
  t: TFunction;
  language: Language;
  resultsState: 'loading' | 'loaded' | 'empty';
  limit?: number;
}

const ITEMS_PER_PAGE = 20;

const ResultsList: React.FC<ResultsListProps> = ({ 
    medicines, 
    onMedicineSelect, 
    onMedicineLongPress, 
    onFindAlternative, 
    t, 
    language, 
    resultsState, 
    favorites, 
    onToggleFavorite,
}) => {
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);

  const visibleMedicines = useMemo(() => {
    return medicines.slice(0, displayLimit);
  }, [medicines, displayLimit]);

  if (resultsState === 'empty') {
    return (
      <div className="text-center py-10 px-4 bg-white/50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800 animate-fade-in" role="status">
        <h3 className="text-lg font-black text-slate-400">{t('noResultsTitle')}</h3>
        <p className="text-sm text-slate-400 mt-1">{t('noResultsSubtitle')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-10">
      <AnimatePresence mode="popLayout">
        {visibleMedicines.map((med) => (
          <MedicineCard 
            key={med.RegisterNumber} 
            medicine={med} 
            onShortPress={() => onMedicineSelect(med)} 
            onLongPress={onMedicineLongPress}
            onFindAlternative={onFindAlternative}
            isFavorite={favorites.includes(med.RegisterNumber)}
            onToggleFavorite={onToggleFavorite}
            t={t} 
            language={language} 
          />
        ))}
      </AnimatePresence>
      
      {medicines.length > displayLimit && (
        <div className="flex justify-center pt-6">
          <button 
            onClick={() => setDisplayLimit(prev => prev + ITEMS_PER_PAGE)}
            className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-black text-xs text-primary shadow-sm active:scale-95 transition-all"
          >
            {language === 'ar' ? 'عرض المزيد' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(ResultsList);
