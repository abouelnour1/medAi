
import React, { useState, useEffect, useRef } from 'react';
import { Medicine, TFunction, Language, User } from '../types';
import StarIcon from './icons/StarIcon';
import EditIcon from './icons/EditIcon';
import CameraIcon from './icons/CameraIcon';
import AssistantIcon from './icons/AssistantIcon';
import MarkdownRenderer from './MarkdownRenderer';
import ClearIcon from './icons/ClearIcon';

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

  // --- High-Resolution (Raw Mode) State ---
  const [isRawMode, setIsRawMode] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastTouchRef = useRef<{ x: number, y: number, dist: number } | null>(null);

  useEffect(() => {
    if (zoomedImage) {
      document.body.style.overflow = 'hidden';
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsRawMode(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [zoomedImage]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      lastTouchRef.current = { x: 0, y: 0, dist };
    } else if (e.touches.length === 1) {
      lastTouchRef.current = { x: e.touches[0].pageX, y: e.touches[0].pageY, dist: 0 };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!lastTouchRef.current) return;

    if (e.touches.length === 2 && lastTouchRef.current.dist > 0) {
      const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      const zoomFactor = dist / lastTouchRef.current.dist;
      const newScale = Math.min(Math.max(scale * zoomFactor, 0.4), 10);
      setScale(newScale);
      lastTouchRef.current.dist = dist;
    } else if (e.touches.length === 1) {
      const deltaX = e.touches[0].pageX - lastTouchRef.current.x;
      const deltaY = e.touches[0].pageY - lastTouchRef.current.y;
      setPosition(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      lastTouchRef.current.x = e.touches[0].pageX;
      lastTouchRef.current.y = e.touches[0].pageY;
    }
  };

  const productControl = medicine['Product Control'] || '';
  const isControlled = productControl.toLowerCase().includes('controlled') && !productControl.toLowerCase().includes('uncontrolled');
  const isRestricted = productControl.toLowerCase().includes('restricted');

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
                className="w-56 h-56 sm:w-64 sm:h-64 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800 p-2 shadow-sm overflow-hidden flex items-center justify-center transition-all cursor-zoom-in hover:border-primary/50"
            >
                <img src={src} alt={label} className="max-w-full max-h-full object-contain pointer-events-none" />
            </div>
            <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-primary font-bold">{language === 'ar' ? 'افتح بالجودة الكاملة' : 'Open Full Quality'}</span>
            </div>
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
                    {/* Image Carousel */}
                    {hasImages && (
                        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-2 snap-x">
                            <div className="snap-center"><PhysicalImage src={medicine.imgBox} label={t('boxImage')} /></div>
                            <div className="snap-center"><PhysicalImage src={medicine.imgIndex1} label={language === 'ar' ? 'صورة الفهرس 1' : 'Index Image 1'} /></div>
                            <div className="snap-center"><PhysicalImage src={medicine.imgIndex2} label={language === 'ar' ? 'صورة الفهرس 2' : 'Index Image 2'} /></div>
                            <div className="snap-center"><PhysicalImage src={medicine.imgPill} label={t('pillImage')} /></div>
                        </div>
                    )}

                    {/* Physical Properties */}
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
            {(medicine['Legal Status'] || isControlled || isRestricted) && (
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-light-text-secondary">{t('legalStatus')}</dt>
                <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">{ (isControlled || isRestricted) ? (<span className={`inline-block font-bold rounded-full px-3 py-1 text-sm text-white whitespace-nowrap shadow-sm ${isControlled ? 'bg-red-600' : 'bg-orange-500'}`}>{isControlled ? 'CONTROLLED' : 'RESTRICTED'}</span>) : (<LegalStatusBadge status={medicine['Legal Status']} size="base" t={t} />)}</dd>
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

      {/* --- Immersive RAW Quality Image Viewer --- */}
      {zoomedImage && (
          <div 
            className="fixed inset-0 z-[9999] bg-black flex flex-col animate-fade-in touch-none select-none overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
              {/* Header Controls */}
              <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/90 to-transparent">
                  <div className="flex gap-2">
                    <button 
                        onClick={() => setIsRawMode(!isRawMode)}
                        className={`text-white/90 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/20 backdrop-blur-md transition-all ${isRawMode ? 'bg-primary border-primary shadow-[0_0_15px_rgba(45,212,191,0.5)]' : 'bg-white/10'}`}
                    >
                        {isRawMode ? (language === 'ar' ? 'الدقة الخام نشطة' : 'RAW PIXELS ACTIVE') : (language === 'ar' ? 'تفعيل الجودة الكاملة' : 'FORCE FULL QUALITY')}
                    </button>
                    {isRawMode && (
                        <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-full border border-white/20 text-white/70 text-[9px] font-bold flex items-center">
                            {Math.round(scale * 100)}%
                        </div>
                    )}
                  </div>
                  <button 
                    onClick={() => { setZoomedImage(null); setIsRawMode(false); }}
                    className="p-3 bg-white/10 hover:bg-white/20 active:scale-90 rounded-full text-white transition-all shadow-xl backdrop-blur-md border border-white/20"
                  >
                      <ClearIcon />
                  </button>
              </div>
              
              {/* Image Rendering Logic - RAW MODE BYPASSES BROWSER DOWNSCALING */}
              <div 
                className={`w-full h-full flex items-center justify-center ${isRawMode ? 'overflow-auto no-scrollbar touch-auto' : 'pointer-events-none'}`}
                onClick={(e) => { if (!isRawMode) setZoomedImage(null); }}
              >
                  <img 
                    src={zoomedImage} 
                    className={`transition-transform duration-75 ease-out will-change-transform ${isRawMode ? 'cursor-grab active:cursor-grabbing' : ''}`} 
                    style={{ 
                        // The secret for RAW quality: Remove all max constraints and use natural scale
                        maxWidth: isRawMode ? 'none' : '100%',
                        maxHeight: isRawMode ? 'none' : '100%',
                        transform: isRawMode ? `translate(${position.x}px, ${position.y}px) scale(${scale})` : `scale(${scale})`,
                        
                        // Force browser to respect every single pixel (Perfect for text in Indexes)
                        imageRendering: isRawMode ? 'high-quality' : 'auto',
                        WebkitBackfaceVisibility: 'hidden',
                        WebkitTransformStyle: 'preserve-3d'
                    }}
                    alt="High Resolution Content" 
                    onLoad={(e) => {
                        setScale(1);
                        setPosition({ x: 0, y: 0 });
                    }}
                  />
              </div>

              {/* Enhanced Instructions Footer */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full px-10 pointer-events-none text-center">
                <div className="bg-black/40 backdrop-blur-sm border border-white/10 py-2 px-4 rounded-full inline-block">
                    <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em]">
                        {isRawMode 
                            ? (language === 'ar' ? 'حرك بإصبع واحد • كبّر بإصبعين' : '1 FINGER DRAG • 2 FINGER PINCH') 
                            : (language === 'ar' ? 'اضغط على الزر بالأعلى لرؤية أدق التفاصيل' : 'CLICK BUTTON ABOVE FOR MAXIMUM DETAIL')}
                    </p>
                </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default MedicineDetail;
