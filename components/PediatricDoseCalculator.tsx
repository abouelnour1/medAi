import React, { useState, useMemo, useEffect } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────
interface DrugEntry {
  active: string;
  conc_mg: number | null;
  conc_ml: number | null;
  fixed_dose: string | null;
  dose_mg_kg_min: number | null;
  dose_mg_kg_max: number | null;
  max_mg_kg_day: number | null;
  max_single_dose_mg: number | null;
  frequency: string;
  notes: string;
  form: 'Syrup' | 'Suppository' | string;
  display: string;
}

interface WeightEntry { age: string; weight: number; }

interface IndicationEntry {
  disease: string;
  dosage_form: string | null;
  condition: string | null;
  condition_2: string | null;
  fixed_dose: string | null;
  dose_mg_kg_min: number | null;
  dose_mg_kg_max: number | null;
  frequency: string;
  duration: string;
  max_mg_kg_day: number | string | null;
  max_single_dose_mg: number | string | null;
  notes: string;
}

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
  customImage?: string | null; // URL اختياري يضيفه المستخدم
}

const PRESET_KEY = 'ps_ped_presets_v1';
const MAX_PRESETS = 5;

function loadPresets(): DrugPreset[] {
  try { return JSON.parse(localStorage.getItem(PRESET_KEY) || '[]'); } catch { return []; }
}
function savePresets(p: DrugPreset[]) {
  try { localStorage.setItem(PRESET_KEY, JSON.stringify(p)); } catch {}
}

// ── R2 Fetch + localStorage Cache ───────────────────────────────────────────
const R2_URL = 'https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/pediatric-drugs.json';
const CACHE_KEY = 'ps_pediatric_drugs_v4';

async function fetchPediatricData(): Promise<{
  drugs: DrugEntry[];
  weightChart: WeightEntry[];
  specialIndications: Record<string, IndicationEntry[]>;
}> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  const res = await fetch(R2_URL);
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  if (!data.specialIndications) data.specialIndications = {};
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
  return data;
}

// Static set للـ MedicineDetail matching — مش محتاج fetch
export const PEDIATRIC_DRUG_NAMES = new Set([
  'paracetamol','ibuprofen','amoxicillin','amoxicillin/clavulanate','amoxicillin/clavulanate (es)',
  'amoxicillin,clavulanate','amoxicillin, clavulanate','amoxicillin,clavulanic acid',
  'azithromycin','cefdinir','cefixime','cephalexin','clarithromycin','metronidazole',
  'trimethoprim/sulfamethoxazole','trimethoprim,sulfamethoxazole','cetirizine','loratadine',
  'desloratadine','fexofenadine','diphenhydramine','salbutamol','prednisolone','dexamethasone',
  'domperidone','ondansetron','simethicone','iron polymaltose','ferrous sulfate','ferrous sulfate (drops)',
  'vitamin d3','vitamin d3 (drops)','cholecalciferol','zinc',
  'ambroxol','guaifenesin','chlorpheniramine','nifuroxazide','furazolidone','albendazole',
  'mebendazole','nitazoxanide','ketotifen','hydroxyzine','cefadroxil',
  'spironolactone','furosemide','diclofenac (rofinac) supp','diclofenac',
]);

interface Props {
  onClose: () => void;
  initialDrugName?: string;
  language?: 'ar' | 'en';
}

// Normalize active name for indication lookup
const normalizeActive = (s: string) => s.toLowerCase().trim()
  .replace(/\s*\/\s*/g, ',')
  .replace(/\s+/g, ' ');

const PediatricDoseCalculator: React.FC<Props> = ({ onClose, initialDrugName, language = 'ar' }) => {
  const ar = language === 'ar';

  // ── Data from R2 ───────────────────────────────────────────────────────────
  const [drugs, setDrugs] = useState<DrugEntry[]>([]);
  const [weightChart, setWeightChart] = useState<WeightEntry[]>([]);
  const [specialIndications, setSpecialIndications] = useState<Record<string, IndicationEntry[]>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    fetchPediatricData()
      .then(data => {
        setDrugs(data.drugs);
        setWeightChart(data.weightChart);
        setSpecialIndications(data.specialIndications || {});
        setDataLoading(false);
      })
      .catch(() => { setDataError(true); setDataLoading(false); });
  }, []);

  // ── State ──────────────────────────────────────────────────────────────────
  const [inputMode, setInputMode] = useState<'weight' | 'age'>('weight');
  const [weight, setWeight] = useState('');
  const [selectedAge, setSelectedAge] = useState('');
  const [selectedActive, setSelectedActive] = useState('');
  const [selectedDrugIdx, setSelectedDrugIdx] = useState<number | null>(null);
  const [doseLevel, setDoseLevel] = useState<DoseLevel>('min');
  const [useIndication, setUseIndication] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [selectedCondition2, setSelectedCondition2] = useState<string | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<string | null>(null);
  const [presets, setPresets] = useState<DrugPreset[]>(loadPresets);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [presetLabel, setPresetLabel] = useState('');
  const [presetImageUrl, setPresetImageUrl] = useState('');

  useEffect(() => {
    if (!initialDrugName || !drugs.length || selectedActive) return;
    const lower = initialDrugName.toLowerCase()
      .replace(/,\s*/g, ',')
      .replace('clavulanic acid', 'clavulanate')
      .replace('cholecalciferol', 'vitamin d3');
    const match = Array.from(new Set(drugs.map(d => d.active)))
      .find(a => {
        const aNorm = a.toLowerCase().replace(/,\s*/g, ',').replace('clavulanic acid', 'clavulanate');
        return aNorm.includes(lower) || lower.includes(aNorm);
      });
    if (match) setSelectedActive(match);
  }, [drugs, initialDrugName]);

  const activeIngredients = useMemo(() => Array.from(new Set(drugs.map(d => d.active))), [drugs]);
  const concentrations = useMemo(
    () => drugs.filter(d => d.active === selectedActive),
    [drugs, selectedActive]
  );

  // Auto-select إذا تركيز واحد
  useEffect(() => {
    if (concentrations.length === 1) {
      setSelectedDrugIdx(drugs.indexOf(concentrations[0]));
    } else if (concentrations.length > 1) {
      setSelectedDrugIdx(null);
    }
  }, [concentrations]);

  // رجّع حالة الـ indication لما المادة الفعالة تتغير
  useEffect(() => {
    setUseIndication(false);
    setSelectedCondition(null);
    setSelectedCondition2(null);
    setSelectedDisease(null);
  }, [selectedActive]);

  // هل المادة الفعالة فيها special indications؟
  const availableIndications = useMemo(() => {
    if (!selectedActive) return [];
    const key = normalizeActive(selectedActive);
    return specialIndications[key] || [];
  }, [selectedActive, specialIndications]);

  const hasIndications = availableIndications.length > 0;

  // Conditions متاحة للمرض المختار
  const availableConditions = useMemo(() => {
    if (!selectedDisease) return [];
    const matches = availableIndications.filter(i => i.disease === selectedDisease);
    const conds = matches.filter(m => m.condition).map(m => m.condition!);
    return Array.from(new Set(conds));
  }, [selectedDisease, availableIndications]);

  // condition_2 متاحة بعد اختيار condition
  const availableConditions2 = useMemo(() => {
    if (!selectedDisease || !selectedCondition) return [];
    const matches = availableIndications.filter(
      i => i.disease === selectedDisease && i.condition === selectedCondition
    );
    const conds2 = matches.filter(m => m.condition_2).map(m => m.condition_2!);
    return Array.from(new Set(conds2));
  }, [selectedDisease, selectedCondition, availableIndications]);

  // الـ indication النهائي
  const finalIndication = useMemo<IndicationEntry | null>(() => {
    if (!useIndication || !selectedDisease) return null;
    const matches = availableIndications.filter(i => i.disease === selectedDisease);
    if (matches.length === 0) return null;
    // بدون conditions → أول نتيجة
    if (matches.length === 1 && !matches[0].condition) return matches[0];
    // عنده condition → لازم يتختار
    if (!selectedCondition) return null;
    const byCondition = matches.filter(m => m.condition === selectedCondition);
    if (byCondition.length === 0) return null;
    // condition_2؟
    if (availableConditions2.length > 0) {
      if (!selectedCondition2) return null;
      return byCondition.find(m => m.condition_2 === selectedCondition2) || null;
    }
    return byCondition[0];
  }, [useIndication, selectedDisease, selectedCondition, selectedCondition2, availableConditions2, availableIndications]);

  // Auto-select condition لو واحد بس
  useEffect(() => {
    setSelectedCondition(availableConditions.length === 1 ? availableConditions[0] : null);
  }, [selectedDisease]);

  // Reset condition_2 لما condition تتغير، وauto-select لو واحد
  useEffect(() => {
    setSelectedCondition2(availableConditions2.length === 1 ? availableConditions2[0] : null);
  }, [selectedCondition]);

  const drug = selectedDrugIdx !== null ? drugs[selectedDrugIdx] : null;

  // الوزن الفعلي
  const effectiveWeight = useMemo(() => {
    if (inputMode === 'weight') return parseFloat(weight) || 0;
    const entry = weightChart.find(w => w.age === selectedAge);
    return entry?.weight || 0;
  }, [inputMode, weight, selectedAge]);

  // مصدر الجرعة: إما indication أو drug الأساسي
  const doseSource = useMemo(() => {
    // لو الـ indication active، استخدمه
    if (finalIndication) {
      return {
        fixed_dose: finalIndication.fixed_dose,
        dose_min: finalIndication.dose_mg_kg_min,
        dose_max: finalIndication.dose_mg_kg_max,
        max_mg_kg_day: finalIndication.max_mg_kg_day,
        max_single_dose_mg: finalIndication.max_single_dose_mg,
        frequency: finalIndication.frequency,
        duration: finalIndication.duration,
        notes: finalIndication.notes,
        isIndication: true,
      };
    }
    if (!drug) return null;
    return {
      fixed_dose: drug.fixed_dose,
      dose_min: drug.dose_mg_kg_min,
      dose_max: drug.dose_mg_kg_max,
      max_mg_kg_day: drug.max_mg_kg_day,
      max_single_dose_mg: drug.max_single_dose_mg,
      frequency: drug.frequency,
      duration: '',
      notes: drug.notes,
      isIndication: false,
    };
  }, [drug, finalIndication]);

  // هل الجرعة رينج؟
  const isRange = useMemo(() => {
    if (!doseSource) return false;
    return doseSource.dose_min !== null && doseSource.dose_max !== null && doseSource.dose_min !== doseSource.dose_max;
  }, [doseSource]);

  // اختار الـ dose/kg حسب مستوى المستخدم
  const pickedDosePerKg = useMemo<number | null>(() => {
    if (!doseSource) return null;
    const { dose_min, dose_max } = doseSource;
    if (dose_min === null && dose_max === null) return null;
    if (dose_min !== null && dose_max === null) return dose_min;
    if (dose_min === null && dose_max !== null) return dose_max;
    // both present
    if (doseLevel === 'min') return dose_min!;
    if (doseLevel === 'max') return dose_max!;
    return (dose_min! + dose_max!) / 2; // mid
  }, [doseSource, doseLevel]);

  // الحساب
  const result = useMemo(() => {
    if (!doseSource || !drug) return null;

    // Fixed dose → لا حساب
    if (doseSource.fixed_dose && doseSource.fixed_dose.trim()) {
      // ممكن يبقى فيه حالات متعددة مفصولة بـ ,
      const cases = doseSource.fixed_dose.split(',').map(s => s.trim()).filter(Boolean);
      return {
        kind: 'fixed' as const,
        cases,
      };
    }

    if (effectiveWeight <= 0 || pickedDosePerKg === null) return null;

    const rawDoseMg = pickedDosePerKg * effectiveWeight;
    const maxSingleRaw = doseSource.max_single_dose_mg;
    const maxSingle = typeof maxSingleRaw === 'number' ? maxSingleRaw : Infinity;
    const capped = rawDoseMg > maxSingle;
    const doseMg = Math.min(rawDoseMg, maxSingle);
    const doseML = (drug.conc_mg && drug.conc_ml) ? (doseMg / drug.conc_mg) * drug.conc_ml : 0;

    return {
      kind: 'calc' as const,
      doseMg,
      doseML,
      capped,
      maxSingle,
      rawDoseMg,
      usedPerKg: pickedDosePerKg,
    };
  }, [doseSource, drug, effectiveWeight, pickedDosePerKg]);

  const maxWarning = useMemo(() => {
    if (!result || result.kind !== 'calc' || !result.capped) return null;
    return ar
      ? `الجرعة المحسوبة (${result.rawDoseMg.toFixed(1)}mg) تجاوزت الحد الأقصى — تم تحديدها بـ ${result.maxSingle}mg`
      : `Calculated dose (${result.rawDoseMg.toFixed(1)}mg) exceeded max — capped at ${result.maxSingle}mg`;
  }, [result, ar]);

  // Unique diseases للمادة الفعالة المختارة
  const uniqueDiseases = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const ind of availableIndications) {
      if (!seen.has(ind.disease)) {
        seen.add(ind.disease);
        list.push(ind.disease);
      }
    }
    return list;
  }, [availableIndications]);

  const canSave = !!selectedActive && selectedDrugIdx !== null;

  const applyPreset = (p: DrugPreset) => {
    setSelectedActive(p.active);
    setSelectedDrugIdx(p.drugIdx);
    setDoseLevel(p.doseLevel);
    setUseIndication(p.useIndication);
    setSelectedDisease(p.disease);
    setSelectedCondition(p.condition);
    setSelectedCondition2(p.condition2);
    setWeight('');
    setSelectedAge('');
  };

  const savePreset = () => {
    const label = presetLabel.trim() || selectedActive;
    const newPreset: DrugPreset = {
      id: Date.now().toString(),
      label,
      active: selectedActive,
      drugIdx: selectedDrugIdx,
      doseLevel,
      useIndication,
      disease: selectedDisease,
      condition: selectedCondition,
      condition2: selectedCondition2,
      customImage: presetImageUrl.trim() || null,
    };
    const updated = [newPreset, ...presets].slice(0, MAX_PRESETS);
    setPresets(updated);
    savePresets(updated);
    setShowSavePrompt(false);
    setPresetLabel('');
    setPresetImageUrl('');
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    savePresets(updated);
  };

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
              <button onClick={() => { setDataError(false); setDataLoading(true); fetchPediatricData().then(d => { setDrugs(d.drugs); setWeightChart(d.weightChart); setSpecialIndications(d.specialIndications || {}); setDataLoading(false); }).catch(() => { setDataError(true); setDataLoading(false); }); }}
                className="px-4 py-2 bg-teal-500 text-white rounded-xl text-xs font-black active:scale-95">
                Retry
              </button>
            </div>
          ) : (
          <div className="p-4 space-y-4">

            {/* Presets Bar */}
            {(presets.length > 0 || canSave) && (
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {ar ? 'الإعدادات المحفوظة' : 'Saved Presets'}
                  </p>
                  {presets.length < MAX_PRESETS && canSave && !showSavePrompt && (
                    <button
                      onClick={() => { setPresetLabel(selectedActive); setShowSavePrompt(true); }}
                      className="flex items-center gap-1 text-[10px] font-black text-teal-600 active:scale-95"
                    >
                      <span className="text-base leading-none">+</span>
                      {ar ? 'حفظ' : 'Save'}
                    </button>
                  )}
                </div>

                {/* Save prompt */}
                {showSavePrompt && (
                  <div className="space-y-2 mb-2">
                    <div className="flex gap-2">
                      <input
                        value={presetLabel}
                        onChange={e => setPresetLabel(e.target.value)}
                        placeholder={ar ? 'اسم الـ Preset' : 'Preset name'}
                        className="flex-1 px-3 py-2 bg-white dark:bg-dark-card border-2 border-teal-300 rounded-xl text-xs font-bold text-slate-700 dark:text-white outline-none"
                      />
                      <button onClick={savePreset} className="px-3 py-2 bg-teal-500 text-white rounded-xl text-xs font-black active:scale-95">
                        {ar ? 'حفظ' : 'Save'}
                      </button>
                      <button onClick={() => { setShowSavePrompt(false); setPresetImageUrl(''); }} className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black active:scale-95">
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {presetImageUrl.trim() && (
                        <img src={presetImageUrl} alt="" className="w-8 h-8 rounded-lg object-contain bg-slate-100 flex-shrink-0" onError={e => (e.currentTarget.style.display = 'none')} />
                      )}
                      <input
                        value={presetImageUrl}
                        onChange={e => setPresetImageUrl(e.target.value)}
                        placeholder={ar ? 'رابط صورة الدواء (اختياري)' : 'Medicine image URL (optional)'}
                        className="flex-1 px-3 py-2 bg-white dark:bg-dark-card border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Preset chips */}
                {presets.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                    {presets.map(p => (
                      <div
                        key={p.id}
                        className="flex-shrink-0 flex items-center gap-1.5 bg-white dark:bg-dark-card border-2 border-slate-100 dark:border-dark-border rounded-xl pl-3 pr-1.5 py-2 active:scale-95 transition-transform cursor-pointer"
                        onClick={() => applyPreset(p)}
                      >
                        <div>
                          <p className="text-[11px] font-black text-slate-700 dark:text-white whitespace-nowrap">{p.label}</p>
                          {p.disease && (
                            <p className="text-[9px] font-bold text-indigo-500 whitespace-nowrap truncate max-w-[100px]">🎯 {p.disease}</p>
                          )}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); deletePreset(p.id); }}
                          className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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

              {/* Advanced: Special Indication */}
              {hasIndications && (
                <div className="mb-3 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl p-3">
                  <button
                    onClick={() => { setUseIndication(!useIndication); setSelectedDisease(null); setSelectedCondition(null); setSelectedCondition2(null); }}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🎯</span>
                      <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-300">
                        {ar ? 'متقدم · اختر التشخيص' : 'Advanced · Select Diagnosis'}
                      </span>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-colors ${useIndication ? 'bg-indigo-500' : 'bg-slate-300'} relative`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${useIndication ? 'left-5' : 'left-0.5'}`} />
                    </div>
                  </button>

                  {useIndication && (
                    <div className="mt-3 space-y-2">
                      <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-300 px-1">
                        {ar ? 'التشخيص / المرض' : 'Diagnosis / Disease'}
                      </label>
                      <select
                        value={selectedDisease || ''}
                        onChange={e => { setSelectedDisease(e.target.value || null); setSelectedCondition(null); setSelectedCondition2(null); }}
                        className="w-full p-2.5 bg-white dark:bg-dark-card border-2 border-indigo-200 dark:border-indigo-700 rounded-xl text-xs font-bold text-slate-700 dark:text-white outline-none focus:border-indigo-400 transition-colors"
                      >
                        <option value="">{ar ? '-- اختر المرض --' : '-- Select disease --'}</option>
                        {uniqueDiseases.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>

                      {/* Condition */}
                      {availableConditions.length > 1 && (
                        <>
                          <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-300 px-1 mt-2">
                            {ar ? 'الحالة' : 'Condition'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {availableConditions.map(c => (
                              <button
                                key={c}
                                onClick={() => { setSelectedCondition(c); setSelectedCondition2(null); }}
                                className={`p-2 rounded-lg border-2 text-[10px] font-black transition-all active:scale-95 ${
                                  selectedCondition === c
                                    ? 'bg-indigo-500 border-indigo-500 text-white'
                                    : 'bg-white dark:bg-dark-card border-indigo-200 dark:border-indigo-700 text-slate-700 dark:text-white'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Condition 2 */}
                      {availableConditions2.length > 1 && (
                        <>
                          <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-300 px-1 mt-2">
                            {ar ? 'تفاصيل إضافية' : 'Additional detail'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {availableConditions2.map(c => (
                              <button
                                key={c}
                                onClick={() => setSelectedCondition2(c)}
                                className={`p-2 rounded-lg border-2 text-[10px] font-black transition-all active:scale-95 ${
                                  selectedCondition2 === c
                                    ? 'bg-purple-500 border-purple-500 text-white'
                                    : 'bg-white dark:bg-dark-card border-indigo-200 dark:border-indigo-700 text-slate-700 dark:text-white'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

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

            {/* Step 2 - الوزن أو العمر (مخفي لو fixed_dose) */}
            {!(doseSource?.fixed_dose) && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  {ar ? '٢ · أدخل الوزن أو العمر' : '2 · Weight or Age'}
                </p>

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
                      className="w-full py-4 px-4 bg-white dark:bg-dark-card border-2 border-slate-100 dark:border-dark-border rounded-xl text-lg font-black text-slate-700 dark:text-white outline-none focus:border-teal-400 transition-colors"
                      style={{ paddingLeft: '3rem' }}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none bg-white dark:bg-dark-card px-1">kg</span>
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

                {/* Dose Level Selector (min/mid/max) — يطلع بس لو رينج */}
                {isRange && doseSource && (
                  <div className="mt-3">
                    <p className="text-[10px] font-black text-slate-500 mb-1.5 px-1">
                      {ar ? 'مستوى الجرعة' : 'Dose Level'}
                      <span className="text-[9px] font-bold text-slate-400 mr-1">
                        ({doseSource.dose_min}–{doseSource.dose_max} mg/kg)
                      </span>
                    </p>
                    <div className="flex bg-slate-200 dark:bg-slate-700 rounded-xl p-1">
                      {(['min','mid','max'] as const).map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => setDoseLevel(lvl)}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${
                            doseLevel === lvl
                              ? 'bg-white dark:bg-dark-card text-teal-600 shadow-sm'
                              : 'text-slate-500'
                          }`}
                        >
                          {lvl === 'min' ? (ar ? `أقل · ${doseSource.dose_min}` : `Min · ${doseSource.dose_min}`)
                            : lvl === 'mid' ? (ar ? `وسط · ${((doseSource.dose_min! + doseSource.dose_max!)/2).toFixed(2)}` : `Mid · ${((doseSource.dose_min! + doseSource.dose_max!)/2).toFixed(2)}`)
                            : (ar ? `أعلى · ${doseSource.dose_max}` : `Max · ${doseSource.dose_max}`)}
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 px-1">
                      {ar ? 'الافتراضي: الجرعة الأقل' : 'Default: minimum dose'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* النتيجة */}
            {result && drug && doseSource && (
              <div className={`rounded-2xl p-5 border-2 ${maxWarning ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700' : result.kind === 'fixed' ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 dark:from-indigo-900/20 dark:to-purple-900/20 dark:border-indigo-700' : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 dark:from-teal-900/20 dark:to-cyan-900/20 dark:border-teal-700'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{maxWarning ? '⚠️' : result.kind === 'fixed' ? '📌' : '✅'}</span>
                  <p className="text-[10px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest">
                    {result.kind === 'fixed' ? (ar ? 'جرعة ثابتة' : 'Fixed Dose') : (ar ? 'الجرعة المحسوبة' : 'Calculated Dose')}
                  </p>
                  {doseSource.isIndication && (
                    <span className="mr-auto bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[9px] font-black px-2 py-0.5 rounded-full">
                      🎯 {ar ? 'حسب التشخيص' : 'By Indication'}
                    </span>
                  )}
                </div>

                {/* Fixed dose → عرض نصي بالحالات */}
                {result.kind === 'fixed' ? (
                  <div className="space-y-2 mb-3">
                    {result.cases.map((c, i) => (
                      <div key={i} className="bg-white dark:bg-dark-card rounded-xl p-3 shadow-sm">
                        <p className="text-[12px] font-bold text-slate-700 dark:text-white leading-relaxed">{c}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* الجرعة الرئيسية */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {drug.form === 'Suppository' ? (
                        <div className="bg-white dark:bg-dark-card rounded-xl p-3 text-center shadow-sm col-span-2">
                          <p className="text-3xl font-black text-purple-600">{result.doseMg.toFixed(0)} mg</p>
                          <p className="text-[10px] font-black text-slate-400 mt-1">🕯️ Suppository dose</p>
                        </div>
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
                  </>
                )}

                {/* التفاصيل */}
                <div className="space-y-2">
                  {doseSource.frequency && (
                    <div className="flex items-center justify-between py-1.5 border-b border-teal-100 dark:border-teal-800/40">
                      <span className="text-[11px] font-bold text-slate-500">{ar ? 'التكرار' : 'Frequency'}</span>
                      <span className="text-[11px] font-black text-slate-700 dark:text-white">{doseSource.frequency}</span>
                    </div>
                  )}
                  {doseSource.duration && (
                    <div className="flex items-center justify-between py-1.5 border-b border-teal-100 dark:border-teal-800/40">
                      <span className="text-[11px] font-bold text-slate-500">{ar ? 'المدة' : 'Duration'}</span>
                      <span className="text-[11px] font-black text-slate-700 dark:text-white text-right max-w-[60%]">{doseSource.duration}</span>
                    </div>
                  )}
                  {result.kind === 'calc' && effectiveWeight > 0 && (
                    <div className="flex items-center justify-between py-1.5 border-b border-teal-100 dark:border-teal-800/40">
                      <span className="text-[11px] font-bold text-slate-500">{ar ? 'الوزن المستخدم' : 'Weight used'}</span>
                      <span className="text-[11px] font-black text-slate-700 dark:text-white">{effectiveWeight} kg</span>
                    </div>
                  )}
                  {result.kind === 'calc' && (
                    <div className="flex items-center justify-between py-1.5 border-b border-teal-100 dark:border-teal-800/40">
                      <span className="text-[11px] font-bold text-slate-500">{ar ? 'الجرعة بالكيلو' : 'Dose/kg'}</span>
                      <span className="text-[11px] font-black text-slate-700 dark:text-white">
                        {result.usedPerKg} mg/kg
                        {isRange && (
                          <span className="text-[9px] font-bold text-slate-400 mr-1">
                            ({doseLevel === 'min' ? (ar ? 'أقل' : 'min') : doseLevel === 'max' ? (ar ? 'أعلى' : 'max') : (ar ? 'وسط' : 'mid')})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {doseSource.max_mg_kg_day && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-[11px] font-bold text-slate-500">{ar ? 'الحد الأقصى اليومي' : 'Max daily'}</span>
                      <span className="text-[11px] font-black text-slate-700 dark:text-white">{doseSource.max_mg_kg_day} mg/kg/day</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {(doseSource.notes || maxWarning) && (
                  <div className={`mt-3 p-3 rounded-xl text-[10px] font-bold ${maxWarning ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'}`}>
                    {maxWarning ? `⚠️ ${maxWarning}${doseSource.notes ? ' · ' + doseSource.notes : ''}` : `📋 ${doseSource.notes}`}
                  </div>
                )}

                {/* Save preset button */}
                {canSave && presets.length < MAX_PRESETS && !presets.find(p => p.active === selectedActive && p.drugIdx === selectedDrugIdx && p.disease === selectedDisease) && (
                  <button
                    onClick={() => { setPresetLabel(selectedActive); setShowSavePrompt(true); window.scrollTo(0,0); }}
                    className="mt-3 w-full py-2.5 rounded-xl border-2 border-dashed border-teal-300 dark:border-teal-700 text-[11px] font-black text-teal-600 dark:text-teal-400 active:scale-95 transition-transform"
                  >
                    💾 {ar ? 'حفظ كإعداد سريع' : 'Save as Quick Preset'}
                  </button>
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
