
import React, { useState, useEffect, memo, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { logMedicineView } from '../utils/analytics';
import { abbreviateForm } from '../utils/formAbbrev';
import { PEDIATRIC_DRUG_NAMES } from './PediatricDoseCalculator';
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

const InfoCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string }> = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-sm border border-slate-100/80 dark:border-dark-border animate-fade-in">
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-slate-50 dark:border-slate-800/60">
            <div className="w-6 h-6 text-primary/70 flex-shrink-0">{icon}</div>
            <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-dark-muted">{title}</h3>
        </div>
        <div className="px-4 py-2.5 space-y-1">{children}</div>
    </div>
);

const DetailRow: React.FC<{ label: string; value?: string | number | null; highlight?: boolean }> = ({ label, value, highlight }) => {
  if (!value || String(value).trim() === '' || String(value).toLowerCase() === 'na') return null;
  return (
    <div className="flex justify-between items-center gap-3 py-1.5 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
      <dt className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">{label}</dt>
      <dd className={`text-[11px] font-bold text-right leading-tight ${highlight ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>{value}</dd>
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
    onOpenClinical?: () => void;
    onToggleCompare?: (medicine: Medicine) => void;
    isInCompare?: boolean;
}

const MedicineDetail: React.FC<MedicineDetailProps> = ({ medicine, allMedicines, t, language, isFavorite, onToggleFavorite, user, onEdit, onOpenAssistant, onOpenInteractions, onOpenDoseCalc, onImageZoom, onFindAlternative, onShare, onToggleCompare, isInCompare, onAskGemini, onOpenClinical }) => {
  React.useEffect(() => {
    logMedicineView(medicine['Trade Name'], medicine.RegisterNumber, medicine['Product type']);
  }, [medicine.RegisterNumber]);

  const [clinicalData, setClinicalData] = useState<ClinicalData | null>(null);
  const [showClinicalPage, setShowClinicalPage] = useState(false);

  // ── Order List helpers ────────────────────────────────────────────────
  const [inOrder, setInOrder] = useState(() => {
    try {
      const r = localStorage.getItem('pharma_order_list');
      if (!r) return false;
      return JSON.parse(r).some((i: any) => i.medicine?.RegisterNumber === medicine.RegisterNumber);
    } catch { return false; }
  });

  const toggleOrder = () => {
    try {
      const raw = localStorage.getItem('pharma_order_list');
      let items: any[] = raw ? JSON.parse(raw) : [];
      if (inOrder) {
        items = items.filter((i: any) => i.medicine?.RegisterNumber !== medicine.RegisterNumber);
        setInOrder(false);
      } else {
        items.push({ medicine, quantity: 1 });
        setInOrder(true);
      }
      localStorage.setItem('pharma_order_list', JSON.stringify(items));
    } catch {}
  };

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
  const hasPhysicalContent = !!(medicine.pillShape || medicine.pillScored || medicine.pillMarkings || medicine.physicalNotes);
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
    <div className="space-y-3 pb-24 animate-fade-in bg-light-bg dark:bg-dark-bg">
      {/* ── Hero Card ── */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">
        
        {/* Action Bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-50 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide ${
              medicine['Legal Status'] === 'Prescription'
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
            }`}>
              {medicine['Legal Status'] === 'Prescription' ? 'Rx' : 'OTC'}
            </span>
            {medicine.DrugType && (
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide ${
                medicine.DrugType.toLowerCase().includes('generic')
                  ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  : 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400'
              }`}>
                {medicine.DrugType.toLowerCase().includes('generic') ? 'Generic' : 'Brand'}
              </span>
            )}
            {isControlled && <span className="bg-purple-50 text-purple-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide">Controlled</span>}
            {isRestricted && <span className="bg-orange-50 text-orange-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide">Restricted</span>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleGoogleImageSearch} disabled={imgSearching} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 ${imgSearching ? 'bg-primary/10 text-primary' : 'text-slate-400'}`}>
              <div className="w-4 h-4"><CameraIcon /></div>
            </button>
            {onShare && (
              <button onClick={() => onShare(medicine)} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-500 active:scale-90 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
              </button>
            )}
            {onToggleCompare && (
              <button onClick={() => onToggleCompare(medicine)} className={`w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-all ${isInCompare ? 'bg-primary text-white' : 'text-slate-400'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              </button>
            )}
            <button onClick={() => onToggleFavorite(medicine.RegisterNumber)} className={`w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-all ${isFavorite ? 'text-amber-500' : 'text-slate-300'}`}>
              <div className="w-4 h-4"><StarIcon isFilled={isFavorite} /></div>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 pt-3 pb-4">
          <div className="flex gap-3 items-start">
            {medicine.imgBox ? (
              <button onClick={() => onImageZoom(productImages, 0, medicine['Trade Name'], imageIndexFlags)}
                className="flex-shrink-0 w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden active:scale-95 transition-all border border-slate-100 dark:border-slate-700">
                <img src={medicine.imgBox} alt="" className="w-full h-full object-contain p-1" />
              </button>
            ) : (
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/20 rounded-xl flex items-center justify-center border border-teal-100 dark:border-teal-800/30">
                <span className="text-[11px] font-black text-teal-600 dark:text-teal-400 text-center leading-tight px-1">
                  {medicine['Trade Name'].substring(0, 4).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-grow min-w-0">
              <h1 className="text-base font-black text-slate-800 dark:text-white leading-tight">{medicine['Trade Name']}</h1>
              {medicine['Scientific Name'] && medicine['Scientific Name'].toUpperCase() !== 'N/A' && (() => {
                const sciNames = String(medicine['Scientific Name']).split(',').map((s: string) => s.trim()).filter(Boolean);
                if (sciNames.length > 3) {
                  return <span className="inline-block mt-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-teal-100/60 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400">{sciNames.length} ingredients</span>;
                }
                const strengths = String(medicine.Strength || '').split(',').map((s: string) => s.trim());
                const strengthUnit = String(medicine.StrengthUnit || '').trim();
                const KNOWN_UNITS = /(mg|ml|g|mcg|ug|iu|unit|units|mmol|%|mcg\/ml|mg\/ml|mg\/g|g\/ml|mg\/dose|iu\/ml)/i;
                const parts = sciNames.map((name: string, i: number) => {
                  const s = (strengths[i] || strengths[0] || '').trim();
                  if (!s) return name;
                  const hasUnit = KNOWN_UNITS.test(s);
                  const display = (!hasUnit && strengthUnit) ? `${s} ${strengthUnit}` : s;
                  return `${name} ${display}`;
                });
                return <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug" dir="ltr">{parts.join(' · ')}</p>;
              })()}
              {price > 0 && (
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-teal-600 dark:text-teal-400">{price.toFixed(2)}</span>
                  <span className="text-sm font-black text-teal-500/70">{language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
              )}
            </div>
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
          {/* Pediatric Dose Calculator - بيظهر بس للأدوية الموجودة في القائمة */}
          {(() => {
            const sciName = String(medicine['Scientific Name'] || '').toLowerCase().trim();
            const tradeName = String(medicine['Trade Name'] || '').toLowerCase().trim();
            // بس للأشكال السائلة (شراب/قطرات) — مش أقراص أو كبسولات
            const form = String(medicine['PharmaceuticalForm'] || '').toLowerCase();
            const isLiquid = /syrup|suspension|drops|solution|elixir|oral liquid|شراب|قطر|محلول|معلق/.test(form);
            if (!isLiquid) return null;
            // نجرب كل كلمة في الاسم العلمي والتجاري
            const tokens = [...sciName.split(/[\s/,()-]+/), ...tradeName.split(/[\s/,()-]+/)].filter(t => t.length > 2);
            const hasPediatric = PEDIATRIC_DRUG_NAMES.has(sciName) || PEDIATRIC_DRUG_NAMES.has(tradeName) ||
              tokens.some(tok => PEDIATRIC_DRUG_NAMES.has(tok)) ||
              Array.from(PEDIATRIC_DRUG_NAMES).some(n => sciName.includes(n) || tradeName.includes(n));
            if (!hasPediatric) return null;
            return (
              <button onClick={() => onOpenDoseCalc?.()} className="flex items-center justify-center gap-1.5 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200/60 dark:border-teal-800/40 p-3 rounded-2xl active:scale-95 transition-all">
                <span className="text-base">👶</span>
                <span className="font-black text-[9px] uppercase text-teal-600 dark:text-teal-400">{language === 'ar' ? 'جرعة الأطفال' : 'Pediatric'}</span>
              </button>
            );
          })()}
      </div>

      {/* ── Clinical Data Card ── */}
      {clinicalData && (
        <div
          onClick={() => { if (onOpenClinical) onOpenClinical(); else setShowClinicalPage(true); }}
          className="relative overflow-hidden rounded-[1.75rem] cursor-pointer active:scale-[0.98] transition-all duration-200 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
            isolation: 'isolate',  // منع bleed من الخلفية
          }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }} />

          {/* Top row — title + arrow */}
          <div className="relative flex items-center justify-between px-5 pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="text-lg">🩺</span>
              </div>
              <div>
                <p className="text-white font-black text-sm tracking-tight">
                  {language === 'ar' ? 'المعلومات السريرية' : 'Clinical Information'}
                </p>
                <p className="text-teal-100 text-[10px] font-bold opacity-80">
                  {language === 'ar' ? 'اضغط لعرض التفاصيل الكاملة' : 'Tap for full details'}
                </p>
              </div>
            </div>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-white/20" />

          {/* Sections preview */}
          <div className="relative px-5 py-4 grid grid-cols-2 gap-3">

            {/* Indication */}
            <div className="bg-white/20 rounded-2xl p-3 backdrop-blur-none">
              <p className="text-teal-100 text-[9px] font-black uppercase tracking-widest mb-1">
                {language === 'ar' ? 'الاستخدام' : 'Indication'}
              </p>
              <p className="text-white text-[11px] font-bold leading-relaxed line-clamp-3">
                {clinicalData.indication}
              </p>
            </div>

            {/* Pharmacist Note OR Key Points */}
            <div className="bg-white/20 rounded-2xl p-3 backdrop-blur-none">
              {clinicalData.pharmacistNote ? (
                <>
                  <p className="text-amber-200 text-[9px] font-black uppercase tracking-widest mb-1">
                    {language === 'ar' ? 'ملاحظة الصيدلاني' : 'Pharmacist Note'}
                  </p>
                  <p className="text-white text-[11px] font-bold leading-relaxed line-clamp-3">
                    {clinicalData.pharmacistNote}
                  </p>
                </>
              ) : clinicalData.keyPoints ? (
                <>
                  <p className="text-amber-200 text-[9px] font-black uppercase tracking-widest mb-1">
                    {language === 'ar' ? 'نقاط مميزة' : 'Key Points'}
                  </p>
                  <p className="text-white text-[11px] font-bold leading-relaxed line-clamp-3">
                    {clinicalData.keyPoints}
                  </p>
                </>
              ) : clinicalData.dosage ? (
                <>
                  <p className="text-blue-200 text-[9px] font-black uppercase tracking-widest mb-1">
                    {language === 'ar' ? 'الجرعة' : 'Dosage'}
                  </p>
                  <p className="text-white text-[11px] font-bold leading-relaxed line-clamp-3">
                    {clinicalData.dosage}
                  </p>
                </>
              ) : null}
            </div>
          </div>

          {/* Bottom chips */}
          <div className="relative flex items-center gap-2 px-5 pb-4">
            {clinicalData.dosage && (
              <span className="flex items-center gap-1 bg-white/15 text-white text-[9px] font-black px-2.5 py-1 rounded-full">
                💊 {language === 'ar' ? 'جرعة' : 'Dosage'}
              </span>
            )}
            {clinicalData.sideEffects && (
              <span className="flex items-center gap-1 bg-white/15 text-white text-[9px] font-black px-2.5 py-1 rounded-full">
                ⚠️ {language === 'ar' ? 'أعراض' : 'Side Effects'}
              </span>
            )}
            {clinicalData.mechanism && (
              <span className="flex items-center gap-1 bg-white/15 text-white text-[9px] font-black px-2.5 py-1 rounded-full">
                🔬 {language === 'ar' ? 'آلية العمل' : 'Mechanism'}
              </span>
            )}
          </div>
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

      {/* معلومات العبوة - table design */}
      {(medicine.PackageSize || medicine.PackageTypes || medicine['Distribute area'] || medicine.PharmaceuticalForm) && (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100/80 dark:border-dark-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-50 dark:border-slate-800/60">
            <svg className="w-4 h-4 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('packagingInfo')}</h3>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
            {medicine.PharmaceuticalForm && (
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Form</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{abbreviateForm(medicine.PharmaceuticalForm)}</span>
              </div>
            )}
            {medicine.PackageSize && (
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t('packageSize')}</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{medicine.PackageSize}{medicine.SizeUnit ? ' ' + medicine.SizeUnit : ''}</span>
              </div>
            )}
            {medicine.PackageTypes && (
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t('packageType')}</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{medicine.PackageTypes}</span>
              </div>
            )}
            {medicine['Distribute area'] && (
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t('distributeArea')}</span>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                  medicine['Distribute area']?.toLowerCase().includes('hospital')
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                }`}>
                  {medicine['Distribute area']?.toLowerCase().includes('hospital') ? 'Hospital' 
                    : medicine['Distribute area']?.toLowerCase().includes('pharmacy') ? 'Pharmacy' 
                    : medicine['Distribute area']}
                </span>
              </div>
            )}
            {medicine.liquidTaste && (
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Taste</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{medicine.liquidTaste}</span>
              </div>
            )}
            {medicine.liquidColor && (
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Color</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{medicine.liquidColor}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {hasPhysicalContent && <div className="bg-white dark:bg-dark-card rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">
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
                    <DetailRow label={t('pillShape')} value={medicine.pillShape} />
                    <DetailRow label={t('scored')} value={medicine.pillScored} />
                    <DetailRow label={t('markings')} value={medicine.pillMarkings} />

                    <DetailRow label={t('notes')} value={medicine.physicalNotes} />
                </div>
          </div>
      </div>}


      <InfoCard title={t('regulatory')} icon={<ShieldIcon />}>
          <DetailRow label={t('regNumLabel')} value={medicine.RegisterNumber} highlight />
          <DetailRow label={t('productControlLabel')} value={medicine['Product Control']} />
          <DetailRow label={t('atcCodeLabel')} value={medicine.AtcCode1} highlight />
      </InfoCard>

      <InfoCard title={t('manufacturing')} icon={<FactoryIcon />}>
          <DetailRow label={t('manufacturer')} value={medicine['Manufacture Name']} />
          <DetailRow label={t('manufacturerCountry')} value={medicine['Manufacture Country']} />
          <DetailRow label={t('marketingCompanyLabel')} value={medicine['Marketing Company']} />
          <DetailRow label={t('marketingCountry')} value={medicine['Marketing Country']} />
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
      {/* ── Report — آخر الكارت ── */}
      <button
        onClick={() => {
          const msg = encodeURIComponent(
            `[Easy Drug Report]\n` +
            `Medicine: ${medicine['Trade Name']}\n` +
            `Active: ${medicine['Scientific Name']}\n` +
            `Price: ${medicine['Public price'] || 'N/A'} SAR\n` +
            `Reg#: ${medicine.RegisterNumber}\n\n` +
            `Reported by: ${user?.username || 'Unknown'}\n` +
            `Issue:\n`
          );
          if (Capacitor.isNativePlatform()) {
            window.open(`https://wa.me/966550806894?text=${msg}`, '_system');
          } else {
            window.open(`https://wa.me/966550806894?text=${msg}`, '_blank', 'noopener,noreferrer');
          }
        }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 active:scale-[0.99] transition-all text-slate-400 hover:text-emerald-500 hover:border-emerald-200"
      >
        <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        <span className="text-xs font-black">Report Error / Add Missing Medicine</span>
      </button>

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
