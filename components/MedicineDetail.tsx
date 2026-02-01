
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

const DetailRow: React.FC<{ label: string; value?: string | number | null; valueClassName?: string }> = ({ label, value, valueClassName }) => {
  if (!value || String(value).trim() === '') return null;
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

    return (
        <div className="flex flex-col items-center gap-2 flex-shrink-0 snap-center">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
            <div 
                onClick={onClick}
                className="w-48 h-48 sm:w-64 sm:h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-1 shadow-sm overflow-hidden flex items-center justify-center cursor-zoom-in active:scale-95 transition-all relative"
            >
                {isLoading && !hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                )}
                
                {hasError ? (
                    <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 p-4">
                        <div className="w-16 h-16 mb-2 opacity-20"><PillBottleIcon /></div>
                        <span className="text-[9px] font-bold uppercase tracking-tight text-center">الصورة غير متوفرة</span>
                    </div>
                ) : (
                    <img 
                        src={src} 
                        alt={label} 
                        className={`max-w-full max-h-full object-contain transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                        onLoad={() => setIsLoading(false)}
                        onError={() => {
                            setIsLoading(false);
                            setHasError(true);
                        }}
                        loading="lazy" 
                    />
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
    onOpenAssistant?: () => void;
    onImageZoom: (allImages: string[], initialIndex: number, title: string, indexFlags: boolean[]) => void;
    onFindAlternative: (medicine: Medicine) => void;
}

const MedicineDetail: React.FC<MedicineDetailProps> = ({ medicine, insuranceData, t, language, isFavorite, onToggleFavorite, user, onEdit, onOpenAssistant, onImageZoom, onFindAlternative }) => {
  const [isClinicalExpanded, setIsClinicalExpanded] = useState(true);
  const [isPhysicalExpanded, setIsPhysicalExpanded] = useState(false);
  
  const medicineImages = useMemo(() => {
    return [
        { url: medicine.imgBox, label: t('boxImage'), isIndex: false },
        { url: medicine.imgIndex1, label: language === 'ar' ? 'الفهرس 1' : 'Index 1', isIndex: true },
        { url: medicine.imgIndex2, label: language === 'ar' ? 'الفهرس 2' : 'Index 2', isIndex: true },
        { url: medicine.imgPill, label: t('pillImage'), isIndex: false }
    ].filter(img => img.url && img.url.trim() !== '');
  }, [medicine, t, language]);

  // الربط الذكي مع بيانات التأمين السريرية
  const clinicalMatches = useMemo(() => {
    if (!insuranceData || !medicine['Scientific Name']) return [];
    const medicineSciName = medicine['Scientific Name'].toLowerCase().trim();
    
    // فلترة البيانات التي تطابق الاسم العلمي
    const matches = insuranceData.filter(d => {
        if (!d.scientificName) return false;
        const entrySciName = d.scientificName.toLowerCase().trim();
        return medicineSciName.includes(entrySciName) || entrySciName.includes(medicineSciName);
    });

    // تجميع البيانات حسب التشخيص (Indication)
    const groupedByIndication = new Map<string, InsuranceDrug[]>();
    matches.forEach(m => {
        const key = m.indication || (language === 'ar' ? 'عام' : 'General');
        if (!groupedByIndication.has(key)) groupedByIndication.set(key, []);
        groupedByIndication.get(key)!.push(m);
    });

    return Array.from(groupedByIndication.entries());
  }, [insuranceData, medicine, language]);

  const hasImages = medicineImages.length > 0;

  const handleImageSearch = () => {
      const tradeName = medicine['Trade Name'] || '';
      let query = tradeName;
      if (tradeName.trim().split(/\s+/).length === 1) {
          query = `${tradeName} ${medicine.Strength || ''} ${medicine.PharmaceuticalForm || ''}`;
      }
      window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, '_blank');
  };

  const price = parseFloat(medicine['Public price']);
  const scientificName = medicine['Scientific Name'] || '';
  const ingredients = scientificName ? scientificName.split(',').map(s => s.trim()).filter(Boolean) : [];
  const strengthValues = String(medicine.Strength || '').split(',').map(s => s.trim()).filter(Boolean);
  const hasMultipleIngredients = ingredients.length > 1 && ingredients.length === strengthValues.length;

  const canEdit = user?.role === 'admin' || user?.role === 'company';

  const handleThumbnailClick = (index: number) => {
    const allUrls = medicineImages.map(img => img.url!);
    const indexFlags = medicineImages.map(img => !!img.isIndex);
    onImageZoom(allUrls, index, medicine['Trade Name'], indexFlags);
  };

  return (
    <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm animate-fade-in space-y-6">
      <div className="space-y-4">
        <div className="px-2 sm:px-0">
          <div className="flex items-center justify-between gap-4">
              <button onClick={onOpenAssistant} className="group flex items-center gap-2 text-left">
                  <h2 className="text-xl md:text-2xl font-bold text-light-text dark:text-dark-text group-hover:text-primary underline decoration-dotted decoration-gray-300 underline-offset-4">
                      {medicine['Trade Name']}
                  </h2>
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"><AssistantIcon /></span>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => onFindAlternative(medicine)} className="p-2 rounded-full text-gray-400 bg-gray-100 dark:bg-slate-800 hover:text-primary" title={t('directAlternatives')}><div className="h-5 w-5"><AlternativeIcon /></div></button>
                  <button onClick={handleImageSearch} className="p-2 rounded-full text-gray-400 bg-gray-100 dark:bg-slate-800 hover:text-blue-500" title={t('searchImage')}><div className="h-5 w-5"><CameraIcon /></div></button>
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

          {!isNaN(price) && <div className="mt-4 text-orange-600 dark:text-orange-400 text-2xl font-black">{`${price.toFixed(2)} ${t('sar')}`}</div>}
        </div>

        {/* القسم السريري الجديد: Clinical Information مجمعة حسب التشخيص */}
        {clinicalMatches.length > 0 && (
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800">
                <button 
                    onClick={() => setIsClinicalExpanded(!isClinicalExpanded)}
                    className="w-full flex justify-between items-center py-4 text-secondary dark:text-green-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 rounded-xl transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5"><StethoscopeIcon /></div>
                        <span>{t('clinicalDetails')}</span>
                    </div>
                    <svg className={`h-5 w-5 transform transition-transform ${isClinicalExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>

                {isClinicalExpanded && (
                    <div className="pb-6 px-1 animate-fade-in space-y-4">
                        {clinicalMatches.map(([indication, entries]) => (
                            <div key={indication} className="bg-green-50/50 dark:bg-green-900/10 rounded-2xl overflow-hidden border border-green-100/50 dark:border-green-800/30">
                                <div className="bg-green-100/40 dark:bg-green-800/30 px-4 py-2 border-b border-green-100 dark:border-green-800/50">
                                    <h4 className="text-xs font-black text-secondary dark:text-green-300 uppercase tracking-widest">{indication}</h4>
                                </div>
                                <div className="p-4 space-y-3">
                                    {entries.map((entry, idx) => (
                                        <div key={idx} className="space-y-3">
                                            {(entry.mddAdults) && (
                                                <div>
                                                    <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t('maxDailyDoseAdults')}</dt>
                                                    <dd className="text-sm font-bold text-slate-700 dark:text-slate-200">{entry.mddAdults}</dd>
                                                </div>
                                            )}
                                            {(entry.mddPediatrics) && (
                                                <div>
                                                    <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t('maxDailyDosePediatrics')}</dt>
                                                    <dd className="text-sm font-bold text-slate-700 dark:text-slate-200">{entry.mddPediatrics}</dd>
                                                </div>
                                            )}
                                            {entry.notes && (
                                                <div className="pt-2 border-t border-green-100/50 dark:border-green-800/30">
                                                    <dt className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1.5">{t('clinicalNotes')}</dt>
                                                    <dd className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                                                        <MarkdownRenderer content={entry.notes} />
                                                    </dd>
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
                            {medicineImages.map((img, idx) => (
                                <PhysicalImage key={idx} src={img.url!} label={img.label} onClick={() => handleThumbnailClick(idx)} />
                            ))}
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

        <div className="mt-6 border-t border-slate-100 dark:border-slate-800">
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            <DetailRow label={t('pharmaceuticalForm')} value={medicine.PharmaceuticalForm} />
            <DetailRow label={t('packageSize')} value={`${medicine.PackageSize || ''} ${medicine.PackageTypes || ''}`.trim()} />
            <DetailRow label={t('atcCode') || 'كود ATC'} value={medicine.AtcCode1} valueClassName="font-mono text-primary font-bold" />
            <DetailRow label={t('descriptiveCode') || 'الكود الوصفي'} value={medicine['Description Code']} valueClassName="font-mono" />
            <DetailRow label={t('shelfLife') || 'الكود الوصفي'} value={medicine.shelfLife ? `${medicine.shelfLife} ${language === 'ar' ? 'شهراً' : 'Months'}` : null} />
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

export default memo(MedicineDetail);
