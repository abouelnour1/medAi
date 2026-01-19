
import React, { useState, useMemo, useEffect } from 'react';
import { TFunction, Language, InsuranceDrug, Medicine, SelectedInsuranceData, ScientificGroupData, InsuranceSearchMode } from '../types';
import ClearIcon from './icons/ClearIcon';
import IndicationCard, { IndicationGroup } from './IndicationCard';
import NotCoveredCard from './NotCoveredCard';
import DrugPolicyCard, { DrugGroup } from './DrugPolicyCard';

const JUNK_TOKENS = new Set(['mg', 'ml', 'g', 'mcg', 'iu', 'kg', 'tab', 'caps', 'solution', 'suspension', 'oral', 'vial', 'ampoule', 'f.c', 'tablet', 'capsule']);

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

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue !== searchTerm) {
        setSearchTerm(inputValue);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [inputValue, searchTerm, setSearchTerm]);

  useEffect(() => {
    if (searchTerm !== inputValue) {
      setInputValue(searchTerm);
    }
  }, [searchTerm]);

  const searchResults = useMemo((): SearchResult[] => {
    const trimmedTerm = searchTerm.trim().toLowerCase();
    if (trimmedTerm.replace(/%/g, '').length < 2) return [];
    
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const normalizeForMatch = (name: string) => {
        if (!name) return '';
        return name.toLowerCase()
            .replace(/\d+\s*(mg|ml|g|mcg|iu|kg|tablet|capsule|cap|tab|softgel)\b/g, '')
            .replace(/[^a-z,]/g, ' ')
            .split(/[,\s]+/)
            .filter(s => s.length > 1 && !JUNK_TOKENS.has(s))
            .join(' ')
            .trim();
    };

    let matchingMeds: Medicine[] = [];
    const isNameSearch = searchMode === 'tradeName' || searchMode === 'scientificName';

    if (isNameSearch) {
        const field = searchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
        let pattern = '';
        if (trimmedTerm.includes('%')) {
            pattern = trimmedTerm.split('%').map(escapeRegExp).join('.*');
        } else {
            pattern = '^' + escapeRegExp(trimmedTerm);
        }
        
        const regex = new RegExp(pattern, 'i');
        matchingMeds = allMedicines.filter(m => regex.test(m[field]));
    }

    const sciToTradeMap = new Map<string, Set<string>>();
    const scientificToNormalizedMap = new Map<string, string>();

    matchingMeds.forEach(m => {
        const fullSci = m['Scientific Name'];
        const normalized = normalizeForMatch(fullSci);
        if (normalized.length < 2) return;
        if (!sciToTradeMap.has(fullSci)) {
            sciToTradeMap.set(fullSci, new Set());
            scientificToNormalizedMap.set(fullSci, normalized);
        }
        sciToTradeMap.get(fullSci)!.add(m['Trade Name']);
    });

    const results: SearchResult[] = [];

    if (isNameSearch) {
        sciToTradeMap.forEach((tradeNamesSet, fullSciName) => {
            const normalizedSci = scientificToNormalizedMap.get(fullSciName)!;
            const matchedPolicies = insuranceData.filter(p => {
                const policyNormalized = normalizeForMatch(p.scientificName);
                return policyNormalized === normalizedSci || 
                       policyNormalized.includes(normalizedSci) || 
                       normalizedSci.includes(policyNormalized);
            });

            if (matchedPolicies.length > 0) {
                const availableMeds = allMedicines
                    .filter(m => normalizeForMatch(m['Scientific Name']) === normalizedSci)
                    .sort((a, b) => parseFloat(a['Public price']) - parseFloat(b['Public price']));

                results.push({
                    type: 'drug-grouped',
                    scientificName: fullSciName,
                    tradeNames: Array.from(tradeNamesSet),
                    policies: matchedPolicies,
                    availableMedicines: availableMeds
                });
            } else {
                // تصفية: فقط الأدوية التي لا تملك سياسة تأمين تظهر كـ "غير مغطى"
                const medsOfThisSci = matchingMeds.filter(m => m['Scientific Name'] === fullSciName);
                medsOfThisSci.forEach(med => {
                    results.push({ type: 'not-covered', medicine: med });
                });
            }
        });
    } else {
        // البحث حسب الحالة أو التشخيص
        let pattern = trimmedTerm.includes('%') 
            ? trimmedTerm.split('%').map(escapeRegExp).join('.*')
            : escapeRegExp(trimmedTerm);
        const regex = new RegExp(pattern, 'i');

        const matchingPolicies = insuranceData.filter(p => {
            const targetField = (searchMode === 'indication' ? p.indication : p.icd10Code || '').toLowerCase();
            return regex.test(targetField);
        });

        const groupedByIndication = new Map<string, InsuranceDrug[]>();
        matchingPolicies.forEach(p => {
            const key = p.indication || 'General';
            if (!groupedByIndication.has(key)) groupedByIndication.set(key, []);
            groupedByIndication.get(key)!.push(p);
        });

        groupedByIndication.forEach((policies, indication) => {
            const sciGroupsMap = new Map<string, ScientificGroupData>();
            const icdCodes = new Set<string>();

            policies.forEach(p => {
                if (p.icd10Code) p.icd10Code.split(',').forEach(c => icdCodes.add(c.trim()));
                const sciName = p.scientificName;
                if (!sciGroupsMap.has(sciName)) {
                    sciGroupsMap.set(sciName, {
                        scientificName: sciName,
                        policies: [],
                        availableMedicines: allMedicines.filter(m => normalizeForMatch(m['Scientific Name']) === normalizeForMatch(sciName))
                    });
                }
                sciGroupsMap.get(sciName)!.policies.push(p);
            });

            results.push({
                type: 'covered',
                indication: indication,
                icd10Codes: Array.from(icdCodes).sort(),
                scientificGroups: Array.from(sciGroupsMap.values())
            });
        });
    }

    const finalResults: SearchResult[] = [];
    const seenMeds = new Set<string>();
    const seenSci = new Set<string>();

    results.forEach(res => {
        if (res.type === 'not-covered') {
            if (!seenMeds.has(res.medicine.RegisterNumber)) {
                finalResults.push(res);
                seenMeds.add(res.medicine.RegisterNumber);
            }
        } else if (res.type === 'drug-grouped') {
            if (!seenSci.has(res.scientificName)) {
                finalResults.push(res);
                seenSci.add(res.scientificName);
            }
        } else {
            finalResults.push(res);
        }
    });

    return finalResults;
  }, [searchTerm, searchMode, insuranceData, allMedicines]);

  return (
    <div className="space-y-4 min-h-[400px]">
      <div className="bg-white dark:bg-dark-card p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="relative">
            <select
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value as InsuranceSearchMode)}
              className="w-full h-11 pl-4 pr-10 rtl:pr-4 rtl:pl-10 text-sm font-bold bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl appearance-none cursor-pointer focus:border-primary transition-all"
            >
              <option value="tradeName">{t('tradeName')}</option>
              <option value="scientificName">{t('scientificName')}</option>
              <option value="indication">{t('indication')}</option>
              <option value="icd10Code">{t('icd10Code')}</option>
            </select>
            <div className="absolute top-1/2 right-4 rtl:left-4 rtl:right-auto transform -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={t('insuranceSearchPlaceholder')}
              className="w-full h-11 pl-4 pr-10 rtl:pr-4 rtl:pl-10 text-base bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-primary outline-none transition-all"
            />
            {inputValue && (
                <button onClick={() => { setInputValue(''); setSearchTerm(''); }} className="absolute top-1/2 right-3 rtl:left-3 rtl:right-auto transform -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                    <ClearIcon />
                </button>
            )}
          </div>
      </div>

      <div className="grid grid-cols-1 gap-4 animate-fade-in pb-10">
        {searchResults.length > 0 ? (
            searchResults.map((result, idx) => {
                if (result.type === 'covered') return <IndicationCard key={'c'+idx} group={result} t={t} onSelectInsuranceData={onSelectInsuranceData} />;
                if (result.type === 'drug-grouped') return <DrugPolicyCard key={'d'+idx} group={result} t={t} onSelectInsuranceData={onSelectInsuranceData} />;
                if (result.type === 'not-covered') return <NotCoveredCard key={'n'+idx} medicine={result.medicine} t={t} />;
                return null;
            })
        ) : (
            searchTerm.length >= 2 && (
                <div className="text-center py-12 bg-white dark:bg-dark-card rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <p className="text-slate-400 font-bold">{t('noResultsTitle')}</p>
                </div>
            )
        )}
      </div>
    </div>
  );
};

export default InsuranceSimpleSearch;
