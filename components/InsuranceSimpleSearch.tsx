
import React, { useState, useMemo, useEffect } from 'react';
import { fuzzyMatch, fuzzyScore } from '../utils/fuzzySearch';
import { TFunction, Language, InsuranceDrug, Medicine, SelectedInsuranceData, ScientificGroupData, InsuranceSearchMode } from '../types';
import SearchIcon from './icons/SearchIcon';
import IndicationCard, { IndicationGroup } from './IndicationCard';
import NotCoveredCard from './NotCoveredCard';
import DrugPolicyCard, { DrugGroup } from './DrugPolicyCard';

const JUNK_TOKENS = new Set(['mg', 'ml', 'g', 'mcg', 'iu', 'kg', 'tab', 'caps', 'solution', 'suspension', 'oral', 'vial', 'ampoule', 'f.c', 'tablet', 'capsule', 'prolonged', 'release', 'tablet']);

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
  onSearchIconClick?: () => void;
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
    onSearchIconClick
}) => {
  const [inputValue, setInputValue] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue !== searchTerm) setSearchTerm(inputValue);
    }, 400);
    return () => clearTimeout(handler);
  }, [inputValue, searchTerm, setSearchTerm]);

  const searchResults = useMemo((): SearchResult[] => {
    const term = searchTerm.toLowerCase().trim();
    if (term.replace(/\*/g, '').length < 3) return [];
    
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const normalizeForMatch = (name: string) => {
        if (!name) return '';
        return name.toLowerCase()
            .replace(/\d+\s*(mg|ml|g|mcg|iu|kg|tablet|capsule|cap|tab|softgel)\b/g, ' ')
            .replace(/[^a-z0-9\s]/g, ' ') 
            .split(/\s+/)
            .filter(s => s.length > 1 && !JUNK_TOKENS.has(s))
            .join(' ')
            .trim();
    };

    let matchingMeds: Medicine[] = [];
    let foodMeds: Medicine[] = [];
    const isNameSearch = searchMode === 'tradeName' || searchMode === 'scientificName';

    if (isNameSearch) {
        const field = searchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
        if (term.includes('*')) {
            const parts = term.split('*').map(p => p.trim()).filter(Boolean);
            if (parts.length > 0) {
                const regexPattern = parts.map(escapeRegExp).join('.*');
                const regex = new RegExp(regexPattern, 'i');
                matchingMeds = allMedicines.filter(m => regex.test(String(m[field])));
            }
        } else {
            // ✅ نفس منطق البحث العادي: startsWith > startsWithWord > contains > fuzzy
            const startsWith = allMedicines.filter(m => String(m[field]).toLowerCase().startsWith(term));
            const startsWithWord = allMedicines.filter(m => {
                const v = String(m[field]).toLowerCase();
                return !v.startsWith(term) && v.split(/[\s-]+/).some(w => w.startsWith(term));
            });
            const contains = allMedicines.filter(m => {
                const v = String(m[field]).toLowerCase();
                return !v.startsWith(term) && !v.split(/[\s-]+/).some(w => w.startsWith(term)) && v.includes(term);
            });
            const exact = [...startsWith, ...startsWithWord, ...contains];
            if (exact.length < 5) {
                const fuzzy = allMedicines
                    .filter(m => !exact.includes(m) && fuzzyMatch(String(m[field]).toLowerCase(), term))
                    .sort((a, b) => fuzzyScore(String(b[field]), term) - fuzzyScore(String(a[field]), term));
                matchingMeds = [...exact, ...fuzzy];
            } else {
                matchingMeds = exact;
            }
        }
        // Food = Product type 'Food' — غير مغطى تأمينياً
        foodMeds = matchingMeds.filter(m => 
            String(m['Product type'] || '').toLowerCase() === 'food'
        );
        matchingMeds = matchingMeds.filter(m => 
            String(m['Product type'] || '').toLowerCase() !== 'food'
        );
    }

    const results: SearchResult[] = [];

    if (isNameSearch) {
        // نبني sciGroups مرتبة على أساس أفضل rank (startsWith أولاً)
        const sciGroupsOrder: string[] = [];
        const sciGroupsRank = new Map<string, number>();
        const sciGroups = new Map<string, Set<Medicine>>();
        matchingMeds.forEach((m, idx) => {
            const sci = m['Scientific Name'];
            if (!sciGroups.has(sci)) {
                sciGroups.set(sci, new Set());
                sciGroupsOrder.push(sci);
                sciGroupsRank.set(sci, idx);
            }
            sciGroups.get(sci)!.add(m);
        });
        sciGroupsOrder.sort((a, b) => (sciGroupsRank.get(a) ?? 999) - (sciGroupsRank.get(b) ?? 999));

        sciGroupsOrder.forEach(fullSciName => {
            const medsSet = sciGroups.get(fullSciName)!;
            const medsArray = Array.from(medsSet);
            const normalizedSci = normalizeForMatch(fullSciName);
            
            const matchedPolicies = insuranceData.filter(p => {
                const policyNormalized = normalizeForMatch(p.scientificName);
                const atcMatch = medsArray.some(m => m.AtcCode1 && p.atcCode && (m.AtcCode1 === p.atcCode || m.AtcCode1.startsWith(p.atcCode)));
                
                return atcMatch || 
                       policyNormalized === normalizedSci || 
                       (normalizedSci.length > 5 && policyNormalized.includes(normalizedSci)) || 
                       (policyNormalized.length > 5 && normalizedSci.includes(policyNormalized));
            });

            if (matchedPolicies.length > 0) {
                results.push({
                    type: 'drug-grouped',
                    scientificName: fullSciName,
                    tradeNames: Array.from(new Set(medsArray.map(m => m['Trade Name']))),
                    policies: matchedPolicies,
                    availableMedicines: medsArray
                });
            } else {
                medsArray.forEach(med => {
                    results.push({ type: 'not-covered', medicine: med });
                });
            }
        });
        // Food: غير مغطاة — تيجي في الآخر
        foodMeds.forEach(med => results.push({ type: 'not-covered', medicine: med }));
    } else {
        let regex: RegExp;
        if (term.includes('*')) {
            const parts = term.split('*').map(p => p.trim()).filter(Boolean);
            const regexPattern = parts.map(escapeRegExp).join('.*');
            regex = new RegExp(regexPattern, 'i');
        } else {
            regex = new RegExp(escapeRegExp(term), 'i');
        }

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
            policies.forEach(p => {
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
                icd10Codes: Array.from(new Set(policies.map(p => p.icd10Code))).filter(Boolean),
                scientificGroups: Array.from(sciGroupsMap.values())
            });
        });
    }

    return results;
  }, [searchTerm, searchMode, insuranceData, allMedicines]);

  return (
    <div className="space-y-4 min-h-[400px]">
      <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border space-y-4">
          <div className="relative">
            <select
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value as InsuranceSearchMode)}
              className="w-full h-12 pl-4 pr-10 rtl:pr-4 rtl:pl-10 text-base font-bold bg-slate-50 dark:bg-slate-900/40 border-2 border-slate-100 dark:border-dark-border rounded-xl appearance-none cursor-pointer focus:border-primary transition-all shadow-inner"
            >
              <option value="tradeName">{t('tradeName')}</option>
              <option value="scientificName">{t('scientificName')}</option>
              <option value="indication">{t('indication')}</option>
              <option value="icd10Code">{t('icd10Code')}</option>
            </select>
          </div>

          <div className="relative">
             <button onClick={onSearchIconClick} className="absolute top-1/2 left-3 rtl:right-3 transform -translate-y-1/2 text-gray-400 h-5 w-5 hover:text-primary transition-colors z-10"><SearchIcon /></button>
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={t('insuranceSearchPlaceholder')}
              className="w-full h-12 pl-10 pr-10 rtl:pr-10 rtl:pl-10 text-lg bg-slate-50 dark:bg-slate-900/40 border-2 border-slate-100 dark:border-dark-border rounded-xl focus:border-primary outline-none transition-all shadow-inner"
            />
          </div>
      </div>

      <div className="grid grid-cols-1 gap-4 animate-fade-in pb-20">
        {searchResults.map((result, idx) => {
            if (result.type === 'covered') return <IndicationCard key={'c'+idx} group={result} t={t} onSelectInsuranceData={onSelectInsuranceData} />;
            if (result.type === 'drug-grouped') return <DrugPolicyCard key={'d'+idx} group={result} t={t} onSelectInsuranceData={onSelectInsuranceData} />;
            if (result.type === 'not-covered') return <NotCoveredCard key={'n'+idx} medicine={result.medicine} t={t} />;
            return null;
        })}
      </div>
    </div>
  );
};

export default InsuranceSimpleSearch;
