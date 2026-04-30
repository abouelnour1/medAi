import React from 'react';
import { SelectedInsuranceData, TFunction, InsuranceDrug } from '../types';
import PillIcon from './icons/PillIcon';

const InsuranceDetailsView: React.FC<{ data: SelectedInsuranceData; t: TFunction }> = ({ data, t }) => {
  const { indication, scientificGroup } = data;

  if (!scientificGroup || scientificGroup.policies.length === 0) {
    return <div className="p-4 text-center"><p className="text-slate-400">{t('noInsuranceInfo')}</p></div>;
  }

  const policies = scientificGroup.policies;
  const rep = policies[0];

  const uniq = (key: keyof InsuranceDrug): string =>
    [...new Set(policies.map(p => p[key]).filter((v): v is string => typeof v === 'string' && v.trim() !== ''))].join(' | ') || '';

  const rows: { label: string; value: string }[] = [
    { label: t('drugClass'),              value: rep.drugClass || '' },
    { label: t('drugSubclass'),           value: uniq('drugSubclass') },
    { label: t('icd10Code'),              value: uniq('icd10Code') },
    { label: t('atcCode'),                value: rep.atcCode || '' },
    { label: t('administrationRoute'),    value: uniq('administrationRoute') },
    { label: t('substitutable'),          value: uniq('substitutable') },
    { label: t('prescribingEdits'),       value: uniq('prescribingEdits') },
    { label: t('mddAdults'),              value: uniq('mddAdults') },
    { label: t('mddPediatrics'),          value: uniq('mddPediatrics') },
    { label: t('patientType'),            value: uniq('patientType') },
    { label: t('sfdaRegistrationStatus'), value: uniq('sfdaRegistrationStatus') },
    { label: t('notes'),                  value: uniq('notes') },
  ].filter(r => r.value && r.value !== '-');

  const meds = scientificGroup.availableMedicines || [];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="px-1">
        <p className="text-[12px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-wide">{indication}</p>
        <h2 className="text-[18px] font-black text-slate-800 dark:text-white mt-0.5">{scientificGroup.scientificName}</h2>
      </div>

      {/* Coverage details */}
      {rows.length > 0 && (
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-50 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('insuranceCoverageDetails')}</p>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {rows.map(r => (
              <div key={r.label} className="flex items-start gap-3 px-4 py-2.5">
                <span className="text-[11px] text-slate-400 font-bold flex-shrink-0 w-[120px] pt-0.5">{r.label}</span>
                <span className="text-[13px] text-slate-700 dark:text-slate-200 font-medium leading-snug" style={{wordBreak:'break-word'}}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available medicines */}
      {meds.length > 0 && (
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-50 dark:border-slate-800 flex items-center gap-2">
            <div className="w-4 h-4 text-teal-600 flex-shrink-0"><PillIcon /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('availableProducts')}</p>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {meds.map(med => (
              <div key={med.RegisterNumber} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-black text-slate-800 dark:text-white truncate">{med['Trade Name']}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{med.Strength} {med.StrengthUnit} · {med.PharmaceuticalForm}</p>
                </div>
                {!isNaN(parseFloat(med['Public price'])) && (
                  <span className="text-[13px] font-black text-teal-600 dark:text-teal-400 flex-shrink-0">
                    {parseFloat(med['Public price']).toFixed(2)} ر.س
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceDetailsView;
