import React, { useState, useEffect } from 'react';
import { Medicine } from '../types';

// ── Types (مشتركة مع PediatricDoseCalculator) ────────────────────────────────
type DoseLevel = 'min' | 'mid' | 'max';

interface DrugPreset {
  id: string;
  label: string;
  active: string;
  drugIdx: number | null;
  doseLevel: DoseLevel;
  useIndication: boolean;
  disease: string | null;
  condition: string | null;
  condition2: string | null;
  customImage?: string | null;
}

interface DrugEntry {
  active: string;
  conc_mg: number | null;
  conc_ml: number | null;
  fixed_dose: string | null;
  dose_mg_kg_min: number | null;
  dose_mg_kg_max: number | null;
  max_mg_kg_day: number | null;
  max_single_dose_mg: number | string | null;
  frequency: string;
  notes: string;
  form: string;
  display: string;
}

// ── localStorage ─────────────────────────────────────────────────────────────
const PRESET_KEY = 'ps_ped_presets_v1';
const DRUGS_CACHE = 'ps_pediatric_drugs_v5';
const R2_URL = 'https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/pediatric-drugs.json';

function loadPresets(): DrugPreset[] {
  try { return JSON.parse(localStorage.getItem(PRESET_KEY) || '[]'); } catch { return []; }
}

async function getDrugs(): Promise<DrugEntry[]> {
  try {
    const cached = localStorage.getItem(DRUGS_CACHE);
    if (cached) return JSON.parse(cached).drugs || [];
  } catch {}
  try {
    const res = await fetch(R2_URL);
    if (!res.ok) return [];
    const data = await res.json();
    try { localStorage.setItem(DRUGS_CACHE, JSON.stringify(data)); } catch {}
    return data.drugs || [];
  } catch { return []; }
}

// ── Dose Calculator ───────────────────────────────────────────────────────────
function calcDose(drug: DrugEntry, preset: DrugPreset, weight: number) {
  if (!drug || weight <= 0) return null;

  // fixed dose → لا حساب
  if (drug.fixed_dose) return { kind: 'fixed' as const, text: drug.fixed_dose };

  const dMin = drug.dose_mg_kg_min;
  const dMax = drug.dose_mg_kg_max;

  let perKg: number | null = null;
  if (dMin !== null && dMax !== null && dMin !== dMax) {
    if (preset.doseLevel === 'min') perKg = dMin;
    else if (preset.doseLevel === 'max') perKg = dMax;
    else perKg = (dMin + dMax) / 2;
  } else if (dMin !== null) perKg = dMin;
  else if (dMax !== null) perKg = dMax;

  if (perKg === null) return null;

  const rawMg = perKg * weight;
  const maxSingle = typeof drug.max_single_dose_mg === 'number' ? drug.max_single_dose_mg : Infinity;
  const doseMg = Math.min(rawMg, maxSingle);
  const doseML = (drug.conc_mg && drug.conc_ml) ? (doseMg / drug.conc_mg) * drug.conc_ml : 0;
  const capped = rawMg > maxSingle;

  return {
    kind: 'calc' as const,
    doseMg,
    doseML,
    capped,
    frequency: drug.frequency,
    isSupp: drug.form === 'Suppository',
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  language: 'ar' | 'en';
  onOpenCalc: (drugName?: string) => void;
  medicines: Medicine[];
}

const PediatricPresetBar: React.FC<Props> = ({ language, onOpenCalc, medicines }) => {
  const ar = language === 'ar';
  const [presets, setPresets] = useState<DrugPreset[]>(loadPresets);
  const [drugs, setDrugs] = useState<DrugEntry[]>([]);
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // إيجاد صورة المنتج من الـ medicines array بالمادة الفعالة
  const getMedImage = (active: string): string | null => {
    if (!medicines.length) return null;
    const norm = active.toLowerCase().replace(/,\s*/g, ',');
    const match = medicines.find(m => {
      const sci = (m['Scientific Name'] || '').toLowerCase().replace(/,\s*/g, ',');
      return sci.includes(norm) || norm.includes(sci);
    });
    return match?.imgBox || match?.imgPill || null;
  };

  // مستمع لأي تغيير في الـ presets من الحاسبة
  useEffect(() => {
    const sync = () => setPresets(loadPresets());
    window.addEventListener('storage', sync);
    // poll خفيف عشان نفس الصفحة
    const interval = setInterval(sync, 1500);
    return () => { window.removeEventListener('storage', sync); clearInterval(interval); };
  }, []);

  useEffect(() => {
    getDrugs().then(setDrugs);
  }, []);

  if (presets.length === 0) return null;

  const getDrug = (p: DrugPreset): DrugEntry | null =>
    p.drugIdx !== null && drugs[p.drugIdx] ? drugs[p.drugIdx] : null;

  const deletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    try { localStorage.setItem(PRESET_KEY, JSON.stringify(updated)); } catch {}
  };

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          👶 {ar ? 'جرعات سريعة' : 'Quick Doses'}
        </p>
        <button
          onClick={() => onOpenCalc(undefined)}
          className="text-[10px] font-black text-teal-600 active:scale-95"
        >
          {ar ? 'الحاسبة ←' : '← Calc'}
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {presets.map(p => {
          const drug = getDrug(p);
          const w = parseFloat(weights[p.id] || '') || 0;
          const result = drug ? calcDose(drug, p, w) : null;
          const isExpanded = expandedId === p.id;

          return (
            <div
              key={p.id}
              className="bg-white dark:bg-dark-card rounded-2xl border-2 border-slate-100 dark:border-dark-border overflow-hidden"
            >
              {/* Top row */}
              <div className="flex items-center gap-3 px-3 pt-3 pb-2">
                {/* صورة: customImage أولاً، بعدين medicines lookup */}
                {(() => {
                  const img = p.customImage?.trim() || getMedImage(p.active);
                  return img ? (
                    <img src={img} alt="" className="w-10 h-10 rounded-xl object-contain bg-slate-50 dark:bg-slate-800 p-1 flex-shrink-0" onError={e => (e.currentTarget.style.display = 'none')} />
                  ) : null;
                })()}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-slate-700 dark:text-white truncate">{p.label}</p>
                  <p className="text-[10px] font-bold text-slate-400 truncate">
                    {drug?.display || p.active}
                    {p.disease && <span className="text-indigo-400"> · {p.disease}</span>}
                  </p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deletePreset(p.id)}
                  className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-400 active:bg-red-100 active:text-red-500 flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Weight input + result row */}
              <div className="flex items-center gap-2 px-3 pb-3">
                {/* Weight */}
                <div className="flex-shrink-0 w-24">
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-dark-border rounded-xl overflow-hidden focus-within:border-slate-200 dark:focus-within:border-slate-600 transition-colors">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={weights[p.id] || ''}
                      onChange={e => setWeights(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="0.0"
                      className="w-0 flex-1 py-2 px-2 bg-transparent text-sm font-black text-slate-700 dark:text-white outline-none text-center appearance-none"
                      style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' } as any}
                    />
                    <span className="pr-2 text-[10px] font-black text-slate-400 flex-shrink-0">kg</span>
                  </div>
                </div>

                {/* Result */}
                <div className="flex-1 min-w-0">
                  {!drug ? (
                    <p className="text-[10px] font-bold text-slate-400 text-center">
                      {ar ? 'جاري التحميل...' : 'Loading...'}
                    </p>
                  ) : w <= 0 ? (
                    <p className="text-[11px] font-bold text-slate-400 text-center">
                      {ar ? 'أدخل الوزن' : 'Enter weight'}
                    </p>
                  ) : result?.kind === 'fixed' ? (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      className="w-full text-[10px] font-black text-indigo-600 dark:text-indigo-400 text-center bg-indigo-50 dark:bg-indigo-900/20 rounded-xl py-2 active:scale-95"
                    >
                      📌 {ar ? 'جرعة ثابتة · اضغط' : 'Fixed dose · tap'}
                    </button>
                  ) : result?.kind === 'calc' ? (
                    <div className="flex items-center gap-2">
                      {/* ml / mg */}
                      {result.isSupp ? (
                        <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-xl py-2 text-center">
                          <p className="text-[14px] font-black text-purple-600">{result.doseMg.toFixed(0)}<span className="text-[10px] font-bold mr-0.5">mg</span></p>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 bg-teal-50 dark:bg-teal-900/20 rounded-xl py-2 text-center">
                            <p className="text-[15px] font-black text-teal-600">{result.doseML.toFixed(1)}<span className="text-[10px] font-bold mr-0.5">ml</span></p>
                          </div>
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl py-2 text-center">
                            <p className="text-[13px] font-black text-slate-600 dark:text-slate-300">{result.doseMg.toFixed(0)}<span className="text-[10px] font-bold mr-0.5">mg</span></p>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-slate-400 text-center">—</p>
                  )}
                </div>

                {/* Open calc */}
                <button
                  onClick={() => onOpenCalc(p.active)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 active:scale-95"
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>

              {/* Frequency + duration row (تظهر لما يبقى فيه نتيجة) */}
              {result?.kind === 'calc' && w > 0 && drug && (
                <div className="flex items-center gap-3 px-3 pb-3 -mt-1">
                  {result.capped && (
                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                      ⚠️ {ar ? 'وصلت للحد الأقصى' : 'Max dose reached'}
                    </span>
                  )}
                  {drug.frequency && (
                    <span className="text-[9px] font-black text-slate-500">
                      🕐 {drug.frequency}
                    </span>
                  )}
                </div>
              )}

              {/* Expanded fixed dose cases */}
              {isExpanded && result?.kind === 'fixed' && (
                <div className="px-3 pb-3 space-y-1.5 border-t border-slate-100 dark:border-dark-border pt-2 mt-1">
                  {result.text.split(',').map((c, i) => (
                    <p key={i} className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                      • {c.trim()}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PediatricPresetBar;
