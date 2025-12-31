
import React from 'react';
import { Medicine, TFunction, Language, User } from '../types';
import StarIcon from './icons/StarIcon';
import CameraIcon from './icons/CameraIcon';
import AssistantIcon from './icons/AssistantIcon';
import PillIcon from './icons/PillIcon';
import GlobeIcon from './icons/GlobeIcon';
import MarkdownRenderer from './MarkdownRenderer';

const DetailRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
  if (!value || String(value).trim() === '') return null;
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
      <dt className="text-sm font-medium leading-6 text-light-text-secondary dark:text-dark-text-secondary">{label}</dt>
      <dd className={`mt-1 text-sm leading-6 text-light-text dark:text-dark-text sm:col-span-2 sm:mt-0`}>{value}</dd>
    </div>
  );
};

interface MedicineDetailProps {
    medicine: Medicine;
    t: TFunction;
    language: Language;
    isFavorite: boolean;
    onToggleFavorite: (medicineId: string) => void;
    user?: User | null;
    onCheckAvailability?: () => void;
    isCheckingAvailability?: boolean;
    availabilityResult?: { text: string, sources: { title: string, uri: string }[] } | null;
}

const MedicineDetail: React.FC<MedicineDetailProps> = ({ 
    medicine, t, language, isFavorite, onToggleFavorite, user, 
    onCheckAvailability, isCheckingAvailability, availabilityResult 
}) => {
  const price = parseFloat(medicine['Public price']);
  
  const scientificName = String(medicine['Scientific Name'] || '');
  const ingredients = scientificName.split(',').map(s => s.trim()).filter(Boolean);
  const strengths = String(medicine.Strength || '').split(',').map(s => s.trim());
  const units = String(medicine.StrengthUnit || '').split(',').map(s => s.trim());

  return (
    <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm animate-fade-in space-y-6">
      <div className="px-1">
        <div className="flex items-start justify-between gap-4">
            <div className="flex-grow min-w-0">
                <h2 className="text-2xl font-black text-light-text dark:text-dark-text leading-tight">
                    {medicine['Trade Name']}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                   <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-md">{medicine['Legal Status'] || 'OTC'}</span>
                   <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">{medicine.DrugType}</span>
                </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 items-end">
                <button onClick={() => onToggleFavorite(medicine.RegisterNumber)} className={`p-2.5 rounded-xl ${isFavorite ? 'bg-accent/10 text-accent' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <div className="h-5 w-5"><StarIcon isFilled={isFavorite} /></div>
                </button>
                {!isNaN(price) && price > 0 && (
                    <div className="text-right">
                        <span className="text-2xl font-black text-accent">{price.toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-tighter">{t('sar')}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Real-time Availability Feature - Minimized Button */}
        <div className="mt-4 flex flex-col items-center">
            <button 
                onClick={onCheckAvailability}
                disabled={isCheckingAvailability}
                className="w-fit px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all disabled:opacity-70 active:scale-95"
            >
                {isCheckingAvailability ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : <div className="w-4 h-4"><GlobeIcon /></div>}
                {t('checkAvailability')}
            </button>

            {isCheckingAvailability && (
                <p className="text-[10px] text-center text-primary font-medium mt-2 animate-pulse">
                    {t('searchingPharmacies')}
                </p>
            )}

            {availabilityResult && (
                <div className="w-full mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 animate-fade-in">
                    <h4 className="text-sm font-black text-primary dark:text-primary-light uppercase tracking-wider mb-2 flex items-center gap-2">
                        <AssistantIcon /> {t('availabilityStatus')}
                    </h4>
                    <div className="text-sm text-slate-700 dark:text-slate-300 ai-response-content prose prose-sm dark:prose-invert">
                        <MarkdownRenderer content={availabilityResult.text} />
                    </div>
                    {availabilityResult.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{t('foundInSources')}</p>
                            <div className="flex flex-wrap gap-2">
                                {availabilityResult.sources.map((source, i) => (
                                    <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 truncate max-w-[150px]">
                                        {source.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="mt-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex items-center gap-2">
                <div className="w-4 h-4 text-primary"><PillIcon /></div>
                <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">{t('scientificName')}</h3>
            </div>
            <div className="p-1">
                {ingredients.map((ing, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{ing}</span>
                        <div className="text-right">
                            <span className="text-sm font-black text-primary">{strengths[idx] || strengths[0] || ''}</span>
                            <span className="text-[10px] ml-1 font-bold text-slate-400">{units[idx] || units[0] || ''}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="mt-8 border-t border-slate-100 dark:border-slate-800">
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            <DetailRow label={t('pharmaceuticalForm')} value={medicine.PharmaceuticalForm} />
            <DetailRow label={t('packageSize')} value={`${medicine.PackageSize || ''} ${medicine.PackageTypes || ''}`} />
            <DetailRow label={t('manufacturer')} value={medicine['Manufacture Name']} />
            <DetailRow label={t('countryOfManufacture')} value={medicine['Manufacture Country']} />
            <DetailRow label={t('registrationNumber')} value={medicine.RegisterNumber} />
          </dl>
        </div>
      </div>
    </div>
  );
};

export default MedicineDetail;
