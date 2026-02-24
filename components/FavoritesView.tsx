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
  const [sortBy, setSortBy] = React.useState<'added' | 'name' | 'price'>('added');
  const ar = language === 'ar';

  const favoriteMedicines = React.useMemo(() => {
    const favoriteSet = new Set(favoriteIds);
    const meds = allMedicines.filter(med => favoriteSet.has(med.RegisterNumber));
    if (sortBy === 'name') return [...meds].sort((a, b) => a['Trade Name'].localeCompare(b['Trade Name']));
    if (sortBy === 'price') return [...meds].sort((a, b) => parseFloat(a['Public price'] || '0') - parseFloat(b['Public price'] || '0'));
    // added = ترتيب الإضافة (favoriteIds order)
    return favoriteIds.map(id => meds.find(m => m.RegisterNumber === id)).filter(Boolean) as typeof meds;
  }, [favoriteIds, allMedicines, sortBy]);

  const sortOptions = [
    { id: 'added', label: ar ? 'ترتيب الإضافة' : 'Date Added' },
    { id: 'name',  label: ar ? 'الاسم' : 'Name' },
    { id: 'price', label: ar ? 'السعر' : 'Price' },
  ];

  if (favoriteMedicines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-light-text-secondary dark:text-dark-muted p-8 animate-fade-in">
        <div className="w-16 h-16 text-accent"><StarIcon isFilled /></div>
        <h2 className="text-2xl font-bold mt-4 text-slate-800 dark:text-white">{t('noFavorites')}</h2>
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