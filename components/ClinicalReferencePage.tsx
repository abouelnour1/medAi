import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { ClinicalReference, getClinicalReference } from '../utils/dailyMedicines';

interface Props {
  scientificName: string;
  tradeName: string;
  language: Language;
  onClose: () => void;
}

interface Section {
  key: keyof ClinicalReference;
  fullKey: keyof ClinicalReference;
  labelAr: string;
  labelEn: string;
  badgeColor: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
}

const SECTIONS: Section[] = [
  { key: 'indications',       fullKey: 'indications_full',       labelAr: 'الاستخدامات المعتمدة',  labelEn: 'Indications',        badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', textColor: 'text-emerald-700 dark:text-emerald-400', borderColor: 'border-emerald-400', bgColor: 'bg-white dark:bg-dark-card' },
  { key: 'mechanism',         fullKey: 'mechanism_full',         labelAr: 'آلية العمل',             labelEn: 'Mechanism',          badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',           textColor: 'text-blue-700 dark:text-blue-400',     borderColor: 'border-blue-400',    bgColor: 'bg-white dark:bg-dark-card' },
  { key: 'adultDose',         fullKey: 'adultDose_full',         labelAr: 'جرعة البالغين',          labelEn: 'Adult Dose',         badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',   textColor: 'text-violet-700 dark:text-violet-400', borderColor: 'border-violet-400',  bgColor: 'bg-white dark:bg-dark-card' },
  { key: 'pediatricDose',     fullKey: 'pediatricDose_full',     labelAr: 'جرعة الأطفال',           labelEn: 'Pediatric Dose',     badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',           textColor: 'text-pink-700 dark:text-pink-400',     borderColor: 'border-pink-400',    bgColor: 'bg-white dark:bg-dark-card' },
  { key: 'contraindications', fullKey: 'contraindications_full', labelAr: 'موانع الاستخدام',        labelEn: 'Contraindications',  badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',               textColor: 'text-red-700 dark:text-red-400',       borderColor: 'border-red-400',     bgColor: 'bg-red-50/40 dark:bg-red-900/5' },
  { key: 'interactions',      fullKey: 'interactions_full',      labelAr: 'التفاعلات الدوائية',     labelEn: 'Drug Interactions',  badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',       textColor: 'text-amber-700 dark:text-amber-400',   borderColor: 'border-amber-400',   bgColor: 'bg-amber-50/40 dark:bg-amber-900/5' },
  { key: 'pregnancy',         fullKey: 'pregnancy_full',         labelAr: 'الحمل',                  labelEn: 'Pregnancy',          badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',           textColor: 'text-rose-700 dark:text-rose-400',     borderColor: 'border-rose-400',    bgColor: 'bg-white dark:bg-dark-card' },
  { key: 'lactation',         fullKey: 'lactation_full',         labelAr: 'الرضاعة',                labelEn: 'Lactation',          badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',   textColor: 'text-orange-700 dark:text-orange-400', borderColor: 'border-orange-400',  bgColor: 'bg-white dark:bg-dark-card' },
  { key: 'renalDosing',       fullKey: 'renalDosing_full',       labelAr: 'جرعة الفشل الكلوي',      labelEn: 'Renal Dosing',       badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',           textColor: 'text-cyan-700 dark:text-cyan-400',     borderColor: 'border-cyan-400',    bgColor: 'bg-white dark:bg-dark-card' },
  { key: 'hepaticDosing',     fullKey: 'hepaticDosing_full',     labelAr: 'جرعة الفشل الكبدي',      labelEn: 'Hepatic Dosing',     badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',           textColor: 'text-teal-700 dark:text-teal-400',     borderColor: 'border-teal-400',    bgColor: 'bg-white dark:bg-dark-card' },
  { key: 'g6pd',              fullKey: 'g6pd_full',              labelAr: 'نقص G6PD',               labelEn: 'G6PD Deficiency',    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',   textColor: 'text-indigo-700 dark:text-indigo-400', borderColor: 'border-indigo-400',  bgColor: 'bg-white dark:bg-dark-card' },
];

// Chars shown before "See Full Text" button appears
const PREVIEW_LENGTH = 550;

const ClinicalReferencePage: React.FC<Props> = ({ scientificName, tradeName, language, onClose }) => {
  const ar = language === 'ar';
  const [data, setData]       = useState<ClinicalReference | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['indications', 'adultDose']));
  const [showFull, setShowFull] = useState<Set<string>>(new Set());

  useEffect(() => {
    getClinicalReference(scientificName)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [scientificName]);

  const toggle = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleFull = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFull(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-[500] bg-slate-50 dark:bg-dark-bg flex flex-col"
      style={{ direction: ar ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-dark-card flex-shrink-0 shadow-sm"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
        >
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={ar ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-sm text-slate-800 dark:text-white truncate">{tradeName}</h1>
          <p className="text-xs text-slate-400 truncate">{scientificName}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 dark:bg-teal-900/20 rounded-xl flex-shrink-0">
          <span className="text-xs font-black text-teal-600 dark:text-teal-400">
            {ar ? 'المرجع السريري' : 'Clinical Ref'}
          </span>
        </div>
      </div>

      {/* Source */}
      {data && (
        <div className="px-4 py-2 flex-shrink-0 bg-white dark:bg-dark-card border-b border-slate-50 dark:border-slate-800/50">
          <span className="text-xs font-medium text-slate-400">
            {ar ? 'المصدر:' : 'Source:'} {data.source || 'Micromedex DRUGDEX'}
          </span>
        </div>
      )}

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
      >
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
          </div>
        )}

        {/* No data */}
        {!loading && !data && (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-black text-slate-500 text-sm">
              {ar ? 'لا توجد بيانات سريرية لهذا الدواء' : 'No clinical data available for this drug'}
            </p>
            <p className="text-slate-400 text-xs mt-1">{scientificName}</p>
          </div>
        )}

        {/* Section cards */}
        {!loading && data && SECTIONS.map(sec => {
          const summaryText = (data[sec.key] as string) || '';
          const fullText    = (data[sec.fullKey as keyof ClinicalReference] as string) || summaryText;

          if (!summaryText && !fullText) return null;

          const isOpen      = expanded.has(sec.key as string);
          const isFullMode  = showFull.has(sec.key as string);
          const activeText  = isFullMode ? fullText : summaryText;
          const needsClip   = !isFullMode && activeText.length > PREVIEW_LENGTH;
          const displayText = needsClip ? activeText.slice(0, PREVIEW_LENGTH) + '…' : activeText;
          // Show button if full text is longer than summary, or summary itself is long
          const hasMore     = fullText.length > summaryText.length || summaryText.length > PREVIEW_LENGTH;

          return (
            <div
              key={sec.key as string}
              className={`rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm ${sec.bgColor}`}
            >
              {/* Tap-to-expand header */}
              <button
                onClick={() => toggle(sec.key as string)}
                className="w-full flex items-center justify-between px-4 py-3 active:bg-black/5 dark:active:bg-white/5 transition-colors"
              >
                {/* Colored label with left border accent */}
                <div
                  className={`flex items-center border-l-[3px] ${sec.borderColor} pl-2.5`}
                  style={{ direction: 'ltr' }}
                >
                  <span
                    className={`text-[11px] font-black uppercase tracking-widest ${sec.textColor}`}
                    style={{ direction: ar ? 'rtl' : 'ltr' }}
                  >
                    {ar ? sec.labelAr : sec.labelEn}
                  </span>
                </div>
                {/* Chevron */}
                <svg
                  className={`w-4 h-4 text-slate-300 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded body */}
              {isOpen && (
                <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
                  {/* Text — 13.5px, relaxed leading, no bold weight → easy reading */}
                  <p className="mt-3 text-[13.5px] leading-[1.8] text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-normal tracking-[0.01em]">
                    {displayText}
                  </p>

                  {/* See Full Text / Collapse */}
                  {hasMore && (
                    <button
                      onClick={e => toggleFull(sec.key as string, e)}
                      className={`mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all active:scale-95 ${
                        isFullMode
                          ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                          : sec.badgeColor
                      }`}
                    >
                      {isFullMode ? (
                        <>
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
                          {ar ? 'إخفاء' : 'Collapse'}
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                          {ar ? 'النص الكامل' : 'See Full Text'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Disclaimer */}
        {!loading && data && (
          <p className="text-[11px] text-slate-400 text-center pt-2 pb-4 leading-relaxed px-4">
            {ar
              ? '⚠️ هذه المعلومات للمرجعية السريرية فقط. راجع دائماً المصادر الرسمية والطبيب المختص.'
              : '⚠️ For clinical reference only. Always consult official sources and a qualified clinician.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ClinicalReferencePage;
