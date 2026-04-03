import React, { useState, useMemo, useEffect } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────
interface DrugEntry {
  active: string;
  conc_mg: number;
  conc_ml: number;
  dose_mg_kg: number;
  frequency: string;
  notes: string;
  form: 'Syrup' | 'Suppository' | string;
  display: string;
}

interface WeightEntry { age: string; weight: number; }

// ── R2 Fetch + localStorage Cache ───────────────────────────────────────────
const R2_URL = 'https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/pediatric-drugs.json';

// Max single dose per active ingredient (from Excel)
const MAX_DOSE_MAP: Record<string, number> = {"paracetamol":1000,"paracetamol suppository":1000,"diclofenac (rofinac) supp":50,"ibuprofen":400,"amoxicillin":1000,"amoxicillin/clavulanate":875,"amoxicillin/clavulanate (es)":1000,"azithromycin":500,"cefdinir":600,"cefixime":400,"cephalexin":1000,"clarithromycin":500,"metronidazole":750,"trimethoprim/sulfamethoxazole":160,"cetirizine":10,"loratadine":10,"desloratadine":5,"fexofenadine":60,"diphenhydramine":50,"salbutamol":4,"prednisolone":60,"dexamethasone":16,"domperidone":10,"ondansetron":8,"simethicone":80,"iron polymaltose":100,"ferrous sulfate (drops)":125,"vitamin d3 (drops)":1000,"zinc":20,"ambroxol (ambolar)":30,"guaifenesin":400,"chlorpheniramine":4,"nifuroxazide":220,"furazolidone":100,"albendazole":400,"mebendazole":100,"nitazoxanide":500,"ketotifen":1,"hydroxyzine":25,"cefadroxil":1000};
const CACHE_KEY = 'ps_pediatric_drugs_v2';

async function fetchPediatricData(): Promise<{ drugs: DrugEntry[]; weightChart: WeightEntry[] }> {
  // جرب الـ cache أولاً
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  // جيب من R2
  const res = await fetch(R2_URL);
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
  return data;
}


// Static set للـ MedicineDetail matching — مش محتاج fetch
export const PEDIATRIC_DRUG_NAMES = new Set([
  'paracetamol','ibuprofen','amoxicillin','amoxicillin/clavulanate','amoxicillin/clavulanate (es)',
  'azithromycin','cefdinir','cefixime','cephalexin','clarithromycin','metronidazole',
  'trimethoprim/sulfamethoxazole','cetirizine','loratadine','desloratadine','fexofenadine',
  'diphenhydramine','salbutamol','prednisolone','dexamethasone','domperidone','ondansetron',
  'simethicone','iron polymaltose','ferrous sulfate (drops)','vitamin d3 (drops)','zinc',
  'ambroxol','guaifenesin','chlorpheniramine','nifuroxazide','furazolidone','albendazole',
  'mebendazole','nitazoxanide','ketotifen','hydroxyzine','cefadroxil','spironolactone','furosemide','diclofenac (rofinac) supp','diclofenac'
]);

interface Props {
  onClose: () => void;
  initialDrugName?: string;
  language?: 'ar' | 'en';
}

const PediatricDoseCalculator: React.FC<Props> = ({ onClose, initialDrugName, language = 'ar' }) => {
  const ar = language === 'ar';

  // ── Data from R2 ───────────────────────────────────────────────────────────
  const [drugs, setDrugs] = useState<DrugEntry[]>([]);
  const [weightChart, setWeightChart] = useState<WeightEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    fetchPediatricData()
      .then(data => { setDrugs(data.drugs); setWeightChart(data.weightChart); setDataLoading(false); })
      .catch(() => { setDataError(true); setDataLoading(false); });
  }, []);

  useEffect(() => {
    if (!initialDrugName || !drugs.length || selectedActive) return;
    const lower = initialDrugName.toLowerCase();
    const match = Array.from(new Set(drugs.map(d => d.active)))
      .find(a => a.toLowerCase().includes(lower) || lower.includes(a.toLowerCase()));
    if (match) setSelectedActive(match);
  }, [drugs, initialDrugName]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [inputMode, setInputMode] = useState<'weight' | 'age'>('weight');
  const [weight, setWeight] = useState('');
  const [selectedAge, setSelectedAge] = useState('');
  const [selectedActive, setSelectedActive] = useState('');
  const [selectedDrugIdx, setSelectedDrugIdx] = useState<number | null>(null);

  // تحديث التركيز لما تتغير المادة الفعالة
  const activeIngredients = useMemo(() => Array.from(new Set(drugs.map(d => d.active))), [drugs]);
  const concentrations = useMemo(
    () => drugs.filter(d => d.active === selectedActive),
    [drugs, selectedActive]
  );

  // لو التركيز واحد بس → يتحدد تلقائي، لو أكتر → صفّر الاختيار
  useEffect(() => {
    if (concentrations.length === 1) {
      setSelectedDrugIdx(drugs.indexOf(concentrations[0]));
    } else if (concentrations.length > 1) {
      setSelectedDrugIdx(null);
    }
  }, [concentrations]);

  // الدواء المختار
  const drug = selectedDrugIdx !== null ? drugs[selectedDrugIdx] : null;

  // الوزن الفعلي المستخدم في الحساب
  const effectiveWeight = useMemo(() => {
    if (inputMode === 'weight') return parseFloat(weight) || 0;
    const entry = weightChart.find(w => w.age === selectedAge);
    return entry?.weight || 0;
  }, [inputMode, weight, selectedAge]);

  // الحساب مع تطبيق Max Dose
  const result = useMemo(() => {
    if (!drug || effectiveWeight <= 0) return null;
    const rawDoseMg = drug.dose_mg_kg * effectiveWeight;
    // جيب الـ max من الـ map أو من الـ drug نفسه
    const maxFromMap = MAX_DOSE_MAP[drug.active.toLowerCase()];
    const maxDoseMg = maxFromMap ?? Infinity;
    const capped = rawDoseMg > maxDoseMg;
    const doseMg = Math.min(rawDoseMg, maxDoseMg);
    const doseML = (doseMg / drug.conc_mg) * drug.conc_ml;
    const concPerML = drug.conc_mg / drug.conc_ml;
    return { doseMg, doseML, concPerML, capped, maxDoseMg, rawDoseMg };
  }, [drug, effectiveWeight]);

  // تحذير لو اتطبق الحد الأقصى
  const maxWarning = useMemo(() => {
    if (!result) return null;
    if (result.capped) return `الجرعة المحسوبة (${result.rawDoseMg.toFixed(1)}mg) تجاوزت الحد الأقصى — تم تحديدها بـ ${result.maxDoseMg}mg`;
    return null;
  }, [result]);

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-dark-card rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-teal-500 to-cyan-500 px-5 pt-5 pb-6">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/30 rounded-full" />
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 active:scale-90 transition-transform">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl">👶</div>
            <div>
              <h2 className="text-white font-black text-base">{ar ? 'حاسبة جرعات الأطفال' : 'Pediatric Dose Calculator'}</h2>
              <p className="text-white/70 text-[10px] font-bold mt-0.5">{ar ? 'للأطفال من الولادة حتى 12 سنة' : 'Birth to 12 years'}</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 90px)' }}>
          {dataLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-400">Loading...</p>
            </div>
          ) : dataError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 px-6">
              <span className="text-3xl">⚠️</span>
              <p className="text-xs font-bold text-slate-500 text-center">No internet connection. Please try again.</p>
              <button onClick={() => { setDataError(false); setDataLoading(true); fetchPediatricData().then(d => { setDrugs(d.drugs); setWeightChart(d.weightChart); setDataLoading(false); }).catch(() => { setDataError(true); setDataLoading(false); }); }}
                className="px-4 py-2 bg-teal-500 text-white rounded-xl text-xs font-black active:scale-95">
                Retry
              </button>
            </div>
          ) : (
          <div className="p-4 space-y-4">

            {/* Step 1 - اختيار الدواء */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                {ar ? '١ · اختر الدواء' : '1 · Select Drug'}
              </p>

              {/* المادة الفعالة */}
              <div className="mb-3">
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 px-1">
                  {ar ? 'المادة الفعالة' : 'Active Ingredient'}
                </label>
                <select
                  value={selectedActive}
                  onChange={e => { setSelectedActive(e.target.value); setSelectedDrugIdx(null); }}
                  className="w-full p-3 bg-white dark:bg-dark-card border-2 border-slate-100 dark:border-dark-border rounded-xl text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-teal-400 transition-colors"
                >
                  <option value="">{ar ? '-- اختر --' : '-- Select --'}</option>
                  {activeIngredients.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* التركيز */}
              {concentrations.length > 0 && (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1.5 px-1">
                    {ar ? 'التركيز' : 'Concentration'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {concentrations.map((d, i) => {
                      const globalIdx = drugs.indexOf(d);
                      const selected = selectedDrugIdx === globalIdx;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedDrugIdx(globalIdx)}
                          className={`p-3 rounded-xl border-2 text-[11px] font-black transition-all active:scale-95 ${
                            selected
                              ? (d.form === 'Suppository' ? 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-200' : 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-200')
                              : 'bg-white dark:bg-dark-card border-slate-100 dark:border-dark-border text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {d.conc_mg}mg
                          <span className={`block text-[9px] mt-0.5 ${selected ? 'opacity-80' : 'opacity-50'}`}>
                            {d.form === 'Suppository' ? '🕯️ Supp' : `/ ${d.conc_ml}ml`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 - الوزن أو العمر */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                {ar ? '٢ · أدخل الوزن أو العمر' : '2 · Weight or Age'}
              </p>

              {/* Toggle */}
              <div className="flex bg-slate-200 dark:bg-slate-700 rounded-xl p-1 mb-3">
                {(['weight','age'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setInputMode(m)}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-black transition-all ${
                      inputMode === m
                        ? 'bg-white dark:bg-dark-card text-teal-600 shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    {m === 'weight' ? (ar ? '⚖️ الوزن' : '⚖️ Weight') : (ar ? '🎂 العمر' : '🎂 Age')}
                  </button>
                ))}
              </div>

              {inputMode === 'weight' ? (
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder={ar ? 'مثال: 12.5' : 'e.g. 12.5'}
                    className="w-full p-4 bg-white dark:bg-dark-card border-2 border-slate-100 dark:border-dark-border rounded-xl text-lg font-black text-slate-700 dark:text-white outline-none focus:border-teal-400 transition-colors pr-16"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">kg</span>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    {weightChart.map(w => (
                      <button
                        key={w.age}
                        onClick={() => setSelectedAge(w.age)}
                        className={`p-2.5 rounded-xl border-2 text-[10px] font-black transition-all active:scale-95 ${
                          selectedAge === w.age
                            ? 'bg-teal-500 border-teal-500 text-white'
                            : 'bg-white dark:bg-dark-card border-slate-100 dark:border-dark-border text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {w.age}
                        <span className="block text-[9px] opacity-70 mt-0.5">{w.weight} kg</span>
                      </button>
                    ))}
                  </div>
                  {selectedAge && (
                    <p className="text-[10px] text-teal-600 font-bold mt-2 px-1">
                      {ar ? `متوسط الوزن المستخدم: ${weightChart.find(w=>w.age===selectedAge)?.weight} kg` : `Using avg weight: ${weightChart.find(w=>w.age===selectedAge)?.weight} kg`}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* النتيجة */}
            {result && drug && (
              <div className={`rounded-2xl p-5 border-2 ${maxWarning ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700' : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 dark:from-teal-900/20 dark:to-cyan-900/20 dark:border-teal-700'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{maxWarning ? '⚠️' : '✅'}</span>
                  <p className="text-[10px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest">
                    {ar ? 'الجرعة المحسوبة' : 'Calculated Dose'}
                  </p>
                </div>

                {/* الجرعة الرئيسية */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {drug.form === 'Suppository' ? (
                    <>
                      <div className="bg-white dark:bg-dark-card rounded-xl p-3 text-center shadow-sm col-span-2">
                        <p className="text-3xl font-black text-purple-600">{result.doseMg.toFixed(0)} mg</p>
                        <p className="text-[10px] font-black text-slate-400 mt-1">🕯️ Suppository dose</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white dark:bg-dark-card rounded-xl p-3 text-center shadow-sm">
                        <p className="text-2xl font-black text-teal-600">{result.doseML.toFixed(1)}</p>
                        <p className="text-[10px] font-black text-slate-400 mt-1">ml</p>
                      </div>
                      <div className="bg-white dark:bg-dark-card rounded-xl p-3 text-center shadow-sm">
                        <p className="text-2xl font-black text-slate-700 dark:text-white">{result.doseMg.toFixed(1)}</p>
                        <p className="text-[10px] font-black text-slate-400 mt-1">mg</p>
                      </div>
                    </>
                  )}
                </div>

                {/* التفاصيل */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-teal-100 dark:border-teal-800/40">
                    <span className="text-[11px] font-bold text-slate-500">{ar ? 'التكرار' : 'Frequency'}</span>
                    <span className="text-[11px] font-black text-slate-700 dark:text-white">{drug.frequency}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-teal-100 dark:border-teal-800/40">
                    <span className="text-[11px] font-bold text-slate-500">{ar ? 'الوزن المستخدم' : 'Weight used'}</span>
                    <span className="text-[11px] font-black text-slate-700 dark:text-white">{effectiveWeight} kg</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[11px] font-bold text-slate-500">{ar ? 'الجرعة بالكيلو' : 'Dose/kg'}</span>
                    <span className="text-[11px] font-black text-slate-700 dark:text-white">{drug.dose_mg_kg} mg/kg</span>
                  </div>
                </div>

                {/* Notes */}
                {drug.notes && (
                  <div className={`mt-3 p-3 rounded-xl text-[10px] font-bold ${maxWarning ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'}`}>
                    {maxWarning ? `⚠️ ${maxWarning} · ` : '📋 '}{drug.notes}
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-[9px] text-slate-400 text-center px-2 pb-8">
              {ar
                ? '⚕️ هذه الأداة للإرشاد فقط. يجب مراجعة الطبيب أو الصيدلاني قبل إعطاء أي دواء.'
                : '⚕️ For guidance only. Always consult a physician or pharmacist before administering medication.'}
            </p>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PediatricDoseCalculator;
