import React from 'react';
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
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  maxResults?: number;
}

const ResultsList: React.FC<ResultsListProps> = ({
  medicines, onMedicineSelect, onMedicineLongPress, onFindAlternative,
  t, language, resultsState, favorites, onToggleFavorite,
  maxResults
}) => {

  if (resultsState === 'empty') {
    return (
      <div className="text-center py-10 px-4 bg-white dark:bg-dark-card rounded-2xl shadow-sm animate-fade-in">
        <h3 className="text-lg font-black text-slate-500 dark:text-dark-muted">{t('noResultsTitle')}</h3>
        <p className="text-sm text-slate-400 dark:text-dark-muted mt-1">{t('noResultsSubtitle')}</p>
      </div>
    );
  }

  // maxResults غير موجود = بدون حد
  const visibleMeds = maxResults != null ? medicines.slice(0, maxResults) : medicines;
  const displayCount = visibleMeds.length;

  return (
    <div>
      <div className="px-1 mb-3">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {language === 'ar' ? `${displayCount} نتيجة` : `${displayCount} results`}
        </span>
      </div>

      <div className="space-y-2.5" style={{ contain: 'content' }}>
        {visibleMeds.map((med) => (
          <div key={med.RegisterNumber} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 88px' }}>
            <MedicineCard
              medicine={med}
              onShortPress={() => onMedicineSelect(med)}
              onLongPress={onMedicineLongPress}
              onFindAlternative={onFindAlternative}
              isFavorite={favorites.includes(med.RegisterNumber)}
              onToggleFavorite={onToggleFavorite}
              t={t}
              language={language}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(ResultsList);
