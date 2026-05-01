
import ReactDOM from 'react-dom';
import React, { useState, useEffect, memo, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { logMedicineView } from '../utils/analytics';
import { abbreviateForm } from '../utils/formAbbrev';
import { PEDIATRIC_DRUG_NAMES } from './PediatricDoseCalculator';
import { Medicine, TFunction, Language, User, InsuranceDrug } from '../types';
import { getInsurancePolicies } from '../utils/insuranceMatch';
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
import { getClinicalData, ClinicalData, getClinicalReference, ClinicalReference, getPregReference, PregReferenceData } from '../utils/dailyMedicines';
import ClinicalReferencePage from './ClinicalReferencePage';
import ClinicalDataPage from './ClinicalDataPage';

// ── ClinicalAccordion ────────────────────────────────────────────────────────
const CLINICAL_FIELDS = [
  { key: 'indication'     as const, icon: '', labelAr: 'الاستخدامات',        labelEn: 'Indications',      bg: 'bg-teal-50 dark:bg-teal-900/20',   border: 'border-teal-100 dark:border-teal-800',   label: 'text-teal-600 dark:text-teal-400'   },
  { key: 'dosage'         as const, icon: '', labelAr: 'الجرعة',              labelEn: 'Dosage',           bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-100 dark:border-blue-800',   label: 'text-blue-600 dark:text-blue-400'   },
  { key: 'sideEffects'    as const, icon: '', labelAr: 'الآثار الجانبية',    labelEn: 'Side Effects',     bg: 'bg-red-50 dark:bg-red-900/10',     border: 'border-red-100 dark:border-red-900/30',  label: 'text-red-500 dark:text-red-400'     },
  { key: 'pharmacistNote' as const, icon: '', labelAr: 'تنبيه الصيدلاني',  labelEn: 'Pharmacist Note',  bg: 'bg-amber-50 dark:bg-amber-900/15', border: 'border-amber-100 dark:border-amber-800', label: 'text-amber-600 dark:text-amber-400' },
  { key: 'mechanism'      as const, icon: '', labelAr: 'آلية العمل',          labelEn: 'Mechanism',        bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-100 dark:border-violet-800', label: 'text-violet-600 dark:text-violet-400' },
  { key: 'keyPoints'      as const, icon: '', labelAr: 'نقاط مميزة',          labelEn: 'Key Points',       bg: 'bg-amber-50 dark:bg-amber-900/15', border: 'border-amber-200 dark:border-amber-700', label: 'text-amber-500 dark:text-amber-400' },
];
const PREVIEW_LEN = 140;

// ── Safety Badges ────────────────────────────────────────────────────────────
const SAFETY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'Safe':           { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'Generally Safe': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-400' },
  'Monitor':        { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500' },
  'Caution':        { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
  'Avoid':          { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500' },
  'X':              { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-600' },
  'Unknown':        { bg: 'bg-slate-100 dark:bg-slate-800',     text: 'text-slate-500 dark:text-slate-400',   dot: 'bg-slate-400' },
};
function getSafetyStyle(val: string | undefined) {
  if (!val) return { bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-400', dot: 'bg-slate-300' };
  return SAFETY_STYLES[val] || { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' };
}

const AR_SAFETY_LABELS: Record<string, string> = {
  'Safe': 'آمن', 'Generally Safe': 'آمن عموماً', 'Monitor': 'مراقبة',
  'Caution': 'حذر', 'Avoid': 'تجنب', 'Unknown': 'غير محدد', 'X': 'ممنوع',
};

// SVG icons for safety badges
const BADGE_ICONS: Record<string, React.ReactNode> = {
  pregnancy: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c0 0-3 2-3 6s3 6 3 6m0-12c0 0 3 2 3 6s-3 6-3 6M12 4.5V3m0 15v1.5M8.5 10H7m10 0h-1.5" /></svg>,
  lactation: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  diabetes: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  hypertension: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12v.01" /></svg>,
  g6pd: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
};

interface SafetyBadgeConfig { key: string; labelAr: string; labelEn: string; icon: string; value: string | undefined; }

const SafetyBadgeItem: React.FC<{ cfg: SafetyBadgeConfig; language: Language; onPress: () => void }> = ({ cfg, language, onPress }) => {
  const val = cfg.value || '';
  const s = getSafetyStyle(val);
  const ar = language === 'ar';

  const dispVal = val ? (ar ? (AR_SAFETY_LABELS[val] || val) : val) : (ar ? 'لا بيانات' : 'No Data');
  const hasData = !!val;
  return (
    <button onClick={onPress} className={`flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl active:scale-95 transition-all min-w-[56px] ${hasData ? s.bg : 'bg-slate-50 dark:bg-slate-800/50'}`}>
      <div className={`w-5 h-5 flex items-center justify-center ${hasData ? s.text : 'text-slate-300 dark:text-slate-600'}`}>
        {BADGE_ICONS[cfg.key]}
      </div>
      <span className={`text-[8px] font-black uppercase tracking-wide text-center leading-tight ${hasData ? s.text : 'text-slate-400 dark:text-slate-500'}`}>{ar ? cfg.labelAr : cfg.labelEn}</span>
      <div className="flex items-center gap-0.5">
        {hasData && <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />}
        <span className={`text-[7.5px] font-black ${hasData ? s.text : 'text-slate-300 dark:text-slate-600'}`}>{dispVal}</span>
      </div>
    </button>
  );
};

const PREG_CAT_STYLE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  A:   { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700', dot: 'bg-emerald-500' },
  B:   { bg: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-700 dark:text-blue-400',       border: 'border-blue-200 dark:border-blue-700',       dot: 'bg-blue-500' },
  C:   { bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-700 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-700',     dot: 'bg-amber-500' },
  D:   { bg: 'bg-orange-50 dark:bg-orange-900/20',   text: 'text-orange-700 dark:text-orange-400',   border: 'border-orange-200 dark:border-orange-700',   dot: 'bg-orange-500' },
  X:   { bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-700 dark:text-red-400',         border: 'border-red-200 dark:border-red-700',         dot: 'bg-red-600' },
};
const LACT_CAT_STYLE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  S:   { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700', dot: 'bg-emerald-500' },
  NSC: { bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-700 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-700',     dot: 'bg-amber-500' },
  NS:  { bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-700 dark:text-red-400',         border: 'border-red-200 dark:border-red-700',         dot: 'bg-red-600' },
  U:   { bg: 'bg-slate-50 dark:bg-slate-800/40',     text: 'text-slate-500 dark:text-slate-400',     border: 'border-slate-200 dark:border-slate-700',     dot: 'bg-slate-400' },
};
// Normalize lactation category variants to canonical key
function normLactCat(raw: string): string {
  const r = (raw||'').trim().toUpperCase();
  if (r.startsWith('S')) return 'S';   // S, S (probably), S (conditionally)
  if (r.startsWith('NSC')) return 'NSC';
  if (r.startsWith('NS')) return 'NS'; // NS, NS (possibly), NS (potentially)
  if (r === 'U') return 'U';
  return r;
}
// Normalize pregnancy category variants
function normPregCat(raw: string): string {
  const r = (raw||'').replace(/[^A-Za-z]/g,'').toUpperCase();
  if (r === 'X') return 'X';
  if (r.startsWith('D')) return 'D';
  if (r.startsWith('C')) return 'C';
  if (r.startsWith('B')) return 'B';
  if (r.startsWith('A')) return 'A';
  return r;
}
// Worst pregnancy category helper (A < B < C < D < X)
const PREG_ORDER = ['A','B','C','D','X'];
function worstPregCat(cats: string[]): string {
  let worst = '';
  for (const c of cats) {
    const n = normPregCat(c);
    if (!worst || PREG_ORDER.indexOf(n) > PREG_ORDER.indexOf(worst)) worst = n;
  }
  return worst;
}
// Worst lactation category (S < NSC < NS)
const LACT_ORDER = ['S','U','NSC','NS'];
function worstLactCat(cats: string[]): string {
  let worst = '';
  for (const c of cats) {
    const n = normLactCat(c);
    if (!worst || LACT_ORDER.indexOf(n) > LACT_ORDER.indexOf(worst)) worst = n;
  }
  return worst;
}

const PREG_LABELS_AR: Record<string, string> = { A: 'آمن', B: 'آمن', C: 'احتياط', D: 'تجنب', X: 'ممنوع' };
const LACT_LABELS_AR: Record<string, string> = { S: 'آمن', NSC: 'احتياط', NS: 'تجنب', U: 'غير معروف' };
const PREG_LABELS_EN: Record<string, string> = { A: 'Safe', B: 'Safe', C: 'Caution', D: 'Avoid', X: 'Contraind.' };
const LACT_LABELS_EN: Record<string, string> = { S: 'Safe', NSC: 'Caution', NS: 'Avoid', U: 'Unknown' };

const SafetyBadgesCard: React.FC<{
  clinicalRef: import('../utils/dailyMedicines').ClinicalReference;
  pregRef: import('../utils/dailyMedicines').PregReferenceData | null;
  language: Language;
  onOpenRef: () => void;
}> = ({ clinicalRef, pregRef, language, onOpenRef }) => {
  const ar = language === 'ar';

  const pregCat = normPregCat(pregRef?.pregnancyCategory || '');
  const lactCat = normLactCat(pregRef?.lactationCategory || '');

  // Only show old-style badges if no pregRef data
  const oldBadges: SafetyBadgeConfig[] = [
    { key: 'diabetes',     labelAr: 'سكري',       labelEn: 'Diabetes',    icon: '🩸', value: clinicalRef.diabetesEffect },
    { key: 'hypertension', labelAr: 'ضغط',        labelEn: 'Hypertension',icon: '💓', value: clinicalRef.hypertensionEffect },
    { key: 'g6pd',         labelAr: 'أنيميا/فول', labelEn: 'G6PD/Anemia', icon: '🧬', value: clinicalRef.g6pdRisk },
  ].filter(b => b.value !== undefined);

  const hasPregCat = !!pregCat && !!PREG_CAT_STYLE[pregCat];
  const hasLactCat = !!lactCat && !!LACT_CAT_STYLE[lactCat];
  const hasAny = hasPregCat || hasLactCat || oldBadges.length > 0;
  if (!hasAny) return null;

  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100/80 dark:border-dark-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 dark:border-slate-800/60">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          {ar ? 'السلامة السريرية' : 'Clinical Safety'}
        </span>
        <button onClick={onOpenRef} className="text-[9px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full active:scale-95 transition-all">
          {ar ? 'التفاصيل' : 'Details'}
        </button>
      </div>
      <div className="px-3 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {/* Pregnancy Category Badge */}
        {hasPregCat && (() => {
          const s = PREG_CAT_STYLE[pregCat];
          return (
            <button onClick={onOpenRef}
              className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border active:scale-95 transition-all flex-shrink-0 min-w-[64px] ${s.bg} ${s.border}`}>
              <svg className={`w-4 h-4 ${s.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a5 5 0 015 5c0 5-5 13-5 13S7 12 7 7a5 5 0 015-5z"/>
                <circle cx="12" cy="7" r="2"/>
              </svg>
              <span className={`text-[8px] font-black uppercase tracking-wide text-center ${s.text}`}>
                {ar ? 'حمل' : 'Pregnancy'}
              </span>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>
                <span className={`text-[10px] font-black ${s.text}`}>{pregCat}</span>
              </div>
              <span className={`text-[8px] font-bold ${s.text} opacity-80`}>
                {ar ? PREG_LABELS_AR[pregCat] : PREG_LABELS_EN[pregCat]}
              </span>
            </button>
          );
        })()}

        {/* Lactation Category Badge */}
        {hasLactCat && (() => {
          const s = LACT_CAT_STYLE[lactCat];
          return (
            <button onClick={onOpenRef}
              className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border active:scale-95 transition-all flex-shrink-0 min-w-[64px] ${s.bg} ${s.border}`}>
              <svg className={`w-4 h-4 ${s.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              <span className={`text-[8px] font-black uppercase tracking-wide text-center ${s.text}`}>
                {ar ? 'رضاعة' : 'Lactation'}
              </span>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>
                <span className={`text-[10px] font-black ${s.text}`}>{lactCat}</span>
              </div>
              <span className={`text-[8px] font-bold ${s.text} opacity-80`}>
                {ar ? LACT_LABELS_AR[lactCat] : LACT_LABELS_EN[lactCat]}
              </span>
            </button>
          );
        })()}

        {/* Old-style badges (diabetes, hypertension, g6pd) — only if data exists */}
        {oldBadges.map(b => <SafetyBadgeItem key={b.key} cfg={b} language={language} onPress={onOpenRef} />)}
      </div>
    </div>
  );
};

const ClinicalAccordion: React.FC<{ clinicalData: ClinicalData; language: Language; onViewAll: () => void }> = ({ clinicalData, language, onViewAll }) => {
  const ar = language === 'ar';

  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const toggle = (k: string) => setExpanded(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const visible = CLINICAL_FIELDS.filter(f => (clinicalData as any)[f.key]);
  if (!visible.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1 mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {ar ? '📋 معلومات سريرية' : '📋 Clinical Information'}
        </span>
        <button onClick={onViewAll} className="ml-auto text-[9px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full active:scale-95 transition-all">
          {ar ? 'عرض الكل' : 'View All'}
        </button>
      </div>
      {visible.map(f => {
        const text = (clinicalData as any)[f.key] as string;
        const isLong = text.length > PREVIEW_LEN;
        const isOpen = expanded.has(f.key);
        const displayed = isOpen || !isLong ? text : text.slice(0, PREVIEW_LEN) + '…';
        return (
          <div key={f.key} className={`rounded-2xl border overflow-hidden ${f.bg} ${f.border}`}>
            <div className="px-4 py-3">
              <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${f.label}`}>
                {ar ? f.labelAr : f.labelEn}
              </p>
              <p className="text-[13.5px] leading-relaxed font-medium text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                {displayed}
              </p>
              {isLong && (
                <button onClick={() => toggle(f.key)}
                  className={`mt-2 text-[11px] font-black active:scale-95 transition-all ${f.label}`}>
                  {isOpen
                    ? (ar ? '▲ عرض أقل' : '▲ Show less')
                    : (ar ? '▼ عرض النص الكامل' : '▼ See full text')}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
    onShowInsuranceSheet?: (m: Medicine) => void;
}

const MedicineDetail: React.FC<MedicineDetailProps> = ({ medicine, insuranceData, allMedicines, t, language, isFavorite, onToggleFavorite, user, onEdit, onOpenAssistant, onOpenInteractions, onOpenDoseCalc, onImageZoom, onFindAlternative, onShare, onToggleCompare, isInCompare, onAskGemini, onOpenClinical, onShowInsuranceSheet }) => {
  React.useEffect(() => {
    logMedicineView(medicine['Trade Name'], medicine.RegisterNumber, medicine['Product type']);
  }, [medicine.RegisterNumber]);

  const ar = language === 'ar';
  const productType = String(medicine['Product type'] || '').toLowerCase();
  const isFood = productType === 'food';
  const isSupplement = productType === 'supplement';
  const isFoodOrSupplement = isFood || isSupplement;

  const [showInsuranceSheet, setShowInsuranceSheet] = useState(false);

  // Insurance matching
  const insurancePolicies = useMemo(
    () => getInsurancePolicies(medicine, insuranceData),
    [medicine, insuranceData]
  );
  const isCovered = !isFoodOrSupplement && insurancePolicies.length > 0;
  const showInsuranceBadge = !isFoodOrSupplement;

  const [clinicalData, setClinicalData] = useState<ClinicalData | null>(null);
  const [clinicalRef, setClinicalRef]   = useState<ClinicalReference | null>(null);
  const [pregRef, setPregRef] = useState<PregReferenceData | null>(null);
  const [allPregRefs, setAllPregRefs] = useState<PregReferenceData[]>([]);
  const [showClinicalRef, setShowClinicalRef] = useState(false);
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
      // بنبعت Scientific Name + Trade Name + RegisterNumber + DescriptionCode للـ lookup
      const sciName = String(medicine['Scientific Name'] || '').split(',')[0].trim(); // أول مادة فعالة بس
      const tradeName = String(medicine['Trade Name'] || '');
      const regNum = String(medicine.RegisterNumber || '');
      const descCode = String(medicine['Description Code'] || '');
      getClinicalReference(sciName, tradeName, descCode, regNum).then(ref => {
        setClinicalRef(ref);
      });
      // Known antibiotic combos - treat as single drug, not split
      const KNOWN_COMBOS_MD = ['clavulanic','clavulanate','tazobactam','sulbactam','trimethoprim','sulfamethoxazole'];
      const rawIngs = sciName.split(/[,\/+&]/).map((s: string) => s.trim()).filter(Boolean);
      // Use ANY: if any ingredient is a known combo partner, treat whole drug as combo
      const isKnownComboPairMD = rawIngs.length >= 2 && rawIngs.some((i: string) => KNOWN_COMBOS_MD.some(k => i.toLowerCase().includes(k)));
      const ingredients = isKnownComboPairMD ? [rawIngs.join('-')] : rawIngs;
      if (ingredients.length > 1) {
        Promise.all(ingredients.map((ing: string) => getPregReference(ing, ''))).then(refs => {
          const valid = refs.filter((r): r is PregReferenceData => r !== null);
          setAllPregRefs(valid);
          if (valid.length > 0) {
            // Show worst-category entry as primary
            const worst = valid.reduce((a, b) => {
              const aP = PREG_ORDER.indexOf(normPregCat(a.pregnancyCategory||''));
              const bP = PREG_ORDER.indexOf(normPregCat(b.pregnancyCategory||''));
              return bP > aP ? b : a;
            });
            setPregRef(worst);
          }
        });
      } else {
        getPregReference(sciName, tradeName).then(pref => {
          if (pref) { setPregRef(pref); setAllPregRefs([pref]); }
        });
      }
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
            <div className="flex-grow min-w-0 overflow-hidden">
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
                return <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug break-words" dir="ltr" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{parts.join(' · ')}</p>;
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

          {/* ── Insurance Badge ──────────────────────────────── */}
          {showInsuranceBadge && <div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 4, padding: '10px 8px', borderRadius: 16,
              background: isCovered
                ? 'linear-gradient(135deg, rgba(21,128,61,0.07), rgba(21,128,61,0.12))'
                : 'linear-gradient(135deg, rgba(190,18,60,0.06), rgba(190,18,60,0.1))',
              outline: `1.5px solid ${isCovered ? 'rgba(21,128,61,0.2)' : 'rgba(190,18,60,0.18)'}`,
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: isCovered ? 'rgba(21,128,61,0.12)' : 'rgba(190,18,60,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke={isCovered ? '#15803d' : '#be123c'} strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                {isCovered && <path d="M9 12l2 2 4-4"/>}
                {!isCovered && <path d="M15 9l-6 6M9 9l6 6"/>}
              </svg>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
              color: isCovered ? '#15803d' : '#be123c',
            }}>
              {isCovered
                ? (ar ? 'مغطى' : 'Covered')
                : (ar ? 'غير مغطى' : 'Not Covered')}
            </span>
          </div>}
      </div>

      {/* ── Insurance Bottom Sheet ─────────────────────────── */}
      {showInsuranceSheet && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 450, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowInsuranceSheet(false)}
        >
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'var(--surface)', borderRadius: '24px 24px 0 0',
              maxHeight: '75vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              animation: 'sheetUp 0.28s cubic-bezier(0.22,1,0.36,1)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--ink-20)' }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: isCovered ? 'rgba(21,128,61,0.1)' : 'rgba(190,18,60,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke={isCovered ? '#15803d' : '#be123c'} strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    {isCovered && <path d="M9 12l2 2 4-4"/>}
                    {!isCovered && <path d="M15 9l-6 6M9 9l6 6"/>}
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', lineHeight: 1.2 }}>
                    {ar ? 'التغطية التأمينية' : 'Insurance Coverage'}
                  </p>
                  <p style={{ fontSize: 11, color: isCovered ? '#15803d' : '#be123c', fontWeight: 700, marginTop: 1 }}>
                    {isCovered
                      ? `${insurancePolicies.length} ${ar ? 'دواء مغطى' : 'covered forms'}`
                      : (ar ? 'غير مغطى في NPHIES' : 'Not covered in NPHIES')}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowInsuranceSheet(false)} style={{
                width: 28, height: 28, borderRadius: '50%', border: 'none',
                background: 'var(--surface-2)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-subtle)',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Content — compact, no scroll needed for basics */}
            <div style={{ overflowY: 'auto', padding: '10px 16px 20px', flex: 1 }} className="no-scrollbar">
              {!isCovered ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(190,18,60,0.06)', borderRadius: 14, border: '1px solid rgba(190,18,60,0.15)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#be123c" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#be123c', margin: 0 }}>
                    {ar ? 'غير مدرج في قائمة NPHIES' : 'Not in the NPHIES formulary'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Active ingredient + class — most important, first */}
                  <div style={{ background: 'rgba(21,128,61,0.06)', border: '1px solid rgba(21,128,61,0.15)', borderRadius: 14, padding: '10px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#15803d', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {ar ? 'المادة الفعالة' : 'Active Ingredient'}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', direction: 'ltr', margin: 0 }}>
                      {insurancePolicies[0].scientificName}
                    </p>
                    {insurancePolicies[0].drugClass && (
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {insurancePolicies[0].drugClass}{insurancePolicies[0].drugSubclass ? ` · ${insurancePolicies[0].drugSubclass}` : ''}
                      </p>
                    )}
                  </div>

                  {/* Indication — second most important */}
                  {insurancePolicies[0].indication && (
                    <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: '10px 14px' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                        {ar ? 'الاستخدام' : 'Indication'}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.45, margin: 0 }}>
                        {insurancePolicies[0].indication}
                        {insurancePolicies[0].icd10Code && (
                          <span style={{ marginRight: 6, marginLeft: 6, fontSize: 10, fontWeight: 800, color: 'var(--text-subtle)', background: 'var(--surface)', padding: '2px 7px', borderRadius: 6, direction: 'ltr', display: 'inline-block' }}>
                            {insurancePolicies[0].icd10Code}
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Strengths as chips */}
                  <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: '10px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      {ar ? 'التركيزات' : 'Strengths'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {Array.from(new Set(insurancePolicies.map(p => `${p.strength} ${p.strengthUnit}`.trim()).filter(Boolean))).map((s, i) => (
                        <span key={i} style={{ fontSize: 11, fontWeight: 700, color: '#15803d', background: 'rgba(21,128,61,0.08)', padding: '3px 10px', borderRadius: 20, direction: 'ltr' }}>{s}</span>
                      ))}
                    </div>
                  </div>

                  {insurancePolicies[0].notes && (
                    <div style={{ background: 'rgba(14,26,24,0.03)', borderRadius: 14, padding: '10px 14px', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{ar ? 'ملاحظات' : 'Notes'}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{insurancePolicies[0].notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────── */}

      {/* ── Clinical Safety Badges — prominent, outside card ── */}
      {pregRef && (() => {
        const pCat = normPregCat(pregRef.pregnancyCategory || '');
        const lCat = normLactCat(pregRef.lactationCategory || '');
        const pStyle = PREG_CAT_STYLE[pCat];
        const lStyle = LACT_CAT_STYLE[lCat];
        if (!pStyle && !lStyle) return null;
        return (
          <div className="flex gap-2 px-4">
            {pStyle && (
              <button onClick={() => setShowClinicalRef(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-2xl border active:scale-95 transition-all ${pStyle.bg} ${pStyle.border}`}>
                <svg className={`w-4 h-4 ${pStyle.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a5 5 0 015 5c0 5-5 13-5 13S7 12 7 7a5 5 0 015-5z"/>
                  <circle cx="12" cy="7" r="2"/>
                </svg>
                <div className="text-left">
                  <p className={`text-[9px] font-black uppercase ${pStyle.text} opacity-70`}>{ar ? 'حمل' : 'Pregnancy'}</p>
                  <p className={`text-[16px] font-black leading-none ${pStyle.text}`}>{pCat}</p>
                  <p className={`text-[9px] font-bold ${pStyle.text} opacity-70`}>{ar ? PREG_LABELS_AR[pCat] : PREG_LABELS_EN[pCat]}</p>
                </div>
              </button>
            )}
            {lStyle && (
              <button onClick={() => setShowClinicalRef(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-2xl border active:scale-95 transition-all ${lStyle.bg} ${lStyle.border}`}>
                <svg className={`w-4 h-4 ${lStyle.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                <div className="text-left">
                  <p className={`text-[9px] font-black uppercase ${lStyle.text} opacity-70`}>{ar ? 'رضاعة' : 'Lactation'}</p>
                  <p className={`text-[16px] font-black leading-none ${lStyle.text}`}>{lCat}</p>
                  <p className={`text-[9px] font-bold ${lStyle.text} opacity-70`}>{ar ? LACT_LABELS_AR[lCat] : LACT_LABELS_EN[lCat]}</p>
                </div>
              </button>
            )}
          </div>
        );
      })()}

      {/* ── Clinical Safety Card (old style for diabetes/htn/g6pd) ── */}
      {(clinicalRef || pregRef) && (() => {
        const mergedRef: ClinicalReference = {
          ...(clinicalRef || {} as ClinicalReference),
          pregnancyStatus: (clinicalRef?.pregnancyStatus) || pregRef?.pregnancyStatus,
          lactationStatus: (clinicalRef?.lactationStatus) || pregRef?.lactationStatus,
          maternalConsiderations: clinicalRef?.maternalConsiderations || pregRef?.maternalConsiderations,
          fetalConsiderations:    clinicalRef?.fetalConsiderations    || pregRef?.fetalConsiderations,
          breastfeedingSafety:    clinicalRef?.breastfeedingSafety    || pregRef?.breastfeedingSafety,
          dosage:                 (clinicalRef as any)?.dosage        || pregRef?.dosage,
          summaryNotes:           clinicalRef?.summaryNotes           || pregRef?.summaryNotes,
        };
        const oldBadges = [mergedRef.diabetesEffect, mergedRef.hypertensionEffect, mergedRef.g6pdRisk].filter(Boolean);
        if (!oldBadges.length) return null; // hide if only showing preg/lact (already shown above)
        return (
          <SafetyBadgesCard
            clinicalRef={mergedRef}
            pregRef={pregRef}
            language={language}
            onOpenRef={() => setShowClinicalRef(true)}
          />
        );
      })()}

      {clinicalData && <ClinicalAccordion clinicalData={clinicalData} language={language} onViewAll={() => { if (onOpenClinical) onOpenClinical(); else setShowClinicalPage(true); }} />}


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




      {/* Clinical Reference Full Page — rendered at body level via portal */}
      {showClinicalRef && ReactDOM.createPortal(
        <ClinicalReferencePage
          scientificName={String(medicine['Scientific Name'] || '').split(',')[0].trim()}
          tradeName={String(medicine['Trade Name'] || '')}
          language={language}
          onClose={() => setShowClinicalRef(false)}
          medicine={medicine}
        />,
        document.body
      )}

      {/* Clinical Data Full Page */}
      {showClinicalPage && ReactDOM.createPortal(<ClinicalDataPage
          registerNumber={medicine.RegisterNumber}
          tradeName={medicine['Trade Name']}
          scientificName={medicine['Scientific Name']}
          language={language}
          isAdmin={user?.role === 'admin'}
          allMedicines={allMedicines}
          onClose={() => setShowClinicalPage(false)}
        />, document.body
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
