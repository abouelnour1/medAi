
import React, { useState, useMemo, useEffect } from 'react';
import { TFunction, Language, InsuranceDrug, Medicine, SelectedInsuranceData, ScientificGroupData, InsuranceSearchMode } from '../types';
import ClearIcon from './icons/ClearIcon';
import IndicationCard, { IndicationGroup } from './IndicationCard';
import NotCoveredCard from './NotCoveredCard';
import DrugPolicyCard, { DrugGroup } from './DrugPolicyCard';

// الكلمات التي يجب تجاهلها لزيادة دقة البحث العلمي
const IGNORED_TOKENS = new Set(['mg', 'ml', 'g', 'mcg', 'iu', 'kg', 'tab', 'caps', 'solution', 'suspension', 'oral', 'vial', 'ampoule']);

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
    // البحث يبدأ بعد حرفين على الأقل لضمان الدقة
    if (trimmedTerm.replace(/%/g, '').length < 2) return [];
    
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // دالة تنظيف المادة العلمية للمقارنة الدقيقة في السياسات
    const cleanScientific = (name: string) => {
        if (!name) return '';
        return name.toLowerCase()
            .replace(/\d+\s*(mg|ml|g|mcg|iu|kg|tablet|capsule|cap|tab|softgel)\b/g, '')
            .replace(/[^a-z,]/g, ' ')
            .split(/[,\s]+/)
            .map(s => s.trim())
            .filter(s => s.length > 2 && !IGNORED_TOKENS.has(s))
            .sort()
            .join(' ');
    };

    let matchingMeds: Medicine[] = [];
    const isNameSearch = searchMode === 'tradeName' || searchMode === 'scientificName';

    // 1. منطق البحث الجديد: مطابق للبداية إلا لو وجد الرمز %
    if (isNameSearch) {
        const field = searchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
        let pattern = '';
        if (trimmedTerm.includes('%')) {
            // استبدال % بـ .* للبحث في أي مكان
            pattern = trimmedTerm.split('%').map(escapeRegExp).join('.*');
        } else {
            // البحث من بداية الكلمة فقط ^
            pattern = '^' + escapeRegExp(trimmedTerm);
        }
        
        const regex = new RegExp(pattern, 'i');
        matchingMeds = allMedicines.filter(m => regex.test(m[field]));
    }

    // 2. استخراج المواد العلمية الصافية من الأدوية المطابقة لربطها بالسياسات
    const matchedScientificKeys = new Set(matchingMeds.map(m => cleanScientific(m['Scientific Name'])));
    const matchedTradeNamesMap = new Map<string, Set<string>>();
    
    matchingMeds.forEach(m => {
        const key = cleanScientific(m['Scientific Name']);
        if (!matchedTradeNamesMap.has(key)) matchedTradeNamesMap.set(key, new Set());
        matchedTradeNamesMap.get(key)!.add(m['Trade Name']);
    });

    // 3. العثور على سياسات التأمين المطابقة
    let matchingPolicies: InsuranceDrug[] = [];
    if (isNameSearch) {
        // إذا كان البحث بالاسم، نطابق السياسات التي تحتوي على المادة الفعالة للأدوية التي وجدناها
        matchingPolicies = insuranceData.filter(p => {
            const policyKey = cleanScientific(p.scientificName);
            return Array.from(matchedScientificKeys).some(key => 
                key === policyKey || key.includes(policyKey) || policyKey.includes(key)
            );
        });
    } else {
        // البحث حسب التشخيص أو الكود (مطابقة جزئية مع دعم الرمز %)
        let pattern = trimmedTerm.includes('%') 
            ? trimmedTerm.split('%').map(escapeRegExp).join('.*')
            : escapeRegExp(trimmedTerm);
        const regex = new RegExp(pattern, 'i');

        matchingPolicies = insuranceData.filter(p => {
            const targetField = (searchMode === 'indication' ? p.indication : p.icd10Code || '').toLowerCase();
            return regex.test(targetField);
        });
    }

    const results: SearchResult[] = [];
    const coveredScientificKeys = new Set(matchingPolicies.map(p => cleanScientific(p.scientificName)));

    // إضافة الأدوية غير المغطاة (للأبحاث بالاسم)
    if (isNameSearch) {
        matchingMeds.forEach(med => {
            const medKey = cleanScientific(med['Scientific Name']);
            if (!coveredScientificKeys.has(medKey)) {
                results.push({ type: 'not-covered', medicine: med });
            }
        });

        // تجميع السياسات حسب المادة العلمية
        const groupedByDrug = new Map<string, InsuranceDrug[]>();
        matchingPolicies.forEach(p => {
            const key = cleanScientific(p.scientificName);
            if (!groupedByDrug.has(key)) groupedByDrug.set(key, []);
            groupedByDrug.get(key)!.push(p);
        });

        groupedByDrug.forEach((policies, key) => {
            const tradeNames = Array.from(matchedTradeNamesMap.get(key) || []);
            const availableMeds = allMedicines
                .filter(m => cleanScientific(m['Scientific Name']) === key)
                .sort((a, b) => parseFloat(a['Public price']) - parseFloat(b['Public price']));

            results.push({
                type: 'drug-grouped',
                scientificName: policies[0].scientificName,
                tradeNames: tradeNames,
                policies: policies,
                availableMedicines: availableMeds
            });
        });
    } else {
        // تجميع حسب التشخيص (Indication Mode)
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
                        availableMedicines: allMedicines.filter(m => cleanScientific(m['Scientific Name']) === cleanScientific(sciName))
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

    return results;
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
