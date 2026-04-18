// iOS-style Insurance screen — wraps existing InsuranceSimpleSearch with iOS chrome.
import React from 'react';
import type { InsuranceDrug, Language, SelectedInsuranceData, InsuranceSearchMode, Medicine, TFunction } from '../types';
import InsuranceSimpleSearch from './InsuranceSimpleSearch';
import { LargeTitle, langPick, Dir } from './ui/ios';

interface Props {
  language: Language;
  t: TFunction;
  insuranceData: InsuranceDrug[];
  allMedicines: Medicine[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  searchMode: InsuranceSearchMode;
  setSearchMode: (m: InsuranceSearchMode) => void;
  onSelect: (d: SelectedInsuranceData) => void;
}

export default function IOSInsuranceScreen({
  language,
  t,
  insuranceData,
  allMedicines,
  searchTerm,
  setSearchTerm,
  searchMode,
  setSearchMode,
  onSelect,
}: Props) {
  const dir: Dir = language === 'ar' ? 'rtl' : 'ltr';
  const tr = (ar: string, en: string) => langPick(language, ar, en);

  return (
    <div style={{ direction: dir, paddingBottom: 24 }}>
      <div style={{ paddingTop: 4 }}>
        <LargeTitle
          dir={dir}
          title={tr('التأمين', 'Insurance')}
          subtitle={tr('قائمة CHI للأدوية المغطاة', 'CHI formulary lookup')}
        />
      </div>

      <div style={{ padding: '0 8px' }}>
        <InsuranceSimpleSearch
          t={t}
          language={language}
          insuranceData={insuranceData}
          allMedicines={allMedicines}
          onSelectInsuranceData={onSelect}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchMode={searchMode}
          setSearchMode={setSearchMode}
        />
      </div>
    </div>
  );
}
