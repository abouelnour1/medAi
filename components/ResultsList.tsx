import React, { useState } from 'react';
import { Medicine, TFunction, Language, SortByOption } from '../types';
import MedicineCard from './MedicineCard';

const SORT_OPTIONS = [
  { value: 'alphabetical',   labelAr: 'أ ← ي',       labelEn: 'A → Z'      },
  { value: 'scientificName', labelAr: 'الاسم العلمي', labelEn: 'Scientific' },
  { value: 'priceAsc',       labelAr: 'السعر ↑',      labelEn: 'Price ↑'    },
  { value: 'priceDesc',      labelAr: 'السعر ↓',      labelEn: 'Price ↓'    },
  { value: 'strengthDesc',   labelAr: 'التركيز ↓',    labelEn: 'Strength ↓' },
  { value: 'strengthAsc',    labelAr: 'التركيز ↑',    labelEn: 'Strength ↑' },
];

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
  sortBy?: string;
  setSortBy?: (v: SortByOption) => void;
  onToggleCompare?: (medicine: Medicine) => void;
  compareList?: string[];
  maxResults?: number;
}

const MAX_RESULTS = 100;


const SortDropdown: React.FC<{ sortBy: string; setSortBy: (v: SortByOption) => void; language: string }> = ({ sortBy, setSortBy, language }) => {
  const [open, setOpen] = useState(false);
  const ar = language === 'ar';
  const current = SORT_OPTIONS.find(o => o.value === sortBy);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1 h-7 px-2 rounded-lg text-[10px] font-black border active:scale-95 ${open ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-dark-card text-slate-500 border-slate-200 dark:border-slate-700'}`}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12M10 18h4" />
        </svg>
        {ar ? (current?.labelAr ?? 'ترتيب') : (current?.labelEn ?? 'Sort')}
        <svg className={`w-2 h-2 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className={`absolute ${ar ? 'left-0' : 'right-0'} top-full mt-1 z-[101] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden min-w-[140px]`}>
            {SORT_OPTIONS.map(opt => (
              <button key={opt.value}
                onClick={() => { setSortBy(opt.value as any); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-black ${sortBy === opt.value ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <span className="w-3 text-[10px]">{sortBy === opt.value ? '✓' : ''}</span>
                {ar ? opt.labelAr : opt.labelEn}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ResultsList: React.FC<ResultsListProps> = ({
  medicines, onMedicineSelect, onMedicineLongPress, onFindAlternative,
  t, language, resultsState, favorites, onToggleFavorite,
  sortBy, setSortBy,
  onToggleCompare, compareList = [],
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

  const visibleMeds = maxResults != null ? medicines.slice(0, maxResults) : medicines;
  const displayCount = visibleMeds.length;

  return (
    <div>
      <div className="px-1 mb-3 flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {language === 'ar' ? `${displayCount} نتيجة` : `${displayCount} results`}
        </span>
        {setSortBy && sortBy && <SortDropdown sortBy={sortBy} setSortBy={setSortBy} language={language} />}
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
              onToggleCompare={onToggleCompare}
              isInCompare={compareList.includes(med.RegisterNumber)}
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
