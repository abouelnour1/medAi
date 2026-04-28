import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { ClinicalReference, getClinicalReference } from '../utils/dailyMedicines';

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

let _clinCache: Record<string, any> | null = null;

// ── Drug name normalization for matching ────────────────────────────────────
const SALT_SUFFIXES = /\s+(hydrochloride|hcl|sodium|potassium|sulfate|sulphate|maleate|fumarate|tartrate|acetate|phosphate|citrate|gluconate|mesylate|besylate|oxalate|bromide|chloride|nitrate|succinate|valerate|propionate|dipropionate|butyrate|furoate|monohydrate|trihydrate|anhydrous|dihydrate|monosodium|disodium)\b/gi;

// Synonyms: alternate INN/brand/generic names that map to the data key
const DRUG_SYNONYMS: Record<string, string> = {
  'hyoscine': 'scopolamine',
  'salbutamol': 'albuterol',
  'paracetamol': 'acetaminophen',
  'acetaminophen': 'paracetamol',
  'albuterol': 'salbutamol',
  'miconazole': 'clotrimazole',
  'folic acid': 'folate',
  'vitamin c': 'ascorbic acid',
};

function normalizeDrug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/-/g, '/')
    .replace(SALT_SUFFIXES, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Returns candidate keys to try, in priority order
function drugLookupKeys(raw: string): string[] {
  const norm = normalizeDrug(raw);
  const orig = raw.toLowerCase().trim();
  const firstWord = norm.split(/[\s\/,+]+/)[0];
  const parts = norm.split(/[\/,+]+/).map((p: string) => p.trim()).filter(Boolean);
  const candidates = [norm, orig, firstWord, ...parts].filter(Boolean);
  // Add synonym if exists
  if (DRUG_SYNONYMS[norm]) candidates.push(DRUG_SYNONYMS[norm]);
  if (DRUG_SYNONYMS[firstWord]) candidates.push(DRUG_SYNONYMS[firstWord]);
  return [...new Set(candidates)];
}

function findInMap<T>(map: Record<string, T>, ...raws: string[]): T | undefined {
  // Pre-normalize all map keys once per call (map is cached so this is fast)
  const normMap: Record<string, string> = {};
  const mapKeys = Object.keys(map);
  for (const k of mapKeys) normMap[k] = normalizeDrug(k);

  for (const raw of raws) {
    if (!raw) continue;
    const candidates = drugLookupKeys(raw);

    // 1. Exact candidate match against original keys
    for (const c of candidates) {
      if (map[c]) return map[c];
    }

    // 2. Exact candidate match against normalized keys
    for (const c of candidates) {
      const found = mapKeys.find(k => normMap[k] === c);
      if (found) return map[found];
    }

    // 3. Fuzzy: first word prefix match
    const firstWord = candidates[candidates.length - 1];
    if (firstWord && firstWord.length >= 4) {
      const found = mapKeys.find(k => {
        const nk = normMap[k];
        const nkFirst = nk.split(/[\s\/,+]+/)[0];
        return nk.startsWith(firstWord) || firstWord.startsWith(nkFirst);
      });
      if (found) return map[found];
    }
  }
  return undefined;
}

async function fetchFullClinical(scientificName: string, tradeName?: string): Promise<any | null> {
  if (!_clinCache) {
    try {
      const res = await fetch(R2_CLINICAL_FULL_URL);
      if (res.ok) _clinCache = await res.json();
      else _clinCache = {};
    } catch { _clinCache = {}; }
  }
  return findInMap(_clinCache!, scientificName, tradeName ?? '') ?? null;
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
function InteractionsView({ scientificName, tradeName, fallbackText, language }: {
  scientificName: string;
  tradeName: string;
  fallbackText: string;
  language: Language;
}) {
  const ar = language === 'ar';
  const [items, setItems] = useState<StructuredInteraction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    fetchFullClinical(scientificName, tradeName).then(data => {
      const ix: StructuredInteraction[] = Array.isArray(data?.interactions) ? data.interactions : [];
      setItems(ix);
      setLoading(false);
    });
  }, [scientificName, tradeName]);

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
      {fallbackText ? (
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed"
           style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {fallbackText}
        </p>
      ) : (
        <div className="flex items-center gap-2 py-2 text-slate-400">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span className="text-[11px]">{ar ? 'لا توجد تفاعلات مسجلة' : 'No interactions on record'}</span>
        </div>
      )}
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

// SVG icon components for sections
const SECTIONS = [
  { key: 'indications',       labelAr: 'دواعي الاستخدام',        labelEn: 'Indications',        color: 'text-teal-600',    bg: 'bg-teal-50 dark:bg-teal-900/25' },
  { key: 'mechanism',         labelAr: 'آلية العمل',             labelEn: 'Mechanism',          color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/25' },
  { key: 'adultDose',         labelAr: 'جرعة البالغين',         labelEn: 'Adult Dose',         color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-900/25' },
  { key: 'pediatricDose',     labelAr: 'جرعة الأطفال',          labelEn: 'Pediatric Dose',     color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-900/25' },
  { key: 'contraindications', labelAr: 'موانع الاستخدام',       labelEn: 'Contraindications',  color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/25' },
  { key: 'interactions',      labelAr: 'التفاعلات الدوائية',    labelEn: 'Drug Interactions',  color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/25' },
  { key: 'pregnancy',         labelAr: 'الحمل',                 labelEn: 'Pregnancy',          color: 'text-rose-600',    bg: 'bg-rose-50 dark:bg-rose-900/25' },
  { key: 'lactation',         labelAr: 'الرضاعة',               labelEn: 'Lactation',          color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-900/25' },
  { key: 'renalDosing',       labelAr: 'جرعة القصور الكلوي',    labelEn: 'Renal Dosing',       color: 'text-cyan-600',    bg: 'bg-cyan-50 dark:bg-cyan-900/25' },
  { key: 'hepaticDosing',     labelAr: 'جرعة القصور الكبدي',    labelEn: 'Hepatic Dosing',     color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/25' },
  { key: 'g6pd',              labelAr: 'نقص G6PD',              labelEn: 'G6PD Deficiency',    color: 'text-indigo-600',  bg: 'bg-indigo-50 dark:bg-indigo-900/25' },
];

const SectionIcon: React.FC<{ k: string; cls: string }> = ({ k, cls }) => {
  const s = { className: `w-[18px] h-[18px] ${cls}`, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const icons: Record<string, React.ReactNode> = {
    indications:       <svg {...s}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>,
    mechanism:         <svg {...s}><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
    adultDose:         <svg {...s}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    pediatricDose:     <svg {...s}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    contraindications: <svg {...s}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    interactions:      <svg {...s}><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>,
    pregnancy:         <svg {...s}><path d="M12 2a5 5 0 015 5c0 5-5 13-5 13S7 12 7 7a5 5 0 015-5z"/><circle cx="12" cy="7" r="2"/></svg>,
    lactation:         <svg {...s}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    renalDosing:       <svg {...s}><ellipse cx="12" cy="12" rx="4" ry="7"/><path d="M8 12c-4 0-5 2-5 2s1 4 9 4 9-4 9-4-1-2-5-2"/></svg>,
    hepaticDosing:     <svg {...s}><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
    g6pd:              <svg {...s}><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>,
  };
  return <>{icons[k] ?? icons['indications']}</>;
};

const ClinicalReferencePage: React.FC<Props> = ({ scientificName, tradeName, language, onClose }) => {
  const ar = language === 'ar';
  const [data, setData] = useState<ClinicalReference | null>(null);
  const [fullData, setFullData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    getClinicalReference(scientificName, tradeName)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
    fetchFullClinical(scientificName, tradeName)
      .then(d => { if (d) setFullData(d); });
  }, [scientificName, tradeName]);

  const toggle = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // merge: prefer fullData fields over fallback data
  const getText = (key: keyof ClinicalReference): string => {
    // Try direct key in fullData
    const fullVal = (fullData as any)?.[key];
    if (fullVal && typeof fullVal === 'string' && fullVal.trim()) return fullVal.trim();
    // Try old field names in data
    return ((data as any)?.[key] as string) || '';
  };

  return (
    <div className="fixed inset-0 z-[500] bg-white dark:bg-dark-bg flex flex-col" data-overlay="true"
      style={{ direction: ar ? 'rtl' : 'ltr' }}
      onTouchStart={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
      onTouchEnd={e => e.stopPropagation()}
    >

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-90 transition-transform">
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={ar ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-sm text-slate-800 dark:text-white truncate">{tradeName}</h1>
          <p className="text-[10px] text-slate-400 leading-snug" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{scientificName}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
          <span className="text-[10px] font-black text-teal-600 dark:text-teal-400">
            {ar ? 'المرجع السريري' : 'Clinical Ref'}
          </span>
        </div>
      </div>

      {/* Source */}
      {(data || fullData) && (
        <div className="px-4 py-1.5 flex-shrink-0 border-b border-slate-50 dark:border-slate-800/50">
          <span className="text-[10px] font-bold text-slate-400">
            {ar ? 'المصدر:' : 'Source:'} {fullData?.source || data?.source || 'Micromedex DRUGDEX'}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 overscroll-none"
           style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' } as any}>

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
          const text = getText(sec.key as keyof ClinicalReference);
          // Interactions section always shows (it fetches from R2 independently)
          const hasContent = sec.key === 'interactions'
            ? true
            : (text && text !== '—' && text.trim() !== '' && text !== 'nan');
          if (!hasContent) return null;
          const isOpen = expanded.has(sec.key);

          return (
            <div key={sec.key}
              className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <button
                onClick={() => toggle(sec.key)}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${sec.bg}`}>
                  <SectionIcon k={sec.key} cls={sec.color} />
                </div>
                <span className="flex-1 font-black text-[13px] text-slate-700 dark:text-slate-200">
                  {ar ? sec.labelAr : sec.labelEn}
                </span>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Content — height transition */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.15s ease-out',
                  contain: 'layout',
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div className="px-4 pb-4 pt-1 border-t border-slate-50 dark:border-slate-800">
                    {sec.key === 'interactions' ? (
                      <InteractionsView scientificName={scientificName} tradeName={tradeName} fallbackText={text} language={language} />
                    ) : (
                      <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium"
                         style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {text}
                      </p>
                    )}
                  </div>
                </div>
              </div>
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
