import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { ClinicalReference, getClinicalReference } from '../utils/dailyMedicines';

const R2_INTERACTIONS_URL = 'https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/interactions_merged.json';
const R2_CLINICAL_FULL_URL = 'https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/clinical_reference_full.json';

interface StructuredInteraction {
  interactsWith: string;
  severity: string;
  documentation?: string;
  summary: string;
}

const SEVERITY_ORDER = ['Contraindicated', 'Major', 'Moderate', 'Minor'];

const SEVERITY_STYLE: Record<string, { card: string; badge: string; btn: string }> = {
  Contraindicated: {
    card:  'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    badge: 'bg-red-600 text-white',
    btn:   'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
  },
  Major: {
    card:  'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
    badge: 'bg-orange-500 text-white',
    btn:   'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700',
  },
  Moderate: {
    card:  'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    badge: 'bg-yellow-500 text-white',
    btn:   'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700',
  },
  Minor: {
    card:  'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    badge: 'bg-green-500 text-white',
    btn:   'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
  },
  Unknown: {
    card:  'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
    badge: 'bg-slate-500 text-white',
    btn:   'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300',
  },
};

let _ixCache: Record<string, StructuredInteraction[]> | null = null;
let _clinCache: Record<string, any> | null = null;

async function fetchInteractions(drugKey: string): Promise<StructuredInteraction[]> {
  if (!_ixCache) {
    try {
      const res = await fetch(R2_INTERACTIONS_URL);
      if (res.ok) _ixCache = await res.json();
      else _ixCache = {};
    } catch { _ixCache = {}; }
  }
  const nk = drugKey.toLowerCase().trim();
  return _ixCache![nk] || _ixCache![drugKey] || [];
}

async function fetchFullClinical(drugKey: string): Promise<any | null> {
  if (!_clinCache) {
    try {
      const res = await fetch(R2_CLINICAL_FULL_URL);
      if (res.ok) _clinCache = await res.json();
      else _clinCache = {};
    } catch { _clinCache = {}; }
  }
  const nk = drugKey.toLowerCase().trim();
  return _clinCache![nk] || _clinCache![drugKey] || null;
}

// ── Interaction Card ─────────────────────────────────────────────────────────
function IxCard({ ix }: { ix: StructuredInteraction }) {
  const [open, setOpen] = useState(false);
  const style = SEVERITY_STYLE[ix.severity] || SEVERITY_STYLE['Unknown'];
  return (
    <div className={`rounded-xl border ${style.card} overflow-hidden`}>
      <button className="w-full flex items-start gap-2 p-2.5 text-start active:opacity-70 transition-opacity"
        onClick={() => setOpen(o => !o)}>
        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 ${style.badge}`}>
          {ix.severity}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">{ix.interactsWith}</p>
          {ix.documentation && (
            <p className="text-[9px] text-slate-400 mt-0.5">{ix.documentation}</p>
          )}
          {!open && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{ix.summary}</p>
          )}
        </div>
        <svg className={`w-3.5 h-3.5 flex-shrink-0 mt-1 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-700">
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{ix.summary}</p>
        </div>
      )}
    </div>
  );
}

// ── Interactions View ────────────────────────────────────────────────────────
function InteractionsView({ scientificName, fallbackText, language }: {
  scientificName: string;
  fallbackText: string;
  language: Language;
}) {
  const ar = language === 'ar';
  const [items, setItems] = useState<StructuredInteraction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    fetchInteractions(scientificName).then(data => {
      setItems(data);
      setLoading(false);
    });
  }, [scientificName]);

  if (loading) return (
    <div className="flex items-center gap-2 py-3">
      <div className="w-4 h-4 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
      <span className="text-[11px] text-slate-400">{ar ? 'جارٍ التحميل...' : 'Loading...'}</span>
    </div>
  );

  const hasStructured = items && items.length > 0;

  if (!hasStructured || showRaw) return (
    <div>
      {hasStructured && (
        <button onClick={() => setShowRaw(false)}
          className="mb-2 text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full">
          ← {ar ? 'عرض منظم' : 'Structured'}
        </button>
      )}
      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed"
         style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {fallbackText || (ar ? 'لا توجد بيانات' : 'No data')}
      </p>
    </div>
  );

  const sorted = [...items].sort((a, b) => {
    const ai = SEVERITY_ORDER.indexOf(a.severity);
    const bi = SEVERITY_ORDER.indexOf(b.severity);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const counts = sorted.reduce<Record<string, number>>((acc, ix) => {
    acc[ix.severity] = (acc[ix.severity] || 0) + 1; return acc;
  }, {});

  const visible = filter ? sorted.filter(ix => ix.severity === filter) : sorted;

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <button
          onClick={() => setFilter(null)}
          className={`text-[9px] font-black px-2 py-1 rounded-full border transition-all ${
            !filter ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
          }`}>
          {ar ? 'الكل' : 'All'} {sorted.length}
        </button>
        {SEVERITY_ORDER.filter(s => counts[s]).map(s => {
          const st = SEVERITY_STYLE[s];
          return (
            <button key={s}
              onClick={() => setFilter(filter === s ? null : s)}
              className={`text-[9px] font-black px-2 py-1 rounded-full border transition-all ${
                filter === s ? st.badge + ' border-transparent' : st.btn
              }`}>
              {s} {counts[s]}
            </button>
          );
        })}
        <button onClick={() => setShowRaw(true)}
          className="text-[9px] font-black px-2 py-1 rounded-full border bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 ms-auto">
          {ar ? 'نص' : 'Raw'}
        </button>
      </div>

      <div className="space-y-2">
        {visible.map((ix, i) => <IxCard key={i} ix={ix} />)}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
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
  { key: 'indications',       labelAr: 'الاستخدامات',           labelEn: 'Indications',         icon: '✅', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  { key: 'mechanism',         labelAr: 'آلية العمل',             labelEn: 'Mechanism',           icon: '⚙️', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  { key: 'adultDose',         labelAr: 'جرعة البالغين',          labelEn: 'Adult Dose',          icon: '👤', color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
  { key: 'pediatricDose',     labelAr: 'جرعة الأطفال',           labelEn: 'Pediatric Dose',      icon: '🧒', color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20' },
  { key: 'contraindications', labelAr: 'موانع الاستخدام',        labelEn: 'Contraindications',   icon: '🚫', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
  { key: 'interactions',      labelAr: 'التفاعلات الدوائية',     labelEn: 'Drug Interactions',   icon: '⚠️', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  { key: 'pregnancy',         labelAr: 'الحمل',                  labelEn: 'Pregnancy',           icon: '🤰', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' },
  { key: 'lactation',         labelAr: 'الرضاعة',                labelEn: 'Lactation',           icon: '🤱', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  { key: 'renalDosing',       labelAr: 'جرعة الفشل الكلوي',      labelEn: 'Renal Dosing',        icon: '🫘', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20' },
  { key: 'hepaticDosing',     labelAr: 'جرعة الفشل الكبدي',      labelEn: 'Hepatic Dosing',      icon: '🫀', color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20' },
  { key: 'g6pd',              labelAr: 'نقص G6PD',               labelEn: 'G6PD',                icon: '🧬', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
];

const ClinicalReferencePage: React.FC<Props> = ({ scientificName, tradeName, language, onClose }) => {
  const ar = language === 'ar';
  const [data, setData] = useState<ClinicalReference | null>(null);
  const [fullData, setFullData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    // fetch local fallback first
    getClinicalReference(scientificName)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
    // fetch full R2 data
    fetchFullClinical(scientificName.toLowerCase().trim())
      .then(d => { if (d) setFullData(d); });
  }, [scientificName]);

  const toggle = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // merge: prefer fullData fields over fallback data
  const getText = (key: keyof ClinicalReference): string => {
    const fullVal = fullData?.[key as string];
    if (fullVal && typeof fullVal === 'string' && fullVal.trim()) return fullVal.trim();
    return (data?.[key] as string) || '';
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

      {/* Source */}
      {(data || fullData) && (
        <div className="px-4 py-1.5 flex-shrink-0 border-b border-slate-50 dark:border-slate-800/50">
          <span className="text-[10px] font-bold text-slate-400">
            📄 {ar ? 'المصدر:' : 'Source:'} {fullData?.source || data?.source || 'Micromedex DRUGDEX'}
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

        {!loading && !data && !fullData && (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-black text-slate-500 text-sm">
              {ar ? 'لا توجد بيانات سريرية لهذا الدواء' : 'No clinical data available'}
            </p>
            <p className="text-slate-400 text-xs mt-1">{scientificName}</p>
          </div>
        )}

        {!loading && (data || fullData) && SECTIONS.map(sec => {
          const text = getText(sec.key);
          if (!text || text === '—' || text.trim() === '' || text === 'nan') return null;
          const isOpen = expanded.has(sec.key);

          return (
            <div key={sec.key}
              className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
              <button
                onClick={() => toggle(sec.key)}
                className="w-full flex items-center gap-3 px-4 py-3 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">
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

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-50 dark:border-slate-800">
                  {sec.key === 'interactions' ? (
                    <InteractionsView scientificName={scientificName} fallbackText={text} language={language} />
                  ) : (
                    <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium"
                       style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {text}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!loading && (data || fullData) && (
          <p className="text-[9px] text-slate-400 text-center pt-2 leading-relaxed">
            {ar
              ? '⚠️ للمرجعية السريرية فقط. راجع دائماً المصادر الرسمية.'
              : '⚠️ For clinical reference only. Always consult official sources.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ClinicalReferencePage;
