import React from 'react';
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
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, 
  setSearchTerm,
  textSearchMode,
  setTextSearchMode,
  isSearchActive,
  onClearSearch,
  onForceSearch,
  onSearchIconClick,
  exactOnly = false,
  onToggleExactOnly,
  t,
}) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const handleFocus = () => {
    // لما الكيبورد يطلع، نتأكد ان الـ SearchBar مش خلف الهيدر
    setTimeout(() => {
      if (!wrapperRef.current) return;
      const scrollContainer = document.getElementById('main-scroll-container');
      if (!scrollContainer) return;
      // اسكرول للأعلى عشان الـ SearchBar يبان
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }, 350);
  };

  return (
    <div ref={wrapperRef} className="space-y-2 animate-card">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
           <div className="w-4 h-4"><SearchIcon /></div>
        </div>
        <input
          id="search-term"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onForceSearch()}
          onFocus={handleFocus}
          placeholder={t('searchPlaceholder')}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full bg-white dark:bg-dark-card h-12 pl-11 pr-16 rounded-2xl text-sm font-semibold shadow-[0_4px_12px_-2px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-slate-700 focus:border-primary/40 outline-none transition-all placeholder-slate-300 dark:placeholder-slate-600"
        />
        {/* زرار وضع البحث الحرفي - دايماً ظاهر */}
        <button
          onClick={onToggleExactOnly}
          className={`absolute inset-y-0 flex items-center transition-all ${isSearchActive ? 'right-10 pr-2' : 'right-0 pr-4'}`}
          title={exactOnly ? 'وضع البحث الحرفي مفعّل - اضغط للبحث الذكي' : 'اضغط لتفعيل البحث الحرفي الدقيق'}
        >
          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-black transition-all border ${
            exactOnly
              ? 'bg-primary border-primary text-white shadow-md shadow-primary/30' 
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400'
          }`}>
            {exactOnly ? 'Aa' : 'A~'}
          </div>
        </button>
        {isSearchActive && (
          <button
            onClick={onClearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-rose-500 transition-colors"
          >
            <div className="w-5 h-5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-full"><ClearIcon /></div>
          </button>
        )}
      </div>

      <div className="flex bg-white dark:bg-dark-card p-1 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm w-fit mx-auto gap-0.5">
        <button 
          onClick={() => setTextSearchMode('tradeName')}
          className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${textSearchMode === 'tradeName' ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
        >
          {t('tradeName')}
        </button>
        <button 
          onClick={() => setTextSearchMode('scientificName')}
          className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${textSearchMode === 'scientificName' ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
        >
          {t('scientificName')}
        </button>
      </div>
    </div>
  );
};

export default SearchBar;