import React, { useRef, useState, useEffect, useCallback } from 'react';
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
}

const INITIAL_BATCH = 30;  // نبدأ بـ 30 كارت
const LOAD_MORE_BATCH = 20; // نحمل 20 كل مرة

const ResultsList: React.FC<ResultsListProps> = ({
  medicines, onMedicineSelect, onMedicineLongPress, onFindAlternative,
  t, language, resultsState, favorites, onToggleFavorite
}) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const loaderRef = useRef<HTMLDivElement>(null);

  // reset لما تتغير النتائج
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [medicines.length, medicines[0]?.RegisterNumber]);

  // Intersection Observer - يحمل أكتر لما توصل للآخر
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < medicines.length) {
          setVisibleCount(prev => Math.min(prev + LOAD_MORE_BATCH, medicines.length));
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [visibleCount, medicines.length]);

  if (resultsState === 'empty') {
    return (
      <div className="text-center py-10 px-4 bg-white dark:bg-dark-card rounded-2xl shadow-sm animate-fade-in">
        <h3 className="text-lg font-black text-slate-500 dark:text-dark-muted">{t('noResultsTitle')}</h3>
        <p className="text-sm text-slate-400 dark:text-dark-muted mt-1">{t('noResultsSubtitle')}</p>
      </div>
    );
  }

  const visibleMeds = medicines.slice(0, visibleCount);
  const hasMore = visibleCount < medicines.length;

  return (
    <div className="animate-fade-in">
      <div className="px-1 mb-3 flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {language === 'ar' ? `${medicines.length} نتيجة` : `${medicines.length} results`}
        </span>
        {hasMore && (
          <span className="text-[9px] text-slate-300 dark:text-slate-600">
            {language === 'ar' ? `عارض ${visibleCount} من ${medicines.length}` : `Showing ${visibleCount} of ${medicines.length}`}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {visibleMeds.map((med, index) => (
          <div key={med.RegisterNumber} className="stagger-item" style={{ "--i": Math.min(index, 7) } as React.CSSProperties}>
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

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loaderRef} className="flex items-center justify-center py-6 gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">
            {language === 'ar' ? 'تحميل المزيد...' : 'Loading more...'}
          </span>
        </div>
      )}
    </div>
  );
};

export default React.memo(ResultsList);
