import React, { useState, useCallback } from 'react';
import { Medicine, Language, TFunction } from '../types';

interface Props {
  mode: 'interaction' | 'dose';
  allMedicines: Medicine[];
  language: Language;
  t: TFunction;
  onClose: () => void;
  geminiApiKey?: string;
  initialMedicine?: Medicine | null;
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
  return result.text || '';
}

// ==============================
// Drug Interaction Checker
// ==============================
const InteractionChecker: React.FC<{ allMedicines: Medicine[]; language: Language; geminiApiKey?: string }> = ({ allMedicines, language, geminiApiKey }) => {
  const ar = language === 'ar';
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Medicine[]>([]);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = query.length > 1
    ? allMedicines.filter(m => m['Trade Name'].toLowerCase().includes(query.toLowerCase()) || m['Scientific Name'].toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const addMed = (m: Medicine) => {
    if (selected.length < 5 && !selected.find(s => s.RegisterNumber === m.RegisterNumber)) {
      setSelected(prev => [...prev, m]);
    }
    setQuery('');
  };

  const removeMed = (reg: string) => setSelected(prev => prev.filter(s => s.RegisterNumber !== reg));

  const check = useCallback(async () => {
    if (!geminiApiKey || selected.length < 2) return;
    setLoading(true);
    setResult('');
    const drugsList = selected.map(m => `${m['Trade Name']} (${m['Scientific Name']})`).join('\n- ');
    const prompt = ar
      ? `أنت صيدلاني سريري خبير. افحص التعاملات الدوائية بين هذه الأدوية:
- ${drugsList}

أجب بالعربية بهذا التنسيق الدقيق:
## ⚠️ التعاملات المهمة
[اذكر كل تعامل بالتفصيل أو "لا توجد تعاملات مهمة"]

## 🔴 تحذيرات خطيرة  
[أي تعاملات تهدد الحياة أو "لا يوجد"]

## 💡 توصية الصيدلاني
[ماذا يجب على الصيدلاني أن يفعل]`
      : `You are an expert clinical pharmacist. Check drug interactions between:
- ${drugsList}

Reply in this exact format:
## ⚠️ Important Interactions
[List each interaction in detail or "No significant interactions found"]

## 🔴 Critical Warnings
[Any life-threatening interactions or "None"]

## 💡 Pharmacist Recommendation
[What the pharmacist should do]`;
    try {
      const text = await callGemini(prompt, geminiApiKey);
      setResult(text);
    } catch { setResult(ar ? '❌ حدث خطأ. تحقق من اتصالك.' : '❌ Error occurred.'); }
    setLoading(false);
  }, [selected, geminiApiKey, ar]);

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-400 font-bold">
        {ar ? 'أضف من 2 إلى 5 أدوية للتحقق من التعاملات بينها' : 'Add 2-5 medicines to check interactions'}
      </p>

      {/* الأدوية المختارة */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(m => (
            <div key={m.RegisterNumber} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5">
              <span className="text-[11px] font-black text-primary">{m['Trade Name']}</span>
              <button onClick={() => removeMed(m.RegisterNumber)} className="text-primary/60 hover:text-rose-500 font-black text-xs">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* البحث */}
      {selected.length < 5 && (
        <div className="relative">
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder={ar ? `إضافة دواء (${selected.length}/5)...` : `Add medicine (${selected.length}/5)...`}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary"
          />
          {filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 mt-1 z-10 max-h-48 overflow-y-auto">
              {filtered.map(m => (
                <button key={m.RegisterNumber} onClick={() => addMed(m)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left">
                  <div className="flex-grow min-w-0">
                    <p className="text-[12px] font-black text-slate-700 dark:text-white truncate">{m['Trade Name']}</p>
                    <p className="text-[9px] text-slate-400 truncate">{m['Scientific Name']}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* زرار الفحص */}
      <button onClick={check} disabled={selected.length < 2 || loading || !geminiApiKey}
        className="w-full py-3.5 bg-primary disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2">
        {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{ar ? 'جاري الفحص...' : 'Checking...'}</> 
          : `⚖️ ${ar ? 'فحص التعاملات' : 'Check Interactions'}`}
      </button>

      {!geminiApiKey && (
        <p className="text-center text-[10px] text-amber-500 font-bold">⚠️ {ar ? 'يتطلب مفتاح Gemini API' : 'Requires Gemini API key'}</p>
      )}

      {/* النتيجة */}
      {result && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700" dir="auto">
          {result}
        </div>
      )}
    </div>
  );
};

// ==============================
// Dose Calculator
// ==============================
const DoseCalculator: React.FC<{ allMedicines: Medicine[]; language: Language; geminiApiKey?: string; initialMedicine?: Medicine | null }> = ({ allMedicines, language, geminiApiKey, initialMedicine }) => {
  const ar = language === 'ar';
  const [medicine, setMedicine] = useState<Medicine | null>(initialMedicine || null);
  const [query, setQuery] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [ageUnit, setAgeUnit] = useState<'years' | 'months'>('years');
  const [indication, setIndication] = useState('');
  const [renal, setRenal] = useState('normal');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = query.length > 1
    ? allMedicines.filter(m => m['Trade Name'].toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  const calculate = useCallback(async () => {
    if (!geminiApiKey || !medicine || !weight) return;
    setLoading(true);
    setResult('');
    const ageText = age ? `${age} ${ageUnit === 'years' ? (ar ? 'سنة' : 'years') : (ar ? 'شهر' : 'months')}` : (ar ? 'بالغ' : 'adult');
    const renalMap: Record<string, string> = {
      normal: ar ? 'طبيعي' : 'Normal',
      mild: ar ? 'قصور خفيف' : 'Mild impairment (CrCl 50-80)',
      moderate: ar ? 'قصور متوسط' : 'Moderate impairment (CrCl 30-50)',
      severe: ar ? 'قصور شديد' : 'Severe impairment (CrCl <30)',
      dialysis: ar ? 'غسيل كلى' : 'On dialysis',
    };
    const prompt = ar
      ? `أنت صيدلاني سريري. احسب الجرعة المناسبة:
الدواء: ${medicine['Trade Name']} (${medicine['Scientific Name']}) - ${medicine.Strength} ${medicine.StrengthUnit} - ${medicine.PharmaceuticalForm}
الوزن: ${weight} كجم | العمر: ${ageText} | وظائف الكلى: ${renalMap[renal]}
${indication ? `الحالة: ${indication}` : ''}

أجب بالعربية بهذا التنسيق:
## 💊 الجرعة المحسوبة
[الجرعة بالضبط]

## ⏰ جدول الجرعات
[التكرار والمدة]

## ⚠️ تعديل القصور الكلوي
[لو في تعديل مطلوب]

## 📋 تعليمات خاصة
[أي تنبيهات مهمة]`
      : `You are a clinical pharmacist. Calculate appropriate dose:
Drug: ${medicine['Trade Name']} (${medicine['Scientific Name']}) - ${medicine.Strength} ${medicine.StrengthUnit} - ${medicine.PharmaceuticalForm}
Weight: ${weight}kg | Age: ${ageText} | Renal function: ${renalMap[renal]}
${indication ? `Indication: ${indication}` : ''}

Reply in this format:
## 💊 Calculated Dose
[Exact dose]

## ⏰ Dosing Schedule
[Frequency and duration]

## ⚠️ Renal Adjustment
[If any adjustment needed]

## 📋 Special Instructions
[Any important notes]`;
    try {
      const text = await callGemini(prompt, geminiApiKey);
      setResult(text);
    } catch { setResult(ar ? '❌ حدث خطأ.' : '❌ Error occurred.'); }
    setLoading(false);
  }, [medicine, weight, age, ageUnit, indication, renal, geminiApiKey, ar]);

  return (
    <div className="space-y-4">
      {/* اختيار الدواء */}
      <div className="relative">
        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">{ar ? 'الدواء' : 'Medicine'}</label>
        {medicine ? (
          <div className="flex items-center gap-2 bg-primary/10 rounded-2xl px-4 py-3 border border-primary/20">
            <span className="font-black text-primary text-sm flex-grow">{medicine['Trade Name']}</span>
            <span className="text-[10px] text-primary/60">{medicine.Strength} {medicine.StrengthUnit}</span>
            <button onClick={() => setMedicine(null)} className="text-primary/50 hover:text-rose-500 font-black ml-1">✕</button>
          </div>
        ) : (
          <>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder={ar ? 'ابحث عن الدواء...' : 'Search medicine...'}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary" />
            {filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 mt-1 z-10">
                {filtered.map(m => (
                  <button key={m.RegisterNumber} onClick={() => { setMedicine(m); setQuery(''); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left">
                    <div className="flex-grow min-w-0">
                      <p className="text-[12px] font-black text-slate-700 dark:text-white truncate">{m['Trade Name']}</p>
                      <p className="text-[9px] text-slate-400">{m.Strength} {m.StrengthUnit} · {m.PharmaceuticalForm}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* الوزن والعمر */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">{ar ? 'الوزن (كجم)' : 'Weight (kg)'}</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">{ar ? 'العمر' : 'Age'}</label>
          <div className="flex gap-1">
            <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="25"
              className="flex-grow bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-3 text-sm outline-none focus:border-primary min-w-0" />
            <button onClick={() => setAgeUnit(u => u === 'years' ? 'months' : 'years')}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-[9px] font-black text-slate-500 whitespace-nowrap">
              {ageUnit === 'years' ? (ar ? 'سنة' : 'yr') : (ar ? 'شهر' : 'mo')}
            </button>
          </div>
        </div>
      </div>

      {/* وظائف الكلى */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">{ar ? 'وظائف الكلى' : 'Renal Function'}</label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'normal', label: ar ? 'طبيعي' : 'Normal' },
            { id: 'mild', label: ar ? 'خفيف' : 'Mild' },
            { id: 'moderate', label: ar ? 'متوسط' : 'Moderate' },
            { id: 'severe', label: ar ? 'شديد' : 'Severe' },
            { id: 'dialysis', label: ar ? 'غسيل' : 'Dialysis' },
          ].map(opt => (
            <button key={opt.id} onClick={() => setRenal(opt.id)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${renal === opt.id ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* الحالة */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">{ar ? 'الحالة المرضية (اختياري)' : 'Indication (optional)'}</label>
        <input value={indication} onChange={e => setIndication(e.target.value)}
          placeholder={ar ? 'مثال: التهاب رئوي' : 'e.g. pneumonia'}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary" />
      </div>

      <button onClick={calculate} disabled={!medicine || !weight || loading || !geminiApiKey}
        className="w-full py-3.5 bg-primary disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2">
        {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{ar ? 'جاري الحساب...' : 'Calculating...'}</> 
          : `🧮 ${ar ? 'احسب الجرعة' : 'Calculate Dose'}`}
      </button>

      {!geminiApiKey && <p className="text-center text-[10px] text-amber-500 font-bold">⚠️ {ar ? 'يتطلب مفتاح Gemini API' : 'Requires Gemini API key'}</p>}

      {result && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700" dir="auto">
          {result}
        </div>
      )}
    </div>
  );
};

// ==============================
// Main Modal
// ==============================
const DrugToolsModal: React.FC<Props> = ({ mode, allMedicines, language, t, onClose, geminiApiKey, initialMedicine }) => {
  const ar = language === 'ar';
  const [activeMode, setActiveMode] = useState<'interaction' | 'dose'>(mode);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-dark-card rounded-[2.5rem] w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-dark-border flex-shrink-0">
          <h2 className="text-base font-black text-slate-800 dark:text-white">
            {ar ? '🧪 الأدوات السريرية' : '🧪 Clinical Tools'}
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full active:scale-90 transition-all">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 px-5 py-3 border-b border-slate-100 dark:border-dark-border flex-shrink-0">
          {[
            { id: 'interaction', icon: '⚖️', label: ar ? 'تعاملات دوائية' : 'Drug Interactions' },
            { id: 'dose',        icon: '🧮', label: ar ? 'حاسبة الجرعة' : 'Dose Calculator' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveMode(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-[11px] font-black transition-all ${
                activeMode === tab.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-grow p-5">
          {activeMode === 'interaction'
            ? <InteractionChecker allMedicines={allMedicines} language={language} geminiApiKey={geminiApiKey} />
            : <DoseCalculator allMedicines={allMedicines} language={language} geminiApiKey={geminiApiKey} initialMedicine={initialMedicine} />
          }
        </div>

        {/* Disclaimer */}
        <div className="px-5 pb-4 flex-shrink-0">
          <p className="text-center text-[9px] text-slate-300 dark:text-slate-600 font-bold">
            {ar ? '⚕️ للاستخدام السريري المساعد فقط · الرجوع للمصادر الرسمية' : '⚕️ For clinical assistance only · Always verify with official sources'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DrugToolsModal;
