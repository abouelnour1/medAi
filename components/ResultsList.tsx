import React, { useRef, useMemo, useCallback } from 'react';
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

const ResultsList: React.FC<ResultsListProps> = ({ 
  medicines, onMedicineSelect, onMedicineLongPress, onFindAlternative, 
  t, language, resultsState, favorites, onToggleFavorite, scrollContainerRef
}) => {
  const letterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // تجميع الأدوية حسب أول حرف من الاسم التجاري
  const grouped = useMemo(() => {
    const map: Record<string, Medicine[]> = {};
    medicines.forEach(med => {
      const name = med['Trade Name'] || '';
      const letter = name.charAt(0).toUpperCase();
      // تصنيف الحروف العربية والأرقام
      const key = /[A-Z]/.test(letter) ? letter : /[0-9]/.test(letter) ? '#' : /[\u0600-\u06FF]/.test(letter) ? 'ع' : '#';
      if (!map[key]) map[key] = [];
      map[key].push(med);
    });
    return map;
  }, [medicines]);

  const letters = useMemo(() => Object.keys(grouped).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    if (a === 'ع') return 1;
    if (b === 'ع') return -1;
    return a.localeCompare(b);
  }), [grouped]);

  const scrollToLetter = useCallback((letter: string) => {
    const el = letterRefs.current[letter];
    if (!el) return;
    const container = scrollContainerRef?.current || document.getElementById('main-scroll-container');
    if (container) {
      const containerTop = container.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      const offset = elTop - containerTop + container.scrollTop - 80;
      container.scrollTo({ top: offset, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [scrollContainerRef]);

  if (resultsState === 'empty') {
    return (
      <div className="text-center py-10 px-4 bg-white dark:bg-dark-card rounded-2xl shadow-sm animate-fade-in">
        <h3 className="text-lg font-black text-slate-500 dark:text-dark-muted">{t('noResultsTitle')}</h3>
        <p className="text-sm text-slate-400 dark:text-dark-muted mt-1">{t('noResultsSubtitle')}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* عداد النتائج */}
      <div className="flex items-center justify-between px-1 mb-3">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {language === 'ar' ? `${medicines.length} نتيجة` : `${medicines.length} results`}
        </span>
        <span className="text-[10px] font-bold text-slate-300">
          {letters.filter(l => l !== '#' && l !== 'ع').length} {language === 'ar' ? 'حرف' : 'letters'}
        </span>
      </div>

      {/* شريط الأحرف الأبجدية */}
      {letters.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4 px-1 justify-center">
          {letters.map(letter => (
            <button
              key={letter}
              onClick={() => scrollToLetter(letter)}
              className="min-w-[2rem] h-8 px-2 bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-xl text-[11px] font-black text-slate-600 dark:text-slate-300 active:scale-90 active:bg-primary active:text-white active:border-primary transition-all shadow-sm hover:border-primary/40 hover:text-primary"
            >
              {letter}
              <span className="block text-[8px] font-bold text-slate-300 leading-none">
                {grouped[letter].length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* النتائج مجمعة حسب الحرف */}
      <div className="space-y-6">
        {letters.map(letter => (
          <div key={letter} ref={el => { letterRefs.current[letter] = el; }}>
            {/* فاصل الحرف */}
            <div className="flex items-center gap-3 mb-3 sticky top-0 z-10 py-1">
              <div className="w-9 h-9 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20 flex-shrink-0">
                {letter}
              </div>
              <div className="h-px flex-grow bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="text-[9px] font-black text-slate-300 uppercase">
                {grouped[letter].length}
              </span>
            </div>

            {/* كروت الأدوية */}
            <div className="space-y-3">
              {grouped[letter].map(med => (
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(ResultsList);
