
import React, { useState, useEffect, memo, useMemo } from 'react';
import { Medicine, TFunction, Language, User, InsuranceDrug } from '../types';
import StarIcon from './icons/StarIcon';
import EditIcon from './icons/EditIcon';
import AssistantIcon from './icons/AssistantIcon';
import PillBottleIcon from './icons/PillBottleIcon';
import AlternativeIcon from './icons/AlternativeIcon';
import FactoryIcon from './icons/FactoryIcon';
import GlobeIcon from './icons/GlobeIcon';
import ShieldIcon from './icons/ShieldIcon';
import CameraIcon from './icons/CameraIcon';
import PillIcon from './icons/PillIcon';
import { getIngredientsList } from './MedicineCard';
import { getClinicalData, ClinicalData } from '../utils/dailyMedicines';
import ClinicalDataPage from './ClinicalDataPage';

const InfoCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string }> = ({ title, icon, children, accent = 'teal' }) => (
    <div className="bg-white dark:bg-dark-card rounded-[1.75rem] overflow-hidden shadow-sm border border-slate-100/80 dark:border-dark-border mb-3 animate-fade-in">
        <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-dark-card border-b border-slate-100 dark:border-dark-border`}>
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center p-1.5 flex-shrink-0">{icon}</div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-dark-muted">{title}</h3>
        </div>
        <div className="px-4 py-3 space-y-2">{children}</div>
    </div>
);

const DetailRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
  if (!value || String(value).trim() === '' || String(value).toLowerCase() === 'na') return null;
  return (
    <div className="flex justify-between items-center gap-3 py-1 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
      <dt className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">{label}</dt>
      <dd className="text-[12px] font-bold text-slate-700 dark:text-slate-200 text-right leading-tight">{value}</dd>
    </div>
  );
};

interface MedicineDetailProps {
    medicine: Medicine;
    insuranceData: InsuranceDrug[];
    allMedicines?: Medicine[];
    t: TFunction;
    language: Language;
    isFavorite: boolean;
    onToggleFavorite: (medicineId: string) => void;
    user?: User | null;
    onEdit?: (medicine: Medicine) => void;
    onDelete?: (medicine: Medicine) => void;
    onOpenAssistant?: () => void;
    onOpenInteractions?: () => void;
    onOpenDoseCalc?: () => void;
    onImageZoom: (allImages: string[], initialIndex: number, title: string, indexFlags: boolean[]) => void;
    onFindAlternative: (medicine: Medicine) => void;
    onShare?: (medicine: Medicine) => void;
    onAskGemini?: (medicine: Medicine) => void;
    onToggleCompare?: (medicine: Medicine) => void;
    isInCompare?: boolean;
}

const MedicineDetail: React.FC<MedicineDetailProps> = ({ medicine, allMedicines, t, language, isFavorite, onToggleFavorite, user, onEdit, onOpenAssistant, onOpenInteractions, onOpenDoseCalc, onImageZoom, onFindAlternative, onShare, onToggleCompare, isInCompare, onAskGemini }) => {
  const [clinicalData, setClinicalData] = useState<ClinicalData | null>(null);
  const [showClinicalPage, setShowClinicalPage] = useState(false);

  // Scroll lock handled inside ClinicalDataPage

  // Lazy load clinical data - بس لما الـ RegisterNumber يتغير فعلاً
  const prevRegNumRef = React.useRef<string | undefined>(undefined);
  useEffect(() => {
    if (medicine?.RegisterNumber && medicine.RegisterNumber !== prevRegNumRef.current) {
      prevRegNumRef.current = medicine.RegisterNumber;
      getClinicalData(medicine.RegisterNumber).then(setClinicalData);
    }
  }, [medicine?.RegisterNumber]);


  const hasImportantPhysical = !!(medicine.liquidTaste || medicine.liquidColor);
  const [isPhysicalOpen, setIsPhysicalOpen] = useState(hasImportantPhysical);
  const price = parseFloat(medicine['Public price']);
  const ingredients = useMemo(() => getIngredientsList(medicine), [medicine]);
  const isControlled = medicine['Product Control']?.toLowerCase() === 'controlled';
  const isRestricted = medicine['Product Control']?.toLowerCase() === 'restricted';

  const productImages = useMemo(() => {
    const list: string[] = [];
    if (medicine.imgBox) list.push(medicine.imgBox);
    if (medicine.imgPill) list.push(medicine.imgPill);
    if (medicine.imgIndex1) list.push(medicine.imgIndex1);
    if (medicine.imgIndex2) list.push(medicine.imgIndex2);
    return list;
  }, [medicine]);

  // indexFlags: true = صورة index فيها نص → نضيف لينك للموقع الأصلي
  const imageIndexFlags = useMemo(() => {
    const flags: boolean[] = [];
    if (medicine.imgBox) flags.push(false);
    if (medicine.imgPill) flags.push(false);
    if (medicine.imgIndex1) flags.push(true);  // index = يحتاج لينك
    if (medicine.imgIndex2) flags.push(true);  // index = يحتاج لينك
    return flags;
  }, [medicine]);

  const [imgSearching, setImgSearching] = React.useState(false);
  const handleGoogleImageSearch = () => {
    setImgSearching(true);
    setTimeout(() => setImgSearching(false), 1500);
    const q = encodeURIComponent(medicine['Trade Name']);
    const url = `https://www.google.com/search?tbm=isch&q=${q}`;
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <div className="bg-gradient-to-br from-teal-50 via-white to-cyan-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/50 border border-teal-100/50 dark:border-dark-border rounded-[2rem] p-4 shadow-lg relative">
          <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                {/* Legal Status - ملون حسب النوع */}
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                  medicine['Legal Status'] === 'Prescription'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>
                  {medicine['Legal Status'] === 'Prescription' ? 'Rx' : 'OTC'}
                </span>
                {/* Drug Type */}
                {medicine.DrugType && (
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                    medicine.DrugType.toLowerCase().includes('generic')
                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                  }`}>
                    {medicine.DrugType.toLowerCase().includes('generic') ? 'Generic' : 'Brand'}
                  </span>
                )}
                {isControlled && <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">Controlled</span>}
                {isRestricted && <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">Restricted</span>}
              </div>
              <div className="flex gap-2">
                  <button onClick={handleGoogleImageSearch} disabled={imgSearching} className={`p-2.5 rounded-2xl shadow-sm border active:scale-90 transition-all ${imgSearching ? "bg-primary/10 text-primary border-primary/20" : "bg-white dark:bg-dark-card text-slate-400 dark:text-dark-muted border-slate-100 dark:border-dark-border"}`}>
                      <div className="w-5 h-5"><CameraIcon /></div>
                  </button>
                  {onShare && (
                    <button onClick={() => onShare(medicine)} className="p-2.5 bg-white dark:bg-dark-card text-slate-400 hover:text-green-500 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border active:scale-90 transition-all" title="مشاركة">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                  )}
                  {onToggleCompare && (
                    <button onClick={() => onToggleCompare(medicine)} className={`p-2.5 rounded-2xl shadow-sm border active:scale-90 transition-all ${isInCompare ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-dark-card text-slate-400 border-slate-100 dark:border-dark-border'}`} title="مقارنة">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </button>
                  )}
                  <button onClick={() => onToggleFavorite(medicine.RegisterNumber)} className={`p-2.5 rounded-2xl active:scale-90 transition-all ${isFavorite ? 'bg-amber-500 text-white shadow-lg' : 'bg-white dark:bg-dark-card text-slate-400 dark:text-dark-muted border border-slate-100 dark:border-dark-border'}`}>
                    <div className="w-5 h-5"><StarIcon isFilled={isFavorite} /></div>
                  </button>
              </div>
          </div>
          <div className="flex gap-4 items-center">
              {medicine.imgBox && (
                  <button onClick={() => onImageZoom(productImages, 0, medicine['Trade Name'], imageIndexFlags)} className="flex-shrink-0 w-24 h-24 bg-white rounded-2xl p-1.5 shadow-xl border border-slate-100 active:scale-95 transition-all overflow-hidden">
                      <img src={medicine.imgBox} alt="" className="w-full h-full object-contain" />
                  </button>
              )}
              <div className="flex-grow min-w-0">
                  <h1 className="text-xl font-black text-teal-800 dark:text-teal-400 leading-tight">{medicine['Trade Name']}</h1>
                  {/* ── المادة الفعالة + التركيز — لو أكتر من 3 نكتفي بـ badge ── */}
                  {medicine['Scientific Name'] && medicine['Scientific Name'].toUpperCase() !== 'N/A' && (() => {
                    const sciNames = String(medicine['Scientific Name']).split(',').map(s => s.trim()).filter(Boolean);
                    // لو أكتر من 3 مواد → badge بس، التفاصيل تحت في الـ InfoCard
                    if (sciNames.length > 3) {
                      return (
                        <span className="inline-block mt-1.5 text-[9px] font-black px-2.5 py-1 rounded-full bg-teal-200/60 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400">
                          {sciNames.length} {language === 'ar' ? 'مواد فعالة' : 'ingredients'}
                        </span>
                      );
                    }
                    const strengths = String(medicine.Strength || '').split(',').map(s => s.trim());
                    const strengthUnit = String(medicine.StrengthUnit || '').trim();
                    const KNOWN_UNITS = /\b(mg|ml|g|mcg|ug|iu|unit|units|mmol|%|μg|µg|mcg\/ml|mg\/ml|mg\/g|g\/ml|mg\/dose|iu\/ml)\b/i;
                    const parts = sciNames.map((name, i) => {
                      const s = (strengths[i] || strengths[0] || '').trim();
                      if (!s) return name;
                      const hasUnit = KNOWN_UNITS.test(s);
                      const display = (!hasUnit && strengthUnit) ? `${s} ${strengthUnit}` : s;
                      return `${name} ${display}`;
                    });
                    return (
                      <p className="text-sm font-semibold text-teal-600/70 dark:text-teal-400/60 mt-1 leading-snug" dir="ltr">
                        {parts.join(' · ')}
                      </p>
                    );
                  })()}
                  {price > 0 && <div className="mt-3 flex items-baseline gap-1"><span className="text-3xl font-black text-teal-600 dark:text-teal-300">{price.toFixed(2)}</span><span className="text-lg font-black text-teal-500">{language === 'ar' ? 'ر.س' : 'SAR'}</span></div>}
              </div>
          </div>
      </div>

      {productImages.length > 1 && (
          <div className="px-1 overflow-x-auto no-scrollbar flex gap-3 animate-fade-in">
              {productImages.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => onImageZoom(productImages, idx, medicine['Trade Name'], imageIndexFlags)}
                    className="flex-shrink-0 w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 p-1 shadow-sm overflow-hidden active:scale-90 transition-transform"
                  >
                      <img src={img} className="w-full h-full object-contain" alt={`View ${idx}`} />
                  </button>
              ))}
          </div>
      )}

      <div className="grid grid-cols-3 gap-2 px-0.5">
          {/* Alternatives */}
          <button onClick={() => onFindAlternative(medicine)} className="flex items-center justify-center gap-1.5 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border border-primary/15 p-3 rounded-2xl active:scale-95 transition-all">
              <div className="w-4 h-4 text-primary flex-shrink-0"><AlternativeIcon /></div>
              <span className="font-black text-[9px] uppercase text-primary">{t('directAlternatives')}</span>
          </button>
          {/* Ask Gemini */}
          <button onClick={() => onAskGemini?.(medicine)} className="flex items-center justify-center gap-1.5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 border border-blue-200/50 dark:border-blue-800/30 p-3 rounded-2xl active:scale-95 transition-all">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span className="font-black text-[9px] uppercase text-blue-500">Ask Gemini</span>
          </button>
          {/* Report Error */}
          <button
            onClick={() => {
              const msg = encodeURIComponent(
                `[PharmaSource Report]\n` +
                `Medicine: ${medicine['Trade Name']}\n` +
                `Active Ingredient: ${medicine['Scientific Name']}\n` +
                `Price: ${medicine['Public price'] || 'N/A'} SAR\n` +
                `Reg#: ${medicine.RegisterNumber}\n\n` +
                `Reported by: ${user?.username || 'Unknown'}\n` +
                `Email: ${user?.email || 'N/A'}\n\n` +
                `Issue:\n`
              );
              window.open(`https://wa.me/550806894?text=${msg}`, '_blank', 'noopener,noreferrer');
            }}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10 border border-emerald-200/50 dark:border-emerald-800/30 p-3 rounded-2xl active:scale-95 transition-all"
          >
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span className="font-black text-[9px] uppercase text-emerald-500">Report</span>
          </button>
      </div>

      {/* ── Clinical Data Section ── */}
      {clinicalData && (
        <div
          onClick={() => setShowClinicalPage(true)}
          className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/25 dark:to-cyan-900/15 rounded-[1.5rem] border border-teal-100 dark:border-teal-800/40 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">📋</span>
              </div>
              <span className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-wide">
                {language === 'ar' ? 'معلومات سريرية' : 'Clinical Info'}
              </span>
            </div>
            <span className="text-[9px] font-black text-teal-500 bg-teal-100 dark:bg-teal-900/40 px-2 py-1 rounded-full">
              {language === 'ar' ? 'عرض كامل ←' : 'Full View →'}
            </span>
          </div>

          {/* Indication preview */}
          <div className="px-4 pb-3">
            <p className="text-[11px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1">
              🩺 {language === 'ar' ? 'يستخدم لـ' : 'Indication'}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
              {clinicalData.indication}
            </p>
          </div>

          {/* Key Points لو موجودة */}
          {clinicalData.keyPoints && (
            <div className="px-4 pb-4 border-t border-teal-100 dark:border-teal-800/40 pt-3">
              <p className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5">
                ⭐ {language === 'ar' ? 'نقاط البيع المميزة' : 'Key Selling Points'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                {clinicalData.keyPoints}
              </p>
            </div>
          )}
        </div>
      )}


      <InfoCard title={`${t('quickActionIngredient')}${medicine.StrengthUnit ? ` (${medicine.StrengthUnit})` : ''}`} icon={<PillBottleIcon />}>
          <div className="grid grid-cols-1 gap-1.5">
              {ingredients.map((ing, idx) => {
                  const unit = medicine.StrengthUnit || '';
                  // لو الوحدة مكتوبة جوه الـ strength، ما نضيفهاش تاني
                  const strengthHasUnit = unit && ing.strength.toLowerCase().includes(unit.toLowerCase());
                  const displayStrength = strengthHasUnit ? ing.strength : `${ing.strength}${unit ? ' ' + unit : ''}`.trim();
                  return (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border dark:border-slate-800">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">{ing.name}</span>
                        <span className="bg-primary/5 text-primary text-[10px] font-black px-2 py-0.5 rounded-lg">{displayStrength}</span>
                    </div>
                  );
              })}
          </div>
      </InfoCard>

      {/* معلومات العبوة والتوزيع */}
      {(medicine.PackageSize || medicine.PackageTypes || medicine['Distribute area']) && (
        <InfoCard title={t('packagingInfo')} icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        }>
          <DetailRow label={t('packageSize')} value={
            medicine.PackageSize && medicine.SizeUnit 
              ? `${medicine.PackageSize} ${medicine.SizeUnit}` 
              : medicine.PackageSize
          } />
          <DetailRow label={t('packageType')} value={medicine.PackageTypes} />
          {medicine['Distribute area'] && (
            <div className="flex justify-between items-center py-1.5">
              <dt className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t('distributeArea')}</dt>
              <dd>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                  medicine['Distribute area']?.toLowerCase().includes('hospital') || medicine['Distribute area']?.toLowerCase().includes('مستشفى')
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                }`}>
                  {medicine['Distribute area']?.toLowerCase().includes('hospital') || medicine['Distribute area']?.toLowerCase().includes('مستشفى')
                    ? (language === 'ar' ? '🏥 مستشفى' : '🏥 Hospital')
                    : medicine['Distribute area']?.toLowerCase().includes('pharmacy') || medicine['Distribute area']?.toLowerCase().includes('صيدلية')
                    ? (language === 'ar' ? '💊 صيدلية' : '💊 Pharmacy')
                    : medicine['Distribute area']
                  }
                </span>
              </dd>
            </div>
          )}
        </InfoCard>
      )}

      <div className="bg-white dark:bg-dark-card rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">
          <button onClick={() => setIsPhysicalOpen(!isPhysicalOpen)} className="w-full flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center p-1.5 flex-shrink-0"><PillIcon /></div>
                  <h3 className="text-[11px] font-black uppercase text-slate-500 dark:text-dark-muted tracking-wide">{t('physicalDetails')}</h3>
                  {/* Preview badges - تظهر لما الـ accordion مقفول وفي معلومات مهمة */}
                  {!isPhysicalOpen && hasImportantPhysical && (
                    <div className="flex gap-1.5 flex-wrap">
                      {medicine.liquidTaste && (
                        <span className="text-[9px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                          👅 {medicine.liquidTaste}
                        </span>
                      )}
                      {medicine.liquidColor && (
                        <span className="text-[9px] font-black bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                          🎨 {medicine.liquidColor}
                        </span>
                      )}
                    </div>
                  )}
              </div>
              <svg className={`w-4 h-4 text-slate-300 transition-transform flex-shrink-0 ${isPhysicalOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div className={`${isPhysicalOpen ? 'max-h-[500px] opacity-100 px-4 pb-4' : 'max-h-0 opacity-0 overflow-hidden'} transition-all duration-300`}>
                <div className="space-y-3 border-t border-slate-100 dark:border-dark-border pt-3 mt-2">
                    <DetailRow label={t('pharmaceuticalForm')} value={medicine.PharmaceuticalForm} />
                    <DetailRow label={t('pillShape')} value={medicine.pillShape} />
                    <DetailRow label={t('scored')} value={medicine.pillScored} />
                    <DetailRow label={t('markings')} value={medicine.pillMarkings} />
                    {medicine.liquidTaste && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                        <span className="text-[11px] font-black text-slate-400 uppercase">
                          {language === 'ar' ? '👅 الطعم' : '👅 Taste'}
                        </span>
                        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                          {medicine.liquidTaste}
                        </span>
                      </div>
                    )}
                    {medicine.liquidColor && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                        <span className="text-[11px] font-black text-slate-400 uppercase">
                          {language === 'ar' ? '🎨 اللون' : '🎨 Color'}
                        </span>
                        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                          {medicine.liquidColor}
                        </span>
                      </div>
                    )}
                    <DetailRow label={t('notes')} value={medicine.physicalNotes} />
                </div>
          </div>
      </div>


      <InfoCard title={t('regulatory')} icon={<ShieldIcon />}>
          <DetailRow label={t('regNumLabel')} value={medicine.RegisterNumber} />
          <DetailRow label={t('productControlLabel')} value={medicine['Product Control']} />
          <DetailRow label={t('atcCodeLabel')} value={medicine.AtcCode1} />
      </InfoCard>

      <InfoCard title={t('manufacturing')} icon={<FactoryIcon />}>
          <DetailRow label={t('manufacturer')} value={medicine['Manufacture Name']} />
          <DetailRow label={t('marketingCompanyLabel')} value={medicine['Marketing Company']} />
          <DetailRow label={t('agentLabel')} value={medicine['Main Agent']} />
      </InfoCard>

      <InfoCard title={t('storage')} icon={<GlobeIcon />}>
          <p className="text-sm font-black text-slate-700 dark:text-slate-300 leading-relaxed text-right">{language === 'ar' ? medicine['Storage Condition Arabic'] : medicine['Storage conditions']}</p>
          <DetailRow label={t('shelfLifeLabel')} value={medicine.shelfLife} />
      </InfoCard>

      {user && (user.role === 'admin' || user.role === 'company') && (
          <div className="pt-6">
              <button onClick={() => onEdit?.(medicine)} className="w-full py-4 bg-slate-800 dark:bg-primary text-white rounded-[2rem] font-black flex items-center justify-center gap-2 active:scale-95 shadow-xl transition-all">
                  <div className="w-5 h-5"><EditIcon /></div>
                  {language === 'ar' ? 'تعديل بيانات الدواء' : 'Edit Medicine Data'}
              </button>
          </div>
      )}




      {/* Clinical Data Full Page */}
      {showClinicalPage && (
        <ClinicalDataPage
          registerNumber={medicine.RegisterNumber}
          tradeName={medicine['Trade Name']}
          scientificName={medicine['Scientific Name']}
          language={language}
          isAdmin={user?.role === 'admin'}
          allMedicines={allMedicines}
          onClose={() => setShowClinicalPage(false)}
        />
      )}
    </div>
  );
};
export default memo(MedicineDetail, (prev, next) => {
  // بس نعمل re-render لو الدواء نفسه اتغير أو state مهمة اتغيرت
  return (
    prev.medicine?.RegisterNumber === next.medicine?.RegisterNumber &&
    prev.isFavorite === next.isFavorite &&
    prev.language === next.language &&
    prev.isInCompare === next.isInCompare
  );
});
