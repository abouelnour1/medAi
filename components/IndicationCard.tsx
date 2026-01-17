
import React from 'react';
import { TFunction, InsuranceDrug, Medicine, SelectedInsuranceData, ScientificGroupData } from '../types';
import HealthInsuranceIcon from './icons/HealthInsuranceIcon';

export interface IndicationGroup {
    type: 'covered';
    indication: string;
    icd10Codes: string[];
    scientificGroups: ScientificGroupData[];
}

interface IndicationCardProps {
  group: IndicationGroup;
  t: TFunction;
  onSelectInsuranceData: (data: SelectedInsuranceData) => void;
}

const ScientificInfo: React.FC<{ group: ScientificGroupData, t: TFunction, onClick: () => void }> = ({ group, t, onClick }) => {
    const commonPolicy = group.policies[0];
    const hasMatchingTradeNames = group.matchingTradeNames && group.matchingTradeNames.length > 0;
    
    return (
        <button 
            onClick={onClick}
            className="w-full text-left p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
        >
             {hasMatchingTradeNames && (
                 <p className="font-black text-sm text-slate-800 dark:text-white mb-1 break-words">
                    {group.matchingTradeNames!.join(' / ')}
                </p>
            )}
             <p className={`${hasMatchingTradeNames ? "text-xs text-primary font-bold" : "font-black text-sm text-primary"} uppercase tracking-tight break-words`}>
                {group.scientificName}
            </p>
             <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium break-words">{commonPolicy.drugClass}</p>
        </button>
    )
}

const IndicationCard: React.FC<IndicationCardProps> = ({ group, t, onSelectInsuranceData }) => {
    return (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
             <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-green-50/30 dark:bg-green-900/10">
                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 text-secondary shrink-0 mt-0.5"><HealthInsuranceIcon /></div>
                    <div className="flex-grow min-w-0">
                        <h2 className="text-base font-black text-secondary leading-tight break-words">{group.indication}</h2>
                        {group.icd10Codes.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {group.icd10Codes.slice(0, 5).map(code => (
                                    <span key={code} className="text-[10px] font-black bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md shadow-sm">
                                        {code}
                                    </span>
                                ))}
                                {group.icd10Codes.length > 5 && <span className="text-[10px] text-slate-400 font-bold">+{group.icd10Codes.length - 5}</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-3 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest">{t('availableProducts')} ({group.scientificGroups.length})</p>
                {group.scientificGroups.map(sg => 
                    <ScientificInfo 
                        key={sg.scientificName} 
                        group={sg} 
                        t={t} 
                        onClick={() => onSelectInsuranceData({ indication: group.indication, scientificGroup: sg })}
                    />
                )}
            </div>
        </div>
    );
};

export default IndicationCard;
