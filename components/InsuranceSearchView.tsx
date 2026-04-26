import React from 'react';
import { Medicine, TFunction, Language, InsuranceDrug, SelectedInsuranceData, InsuranceSearchMode } from '../types';
import InsuranceSimpleSearch from './InsuranceSimpleSearch';

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
  headerHeight?: number;
  isKeyboardOpen?: boolean;
  renderPart?: 'bar' | 'results' | 'all';
}

const InsuranceSearchView: React.FC<InsuranceSearchViewProps> = (props) => {
  return (
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
      headerHeight={props.headerHeight}
      isKeyboardOpen={props.isKeyboardOpen}
      renderPart={props.renderPart}
    />
  );
};

export default InsuranceSearchView;
