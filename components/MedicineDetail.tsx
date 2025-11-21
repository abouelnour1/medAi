
import React from 'react';
import { Medicine, TFunction, Language, User } from '../types';
import StarIcon from './icons/StarIcon';
import EditIcon from './icons/EditIcon';

const DetailRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
  if (!value || String(value).trim() === '') return null;
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
      <dt className="text-sm font-medium leading-6 text-light-text-secondary dark:text-dark-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-light-text dark:text-dark-text sm:col-span-2 sm:mt-0">{value}</dd>
    </div>
  );
};

const LegalStatusBadge: React.FC<{ status: string; size?: 'sm' | 'base', t: TFunction }> = ({ status, size = 'sm', t }) => {
  if (!status) return null;

  const statusText = status === 'OTC' ? t('otc') : status === 'Prescription' ? t('prescription') : status;
  
  let colorClasses = 'bg-slate-100 text-light-text-secondary dark:bg-slate-700 dark:text-dark-text-secondary'; // Default
  if (status === 'OTC') {
    colorClasses = 'bg-secondary/10 text-green-700 dark:bg-secondary/20 dark:text-green-300';
  } else if (status === 'Prescription') {
    colorClasses = 'bg-primary/10 text-primary-dark dark:bg-primary/20 dark:text-primary-light';
  }
  
  const sizeClasses = size === 'sm' 
    ? 'px-2.5 py-1 text-xs' 
    : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-block font-semibold rounded-full ${sizeClasses} ${colorClasses}`}>
      {statusText}
    </span>
  );
};


interface MedicineDetailProps {
    medicine: Medicine;
    t: TFunction;
    language: Language;
    isFavorite: boolean;
    onToggleFavorite: (medicineId: string) => void;
    user?: User | null;
    onEdit?: (medicine: Medicine) => void;
}

const MedicineDetail: React.FC<MedicineDetailProps> = ({ medicine, t, language, isFavorite, onToggleFavorite, user, onEdit }) => {
  const price = parseFloat(medicine['Public price']);
  const scientificName = medicine['Scientific Name'] || '';
  const strengths = String(medicine.Strength || '');
  const strengthUnit = String(medicine.StrengthUnit || '');

  // Safeguard against null/undefined before split
  const strengthValues = strengths ? strengths.split(',').map(s => s.trim()).filter(Boolean) : [];
  const strengthUnitValues = strengthUnit ? strengthUnit.split(',').map(s => s.trim()).filter(Boolean) : [];
  const ingredients = scientificName ? scientificName.split(',').map(s => s.trim()).filter(Boolean) : [];

  const hasMultipleIngredients = ingredients.length > 1 && ingredients.length === strengthValues.length;

  return (
    <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm animate-fade-in space-y-8">
      <div>
        <div className="px-2 sm:px-0">
          <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl md:text-2xl font-bold leading-7 text-light-text dark:text-dark-text">{medicine['Trade Name'] || 'Unknown Name'}</h2>
              <div className="flex items-center gap-2">
                  {user?.role === 'admin' && onEdit && (
                      <button
                          onClick={() => onEdit(medicine)}
                          className="p-2 rounded-full transition-colors text-gray-400 bg-gray-100 dark:bg-slate-800 hover:text-primary hover:bg-primary/10"
                          title={t('editMedicine')}
                      >
                          <div className="h-6 w-6">
                              <EditIcon />
                          </div>
                      </button>
                  )}
                  <button
                    onClick={() => onToggleFavorite(medicine.RegisterNumber)}
                    className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-accent bg-accent/10' : 'text-gray-400 bg-gray-100 dark:bg-slate-800'}`}
                    title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                  >
                      <div className="h-6 w-6">
                        <StarIcon isFilled={isFavorite} />
                      </div>
                  </button>
              </div>
          </div>
          
          {hasMultipleIngredients ? (
            <div className="mt-3">
              <p className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('scientificName')}:</p>
              <ul className="space-y-1.5">
                {ingredients.map((ingredient, index) => {
                  let unit = '';
                  if (strengthUnitValues.length === strengthValues.length) {
                    unit = strengthUnitValues[index] || '';
                  } else if (strengthUnitValues.length === 1) {
                    unit = strengthUnitValues[0];
                  }
                  const strengthDisplay = `${strengthValues[index] || ''}${unit ? ` ${unit}` : ''}`.trim();

                  return (
                    <li key={index} className="flex justify-between items-baseline">
                      <span className="text-sm text-light-text dark:text-dark-text">{ingredient}</span>
                      <span className="font-bold text-light-text dark:text-dark-text whitespace-nowrap">
                        {strengthDisplay}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-light-text-secondary dark:text-dark-text-secondary">
              {`${scientificName}${strengths ? ` ${strengths}` : ''}${strengthUnit ? ` ${strengthUnit}` : ''}`.trim()}
            </p>
          )}

          {!isNaN(price) && (
              <div className="mt-4 text-accent text-2xl font-bold">
                {`${price.toFixed(2)} ${t('sar')}`}
              </div>
          )}
        </div>
        <div className="mt-6 border-t border-slate-100 dark:border-slate-800">
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            <DetailRow label={t('pharmaceuticalForm')} value={medicine.PharmaceuticalForm} />
            <DetailRow label={t('packageSize')} value={`${medicine.PackageSize || ''} ${medicine.PackageTypes || ''}`.trim()} />
            
            {medicine['Legal Status'] && (
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-light-text-secondary dark:text-dark-text-secondary">{t('legalStatus')}</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
                  <LegalStatusBadge status={medicine['Legal Status']} size="base" t={t} />
                </dd>
              </div>
            )}

            {medicine['Product type'] === 'Supplement' && (
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-light-text-secondary dark:text-dark-text-secondary">{t('insuranceCoverage')}</dt>
                <dd className="mt-1 text-sm leading-6 text-red-600 dark:text-red-400 font-semibold sm:col-span-2 sm:mt-0">{t('notCovered')}</dd>
              </div>
            )}

            <DetailRow label={t('manufacturer')} value={medicine['Manufacture Name']} />
            <DetailRow label={t('countryOfManufacture')} value={medicine['Manufacture Country']} />
            <DetailRow label={t('storageConditions')} value={language === 'ar' ? medicine['Storage Condition Arabic'] : medicine['Storage conditions']} />
            <DetailRow label={t('mainAgent')} value={medicine['Main Agent']} />
            <DetailRow label={t('registrationNumber')} value={medicine.RegisterNumber} />
          </dl>
        </div>
      </div>
    </div>
  );
};

export default MedicineDetail;
