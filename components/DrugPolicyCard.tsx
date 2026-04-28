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
    const indicationsMap = new Map<string, InsuranceDrug[]>();
    group.policies.forEach(p => {
        const key = p.indication || 'General';
        if (!indicationsMap.has(key)) indicationsMap.set(key, []);
        indicationsMap.get(key)!.push(p);
    });

    const uniqueIndications = Array.from(indicationsMap.entries());
    const primaryPolicy = group.policies[0];

    return (
        <div className="bg-green-50/30 dark:bg-green-900/10 rounded-2xl shadow-sm p-4 animate-fade-in border-2 border-green-200 dark:border-green-800 space-y-3 overflow-hidden" style={{maxWidth:"100%",wordBreak:"break-word"}}>
             <div className="border-b pb-3 border-green-100 dark:border-green-800/50">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-500 text-white flex items-center justify-center mt-1 flex-shrink-0 shadow-lg">
                        <PillIcon />
                    </div>
                    <div className="min-w-0 flex-grow overflow-hidden">
                        <h2 className="text-base font-black text-green-800 dark:text-green-300 leading-tight mb-1" style={{wordBreak:"break-word",overflowWrap:"break-word",maxWidth:"100%"}}>
                            {group.tradeNames.join(' / ')}
                        </h2>
                        <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-tight" style={{wordBreak:"break-word",overflowWrap:"anywhere",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical"}}>
                            {String(group.scientificName || '').length > 60 ? String(group.scientificName).substring(0, 60) + '…' : group.scientificName}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-dark-muted font-medium mt-1">مغطى تأمينياً (Covered)</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 dark:text-dark-muted uppercase tracking-widest px-1">
                    {t('indication')} ({uniqueIndications.length})
                </p>
                {uniqueIndications.map(([indication, policies]) => (
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
                        className="w-full text-left p-3.5 bg-white dark:bg-dark-card/40 rounded-xl border border-slate-200 dark:border-dark-border hover:border-primary transition-all flex justify-between items-center group"
                    >
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-secondary dark:text-green-400 w-4 h-4 shrink-0"><HealthInsuranceIcon /></span>
                                <p className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors leading-tight break-words">
                                    {indication}
                                </p>
                            </div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300 group-hover:text-primary ltr:rotate-0 rtl:rotate-180 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DrugPolicyCard;