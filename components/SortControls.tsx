import React from 'react';
import { SortByOption, TFunction } from '../types';

interface SortControlsProps {
  sortBy: SortByOption;
  setSortBy: (sortBy: SortByOption) => void;
  t: TFunction;
}

const SORT_OPTIONS: { value: SortByOption; labelAr: string; labelEn: string }[] = [
  { value: 'alphabetical',   labelAr: 'أ-ي',      labelEn: 'A-Z'     },
  { value: 'scientificName', labelAr: 'العلمي',   labelEn: 'Sci'     },
  { value: 'priceAsc',       labelAr: 'سعر ↑',    labelEn: 'Price ↑' },
  { value: 'priceDesc',      labelAr: 'سعر ↓',    labelEn: 'Price ↓' },
  { value: 'strengthAsc',    labelAr: 'تركيز ↑',  labelEn: 'Str ↑'   },
  { value: 'strengthDesc',   labelAr: 'تركيز ↓',  labelEn: 'Str ↓'   },
];

const SortControls: React.FC<SortControlsProps> = ({ sortBy, setSortBy, t }) => {
  const isAr = (t('language') as string) === 'ar';

  const handleToggle = (value: SortByOption) => {
    // ضغطة على نفس الاختيار → يشيله ويرجع للـ relevance
    setSortBy(sortBy === value ? 'relevance' : value);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {SORT_OPTIONS.map(opt => {
        const active = sortBy === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => handleToggle(opt.value)}
            className={`
              px-2.5 py-1 rounded-lg text-[11px] font-black transition-all active:scale-90
              ${active
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }
            `}
          >
            {isAr ? opt.labelAr : opt.labelEn}
          </button>
        );
      })}
    </div>
  );
};

export default SortControls;
