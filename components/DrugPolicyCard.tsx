
import React from 'react';
import { TFunction, SelectedInsuranceData, InsuranceDrug, Medicine } from '../types';
import HealthInsuranceIcon from './icons/HealthInsuranceIcon';
import PillIcon from './icons/PillIcon';

export interface DrugGroup {
    type: 'drug-grouped';
    scientificName: string;
    tradeNames: string[];
    policies: InsuranceDrug[];
    availableMedicines: Medicine[];
}

interface DrugPolicyCardProps {
  group: DrugGroup;
  t: TFunction;
  onSelectInsuranceData: (data: SelectedInsuranceData) => void;
}

const DrugPolicyCard: React.FC<DrugPolicyCardProps> = ({ group, t, onSelectInsuranceData }) => {
    // Group policies by indication to avoid duplicates in the list
    const indicationsMap = new Map<string, InsuranceDrug[]>();
    group.policies.forEach(p => {
        const key = p.indication || 'General';
        if (!indicationsMap.has(key)) indicationsMap.set(key, []);
        indicationsMap.get(key)!.push(p);
    });

    const uniqueIndications = Array.from(indicationsMap.entries());
    const primaryPolicy = group.policies[0];

    return (
        <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-sm p-4 animate-fade-in border-l-4 border-primary dark:border-primary-light space-y-3">
             {/* Header: Drug Name */}
             <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-1 flex-shrink-0">
                        <PillIcon />
                    </div>
                    <div>
                        {group.tradeNames.length > 0 && (
                            <h2 className="text-lg font-bold text-light-text dark:text-dark-text leading-tight">
                                {group.tradeNames.join(' / ')}
                            </h2>
                        )}
                        <p className={`${group.tradeNames.length > 0 ? 'text-sm text-primary font-medium' : 'text-lg font-bold text-light-text dark:text-dark-text'}`}>
                            {group.scientificName}
                        </p>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                            {primaryPolicy.drugClass}
                        </p>
                    </div>
                </div>
            </div>

            {/* Body: List of Indications */}
            <div className="space-y-2">
                <p className="text-xs font-bold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mb-1">
                    {t('indication')} ({uniqueIndications.length})
                </p>
                {uniqueIndications.map(([indication, policies]) => {
                    // Collect ICD Codes for this indication
                    const icdCodes = Array.from(new Set(policies.map(p => p.icd10Code).flatMap(c => c ? c.split(',') : []).map(c => c.trim()).filter(Boolean)));
                    
                    return (
                        <button 
                            key={indication}
                            onClick={() => onSelectInsuranceData({ 
                                indication: indication, 
                                scientificGroup: {
                                    scientificName: group.scientificName,
                                    policies: policies,
                                    availableMedicines: group.availableMedicines,
                                    matchingTradeNames: group.tradeNames
                                } 
                            })}
                            className="w-full text-left p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex justify-between items-center group"
                        >
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-secondary dark:text-green-400 w-4 h-4"><HealthInsuranceIcon /></span>
                                    <p className="font-bold text-sm text-secondary dark:text-green-400 group-hover:underline">
                                        {indication}
                                    </p>
                                </div>
                                {icdCodes.length > 0 && (
                                    <div className="flex flex-wrap gap-1 ml-6">
                                        {icdCodes.map(code => (
                                            <span key={code} className="text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded text-light-text-secondary dark:text-dark-text-secondary">
                                                {code}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-primary ltr:rotate-0 rtl:rotate-180 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

export default DrugPolicyCard;
