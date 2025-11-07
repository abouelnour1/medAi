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
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  t,
  ariaLabel,
  mode = 'single',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
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

  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      return options;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();

    if (isGrouped(options)) {
      return options
        .map(group => ({
          ...group,
          options: group.options.filter(opt => opt.toLowerCase().includes(lowerSearchTerm)),
        }))
        .filter(group => group.options.length > 0);
    } else {
      return (options as string[]).filter(opt => opt.toLowerCase().includes(lowerSearchTerm));
    }
  }, [options, searchTerm]);


  const renderSelected = () => {
    if (mode === 'multi') {
        const selected = (value as string[]) || [];
        if (selected.length === 0) {
            return <span className="text-light-text-secondary dark:text-dark-text-secondary">{placeholder}</span>;
        }
        return selected.map(item => (
            <span key={item} className="flex items-center gap-1.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-300 text-sm font-medium px-2 py-0.5 rounded-md">
                {item}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(item);
                    }}
                    className="text-primary/70 hover:text-primary dark:text-blue-400 dark:hover:text-blue-200"
                    aria-label={`Remove ${item}`}
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </span>
        ));
    }
    // Single mode
    return value ? <span className="truncate">{value}</span> : <span className="text-light-text-secondary dark:text-dark-text-secondary">{placeholder}</span>;
  };
  

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[42px] px-3 py-1.5 bg-gray-100 dark:bg-slate-700 border-2 border-transparent focus:border-primary rounded-xl outline-none transition-colors text-left flex justify-between items-center"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <div className="flex-grow flex flex-wrap gap-1 items-center">{renderSelected()}</div>
        <svg className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 max-h-60 flex flex-col">
          <div className="p-2 border-b border-gray-100 dark:border-slate-700">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={t('search') + '...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-100 dark:bg-slate-700 border-2 border-transparent focus:border-primary rounded-md outline-none transition-colors"
              />
              <div className="absolute top-1/2 left-2.5 rtl:left-auto rtl:right-2.5 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary pointer-events-none">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </div>
          <ul className="overflow-y-auto flex-1" role="listbox">
            {mode === 'single' && (
              <li
                onClick={() => handleSelect('')}
                className="px-3 py-2 text-sm text-light-text hover:text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                role="option"
                aria-selected={value === ''}
              >
                {placeholder}
              </li>
            )}

            {isGrouped(filteredOptions) ? (
              filteredOptions.map(group => (
                <React.Fragment key={group.label}>
                  <li className="px-3 pt-2 pb-1 text-xs font-bold text-light-text-secondary dark:text-dark-text-secondary uppercase sticky top-0 bg-white dark:bg-dark-card">{group.label}</li>
                  {group.options.map(option => {
                    const isSelected = mode === 'multi' ? (value as string[]).includes(option) : value === option;
                    return (
                        <li key={option} onClick={() => handleSelect(option)} className={`px-3 py-2 text-sm cursor-pointer flex justify-between items-center ${isSelected ? 'font-semibold text-primary dark:text-primary' : 'text-light-text hover:text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-slate-700'}`} role="option" aria-selected={isSelected}>
                            {option}
                            {isSelected && mode === 'multi' && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </li>
                    )
                  })}
                </React.Fragment>
              ))
            ) : (filteredOptions as string[]).length > 0 ? (
              (filteredOptions as string[]).map(option => {
                const isSelected = mode === 'multi' ? (value as string[]).includes(option) : value === option;
                return (
                  <li key={option} onClick={() => handleSelect(option)} className={`px-3 py-2 text-sm cursor-pointer flex justify-between items-center ${isSelected ? 'font-semibold text-primary dark:text-primary' : 'text-light-text hover:text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-slate-700'}`} role="option" aria-selected={isSelected}>
                      {option}
                      {isSelected && mode === 'multi' && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-2 text-sm text-light-text-secondary dark:text-dark-text-secondary italic text-center">{t('noResultsTitle')}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;