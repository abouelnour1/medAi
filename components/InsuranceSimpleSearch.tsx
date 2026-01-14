
import React, { useState, useMemo, useEffect } from 'react';
import { TFunction, Language, InsuranceDrug, Medicine, SelectedInsuranceData, ScientificGroupData, InsuranceSearchMode } from '../types';
import SearchIcon from './icons/SearchIcon';
import ClearIcon from './icons/ClearIcon';
import IndicationCard, { IndicationGroup } from './IndicationCard';
import NotCoveredCard from './NotCoveredCard';
import DrugPolicyCard, { DrugGroup } from './DrugPolicyCard';

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

type SearchResult = IndicationGroup | DrugGroup | { type: 'not-covered'; medicine: Medicine };


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
    
    // Logic Update: Ensure 3 chars NOT counting the wildcard %
    const effectiveLength = trimmedSearchTerm.replace(/%/g, '').length;
    if (effectiveLength < 2) return []; // Reduced slightly to be more permissive
    
    const lowerSearchTerm = trimmedSearchTerm.toLowerCase();
    
    const normalizeSciName = (name: string) => (name || '').toLowerCase().split(/[\s,]+/).map(s => s.trim()).filter(s => s.length > 2).sort().join(',');

    let matchingPolicies: InsuranceDrug[] = [];
    const isNameSearch = searchMode === 'tradeName' || searchMode === 'scientificName';
    
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = lowerSearchTerm.split('%').map(escapeRegExp);
    const prefix = lowerSearchTerm.includes('%') ? '' : '^';
    const pattern = prefix + parts.join('.*');
    
    let searchRegex: RegExp;
    try {
        searchRegex = new RegExp(pattern, 'i');
    } catch (e) {
        searchRegex = new RegExp(escapeRegExp(lowerSearchTerm), 'i');
    }
    
    const matchingMeds = isNameSearch 
        ? allMedicines.filter(m => {
            if (searchMode === 'tradeName') {
                return searchRegex.test((m['Trade Name'] || '').toLowerCase());
            }
            if (searchMode === 'scientificName') {
                return (m['Scientific Name'] || '').toLowerCase().includes(lowerSearchTerm.replace(/%/g, ''));
            }
            return false;
        })
        : [];

    const sciNameToTradeNames = new Map<string, Set<string>>();
    if (searchMode === 'tradeName') {
        matchingMeds.forEach(med => {
            if (searchRegex.test(med['Trade Name'] || '')) {
                const sciName = normalizeSciName(med['Scientific Name']);
                if (!sciNameToTradeNames.has(sciName)) {
                    sciNameToTradeNames.set(sciName, new Set());
                }
                sciNameToTradeNames.get(sciName)!.add(med['Trade Name']);
            }
        });
    }

    if (searchMode === 'scientificName') {
        matchingPolicies = insuranceData.filter(p => (p.scientificName || '').toLowerCase().includes(lowerSearchTerm.replace(/%/g, '')));
    } else if (searchMode === 'tradeName') {
        const sciNamesFromMeds = new Set(matchingMeds.map(m => normalizeSciName(m['Scientific Name'])));
        matchingPolicies = insuranceData.filter(p => {
            const normPolicyName = normalizeSciName(p.scientificName);
            // Check if policy name exists in meds or vice-versa (partial overlap)
            return Array.from(sciNamesFromMeds).some(medSci => medSci.includes(normPolicyName) || normPolicyName.includes(medSci));
        });
    } else { // indication or icd10Code
        const searchKeywords = lowerSearchTerm.split(/\s+/).filter(Boolean);
        matchingPolicies = insuranceData.filter(p => {
            const field = searchMode === 'indication' ? p.indication : p.icd10Code;
            return searchKeywords.every(kw => (field || '').toLowerCase().includes(kw.replace(/%/g, '')));
        });
    }

    const results: SearchResult[] = [];
    const actuallyCoveredSciNames = new Set<string>();
    matchingPolicies.forEach(p => {
        if (p.scientificName) {
            actuallyCoveredSciNames.add(normalizeSciName(p.scientificName));
        }
    });

    if (isNameSearch) {
        const notCoveredMeds = matchingMeds.filter(m => {
            const normMedName = normalizeSciName(m['Scientific Name']);
            return !Array.from(actuallyCoveredSciNames).some(covered => normMedName.includes(covered) || covered.includes(normMedName));
        });

        notCoveredMeds.forEach(med => {
            results.push({ type: 'not-covered', medicine: med });
        });
    }

    if (isNameSearch) {
        const groupedByDrug = new Map<string, InsuranceDrug[]>();
        matchingPolicies.forEach(policy => {
            const key = normalizeSciName(policy.scientificName);
            if (!groupedByDrug.has(key)) groupedByDrug.set(key, []);
            groupedByDrug.get(key)!.push(policy);
        });

        // Fix: Use for...of to ensure correct type inference for sciNameKey and policies
        // This avoids issues where sciNameKey might be treated as 'unknown' in a .forEach callback.
        for (const [sciNameKey, policies] of groupedByDrug.entries()) {
            const realSciName = policies[0].scientificName;
            const availableMedicines = allMedicines
                .filter(m => {
                    const normM = normalizeSciName(m['Scientific Name']);
                    return normM.includes(sciNameKey) || sciNameKey.includes(normM);
                })
                .sort((a, b) => parseFloat(a['Public price']) - parseFloat(b['Public price']));

            results.push({
                type: 'drug-grouped',
                scientificName: realSciName,
                tradeNames: Array.from(sciNameToTradeNames.get(sciNameKey) || []),
                policies: policies,
                availableMedicines: availableMedicines
            });
        }

    } else {
        const groupedByIndication = new Map<string, InsuranceDrug[]>();
        matchingPolicies.forEach(policy => {
            const key = policy.indication || 'Unknown';
            if (!groupedByIndication.has(key)) {
                groupedByIndication.set(key, []);
            }
            groupedByIndication.get(key)!.push(policy);
        });

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
                        .filter(m => normalizeSciName(m['Scientific Name']).includes(normalizeSciName(sciName)))
                        .sort((a, b) => parseFloat(a['Public price']) - parseFloat(b['Public price']));

                    scientificGroupsMap.set(sciName, {
                        policies: [],
                        availableMedicines: availableMedicines,
                        scientificName: sciName,
                        matchingTradeNames: undefined
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
    }
    
    return results;
  }, [searchTerm, searchMode, insuranceData, allMedicines]);


  const placeholderText = useMemo(() => {
    switch (searchMode) {
      case 'scientificName': return t('searchPlaceholder').replace('...', ` ${t('scientificName')}...`);
      case 'tradeName': return t('searchPlaceholder').replace('...', ` ${t('tradeName')}...`);
      case 'indication': return t('searchPlaceholder').replace('...', ` ${t('indication')}...`);
      case 'icd10Code': return t('searchPlaceholder').replace('...', ` ${t('icd10Code')}...`);
      default: return t('insuranceSearchPlaceholder');
    }
  }, [searchMode, t]);

  const renderResults = () => {
    if (searchTerm.replace(/%/g, '').trim().length < 2) return null;
    
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
      if (result.type === 'drug-grouped') {
          return <DrugPolicyCard key={result.scientificName} group={result} t={t} onSelectInsuranceData={onSelectInsuranceData} />
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
