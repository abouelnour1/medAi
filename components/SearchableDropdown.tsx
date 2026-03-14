
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TFunction } from '../types';
import ClearIcon from './icons/ClearIcon';

type GroupedOption = { label: string; options: string[] };

function isGrouped(options: any[]): options is GroupedOption[] {
  return options.length > 0 && typeof options[0] === 'object' && 'label' in options[0] && 'options' in options[0];
}

interface SearchableDropdownProps {
  options: string[] | GroupedOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder: string;
  t: TFunction;
  ariaLabel: string;
  mode?: 'single' | 'multi';
  headerBottom?: number; // ارتفاع الـ header من فوق
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  t,
  ariaLabel,
  mode = 'single',
  headerBottom = 80,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          event.stopPropagation();
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true); // capture phase
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setDisplayLimit(50);
      // دايماً يبدأ من تحت الـ header وينزل للأسفل
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownStyle({
          position: 'fixed',
          top: headerBottom + 8,
          left: rect.left,
          width: rect.width,
          maxHeight: window.innerHeight - headerBottom - 24,
          zIndex: 9998,
        });
      }
    }
  }, [isOpen]);

  const handleSelect = (option: string) => {
    if (mode === 'single') {
      onChange(option);
      setIsOpen(false);
      setSearchTerm('');
    } else {
      const currentSelection = (value as string[]) || [];
      const newSelection = currentSelection.includes(option)
        ? currentSelection.filter(item => item !== option)
        : [...currentSelection, option];
      onChange(newSelection);
    }
  };

  const { displayedOptions, hasMore, totalMatchCount } = useMemo(() => {
    let filtered: string[] | GroupedOption[] = [];
    let count = 0;
    
    if (!searchTerm) {
        filtered = options;
        if (isGrouped(options)) {
            options.forEach(g => count += g.options.length);
        } else {
            count = options.length;
        }
    } else {
        const lowerSearchTerm = searchTerm.toLowerCase();
        if (isGrouped(options)) {
            filtered = options
                .map(group => ({
                ...group,
                options: group.options.filter(opt => typeof opt === 'string' && opt.toLowerCase().includes(lowerSearchTerm)),
                }))
                .filter(group => {
                    count += group.options.length;
                    return group.options.length > 0;
                });
        } else {
            filtered = (options as string[]).filter(opt => {
                const matches = typeof opt === 'string' && opt.toLowerCase().includes(lowerSearchTerm);
                if (matches) count++;
                return matches;
            });
        }
    }

    let sliced: string[] | GroupedOption[] = [];
    let more = false;

    if (isGrouped(filtered)) {
        sliced = filtered; // Grouped lists are usually smaller categories
    } else {
        const flatList = filtered as string[];
        if (flatList.length > displayLimit) {
            sliced = flatList.slice(0, displayLimit);
            more = true;
        } else {
            sliced = flatList;
        }
    }

    return { displayedOptions: sliced, hasMore: more, totalMatchCount: count };
  }, [options, searchTerm, displayLimit]);


  const renderSelected = () => {
    if (mode === 'multi') {
        const selected = (value as string[]) || [];
        if (selected.length === 0) {
            return <span className="text-light-text-secondary dark:text-dark-text-secondary truncate">{placeholder}</span>;
        }
        return selected.map(item => (
            <span key={item} className="flex items-center gap-1.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-300 text-[11px] font-bold px-2 py-0.5 rounded-md border border-primary/20">
                {item}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(item);
                    }}
                    className="text-primary/70 hover:text-primary dark:text-blue-400 dark:hover:text-blue-200"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </span>
        ));
    }
    return value ? <span className="truncate font-bold text-primary">{value}</span> : <span className="text-light-text-secondary dark:text-dark-text-secondary">{placeholder}</span>;
  };
  

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[44px] px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-2 transition-all rounded-xl outline-none text-left flex justify-between items-center group
                   ${isOpen ? 'border-primary shadow-md' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200'}`}
      >
        <div className="flex-grow flex flex-wrap gap-1.5 items-center overflow-hidden">{renderSelected()}</div>
        <svg className={`h-5 w-5 text-slate-400 transform transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180 text-primary' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700  flex flex-col overflow-hidden animate-zoom-in"
          style={dropdownStyle}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}>
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex-1 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">{ariaLabel}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); setSearchTerm(''); }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-300 active:scale-90 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={t('search') + '...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary rounded-xl outline-none transition-all ltr:pl-9 ltr:pr-4 rtl:pr-9 rtl:pl-4 text-sm"
              />
              <div className="absolute top-1/2 left-3 rtl:left-auto rtl:right-3 transform -translate-y-1/2 text-slate-400 pointer-events-none">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </div>
          <ul className="overflow-y-auto flex-1 no-scrollbar pb-2" role="listbox">
            {mode === 'single' && (
              <li
                onClick={() => handleSelect('')}
                className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-50 dark:border-slate-800"
                role="option"
                aria-selected={value === ''}
              >
                {t('all')}
              </li>
            )}

            {isGrouped(displayedOptions) ? (
              displayedOptions.map(group => {
                // هل كل الـ options في الـ group محددة؟
                const groupSelected = mode === 'multi'
                  ? group.options.every(o => (value as string[]).includes(o))
                  : false;
                const handleSelectAll = () => {
                  if (mode !== 'multi') return;
                  const current = value as string[];
                  if (groupSelected) {
                    // إلغاء تحديد الكل
                    onChange(current.filter(v => !group.options.includes(v)));
                  } else {
                    // تحديد الكل
                    const merged = Array.from(new Set([...current, ...group.options]));
                    onChange(merged);
                  }
                };
                return (
                <React.Fragment key={group.label}>
                  <li className="px-3 pt-2.5 pb-1 sticky top-0 bg-white/95 dark:bg-dark-card/95 backdrop-blur-sm z-10 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.label}</span>
                    {mode === 'multi' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelectAll(); }}
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full transition-all ${groupSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                      >
                        {groupSelected ? '✓ الكل' : 'اختار الكل'}
                      </button>
                    )}
                  </li>
                  {group.options.map(option => {
                    const isSelected = mode === 'multi' ? (value as string[]).includes(option) : value === option;
                    return (
                        <li key={option} onClick={() => handleSelect(option)} className={`px-4 py-2.5 text-sm cursor-pointer flex justify-between items-center transition-colors ${isSelected ? 'bg-primary/5 font-bold text-primary' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`} role="option" aria-selected={isSelected}>
                            <span className="truncate">{option}</span>
                            {isSelected && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </li>
                    )
                  })}
                </React.Fragment>
                );
              })
            ) : (displayedOptions as string[]).length > 0 ? (
              <>
                {(displayedOptions as string[]).map(option => {
                    const isSelected = mode === 'multi' ? (value as string[]).includes(option) : value === option;
                    return (
                    <li key={option} onClick={() => handleSelect(option)} className={`px-4 py-2.5 text-sm cursor-pointer flex justify-between items-center transition-colors ${isSelected ? 'bg-primary/5 font-bold text-primary' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`} role="option" aria-selected={isSelected}>
                        <span className="truncate">{option}</span>
                        {isSelected && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    </li>
                    );
                })}
                {hasMore && (
                    <li className="px-4 py-3">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setDisplayLimit(prev => prev + 50);
                            }}
                            className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary rounded-xl text-xs font-black uppercase tracking-widest transition-all text-slate-500"
                        >
                            {t('loadMore') || 'مشاهدة المزيد'}
                        </button>
                    </li>
                )}
              </>
            ) : (
              <li className="px-4 py-10 text-sm text-slate-400 italic text-center">{t('noResultsTitle')}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
