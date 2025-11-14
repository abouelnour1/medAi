import React from 'react';
import { TFunction, InsuranceDrug, Medicine, SelectedInsuranceData, ScientificGroupData } from '../types';
import HealthInsuranceIcon from './icons/HealthInsuranceIcon';

// This is the structure for the whole card, exported for use in the search component
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
            className="w-full text-left p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
             {hasMatchingTradeNames && (
                 <p className="font-bold text-base text-light-text dark:text-dark-text">
                    {group.matchingTradeNames!.join(' / ')}
                </p>
            )}
             <p className={hasMatchingTradeNames ? "text-sm text-primary dark:text-primary-light font-semibold" : "font-bold text-base text-primary dark:text-primary-light"}>
                {group.scientificName}
            </p>
             <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{commonPolicy.drugClass}</p>
        </button>
    )
}

const IndicationCard: React.FC<IndicationCardProps> = ({ group, t, onSelectInsuranceData }) => {
    return (
        <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-sm p-4 animate-fade-in space-y-3 border-l-4 border-secondary dark:border-green-400">
             <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 flex-shrink-0 text-secondary dark:text-green-400"><HealthInsuranceIcon /></span>
                    <h2 className="text-lg font-bold text-secondary dark:text-green-400">{group.indication}</h2>
                </div>
                {group.icd10Codes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {group.icd10Codes.map(code => (
                            <span key={code} className="text-sm font-mono bg-slate-100 dark:bg-slate-700 text-light-text-secondary dark:text-dark-text-secondary px-2 py-1 rounded-md">
                                {code}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <div className="space-y-2">
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