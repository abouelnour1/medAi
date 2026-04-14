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
  labelAr: string;
  labelEn: string;
  icon: string;
  color: string;
}

const SECTIONS: Section[] = [
  { key: 'indications',       labelAr: 'الاستخدامات المعتمدة',     labelEn: 'Indications',         icon: '✅', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  { key: 'mechanism',         labelAr: 'آلية العمل',               labelEn: 'Mechanism of Action', icon: '⚙️', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  { key: 'adultDose',         labelAr: 'جرعة البالغين',            labelEn: 'Adult Dose',          icon: '👤', color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
  { key: 'pediatricDose',     labelAr: 'جرعة الأطفال',             labelEn: 'Pediatric Dose',      icon: '🧒', color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20' },
  { key: 'contraindications', labelAr: 'موانع الاستخدام',          labelEn: 'Contraindications',   icon: '🚫', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
  { key: 'interactions',      labelAr: 'التفاعلات الدوائية',       labelEn: 'Drug Interactions',   icon: '⚠️', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  { key: 'pregnancy',         labelAr: 'الحمل',                    labelEn: 'Pregnancy',           icon: '🤰', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' },
  { key: 'lactation',         labelAr: 'الرضاعة',                  labelEn: 'Lactation',           icon: '🤱', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  { key: 'renalDosing',       labelAr: 'جرعة الفشل الكلوي',        labelEn: 'Renal Dosing',        icon: '🫘', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20' },
  { key: 'hepaticDosing',     labelAr: 'جرعة الفشل الكبدي',        labelEn: 'Hepatic Dosing',      icon: '🫀', color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20' },
  { key: 'g6pd',              labelAr: 'نقص G6PD',                 labelEn: 'G6PD Deficiency',     icon: '🧬', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
];

const ClinicalReferencePage: React.FC<Props> = ({ scientificName, tradeName, language, onClose }) => {
  const ar = language === 'ar';
  const [data, setData]       = useState<ClinicalReference | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['indications', 'adultDose']));

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

  return (
    <div className="fixed inset-0 z-[500] bg-white dark:bg-dark-bg flex flex-col" style={{ direction: ar ? 'rtl' : 'ltr' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0"
           style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-90 transition-transform">
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={ar ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-sm text-slate-800 dark:text-white truncate">{tradeName}</h1>
          <p className="text-[10px] text-slate-400 truncate">{scientificName}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
          <span className="text-xs">🩺</span>
          <span className="text-[10px] font-black text-teal-600 dark:text-teal-400">
            {ar ? 'المرجع السريري' : 'Clinical Ref'}
          </span>
        </div>
      </div>

      {/* Source badge */}
      {data && (
        <div className="px-4 py-2 flex-shrink-0 border-b border-slate-50 dark:border-slate-800/50">
          <span className="text-[10px] font-bold text-slate-400">
            📄 {ar ? 'المصدر:' : 'Source:'} {data.source || 'Micromedex DRUGDEX'}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
           style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && !data && (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-black text-slate-500 text-sm">
              {ar ? 'لا توجد بيانات سريرية لهذا الدواء' : 'No clinical data available for this drug'}
            </p>
            <p className="text-slate-400 text-xs mt-1">{scientificName}</p>
          </div>
        )}

        {!loading && data && SECTIONS.map(sec => {
          const text = data[sec.key] as string;
          if (!text || text === '—' || text.trim() === '') return null;
          const isOpen = expanded.has(sec.key);

          return (
            <div key={sec.key}
              className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
              <button
                onClick={() => toggle(sec.key)}
                className="w-full flex items-center gap-3 px-4 py-3 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${sec.color}`}>
                  <span className="text-sm">{sec.icon}</span>
                </div>
                <span className="flex-1 text-left font-black text-sm text-slate-700 dark:text-slate-200">
                  {ar ? sec.labelAr : sec.labelEn}
                </span>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                style={{
                  maxHeight: isOpen ? '2000px' : '0px',
                  overflow: 'hidden',
                  transition: 'max-height 0.25s ease',
                }}
              >
                <div className="px-4 pb-4 pt-1 border-t border-slate-50 dark:border-slate-800">
                  <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium"
                     style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && data && (
          <p className="text-[9px] text-slate-400 text-center pt-2 leading-relaxed">
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
