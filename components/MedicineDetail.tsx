
import React, { useState, useEffect } from 'react';
import { Medicine, TFunction, Language, User } from '../types';
import StarIcon from './icons/StarIcon';
import EditIcon from './icons/EditIcon';
import CameraIcon from './icons/CameraIcon';
import AssistantIcon from './icons/AssistantIcon';
import MarkdownRenderer from './MarkdownRenderer';
import ClearIcon from './icons/ClearIcon';
import DownloadIcon from './icons/DownloadIcon';
import GlobeIcon from './icons/GlobeIcon';

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
  const hasImages = !!(medicine.imgBox || medicine.imgIndex1 || medicine.imgIndex2 || medicine.imgPill);
  const hasPhysicalProps = !!(medicine.pillShape || medicine.pillScored || medicine.pillMarkings || medicine.liquidTaste || medicine.liquidColor);
  
  const [isPhysicalExpanded, setIsPhysicalExpanded] = useState(hasImages || hasPhysicalProps);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    if (zoomedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [zoomedImage]);

  // وظيفة التحميل المحسنة
  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('CORS limitation');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `PharmaSource_HQ_${medicine['Trade Name']}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      // إذا فشل التحميل البرمجي بسبب حقوق الموقع، نفتح الصورة في نافذة جديدة بأعلى جودة
      window.open(url, '_blank');
    }
  };

  const handleOpenOriginal = (url: string) => {
      window.open(url, '_blank');
  };

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

  const PhysicalImage = ({ src, label }: { src?: string, label: string }) => {
    if (!src) return null;
    return (
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
            <div 
                onClick={() => setZoomedImage(src)}
                className="w-56 h-56 sm:w-64 sm:h-64 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800 p-2 shadow-sm overflow-hidden flex items-center justify-center transition-all cursor-zoom-in hover:border-primary/50 group"
            >
                <img 
                    src={src} 
                    alt={label} 
                    className="max-w-full max-h-full object-contain pointer-events-none transition-transform group-hover:scale-105" 
                    style={{ 
                        imageRendering: 'auto',
                        WebkitBackfaceVisibility: 'hidden'
                    }}
                />
            </div>
            <span className="text-[9px] text-primary/60 font-bold uppercase">{language === 'ar' ? 'انقر لعرض الجودة الأصلية' : 'Tap for Full Resolution'}</span>
        </div>
    );
  };

  const price = parseFloat(medicine['Public price']);
  const scientificName = medicine['Scientific Name'] || '';
  const strengths = String(medicine.Strength || '');
  const strengthUnit = String(medicine.StrengthUnit || '');
  const ingredients = scientificName ? scientificName.split(',').map(s => s.trim()).filter(Boolean) : [];
  const strengthValues = strengths ? strengths.split(',').map(s => s.trim()).filter(Boolean) : [];
  const strengthUnitValues = strengthUnit ? strengthUnit.split(',').map(s => s.trim()).filter(Boolean) : [];
  const hasMultipleIngredients = ingredients.length > 1 && ingredients.length === strengthValues.length;

  return (
    <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm animate-fade-in space-y-6">
      <div className="space-y-4">
        <div className="px-2 sm:px-0">
          <div className="flex items-center justify-between gap-4">
              <button onClick={onOpenAssistant} className="group flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
                  <h2 className="text-xl md:text-2xl font-bold leading-7 text-light-text dark:text-dark-text group-hover:text-primary underline decoration-dotted decoration-gray-300 underline-offset-4">
                      {medicine['Trade Name'] || 'Unknown Name'}
                  </h2>
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"><AssistantIcon /></span>
              </button>
              <div className="flex items-center gap-2">
                  <button onClick={handleImageSearch} className="p-2 rounded-full transition-colors text-gray-400 bg-gray-100 dark:bg-slate-800 hover:text-blue-500" title={t('searchImage')}><div className="h-6 w-6"><CameraIcon /></div></button>
                  {user?.role === 'admin' && onEdit && (
                      <button onClick={() => onEdit(medicine)} className="p-2 rounded-full transition-colors text-gray-400 bg-gray-100 dark:bg-slate-800 hover:text-primary" title={t('editMedicine')}><div className="h-6 w-6"><EditIcon /></div></button>
                  )}
                  <button onClick={() => onToggleFavorite(medicine.RegisterNumber)} className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-accent bg-accent/10' : 'text-gray-400 bg-gray-100 dark:bg-slate-800'}`}><div className="h-6 w-6"><StarIcon isFilled={isFavorite} /></div></button>
              </div>
          </div>
          
          {hasMultipleIngredients ? (
            <div className="mt-3">
              <p className="text-xs font-semibold text-light-text-secondary mb-2">{t('scientificName')}:</p>
              <ul className="space-y-1.5">{ingredients.map((ingredient, index) => {
                  let unit = strengthUnitValues.length === strengthValues.length ? strengthUnitValues[index] : (strengthUnitValues.length === 1 ? strengthUnitValues[0] : '');
                  const strengthDisplay = `${strengthValues[index] || ''}${unit ? ` ${unit}` : ''}`.trim();
                  return (<li key={index} className="flex justify-between items-baseline"><span className="text-sm text-light-text dark:text-dark-text">{ingredient}</span><span className="font-bold text-light-text dark:text-dark-text whitespace-nowrap">{strengthDisplay}</span></li>);
                })}</ul>
            </div>
          ) : (
            <p className="mt-1 text-sm leading-6 text-light-text-secondary">{`${scientificName}${strengths ? ` ${strengths}` : ''}${strengthUnit ? ` ${strengthUnit}` : ''}`.trim()}</p>
          )}

          {!isNaN(price) && <div className="mt-4 text-accent text-2xl font-bold">{`${price.toFixed(2)} ${t('sar')}`}</div>}
        </div>

        {/* Physical Details Accordion */}
        <div className="mt-6 border-t border-slate-100 dark:border-slate-800">
            <button 
                onClick={() => setIsPhysicalExpanded(!isPhysicalExpanded)}
                className="w-full flex justify-between items-center py-4 text-primary font-black hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 rounded-xl transition-colors"
            >
                <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>{t('physicalDetails')}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform transition-transform duration-300 ${isPhysicalExpanded ? 'rotate-180 text-primary' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isPhysicalExpanded && (
                <div className="pb-6 px-1 animate-fade-in space-y-6">
                    {hasImages && (
                        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-2 snap-x">
                            <div className="snap-center"><PhysicalImage src={medicine.imgBox} label={t('boxImage')} /></div>
                            <div className="snap-center"><PhysicalImage src={medicine.imgIndex1} label={language === 'ar' ? 'صورة الفهرس 1' : 'Index Image 1'} /></div>
                            <div className="snap-center"><PhysicalImage src={medicine.imgIndex2} label={language === 'ar' ? 'صورة الفهرس 2' : 'Index Image 2'} /></div>
                            <div className="snap-center"><PhysicalImage src={medicine.imgPill} label={t('pillImage')} /></div>
                        </div>
                    )}

                    {(hasImages || hasPhysicalProps) ? (
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
                                    <div className="text-sm text-slate-600 dark:text-slate-300 ai-response-content leading-relaxed"><MarkdownRenderer content={medicine.physicalNotes} /></div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-400 italic text-sm bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">{t('noPhysicalData')}</div>
                    )}
                </div>
            )}
        </div>

        <div className="mt-6 border-t border-slate-100 dark:border-slate-800">
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

      {/* --- عارض الصور فائق الدقة (Ultra High Resolution Viewer) --- */}
      {zoomedImage && (
          <div 
            className="fixed inset-0 z-[9999] bg-black flex flex-col animate-fade-in overflow-hidden touch-none"
          >
              {/* شريط التحكم العلوي المطور */}
              <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/90 to-transparent">
                  <div className="flex flex-col">
                    <span className="text-white font-black text-xs uppercase tracking-tighter">Raw Pixel View</span>
                    <span className="text-[9px] text-primary-light font-bold">Max clarity for small text</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                      {/* خيار 1: التحميل البرمجي */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDownload(zoomedImage); }}
                        className="p-3 bg-white/10 hover:bg-primary/20 active:scale-90 rounded-xl text-white transition-all shadow-xl backdrop-blur-md border border-white/10"
                        title="Download"
                      >
                          <div className="w-5 h-5"><DownloadIcon /></div>
                      </button>

                      {/* خيار 2: فتح المصدر الأصلي (الأكثر ضماناً للجودة) */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenOriginal(zoomedImage); }}
                        className="p-3 bg-white/10 hover:bg-blue-500/20 active:scale-90 rounded-xl text-white transition-all shadow-xl backdrop-blur-md border border-white/10 flex items-center gap-2"
                        title="Open Original"
                      >
                          <div className="w-5 h-5"><GlobeIcon /></div>
                          <span className="text-[9px] font-black uppercase hidden sm:inline">Source</span>
                      </button>

                      {/* إغلاق */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
                        className="p-3 bg-red-500/20 hover:bg-red-500/40 active:scale-90 rounded-xl text-white transition-all shadow-xl backdrop-blur-md border border-red-500/20"
                      >
                          <ClearIcon />
                      </button>
                  </div>
              </div>
              
              {/* منطقة عرض الصورة - محسن للنصوص الصغيرة */}
              <div 
                className="w-full h-full flex items-center justify-center overflow-auto p-4 sm:p-10 scrollbar-hide touch-auto" 
                onClick={() => setZoomedImage(null)}
              >
                  <img 
                    src={zoomedImage} 
                    className="max-w-none md:max-w-full h-auto object-contain cursor-zoom-out" 
                    style={{ 
                        // تحسين حاد جداً لرسم البيكسلات لضمان قراءة النصوص الصغيرة
                        imageRendering: '-webkit-optimize-contrast',
                        WebkitBackfaceVisibility: 'hidden',
                        minWidth: '100%',
                    }}
                    alt="Original Quality Document" 
                    onClick={(e) => e.stopPropagation()}
                  />
              </div>

              {/* تلميح ذكي */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none bg-black/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                <p className="text-white/80 text-[9px] font-bold uppercase tracking-widest text-center">
                    {language === 'ar' 
                      ? 'استخدم زر الكرة الأرضية لفتح النسخة الأصلية الخام من بوست إيمدج' 
                      : 'Use the Globe icon to open the Raw Raw source from PostImage'}
                </p>
              </div>
          </div>
      )}
    </div>
  );
};

export default MedicineDetail;
