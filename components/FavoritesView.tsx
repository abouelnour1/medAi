import React from 'react';
import { Medicine, TFunction, Language } from '../types';
import MedicineCard from './MedicineCard';
import StarIcon from './icons/StarIcon';

interface FavoritesViewProps {
  favoriteIds: string[];
  allMedicines: Medicine[];
  onMedicineSelect: (medicine: Medicine) => void;
  onMedicineLongPress: (medicine: Medicine) => void;
  onFindAlternative: (medicine: Medicine) => void;
  toggleFavorite: (medicineId: string) => void;
  t: TFunction;
  language: Language;
}

const FavoritesView: React.FC<FavoritesViewProps> = ({
  favoriteIds,
  allMedicines,
  onMedicineSelect,
  onMedicineLongPress,
  onFindAlternative,
  toggleFavorite,
  t,
  language,
}) => {
  const favoriteMedicines = React.useMemo(() => {
    const favoriteSet = new Set(favoriteIds);
    return allMedicines.filter(med => favoriteSet.has(med.RegisterNumber));
  }, [favoriteIds, allMedicines]);

  if (favoriteMedicines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-light-text-secondary dark:text-dark-text-secondary p-8 animate-fade-in">
        <div className="w-16 h-16 text-accent"><StarIcon isFilled /></div>
        <h2 className="text-2xl font-bold mt-4">{t('noFavorites')}</h2>
        <p className="mt-1">{t('noFavoritesSubtitle')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {favoriteMedicines.map((med) => (
        <MedicineCard
          key={med.RegisterNumber}
          medicine={med}
          onShortPress={() => onMedicineSelect(med)}
          onLongPress={onMedicineLongPress}
          onFindAlternative={onFindAlternative}
          isFavorite={true} // All items here are favorites
          onToggleFavorite={toggleFavorite}
          t={t}
          language={language}
        />
      ))}
    </div>
  );
};

export default FavoritesView;