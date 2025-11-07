import React from 'react';
import { SelectedInsuranceData, TFunction, InsuranceDrug } from '../types';
import PillIcon from './icons/PillIcon';

const DetailRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
  const displayValue = value === null || value === undefined || String(value).trim() === '' ? '-' : value;
  return (
    <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
      <dt className="text-sm font-medium leading-6 text-light-text-secondary dark:text-dark-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-light-text dark:text-dark-text sm:col-span-2 sm:mt-0">{displayValue}</dd>
    </div>
  );
};

const InsuranceDetailsView: React.FC<{ data: SelectedInsuranceData; t: TFunction; }> = ({ data, t }) => {
    const { indication, scientificGroup } = data;

    if (!scientificGroup || scientificGroup.policies.length === 0) {
        return (
            <div className="p-4 text-center">
                 <p className="text-light-text-secondary dark:text-dark-text-secondary">{t('noInsuranceInfo')}</p>
            </div>
        );
    }

    const policies = scientificGroup.policies;
    const representativePolicy = policies[0];

    const getUniqueValues = (key: keyof InsuranceDrug): string => {
        const values = new Set(
            policies
                .map(p => p[key])
                .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
        );
        return Array.from(values).join(' | ') || '-';
    };

    const availableStrengths = Array.from(new Set(
        policies.map(p => `${p.strength} ${p.strengthUnit} (${p.form})`)
    ));
    
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Section */}
            <div className="px-1">
                 <p className="text-sm font-semibold text-secondary dark:text-green-400">{indication}</p>
                 <h2 className="text-2xl md:text-3xl font-bold leading-7 text-light-text dark:text-dark-text">{scientificGroup.scientificName}</h2>
            </div>

            {/* Unified Policy Details Section */}
            <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-primary dark:text-primary-light mb-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                   {t('insuranceCoverageDetails')}
                </h3>
                <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                    <DetailRow label={t('drugClass')} value={representativePolicy.drugClass} />
                    <DetailRow label={t('drugSubclass')} value={getUniqueValues('drugSubclass')} />
                    <DetailRow label={t('icd10Code')} value={getUniqueValues('icd10Code')} />
                    <DetailRow label={t('atcCode')} value={representativePolicy.atcCode} />
                    <DetailRow label={t('descriptiveCode')} value={getUniqueValues('descriptionCode')} />
                    
                    <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm font-medium leading-6 text-light-text-secondary dark:text-dark-text-secondary">{t('availableStrengthsForms')}</dt>
                      <dd className="mt-1 text-sm leading-6 text-light-text dark:text-dark-text sm:col-span-2 sm:mt-0">
                        {availableStrengths.length > 0 ? (
                           <ul className="space-y-1">
                                {availableStrengths.map((strength, index) => <li key={index} className="bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md">{strength}</li>)}
                           </ul>
                        ) : '-'}
                      </dd>
                    </div>

                    <DetailRow label={t('administrationRoute')} value={getUniqueValues('administrationRoute')} />
                    <DetailRow label={t('substitutable')} value={getUniqueValues('substitutable')} />
                    <DetailRow label={t('prescribingEdits')} value={getUniqueValues('prescribingEdits')} />
                    <DetailRow label={t('mddAdults')} value={getUniqueValues('mddAdults')} />
                    <DetailRow label={t('mddPediatrics')} value={getUniqueValues('mddPediatrics')} />
                    <DetailRow label={t('appendix')} value={getUniqueValues('appendix')} />
                    <DetailRow label={t('patientType')} value={getUniqueValues('patientType')} />
                    <DetailRow label={t('sfdaRegistrationStatus')} value={getUniqueValues('sfdaRegistrationStatus')} />
                    <DetailRow label={t('notes')} value={getUniqueValues('notes')} />
                </dl>
            </div>
            
            {/* Available Products Section */}
            <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm">
                <h3 className="flex items-center gap-2 text-xl font-bold text-light-text dark:text-dark-text mb-3">
                    <PillIcon />
                    <span>{t('availableProducts')}</span>
                </h3>
                 {scientificGroup.availableMedicines.length > 0 ? (
                    <div className="space-y-2">
                        {scientificGroup.availableMedicines.map(med => (
                          <div key={med.RegisterNumber} className="flex justify-between items-center text-sm p-2 rounded-md bg-slate-50 dark:bg-slate-800/50">
                            <div>
                              <p className="font-semibold">{med['Trade Name']}</p>
                              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{`${med.Strength} ${med.StrengthUnit} | ${med.PharmaceuticalForm}`}</p>
                            </div>
                            <p className="font-bold text-accent whitespace-nowrap">
                              {isNaN(parseFloat(med['Public price'])) ? 'N/A' : `${parseFloat(med['Public price']).toFixed(2)} ${t('sar')}`}
                            </p>
                          </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary italic">{t('noProductsFound')}</p>
                )}
            </div>
        </div>
    );
};

export default InsuranceDetailsView;