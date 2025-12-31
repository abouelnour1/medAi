
import React, { useState } from 'react';
import { Medicine, TFunction, Language, User } from '../types';
import StarIcon from './icons/StarIcon';
import EditIcon from './icons/EditIcon';
import CameraIcon from './icons/CameraIcon';
import AssistantIcon from './icons/AssistantIcon';
import PillIcon from './icons/PillIcon';
import GlobeIcon from './icons/GlobeIcon';
import { searchPharmacyAvailability } from '../geminiService';

const DetailRow: React.FC<{ label: string; value?: string | number | null; valueClassName?: string }> = ({ label, value, valueClassName }) => {
  if (!value || String(value).trim() === '') return null;
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
      <dt className="text-sm font-medium leading-6 text-light-text-secondary dark:text-dark-text-secondary">{label}</dt>
      <dd className={`mt-1 text-sm leading-6 text-light-text dark:text-dark-text sm:col-span-2 sm:mt-0 ${valueClassName || ''}`}>{value}</dd>
    </div>
  );
};

const LegalStatusBadge: React.FC<{ status: string; size?: 'sm' | 'base', t: TFunction }> = ({ status, size = 'sm', t }) => {
  if (!status) return null;
  const statusText = status === 'OTC' ? 'OTC' : status === 'Prescription' ? 'Prescription' : status;
  let colorClasses = 'bg-slate-100 text-light-text-secondary dark:bg-slate-700 dark:text-dark-text-secondary'; 
  if (status === 'OTC') colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800';
  else if (status === 'Prescription') colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800';
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1 text-sm';
  return <span className={`inline-block font-semibold rounded-full ${sizeClasses} ${colorClasses}`}>{statusText}</span>;
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
  const [isChecking, setIsChecking] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{ text: string, links: { title: string, url: string }[] } | null>(null);

  const scientificName = String(medicine['Scientific Name'] || '');
  const ingredients = scientificName.split(',').map(s => s.trim()).filter(Boolean);
  const strengths = String(medicine.Strength || '').split(',').map(s => s.trim()).filter(Boolean);
  const units = String(medicine.StrengthUnit || '').split(',').map(s => s.trim()).filter(Boolean);

  const handleImageSearch = () => {
      const query = `${medicine['Trade Name']} ${medicine.Strength} ${medicine.PharmaceuticalForm}`;
      const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
      window.open(url, '_blank');
  };

  const checkAvailability = async () => {
      setIsChecking(true);
      setAvailabilityResult(null);
      try {
          const result = await searchPharmacyAvailability(medicine['Trade Name']);
          setAvailabilityResult(result);
      } catch (e) {
          console.error(e);
      } finally {
          setIsChecking(false);
      }
  };

  const productControl = medicine['Product Control'] || '';
  const isControlled = productControl.toLowerCase().includes('controlled') && !productControl.toLowerCase().includes('uncontrolled');
  const isRestricted = productControl.toLowerCase().includes('restricted');

  return (
    <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm animate-fade-in space-y-6">
      <div className="px-1">
        <div className="flex items-start justify-between gap-4">
            <div className="flex-grow min-w-0">
                <button onClick={onOpenAssistant} className="group flex flex-wrap items-center gap-2 text-left hover:opacity-80 transition-opacity">
                    <h2 className="text-2xl md:text-3xl font-black leading-tight text-light-text dark:text-dark-text group-hover:text-primary transition-colors">{medicine['Trade Name']}</h2>
                    <span className="text-primary dark:text-primary-light animate-pulse"><AssistantIcon /></span>
                </button>
                <div className="flex flex-wrap gap-2 mt-2">
                   <LegalStatusBadge status={medicine['Legal Status']} t={t} />
                   {(isControlled || isRestricted) && (
                      <span className={`px-2 py-1 text-[10px] font-bold text-white rounded-md shadow-sm ${isControlled ? 'bg-red-600' : 'bg-orange-500'}`}>{isControlled ? 'CONTROLLED' : 'RESTRICTED'}</span>
                   )}
                </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
                <div className="flex gap-1.5">
                    <button onClick={handleImageSearch} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 transition-all active:scale-90 shadow-sm"><div className="h-5 w-5"><CameraIcon /></div></button>
                    {user?.role === 'admin' && onEdit && (
                        <button onClick={() => onEdit(medicine)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-all active:scale-90 shadow-sm"><div className="h-5 w-5"><EditIcon /></div></button>
                    )}
                    <button onClick={() => onToggleFavorite(medicine.RegisterNumber)} className={`p-2.5 rounded-xl transition-all active:scale-90 shadow-sm ${isFavorite ? 'bg-accent/10 text-accent ring-1 ring-accent/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}><div className="h-5 w-5"><StarIcon isFilled={isFavorite} /></div></button>
                </div>
                {!isNaN(price) && (
                    <div className="text-right">
                        <span className="text-2xl font-black text-accent">{price.toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-slate-400 block -mt-1 uppercase tracking-tighter">{t('sar')}</span>
                    </div>
                )}
            </div>
        </div>

        {/* لوحة التوفر في الصيدليات - عرض حي ومباشر */}
        <div className="mt-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="w-5 h-5 text-primary"><GlobeIcon /></div>
                    {t('pharmacyAvailability')}
                </h3>
                {!isChecking && (
                    <button 
                        onClick={checkAvailability}
                        className="text-xs font-bold bg-primary text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-primary-dark transition-colors"
                    >
                        {availabilityResult ? 'تحديث البحث' : t('checkAvailability')}
                    </button>
                )}
            </div>
            
            <div className="p-4">
                {isChecking && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-bold text-slate-500 animate-pulse">جاري فحص مخزون الصيدليات السعودية أونلاين...</p>
                    </div>
                )}

                {availabilityResult && (
                    <div className="animate-fade-in space-y-6">
                        {/* النص الوصفي من الذكاء الاصطناعي */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <p className="text-xs font-black text-primary mb-3 flex items-center gap-1 uppercase tracking-wider">
                                <div className="w-3.5 h-3.5"><AssistantIcon /></div> {t('availabilityStatus')}
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                                {availabilityResult.text}
                            </p>
                        </div>

                        {/* قسم الروابط والمصادر - ستايل ويكيبيديا المنظم */}
                        {availabilityResult.links.length > 0 && (
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-0.5 flex-grow bg-slate-100 dark:bg-slate-800"></div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{t('foundInSources')}</p>
                                    <div className="h-0.5 flex-grow bg-slate-100 dark:bg-slate-800"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {availabilityResult.links.map((link, i) => (
                                        <a 
                                            key={i} 
                                            href={link.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary group transition-all shadow-sm"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-7 h-7 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                                    <div className="w-4 h-4"><GlobeIcon /></div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{link.title}</span>
                                            </div>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-300 group-hover:text-primary transition-colors ltr:rotate-0 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </a>
                                    ))}
                                </div>
                                
                                {/* زر سريع لفتح الخريطة لأقرب صيدلية بشكل عام */}
                                <button 
                                    onClick={() => window.open(`https://www.google.com/maps/search/pharmacy+near+me`, '_blank')}
                                    className="mt-4 w-full py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-black text-slate-500 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center gap-2 border border-dashed border-slate-300 dark:border-slate-600"
                                >
                                    🗺️ فتح الخريطة لأقرب صيدلية حولك
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {!availabilityResult && !isChecking && (
                    <div className="py-6 px-2 text-center space-y-3">
                        <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary/30">
                            <GlobeIcon />
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-[250px] mx-auto">
                            اضغط على زر <b>تحقق من التوفر</b> للبحث الحي عن الدواء في جميع الصيدليات السعودية المتاحة أونلاين.
                        </p>
                    </div>
                )}
            </div>
        </div>

        <div className="mt-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-inner">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <div className="w-4 h-4 text-primary"><PillIcon /></div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('scientificName')} & {t('strength')}</h3>
            </div>
            <div className="p-1">
                {ingredients.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {ingredients.map((ing, idx) => {
                            const currentStrength = strengths[idx] || (strengths.length === 1 ? strengths[0] : '');
                            const currentUnit = units[idx] || (units.length === 1 ? units[0] : '');
                            return (
                                <div key={idx} className="flex justify-between items-center p-3.5 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{ing}</span>
                                    {currentStrength && (
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="text-base font-black text-primary dark:text-primary-light">{currentStrength}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{currentUnit}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : <div className="p-4 text-center text-sm text-slate-400 italic">{scientificName || 'No scientific data'}</div>}
            </div>
        </div>

        <div className="mt-8 border-t border-slate-100 dark:border-slate-800">
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            <DetailRow label={t('pharmaceuticalForm')} value={medicine.PharmaceuticalForm} />
            <DetailRow label={t('packageSize')} value={`${medicine.PackageSize || ''} ${medicine.PackageTypes || ''}`.trim()} />
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
