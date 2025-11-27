
import React, { useEffect, useRef } from 'react';
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
  onLoadMore?: () => void;
}

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
    limit = 20,
    onLoadMore
}) => {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        const first = entries[0];
        if (first.isIntersecting && onLoadMore) {
            onLoadMore();
        }
    }, { threshold: 0.1 });

    if (loaderRef.current) {
        observer.observe(loaderRef.current);
    }

    return () => {
        if (loaderRef.current) observer.unobserve(loaderRef.current);
    }
  }, [onLoadMore, medicines.length]);

  if (resultsState === 'empty') {
    return (
      <div className="text-center py-10 px-4 bg-light-card dark:bg-dark-card rounded-xl shadow-sm animate-fade-in" role="status">
        <h3 className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary">{t('noResultsTitle')}</h3>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('noResultsSubtitle')}</p>
      </div>
    );
  }

  const displayedMedicines = medicines.slice(0, limit);

  return (
    <div className="space-y-3 animate-fade-in">
      {displayedMedicines.map((med) => {
        if (!med) return null; 
        return (
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
        );
      })}
      
      {/* Infinite Scroll Trigger */}
      {medicines.length > limit && (
          <div ref={loaderRef} className="py-4 text-center text-sm text-gray-400">
              {t('loadMore') || 'Loading more...'}
          </div>
      )}
    </div>
  );
};

export default ResultsList;
