
import React from 'react';
import { Medicine, TFunction, Language, User } from '../types';
import StarIcon from './icons/StarIcon';
import EditIcon from './icons/EditIcon';
import CameraIcon from './icons/CameraIcon';
import AssistantIcon from './icons/AssistantIcon';

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

  const statusText = status === 'OTC' ? 'OTC' : status === 'Prescription' ? 'Prescription' : status;
  
  let colorClasses = 'bg-slate-100 text-light-text-secondary dark:bg-slate-700 dark:text-dark-text-secondary'; 
  if (status === 'OTC') {
    colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800';
  } else if (status === 'Prescription') {
    colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800';
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
    onOpenAssistant?: () => void;
}

const MedicineDetail: React.FC<MedicineDetailProps> = ({ medicine, t, language, isFavorite, onToggleFavorite, user, onEdit, onOpenAssistant }) => {
  const price = parseFloat(medicine['Public price']);
  const scientificName = medicine['Scientific Name'] || '';
  const strengths = String(medicine.Strength || '');
  const strengthUnit = String(medicine.StrengthUnit || '');

  const strengthValues = strengths ? strengths.split(',').map(s => s.trim()).filter(Boolean) : [];
  const strengthUnitValues = strengthUnit ? strengthUnit.split(',').map(s => s.trim()).filter(Boolean) : [];
  const ingredients = scientificName ? scientificName.split(',').map(s => s.trim()).filter(Boolean) : [];

  const hasMultipleIngredients = ingredients.length > 1 && ingredients.length === strengthValues.length;

  const handleImageSearch = () => {
      const tradeName = medicine['Trade Name'] || '';
      let query = tradeName;
      
      if (tradeName.trim().split(/\s+/).length === 1) {
          const strength = medicine.Strength || '';
          const form = medicine.PharmaceuticalForm || '';
          query = `${tradeName} ${strength} ${form}`;
      }
      
      const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm animate-fade-in space-y-8">
      <div>
        <div className="px-2 sm:px-0">
          <div className="flex items-center justify-between gap-4">
              <button 
                onClick={onOpenAssistant}
                className="group flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                title={t('assistantFabTooltip')}
              >
                  <h2 className="text-xl md:text-2xl font-bold leading-7 text-light-text dark:text-dark-text group-hover:text-primary dark:group-hover:text-primary-light underline decoration-dotted decoration-gray-300 dark:decoration-slate-600 underline-offset-4">
                      {medicine['Trade Name'] || 'Unknown Name'}
                  </h2>
                  <span className="text-primary dark:text-primary-light opacity-0 group-hover:opacity-100 transition-opacity"><AssistantIcon /></span>
              </button>

              <div className="flex items-center gap-2">
                  <button
                    onClick={handleImageSearch}
                    className="p-2 rounded-full transition-colors text-gray-400 bg-gray-100 dark:bg-slate-800 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    title={t('searchImage')}
                  >
                      <div className="h-6 w-6">
                        <CameraIcon />
                      </div>
                  </button>
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
