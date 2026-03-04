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
    // نستنى الكيبورد يطلع (200ms) وبعدين نعمل scroll عشان الـ SearchBar ميتخبيش
    setTimeout(() => {
      wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  return (
    <div ref={wrapperRef} className="space-y-4 animate-card">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
           <div className="w-6 h-6"><SearchIcon /></div>
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
          className="w-full bg-white dark:bg-dark-card h-16 pl-12 pr-20 rounded-[2rem] text-sm font-black shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] border-2 border-transparent focus:border-primary/30 focus:shadow-primary/10 outline-none transition-all placeholder-slate-300 dark:placeholder-slate-600"
        />
        {/* زرار وضع البحث الحرفي - دايماً ظاهر */}
        <button
          onClick={onToggleExactOnly}
          className={`absolute inset-y-0 flex items-center transition-all ${isSearchActive ? 'right-10 pr-2' : 'right-0 pr-4'}`}
          title={exactOnly ? 'وضع البحث الحرفي مفعّل - اضغط للبحث الذكي' : 'اضغط لتفعيل البحث الحرفي الدقيق'}
        >
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-black transition-all border-2 ${
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
            <div className="w-6 h-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-full"><ClearIcon /></div>
          </button>
        )}
      </div>

      <div className="flex bg-white/50 dark:bg-dark-card/50 backdrop-blur-sm p-1.5 rounded-2xl border border-white dark:border-dark-border shadow-sm max-w-sm mx-auto">
        <button 
          onClick={() => setTextSearchMode('tradeName')}
          className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${textSearchMode === 'tradeName' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
        >
          {t('tradeName')}
        </button>
        <button 
          onClick={() => setTextSearchMode('scientificName')}
          className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${textSearchMode === 'scientificName' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
        >
          {t('scientificName')}
        </button>
      </div>
    </div>
  );
};

export default SearchBar;