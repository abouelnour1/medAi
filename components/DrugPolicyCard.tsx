
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
        <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-sm p-4 animate-fade-in border border-slate-100 dark:border-slate-800 space-y-3">
             {/* Header: Trade Names (if any) + Scientific Name */}
             <div className="border-b pb-3 border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary mt-1 flex-shrink-0 shadow-inner">
                        <PillIcon />
                    </div>
                    <div className="min-w-0 flex-grow">
                        {group.tradeNames.length > 0 ? (
                            <>
                                <h2 className="text-base font-black text-slate-800 dark:text-white leading-tight mb-1 break-words">
                                    {group.tradeNames.join(' / ')}
                                </h2>
                                <p className="text-xs text-primary font-bold uppercase tracking-tight break-words">
                                    {group.scientificName}
                                </p>
                            </>
                        ) : (
                            <h2 className="text-base font-black text-slate-800 dark:text-white leading-tight uppercase break-words">
                                {group.scientificName}
                            </h2>
                        )}
                        <p className="text-[10px] text-slate-400 font-medium mt-1 break-words">
                            {primaryPolicy.drugClass}
                        </p>
                    </div>
                </div>
            </div>

            {/* Body: List of Indications */}
            <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                    {t('indication')} ({uniqueIndications.length})
                </p>
                {uniqueIndications.map(([indication, policies]) => {
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
                            className="w-full text-left p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800 transition-all flex justify-between items-center group"
                        >
                            <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-secondary dark:text-green-400 w-4 h-4 shrink-0"><HealthInsuranceIcon /></span>
                                    <p className="font-bold text-sm text-secondary dark:text-green-400 group-hover:text-primary transition-colors leading-tight break-words">
                                        {indication}
                                    </p>
                                </div>
                                {icdCodes.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5 ml-6">
                                        {icdCodes.map(code => (
                                            <span key={code} className="text-[9px] font-black bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded shadow-sm text-slate-500">
                                                {code}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300 group-hover:text-primary ltr:rotate-0 rtl:rotate-180 transition-all transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

export default DrugPolicyCard;
