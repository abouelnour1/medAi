import React, { useRef, useEffect, useCallback, useState } from 'react';
import { TFunction, TextSearchMode } from '../types';
import SearchIcon from './icons/SearchIcon';
import ClearIcon from './icons/ClearIcon';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  textSearchMode: TextSearchMode;
  setTextSearchMode: (mode: TextSearchMode) => void;
  isSearchActive: boolean;
  onClearSearch: () => void;
  onForceSearch: () => void;
  onSearchIconClick?: () => void;
  onBarcodeScanClick: () => void;
  fuzzyEnabled?: boolean;
  onToggleFuzzy?: () => void;
  t: TFunction;
  activeFiltersCount?: number;
  onOpenFilters?: () => void;
  sortBy?: string;
  setSortBy?: (v: any) => void;
  onInsuranceClick?: () => void;
  isSearching?: boolean;
  language?: string;
  recentSearches?: { name: string; id: string }[];
  onSelectRecent?: (name: string) => void;
}

const SORT_OPTIONS = [
  { value: 'alphabetical',  labelAr: 'أ ← ي',      labelEn: 'A → Z'       },
  { value: 'scientificName',labelAr: 'الاسم العلمي', labelEn: 'Scientific'  },
  { value: 'priceAsc',      labelAr: 'السعر ↑',     labelEn: 'Price ↑'     },
  { value: 'priceDesc',     labelAr: 'السعر ↓',     labelEn: 'Price ↓'     },
  { value: 'strengthDesc',  labelAr: 'التركيز ↓',   labelEn: 'Strength ↓'  },
  { value: 'strengthAsc',   labelAr: 'التركيز ↑',   labelEn: 'Strength ↑'  },
];

const SearchBar: React.FC<SearchBarProps> = React.memo(({
  searchTerm,
  setSearchTerm,
  textSearchMode,
  setTextSearchMode,
  isSearchActive,
  onClearSearch,
  onForceSearch,
  fuzzyEnabled = false,
  onToggleFuzzy,
  t,
  activeFiltersCount = 0,
  onOpenFilters,
  sortBy,
  setSortBy,
  onInsuranceClick,
  language = 'en',
  recentSearches = [],
  onSelectRecent,
}) => {
  const [isFocused, setIsFocused]           = useState(false);
  const [isTyping, setIsTyping]             = useState(false);
  const [showSettings, setShowSettings]     = useState(false);
  const [showSort, setShowSort]             = useState(false);

  const inputRef    = useRef<HTMLInputElement>(null);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAndroid   = typeof (window as any).Capacitor !== 'undefined'
    ? (window as any).Capacitor.getPlatform() === 'android'
    : /Android/i.test(navigator.userAgent);
  const DELAY = isAndroid ? 150 : 80;

  // sync لما يتغير من برا (clear مثلاً)
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== searchTerm) {
      inputRef.current.value = searchTerm;
    }
  }, [searchTerm]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIsTyping(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearchTerm(val);
      setIsTyping(false);
    }, DELAY);
  }, [setSearchTerm, DELAY]);

  const ar = language === 'ar';

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy);

  return (
    <div>
      {/* ── Row 1: Input + Settings ── */}
      <div className="flex items-center gap-2">

        {/* Input */}
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
            <div className="w-4 h-4"><SearchIcon /></div>
          </div>
          <input
            ref={inputRef}
            id="search-term"
            type="text"
            defaultValue={searchTerm}
            onChange={handleChange}
            onKeyDown={e => e.key === 'Enter' && onForceSearch()}
            onFocus={() => { setIsFocused(true); setShowSettings(false); setShowSort(false); }}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            placeholder={
              textSearchMode === 'tradeName'
                ? (ar ? 'ابحث بالاسم التجاري...' : 'Search by trade name...')
                : textSearchMode === 'indication'
                ? (ar ? 'اكتب اسم المرض...' : 'e.g. Hypertension, Diabetes...')
                : (ar ? 'ابحث بالاسم العلمي...'  : 'Search by scientific name...')
            }
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
            className="w-full bg-white dark:bg-dark-card h-12 pl-11 pr-11 rounded-2xl text-sm font-semibold border border-slate-100 dark:border-slate-700 focus:border-primary/40 outline-none transition-all placeholder-slate-300 dark:placeholder-slate-600"
          />
          {isSearchActive && (
            <button onClick={onClearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-300 hover:text-rose-500 transition-colors">
              <div className="w-5 h-5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-full"><ClearIcon /></div>
            </button>
          )}
        </div>

        {/* Filters button */}
        {!isFocused && onOpenFilters && (
          <button onClick={onOpenFilters}
            className={`h-12 px-3 rounded-2xl flex items-center gap-1 flex-shrink-0 border text-[11px] font-black active:scale-95 ${
              activeFiltersCount > 0
                ? 'bg-primary text-white border-primary'
                : 'bg-white dark:bg-dark-card text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 10h10M11 16h2" />
            </svg>
            {ar ? 'فلاتر' : 'Filters'}
            {activeFiltersCount > 0 && (
              <span className="bg-white/30 text-white text-[9px] font-black px-1 rounded-full">{activeFiltersCount}</span>
            )}
          </button>
        )}

        {/* Settings button */}
        {!isFocused && (
          <button
            onClick={() => { setShowSettings(v => !v); setShowSort(false); }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border active:scale-90 ${
              showSettings || fuzzyEnabled || textSearchMode !== 'tradeName'
                ? 'bg-primary text-white border-primary'
                : 'bg-white dark:bg-dark-card text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Settings panel — يفتح تحت الـ input مباشرة ── */}
      {showSettings && !isFocused && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setShowSettings(false)} />
          <div className="relative z-[101] mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Trade / Scientific */}
            <div className="p-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {ar ? 'نوع البحث' : 'Search Mode'}
              </p>
              <div className="flex gap-2">
                {[
                  { val: 'tradeName',     labelAr: 'الاسم التجاري', labelEn: 'Trade Name' },
                  { val: 'scientificName',labelAr: 'الاسم العلمي',  labelEn: 'Scientific' },
                ].map(opt => (
                  <button key={opt.val}
                    onClick={() => { setTextSearchMode(opt.val as TextSearchMode); setShowSettings(false); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                      textSearchMode === opt.val
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {ar ? opt.labelAr : opt.labelEn}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-px bg-slate-100 dark:bg-slate-800" />
            {/* Exact toggle */}
            <button
              onClick={onToggleFuzzy}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                {ar ? 'البحث الذكي (Fuzzy)' : 'Smart Search (Fuzzy)'}
              </span>
              <div className={`w-10 h-5 rounded-full relative transition-all ${fuzzyEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${fuzzyEnabled ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </button>
          </div>
        </>
      )}

      {/* Recent searches chips removed - shown in home screen instead */}

    </div>
  );
});

export default SearchBar;
