
import React, { useState, useMemo, useEffect } from 'react';
import { TFunction, Language, InsuranceDrug, Medicine, SelectedInsuranceData, ScientificGroupData, InsuranceSearchMode } from '../types';
import SearchIcon from './icons/SearchIcon';
import ClearIcon from './icons/ClearIcon';
import IndicationCard, { IndicationGroup } from './IndicationCard';
import NotCoveredCard from './NotCoveredCard';

interface InsuranceSimpleSearchProps {
  t: TFunction;
  language: Language;
  insuranceData: InsuranceDrug[];
  allMedicines: Medicine[];
  onSelectInsuranceData: (data: SelectedInsuranceData) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchMode: InsuranceSearchMode;
  setSearchMode: (mode: InsuranceSearchMode) => void;
}

type SearchResult = IndicationGroup | { type: 'not-covered'; medicine: Medicine };


const InsuranceSimpleSearch: React.FC<InsuranceSimpleSearchProps> = ({ 
    t, 
    insuranceData, 
    allMedicines, 
    onSelectInsuranceData,
    searchTerm,
    setSearchTerm,
    searchMode,
    setSearchMode,
}) => {
  const [inputValue, setInputValue] = useState(searchTerm);

  // Debounce effect to update the parent search term
  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue !== searchTerm) {
        setSearchTerm(inputValue);
      }
    }, 300); // 300ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, searchTerm, setSearchTerm]);

  // Effect to sync input value if parent term changes (e.g., from a global clear)
  useEffect(() => {
    if (searchTerm !== inputValue) {
      setInputValue(searchTerm);
    }
  }, [searchTerm]);

  const searchResults = useMemo((): SearchResult[] => {
    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm.length < 3) return [];
    
    const lowerSearchTerm = trimmedSearchTerm.toLowerCase();
    const searchKeywords = lowerSearchTerm.split(/\s+/).filter(Boolean);
    const normalizeSciName = (name: string) => (name || '').toLowerCase().split(',').map(s => s.trim()).sort().join(',');

    let matchingPolicies: InsuranceDrug[] = [];
    
    const isNameSearch = searchMode === 'tradeName' || searchMode === 'scientificName';
    
    const matchingMeds = isNameSearch 
        ? allMedicines.filter(m => 
            (m['Trade Name'] || '').toLowerCase().includes(lowerSearchTerm) || 
            (m['Scientific Name'] || '').toLowerCase().includes(lowerSearchTerm)
          )
        : [];

    const sciNameToTradeNames = new Map<string, Set<string>>();
    if (searchMode === 'tradeName') {
        matchingMeds.forEach(med => {
            if ((med['Trade Name'] || '').toLowerCase().includes(lowerSearchTerm)) {
                const sciName = normalizeSciName(med['Scientific Name']);
                if (!sciNameToTradeNames.has(sciName)) {
                    sciNameToTradeNames.set(sciName, new Set());
                }
                sciNameToTradeNames.get(sciName)!.add(med['Trade Name']);
            }
        });
    }

    // Find all policies that match the search criteria.
    if (searchMode === 'scientificName') {
        matchingPolicies = insuranceData.filter(p => (p.scientificName || '').toLowerCase().includes(lowerSearchTerm));
    } else if (searchMode === 'tradeName') {
        const sciNamesFromMeds = new Set(matchingMeds.map(m => normalizeSciName(m['Scientific Name'])));
        matchingPolicies = insuranceData.filter(p => sciNamesFromMeds.has(normalizeSciName(p.scientificName)));
    } else { // indication or icd10Code
        matchingPolicies = insuranceData.filter(p => {
            const field = searchMode === 'indication' ? p.indication : p.icd10Code;
            // Safety check: ensure field is a string before calling toLowerCase
            return searchKeywords.every(kw => (field || '').toLowerCase().replace(/[,-]/g, ' ').includes(kw));
        });
    }

    const results: SearchResult[] = [];

    // Handle non-covered items for name searches
    if (isNameSearch) {
        const allCoveredSciNames = new Set(insuranceData.map(p => normalizeSciName(p.scientificName)));
        const notCoveredMeds = matchingMeds.filter(m => {
            const isSupplementOrHerbal = m['Product type'] === 'Supplement' || m.DrugType === 'Herbal';
            const hasNoPolicy = !allCoveredSciNames.has(normalizeSciName(m['Scientific Name']));
            return isSupplementOrHerbal || hasNoPolicy;
        });
        notCoveredMeds.forEach(med => {
            results.push({ type: 'not-covered', medicine: med });
        });
    }

    // Group covered policies by indication
    const groupedByIndication = new Map<string, InsuranceDrug[]>();
    matchingPolicies.forEach(policy => {
        const key = policy.indication || 'Unknown';
        if (!groupedByIndication.has(key)) {
            groupedByIndication.set(key, []);
        }
        groupedByIndication.get(key)!.push(policy);
    });

    // For each indication, group policies by scientific name.
    groupedByIndication.forEach((policies, indication) => {
        const scientificGroupsMap = new Map<string, ScientificGroupData>();
        
        const allIcd10Codes = new Set<string>();
        policies.forEach(p => {
            if (p.icd10Code) {
                p.icd10Code.split(',').forEach(code => {
                    const trimmedCode = code.trim();
                    if(trimmedCode) allIcd10Codes.add(trimmedCode);
                });
            }
        });
        
        policies.forEach(policy => {
            const sciName = policy.scientificName || 'Unknown';
            if (!scientificGroupsMap.has(sciName)) {
                 const availableMedicines = allMedicines
                    .filter(m => normalizeSciName(m['Scientific Name']) === normalizeSciName(sciName))
                    .sort((a, b) => parseFloat(a['Public price']) - parseFloat(b['Public price']));

                scientificGroupsMap.set(sciName, {
                    policies: [],
                    availableMedicines: availableMedicines,
                    scientificName: sciName,
                    matchingTradeNames: searchMode === 'tradeName' 
                        ? Array.from(sciNameToTradeNames.get(normalizeSciName(sciName)) || []) 
                        : undefined
                });
            }
            scientificGroupsMap.get(sciName)!.policies.push(policy);
        });
        
        results.push({
            type: 'covered',
            indication: indication,
            icd10Codes: Array.from(allIcd10Codes).sort(),
            scientificGroups: Array.from(scientificGroupsMap.values())
                .sort((a, b) => a.scientificName.localeCompare(b.scientificName))
        });
    });
    
    return results.sort((a, b) => {
      const getRelevanceScore = (item: SearchResult): number => {
          let targetStrings: string[] = [];
          
          if (item.type === 'covered') {
              switch(searchMode) {
                  case 'indication':
                      targetStrings.push(item.indication || '');
                      break;
                  case 'icd10Code':
                      targetStrings.push(...item.icd10Codes);
                      break;
                  case 'scientificName':
                      item.scientificGroups.forEach(sg => targetStrings.push(sg.scientificName || ''));
                      break;
                  case 'tradeName':
                      item.scientificGroups.forEach(sg => {
                          targetStrings.push(sg.scientificName || '');
                          if (sg.matchingTradeNames) {
                              targetStrings.push(...sg.matchingTradeNames);
                          }
                      });
                      break;
              }
          } else { // 'not-covered'
              targetStrings.push(item.medicine['Trade Name'] || '');
              targetStrings.push(item.medicine['Scientific Name'] || '');
          }

          const lowerTargetStrings = targetStrings.map(s => (s || '').toLowerCase());

          if (lowerTargetStrings.some(s => s.startsWith(lowerSearchTerm))) {
              return 2; // Starts with match
          }
          if (lowerTargetStrings.some(s => s.includes(lowerSearchTerm))) {
              return 1; // Includes match
          }
          return 0;
      };

      const getCoverageScore = (item: SearchResult): number => {
          return item.type === 'covered' ? 2 : (isNameSearch ? 1 : 0);
      };

      const scoreA = getRelevanceScore(a) * 10 + getCoverageScore(a);
      const scoreB = getRelevanceScore(b) * 10 + getCoverageScore(b);

      if (scoreA !== scoreB) {
          return scoreB - scoreA; // Higher score first
      }

      // Fallback to alphabetical sort for items with the same score
      if (a.type === 'covered' && b.type === 'covered') {
          return (a.indication || '').localeCompare(b.indication || '');
      }
      if (a.type === 'not-covered' && b.type === 'not-covered') {
          return (a.medicine['Trade Name'] || '').localeCompare(b.medicine['Trade Name'] || '');
      }
      
      return 0;
    });

  }, [searchTerm, searchMode, insuranceData, allMedicines]);


  const placeholderText = useMemo(() => {
    switch (searchMode) {
      case 'scientificName': return t('searchPlaceholder').replace('...', ` ${t('scientificName')}...`);
      case 'tradeName': return t('searchPlaceholder').replace('...', ` ${t('tradeName')}...`);
      case 'indication': return t('searchPlaceholder').replace('...', ` ${t('indication')}...`);
      case 'icd10Code': return t('searchPlaceholder').replace('...', ` ${t('icd10Code')}...`);
      default: return t('insuranceSimpleSearchPlaceholder');
    }
  }, [searchMode, t]);

  const renderResults = () => {
    if (searchTerm.trim().length < 3) return null;
    if (searchResults.length === 0) {
       return (
         <div className="text-center py-10 px-4 bg-light-card dark:bg-dark-card rounded-lg shadow-sm">
           <h3 className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary">{t('noResultsTitle')}</h3>
           <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('noResultsSubtitle')}</p>
         </div>
       )
    }

    return searchResults.map((result, index) => {
      if (result.type === 'covered') {
        return <IndicationCard key={result.indication} group={result} t={t} onSelectInsuranceData={onSelectInsuranceData} />;
      }
      if (result.type === 'not-covered') {
        return <NotCoveredCard key={result.medicine.RegisterNumber} medicine={result.medicine} t={t} />;
      }
      return null;
    });
  };

  const handleClear = () => {
    setInputValue('');
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <label htmlFor="insurance-search-mode" className="sr-only">{t('searchBy')}</label>
        <select
          id="insurance-search-mode"
          value={searchMode}
          onChange={(e) => setSearchMode(e.target.value as InsuranceSearchMode)}
          className="w-full h-10 pl-3 pr-8 rtl:pr-3 rtl:pl-8 py-2 text-sm bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-primary dark:focus:border-primary rounded-xl outline-none transition-colors appearance-none cursor-pointer text-light-text dark:text-dark-text"
        >
          <option value="tradeName">{t('searchBy')}: {t('tradeName')}</option>
          <option value="scientificName">{t('searchBy')}: {t('scientificName')}</option>
          <option value="indication">{t('searchBy')}: {t('indication')}</option>
          <option value="icd10Code">{t('searchBy')}: {t('icd10Code')}</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={placeholderText}
          className="w-full h-10 py-2 pl-3 pr-10 rtl:pr-3 rtl:pl-10 text-sm bg-light-card dark:bg-dark-card border-2 border-slate-200 dark:border-slate-700 focus:border-primary dark:focus:border-primary rounded-xl outline-none transition-colors"
          aria-label={placeholderText}
        />
        <div className="absolute top-1/2 right-3 rtl:right-auto rtl:left-3 transform -translate-y-1/2">
          {inputValue && (
             <button
              type="button"
              onClick={handleClear}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-dark-text-secondary dark:hover:text-dark-text"
              aria-label={t('clearSearch')}
            >
              <ClearIcon />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {renderResults()}
      </div>
    </div>
  );
};

export default InsuranceSimpleSearch;
