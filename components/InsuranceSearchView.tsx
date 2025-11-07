import React, { useState } from 'react';
import { Medicine, TFunction, Language, InsuranceDrug, SelectedInsuranceData, InsuranceSearchMode } from '../types';
import InsuranceSimpleSearch from './InsuranceSimpleSearch';
import InsuranceAiGuide from './InsuranceAiGuide';
import SearchIcon from './icons/SearchIcon';
import SparkleIcon from './icons/SparkleIcon';

interface InsuranceSearchViewProps {
  t: TFunction;
  language: Language;
  allMedicines: Medicine[];
  insuranceData: InsuranceDrug[];
  onSelectInsuranceData: (data: SelectedInsuranceData) => void;
  insuranceSearchTerm: string;
  setInsuranceSearchTerm: (term: string) => void;
  insuranceSearchMode: InsuranceSearchMode;
  setInsuranceSearchMode: (mode: InsuranceSearchMode) => void;
}

type Mode = 'simple' | 'ai';

const InsuranceSearchView: React.FC<InsuranceSearchViewProps> = (props) => {
  const [mode, setMode] = useState<Mode>('simple');

  const getButtonClasses = (buttonMode: Mode) => {
    const isActive = mode === buttonMode;
    return `
      w-1/2 py-1.5 px-2 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5
      ${isActive
        ? 'bg-primary text-white shadow-md'
        : 'bg-transparent text-light-text-secondary dark:text-dark-text-secondary hover:bg-slate-200 dark:hover:bg-slate-700'
      }
    `;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="p-1 bg-slate-100 dark:bg-dark-card rounded-xl flex">
        <button onClick={() => setMode('simple')} className={getButtonClasses('simple')}>
          <div className="h-4 w-4"><SearchIcon /></div>
          {props.t('simpleSearch')}
        </button>
        <button onClick={() => setMode('ai')} className={getButtonClasses('ai')}>
          <SparkleIcon />
          {props.t('aiGuide')}
        </button>
      </div>

      {mode === 'simple' ? (
        <InsuranceSimpleSearch 
            t={props.t} 
            language={props.language} 
            insuranceData={props.insuranceData} 
            allMedicines={props.allMedicines}
            onSelectInsuranceData={props.onSelectInsuranceData}
            searchTerm={props.insuranceSearchTerm}
            setSearchTerm={props.setInsuranceSearchTerm}
            searchMode={props.insuranceSearchMode}
            setSearchMode={props.setInsuranceSearchMode}
        />
      ) : (
        <InsuranceAiGuide {...props} />
      )}
    </div>
  );
};

export default InsuranceSearchView;