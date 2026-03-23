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
  exactOnly?: boolean;
  onToggleExactOnly?: () => void;
  t: TFunction;
  activeFiltersCount?: number;
  onOpenFilters?: () => void;
  sortBy?: string;
  setSortBy?: (v: any) => void;
  onInsuranceClick?: () => void;
  isSearching?: boolean;
  language?: string;
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
  exactOnly = false,
  onToggleExactOnly,
  t,
  activeFiltersCount = 0,
  onOpenFilters,
  sortBy,
  setSortBy,
  onInsuranceClick,
  language = 'en',
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
  const DELAY = isAndroid ? 350 : 120;

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
                : (ar ? 'ابحث بالاسم العلمي...'  : 'Search by scientific name...')
            }
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
            className="w-full bg-white dark:bg-dark-card h-12 pl-10 pr-10 rounded-2xl text-sm font-semibold shadow-[0_4px_12px_-2px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-slate-700 focus:border-primary/40 outline-none transition-all placeholder-slate-300 dark:placeholder-slate-600"
          />
          {isSearchActive && (
            <button onClick={onClearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-300 hover:text-rose-500 transition-colors">
              <div className="w-5 h-5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-full"><ClearIcon /></div>
            </button>
          )}
        </div>

        {/* Wildcard hint */}
        {isSearchActive && inputRef.current?.value?.includes('*') && (
          <div className="absolute -bottom-5 left-2 flex items-center gap-1">
            <span className="text-[9px] font-black text-teal-500">✦ wildcard</span>
            <span className="text-[9px] text-slate-400">— * = any letters</span>
          </div>
        )}

        {/* Settings button — يختفي لما focused */}
        {!isFocused && (
          <button
            onClick={() => { setShowSettings(v => !v); setShowSort(false); }}
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all active:scale-90 ${
              showSettings || exactOnly || textSearchMode !== 'tradeName'
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
              onClick={onToggleExactOnly}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div>
                <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                  {ar ? 'بحث مرن (Fuzzy)' : 'Fuzzy Search'}
                </span>
                <p className="text-[9px] text-slate-400">{ar ? 'يتسامح مع الأخطاء الإملائية' : 'Tolerates spelling mistakes'}</p>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-all ${!exactOnly ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${!exactOnly ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </button>
          </div>
        </>
      )}

      {/* ── Row 2: Filters + Sort + Insurance ── */}
      <div className="flex items-center gap-2 mt-2">

        {/* Filter */}
        {onOpenFilters && (
          <button onClick={onOpenFilters}
            className={`flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-black border transition-all active:scale-95 flex-shrink-0 ${
              activeFiltersCount > 0
                ? 'bg-primary text-white border-primary shadow-sm'
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

        {/* Sort — بسيطة جداً، تفتح تحتها مباشرة */}
        {setSortBy && sortBy && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => { setShowSort(v => !v); setShowSettings(false); }}
              className={`flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-black border transition-all active:scale-95 ${
                showSort ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-dark-card text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12M10 18h4" />
              </svg>
              {ar ? (currentSortLabel?.labelAr ?? 'ترتيب') : (currentSortLabel?.labelEn ?? 'Sort')}
              <svg className={`w-2.5 h-2.5 transition-transform ${showSort ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Sort dropdown — relative, تحت الزرار مباشرة */}
            {showSort && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setShowSort(false)} />
                <div className="absolute top-full left-0 mt-1 z-[101] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden min-w-[160px]">
                  {SORT_OPTIONS.map(opt => (
                    <button key={opt.value}
                      onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-3 text-xs font-black transition-colors ${
                        sortBy === opt.value
                          ? 'bg-primary/10 text-primary'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-3">{sortBy === opt.value ? '✓' : ''}</span>
                      {ar ? opt.labelAr : opt.labelEn}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Insurance */}
        {onInsuranceClick && (
          <button onClick={onInsuranceClick}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-black bg-teal-500 text-white shadow-sm transition-all active:scale-90 active:bg-teal-600 flex-shrink-0 ml-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {ar ? 'التأمين' : 'Insurance'}
          </button>
        )}
      </div>
    </div>
  );
});

export default SearchBar;
