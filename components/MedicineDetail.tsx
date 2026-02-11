
import React, { useState, memo, useMemo } from 'react';
import { Medicine, TFunction, Language, User, InsuranceDrug } from '../types';
import StarIcon from './icons/StarIcon';
import EditIcon from './icons/EditIcon';
import CameraIcon from './icons/CameraIcon';
import AssistantIcon from './icons/AssistantIcon';
import MarkdownRenderer from './MarkdownRenderer';
import PillBottleIcon from './icons/PillBottleIcon';
import AlternativeIcon from './icons/AlternativeIcon';
import StethoscopeIcon from './icons/StethoscopeIcon';
import TrashIcon from './icons/TrashIcon';
import { getIngredientsList } from './MedicineCard';

const DetailRow: React.FC<{ label: string; value?: string | number | null; valueClassName?: string }> = ({ label, value, valueClassName }) => {
  if (!value || String(value).trim() === '' || String(value).toLowerCase().trim() === 'na' || String(value).toLowerCase().trim() === 'n/a') return null;
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
      <dt className="text-sm font-medium leading-6 text-light-text-secondary dark:text-dark-text-secondary">{label}</dt>
      <dd className={`mt-1 text-sm leading-6 text-light-text dark:text-dark-text sm:col-span-2 sm:mt-0 ${valueClassName || ''}`}>{value}</dd>
    </div>
  );
};

const PhysicalImage = memo(({ src, label, onClick }: { 
    src: string, 
    label: string, 
    onClick: () => void 
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const hasValue = src && String(src).trim().length > 0;
    return (
        <div className="flex flex-col items-center gap-2 flex-shrink-0 snap-center">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
            <div 
                onClick={onClick}
                className="w-48 h-48 sm:w-64 sm:h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-1 shadow-sm overflow-hidden flex items-center justify-center cursor-zoom-in active:scale-95 transition-all relative"
            >
                {!hasValue || hasError ? (
                    <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 p-4">
                        <div className="w-16 h-16 mb-2 opacity-20"><PillBottleIcon /></div>
                        <span className="text-[9px] font-bold uppercase tracking-tight text-center">
                            {hasError ? 'فشل تحميل الصورة' : 'الصورة غير متوفرة'}
                        </span>
                    </div>
                ) : (
                    <>
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 z-10">
                                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        )}
                        <img 
                            src={src} 
                            alt={label} 
                            className={`max-w-full max-h-full object-contain transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => {
                                setIsLoading(false);
                                setHasError(false);
                            }}
                            onError={() => {
                                setIsLoading(false);
                                setHasError(true);
                            }}
                            loading="eager" 
                        />
                    </>
                )}
            </div>
        </div>
    );
});

interface MedicineDetailProps {
    medicine: Medicine;
    insuranceData: InsuranceDrug[];
    t: TFunction;
    language: Language;
    isFavorite: boolean;
    onToggleFavorite: (medicineId: string) => void;
    user?: User | null;
    onEdit?: (medicine: Medicine) => void;
    onDelete?: (medicine: Medicine) => void;
    onOpenAssistant?: () => void;
    onImageZoom: (allImages: string[], initialIndex: number, title: string, indexFlags: boolean[]) => void;
    onImageSearch?: () => void;
    onFindAlternative: (medicine: Medicine) => void;
}

const MedicineDetail: React.FC<MedicineDetailProps> = ({ medicine, insuranceData, t, language, isFavorite, onToggleFavorite, user, onEdit, onDelete, onOpenAssistant, onImageZoom, onFindAlternative }) => {
  const [isPhysicalExpanded, setIsPhysicalExpanded] = useState(true);
  const [isClinicalExpanded, setIsClinicalExpanded] = useState(false);
  
  const medicineImages = useMemo(() => {
    return [
        { url: medicine.imgBox, label: t('boxImage'), isIndex: false },
        { url: medicine.imgPill, label: t('pillImage'), isIndex: false },
        { url: medicine.imgIndex1, label: language === 'ar' ? 'الفهرس 1' : 'Index 1', isIndex: true },
        { url: medicine.imgIndex2, label: language === 'ar' ? 'الفهرس 2' : 'Index 2', isIndex: true }
    ].filter(img => img.url && String(img.url).trim() !== '');
  }, [medicine, t, language]);

  const ingredients = useMemo(() => getIngredientsList(medicine), [medicine]);

  const clinicalMatches = useMemo(() => {
    if (!insuranceData || !medicine['Scientific Name'] || medicine['Product type'] !== 'Human') return [];
    const medicineSciName = medicine['Scientific Name'].toLowerCase().trim();
    const matches = insuranceData.filter(d => {
        if (!d.scientificName) return false;
        const entrySciName = d.scientificName.toLowerCase().trim();
        return medicineSciName.includes(entrySciName) || entrySciName.includes(medicineSciName);
    });
    const groupedByIndication = new Map<string, InsuranceDrug[]>();
    matches.forEach(m => {
        const key = m.indication || (language === 'ar' ? 'استخدامات عامة' : 'General Usage');
        const cleanEntry = { ...m };
        if (cleanEntry.mddAdults?.toLowerCase().trim() === 'na') cleanEntry.mddAdults = '';
        if (cleanEntry.mddPediatrics?.toLowerCase().trim() === 'na') cleanEntry.mddPediatrics = '';
        if (cleanEntry.notes?.toLowerCase().trim() === 'na') cleanEntry.notes = '';
        if (!groupedByIndication.has(key)) groupedByIndication.set(key, []);
        const existing = groupedByIndication.get(key)!;
        const isDuplicate = existing.some(e => e.mddAdults === cleanEntry.mddAdults && e.mddPediatrics === cleanEntry.mddPediatrics && e.notes === cleanEntry.notes);
        if (!isDuplicate) {
            groupedByIndication.get(key)!.push(cleanEntry);
        }
    });
    return Array.from(groupedByIndication.entries());
  }, [insuranceData, medicine, language]);

  const handleImageSearch = () => {
      const tradeName = medicine['Trade Name'] || '';
      const sciName = medicine['Scientific Name'] || '';
      let query = `${tradeName} ${sciName}`.trim();
      window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, '_blank');
  };

  const price = parseFloat(medicine['Public price']);
  const canEdit = user?.role === 'admin' || user?.role === 'company';
  const isAdmin = user?.role === 'admin';
  const isFood = medicine['Product type'] === 'Food';

  const handleThumbnailClick = (index: number) => {
    const allUrls = medicineImages.map(img => img.url!);
    const indexFlags = medicineImages.map(img => !!img.isIndex);
    onImageZoom(allUrls, index, medicine['Trade Name'], indexFlags);
  };

  const isTempRegisterNumber = useMemo(() => {
    if (!medicine.RegisterNumber) return true;
    return medicine.RegisterNumber.startsWith('temp-');
  }, [medicine.RegisterNumber]);

  const hasPhysicalData = useMemo(() => {
    const fields = [medicine.pillShape, medicine.pillScored, medicine.pillMarkings, medicine.liquidTaste, medicine.liquidColor, medicine.physicalNotes];
    return fields.some(f => f && f.trim() !== '' && f.toLowerCase() !== 'na' && f.toLowerCase() !== 'n/a');
  }, [medicine]);

  const showPhysicalSection = medicineImages.length > 0 || hasPhysicalData;

  // Translate distribution area
  const distAreaRaw = medicine['Distribute area'] || '';
  const distAreaTranslated = distAreaRaw.toLowerCase().includes('hospital') ? t('hospital') : distAreaRaw.toLowerCase().includes('pharmacy') ? t('pharmacy') : distAreaRaw;

  // Combine package info
  const packageDisplay = medicine.PackageSize && medicine.PackageSize !== '0' ? `${medicine.PackageSize} ${medicine.PackageTypes || ''}`.trim() : null;

  // Control logic
  const productControl = medicine['Product Control'] || '';
  const isControlled = productControl.toLowerCase().includes('controlled') && !productControl.toLowerCase().includes('uncontrolled');
  const isRestricted = productControl.toLowerCase().includes('restricted');

  return (
    <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm animate-fade-in space-y-6">
      <div className="space-y-4">
        <div className="px-2 sm:px-0">
          <div className="flex items-center justify-between gap-4">
              <button onClick={onOpenAssistant} className="group flex items-center gap-2 text-left min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-light-text dark:text-dark-text group-hover:text-primary underline decoration-dotted decoration-gray-300 underline-offset-4 truncate">
                      {medicine['Trade Name']}
                  </h2>
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"><AssistantIcon /></span>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => onFindAlternative(medicine)} className="p-2 rounded-full text-gray-400 bg-gray-100 dark:bg-slate-800 hover:text-primary" title={t('directAlternatives')}><div className="h-5 w-5"><AlternativeIcon /></div></button>
                  <button onClick={handleImageSearch} className="p-2 rounded-full text-gray-400 bg-gray-100 dark:bg-slate-800 hover:text-blue-500" title={t('searchImage')}><div className="h-5 w-5"><CameraIcon /></div></button>
                  {isAdmin && isFood && onDelete && (
                      <button onClick={() => onDelete(medicine)} className="p-2 rounded-full text-gray-400 bg-gray-100 dark:bg-slate-800 hover:text-red-600 transition-colors" title={t('delete')}><div className="h-5 w-5"><TrashIcon /></div></button>
                  )}
                  {canEdit && onEdit && (
                      <button onClick={() => onEdit(medicine)} className="p-2 rounded-full text-gray-400 bg-gray-100 dark:bg-slate-800 hover:text-primary"><div className="h-5 w-5"><EditIcon /></div></button>
                  )}
                  <button onClick={() => onToggleFavorite(medicine.RegisterNumber)} className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-accent bg-accent/10' : 'text-gray-400 bg-gray-100 dark:bg-slate-800'}`}><div className="h-5 w-5"><StarIcon isFilled={isFavorite} /></div></button>
              </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
              {(isControlled || isRestricted) && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black text-white shadow-lg uppercase tracking-wider ${isControlled ? 'bg-red-600' : 'bg-amber-600'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                      {isControlled ? 'Controlled Drug (خاضع للرقابة)' : 'Restricted Drug (دواء مقيد)'}
                  </span>
              )}
              <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 rounded-md">
                {medicine['Legal Status']}
              </span>
          </div>
          
          <div className="mt-4">
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner">
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      {ingredients.map((ing, i) => (
                          <div key={i} className={`flex justify-between items-center py-2 px-3 group ${i % 2 === 0 ? 'bg-white/50 dark:bg-slate-900/20' : 'bg-transparent'}`}>
                              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 uppercase tracking-tight group-hover:text-primary transition-colors leading-tight flex-grow pr-4">
                                {ing.name}
                              </span>
                              {ing.strength && ing.strength.toLowerCase() !== 'na' && (
                                <span className="text-[11px] font-black text-primary dark:text-primary-light whitespace-nowrap min-w-[50px] text-right">
                                    {ing.strength}
                                </span>
                              )}
                          </div>
                      ))}
                      {ingredients.length === 0 && <span className="p-4 text-[11px] text-slate-400 italic block text-center uppercase tracking-widest">No active ingredients found</span>}
                  </div>
              </div>
          </div>

          {!isNaN(price) && price > 0 && <div className="mt-4 text-orange-600 dark:text-orange-400 text-2xl font-black px-1">{`${price.toFixed(2)} ${t('sar')}`}</div>}
        </div>

        {showPhysicalSection && (
          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-2">
              <button 
                  onClick={() => setIsPhysicalExpanded(!isPhysicalExpanded)}
                  className="w-full flex justify-between items-center py-4 text-primary font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 rounded-xl transition-colors"
              >
                  <div className="flex items-center gap-3">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
                      <span>{t('physicalDetails')}</span>
                  </div>
                  <svg className={`h-5 w-5 transform transition-transform ${isPhysicalExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>

              {isPhysicalExpanded && (
                  <div className="pb-6 px-1 animate-fade-in space-y-6">
                      {medicineImages.length > 0 && (
                          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-2 snap-x">
                              {medicineImages.map((img, idx) => (
                                  <PhysicalImage key={idx} src={img.url!} label={img.label} onClick={() => handleThumbnailClick(idx)} />
                              ))}
                          </div>
                      )}
                      {hasPhysicalData && (
                          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-inner">
                              <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                                  <DetailRow label={t('pillShape')} value={medicine.pillShape} />
                                  <DetailRow label={t('scored')} value={medicine.pillScored} />
                                  <DetailRow label={t('markings')} value={medicine.pillMarkings} />
                                  <DetailRow label={t('taste')} value={medicine.liquidTaste} />
                                  <DetailRow label={t('liquidColor')} value={medicine.liquidColor} />
                                  <DetailRow label={t('notes')} value={medicine.physicalNotes} valueClassName="italic text-slate-500 font-medium" />
                              </dl>
                          </div>
                      )}
                  </div>
              )}
          </div>
        )}

        {medicine['Product type'] === 'Human' && clinicalMatches.length > 0 && (
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-2">
                <button 
                    onClick={() => setIsClinicalExpanded(!isClinicalExpanded)}
                    className="w-full flex justify-between items-center py-4 text-secondary dark:text-green-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 rounded-xl transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5"><StethoscopeIcon /></div>
                        <span>{t('clinicalDetails')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-secondary/10 px-2 py-0.5 rounded-full">{clinicalMatches.length}</span>
                        <svg className={`h-5 w-5 transform transition-transform ${isClinicalExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </button>
                {isClinicalExpanded && (
                    <div className="pb-6 px-1 animate-fade-in space-y-6">
                        {clinicalMatches.map(([indication, entries]) => (
                            <div key={indication} className="bg-white dark:bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="bg-teal-600 dark:bg-teal-700 px-4 py-3 border-b border-teal-500 flex items-center gap-2">
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight leading-tight">{indication}</h4>
                                </div>
                                <div className="p-4 space-y-4">
                                    {entries.map((entry, idx) => (
                                        <div key={idx} className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {entry.mddAdults && (
                                                    <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                                                        <dt className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('maxDailyDoseAdults')}</dt>
                                                        <dd className="text-sm font-bold text-slate-800 dark:text-slate-100">{entry.mddAdults}</dd>
                                                    </div>
                                                )}
                                            </div>
                                            {entry.notes && (
                                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                                    <dt className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">{t('clinicalNotes')}</dt>
                                                    <dd className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 italic"><MarkdownRenderer content={entry.notes} /></dd>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Added Distribution and Pack Size Rows */}
            <DetailRow label={t('distribution')} value={distAreaTranslated} valueClassName="font-bold text-primary" />
            <DetailRow label={t('packSize')} value={packageDisplay} valueClassName="font-bold" />
            
            <DetailRow label={t('strengthUnit')} value={medicine.StrengthUnit} />
            <DetailRow label={t('pharmaceuticalForm')} value={medicine.PharmaceuticalForm} />
            <DetailRow label={t('atcCode') || 'كود ATC'} value={medicine.AtcCode1} valueClassName="font-mono text-primary font-bold" />
            <DetailRow label={t('descriptiveCode') || 'الكود الوصفي'} value={medicine['Description Code']} valueClassName="font-mono" />
            <DetailRow label={t('legalStatus')} value={medicine['Legal Status']} />
            <DetailRow label={t('manufacturer')} value={medicine['Manufacture Name']} />
            <DetailRow label={t('mainAgent')} value={medicine['Main Agent']} />
            
            {/* Storage Conditions Section */}
            <DetailRow label={t('storageConditionsAr') || 'ظروف التخزين (AR)'} value={medicine['Storage Condition Arabic']} />
            <DetailRow label={t('storageConditionsEn') || 'Storage Conditions (EN)'} value={medicine['Storage conditions']} valueClassName="font-medium text-slate-600 dark:text-slate-400" />
            
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-light-text-secondary dark:text-dark-text-secondary">{t('registrationNumber')}</dt>
              <dd className="mt-1 text-sm leading-6 text-light-text dark:text-dark-text sm:col-span-2 sm:mt-0">
                {isTempRegisterNumber ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-bold text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {language === 'ar' ? 'رقم مؤقت - قيد التحديث' : 'Temporary - Pending Update'}
                    </span>
                ) : (
                    <span className="font-mono">{medicine.RegisterNumber}</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default memo(MedicineDetail);
