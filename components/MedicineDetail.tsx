
import React, { useState } from 'react';
import { Medicine, TFunction, Language, User } from '../types';
import StarIcon from './icons/StarIcon';
import EditIcon from './icons/EditIcon';
import CameraIcon from './icons/CameraIcon';
import AssistantIcon from './icons/AssistantIcon';
import MarkdownRenderer from './MarkdownRenderer';

const DetailRow: React.FC<{ label: string; value?: string | number | null; valueClassName?: string }> = ({ label, value, valueClassName }) => {
  if (!value || String(value).trim() === '') return null;
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
      <dt className="text-sm font-medium leading-6 text-light-text-secondary dark:text-dark-text-secondary">{label}</dt>
      <dd className={`mt-1 text-sm leading-6 text-light-text dark:text-dark-text sm:col-span-2 sm:mt-0 ${valueClassName || ''}`}>{value}</dd>
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
    onEdit?: (medicine: Medicine) => void;
    onOpenAssistant?: () => void;
    onImageZoom: (url: string, title: string, isIndex: boolean) => void;
}

const MedicineDetail: React.FC<MedicineDetailProps> = ({ medicine, t, language, isFavorite, onToggleFavorite, user, onEdit, onOpenAssistant, onImageZoom }) => {
  const hasImages = !!(medicine.imgBox || medicine.imgIndex1 || medicine.imgIndex2 || medicine.imgPill);
  const hasPhysicalProps = !!(medicine.pillShape || medicine.pillScored || medicine.pillMarkings || medicine.liquidTaste || medicine.liquidColor);
  
  const [isPhysicalExpanded, setIsPhysicalExpanded] = useState(hasImages || hasPhysicalProps);

  const handleImageSearch = () => {
      const tradeName = medicine['Trade Name'] || '';
      let query = tradeName;
      if (tradeName.trim().split(/\s+/).length === 1) {
          query = `${tradeName} ${medicine.Strength || ''} ${medicine.PharmaceuticalForm || ''}`;
      }
      window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, '_blank');
  };

  const PhysicalImage = ({ src, label }: { src?: string, label: string }) => {
    if (!src) return null;
    const isIndex = label.toLowerCase().includes('index') || label.includes('فهرس');
    return (
        <div className="flex flex-col items-center gap-2 flex-shrink-0 snap-center">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
            <div 
                onClick={() => onImageZoom(src, `${medicine['Trade Name']} - ${label}`, isIndex)}
                className="w-48 h-48 sm:w-64 sm:h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-1 shadow-sm overflow-hidden flex items-center justify-center cursor-zoom-in active:scale-95 transition-transform"
            >
                <img src={src} alt={label} className="max-w-full max-h-full object-contain" loading="lazy" />
            </div>
        </div>
    );
  };

  const price = parseFloat(medicine['Public price']);
  const scientificName = medicine['Scientific Name'] || '';
  const ingredients = scientificName ? scientificName.split(',').map(s => s.trim()).filter(Boolean) : [];
  const strengthValues = String(medicine.Strength || '').split(',').map(s => s.trim()).filter(Boolean);
  const hasMultipleIngredients = ingredients.length > 1 && ingredients.length === strengthValues.length;

  const canEdit = user?.role === 'admin' || user?.role === 'company';

  return (
    <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm animate-fade-in space-y-6">
      <div className="space-y-4">
        {/* Header Section */}
        <div className="px-2 sm:px-0">
          <div className="flex items-center justify-between gap-4">
              <button onClick={onOpenAssistant} className="group flex items-center gap-2 text-left">
                  <h2 className="text-xl md:text-2xl font-bold text-light-text dark:text-dark-text group-hover:text-primary underline decoration-dotted decoration-gray-300 underline-offset-4">
                      {medicine['Trade Name']}
                  </h2>
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"><AssistantIcon /></span>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                  <button onClick={handleImageSearch} className="p-2 rounded-full text-gray-400 bg-gray-100 dark:bg-slate-800 hover:text-blue-500"><div className="h-5 w-5"><CameraIcon /></div></button>
                  {canEdit && onEdit && (
                      <button onClick={() => onEdit(medicine)} className="p-2 rounded-full text-gray-400 bg-gray-100 dark:bg-slate-800 hover:text-primary"><div className="h-5 w-5"><EditIcon /></div></button>
                  )}
                  <button onClick={() => onToggleFavorite(medicine.RegisterNumber)} className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-accent bg-accent/10' : 'text-gray-400 bg-gray-100 dark:bg-slate-800'}`}><div className="h-5 w-5"><StarIcon isFilled={isFavorite} /></div></button>
              </div>
          </div>
          
          {hasMultipleIngredients ? (
            <div className="mt-3">
              <ul className="space-y-1.5">{ingredients.map((ingredient, index) => (
                  <li key={index} className="flex justify-between items-baseline border-b border-slate-50 dark:border-slate-800 pb-1">
                      <span className="text-sm text-light-text dark:text-dark-text">{ingredient}</span>
                      <span className="font-bold text-xs text-primary">{strengthValues[index]}</span>
                  </li>
              ))}</ul>
            </div>
          ) : (
            <p className="mt-1 text-sm leading-6 text-light-text-secondary">{`${scientificName} ${medicine.Strength || ''} ${medicine.StrengthUnit || ''}`.trim()}</p>
          )}

          {!isNaN(price) && <div className="mt-4 text-accent text-2xl font-bold">{`${price.toFixed(2)} ${t('sar')}`}</div>}
        </div>

        {/* Physical Appearance Section (Now First) */}
        <div className="mt-6 border-t border-slate-100 dark:border-slate-800">
            <button 
                onClick={() => setIsPhysicalExpanded(!isPhysicalExpanded)}
                className="w-full flex justify-between items-center py-4 text-primary font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 rounded-xl transition-colors"
            >
                <div className="flex items-center gap-3">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>{t('physicalDetails')}</span>
                </div>
                <svg className={`h-5 w-5 transform transition-transform ${isPhysicalExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isPhysicalExpanded && (
                <div className="pb-6 px-1 animate-fade-in space-y-6">
                    {hasImages && (
                        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-2 snap-x">
                            <PhysicalImage src={medicine.imgBox} label={t('boxImage')} />
                            <PhysicalImage src={medicine.imgIndex1} label={language === 'ar' ? 'الفهرس 1' : 'Index 1'} />
                            <PhysicalImage src={medicine.imgIndex2} label={language === 'ar' ? 'الفهرس 2' : 'Index 2'} />
                            <PhysicalImage src={medicine.imgPill} label={t('pillImage')} />
                        </div>
                    )}

                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                            <DetailRow label={t('pillShape')} value={medicine.pillShape} />
                            <DetailRow label={t('scored')} value={medicine.pillScored} />
                            <DetailRow label={t('markings')} value={medicine.pillMarkings} />
                            <DetailRow label={t('taste')} value={medicine.liquidTaste} />
                            <DetailRow label={t('liquidColor')} value={medicine.liquidColor} />
                        </dl>
                        {medicine.physicalNotes && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{t('notes')}</p>
                                <div className="text-sm text-slate-600 dark:text-slate-300"><MarkdownRenderer content={medicine.physicalNotes} /></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Main Details List (Including ATC, Shelf Life, etc.) */}
        <div className="mt-6 border-t border-slate-100 dark:border-slate-800">
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            <DetailRow label={t('pharmaceuticalForm')} value={medicine.PharmaceuticalForm} />
            <DetailRow label={t('packageSize')} value={`${medicine.PackageSize || ''} ${medicine.PackageTypes || ''}`.trim()} />
            
            {/* Regulatory & Code Fields Merged Here */}
            <DetailRow label={t('atcCode') || 'كود ATC'} value={medicine.AtcCode1} valueClassName="font-mono text-primary font-bold" />
            <DetailRow label={t('descriptiveCode') || 'الكود الوصفي'} value={medicine['Description Code']} valueClassName="font-mono" />
            <DetailRow label={t('shelfLife') || 'مدة الصلاحية'} value={medicine.shelfLife ? `${medicine.shelfLife} ${language === 'ar' ? 'شهراً' : 'Months'}` : null} />
            <DetailRow label={language === 'ar' ? 'منطقة التوزيع' : 'Distribute Area'} value={medicine['Distribute area']} />
            <DetailRow label={language === 'ar' ? 'الرقابة' : 'Product Control'} value={medicine['Product Control']} valueClassName={medicine['Product Control']?.toLowerCase().includes('controlled') ? 'text-red-500 font-bold' : ''} />
            <DetailRow label={t('legalStatus')} value={medicine['Legal Status']} />

            <DetailRow label={t('manufacturer')} value={medicine['Manufacture Name']} />
            <DetailRow label={t('countryOfManufacture')} value={medicine['Manufacture Country']} />
            <DetailRow label={t('storageConditions')} value={language === 'ar' ? medicine['Storage Condition Arabic'] : medicine['Storage conditions']} />
            <DetailRow label={t('marketingCompany') || 'الشركة المسوقة'} value={medicine['Marketing Company']} />
            <DetailRow label={t('mainAgent')} value={medicine['Main Agent']} />
            <DetailRow label={t('registrationNumber')} value={medicine.RegisterNumber} />
          </dl>
        </div>
      </div>
    </div>
  );
};

export default MedicineDetail;
