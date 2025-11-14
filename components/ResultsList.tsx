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
}

const ResultsList: React.FC<ResultsListProps> = ({ medicines, onMedicineSelect, onMedicineLongPress, onFindAlternative, t, language, resultsState, favorites, onToggleFavorite }) => {
  if (resultsState === 'empty') {
    return (
      <div className="text-center py-10 px-4 bg-light-card dark:bg-dark-card rounded-xl shadow-sm animate-fade-in" role="status">
        <h3 className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary">{t('noResultsTitle')}</h3>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('noResultsSubtitle')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {medicines.map((med) => (
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
    </div>
  );
};

export default ResultsList;