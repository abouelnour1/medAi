/**
 * ClinicalDataManager - صفحة إدارة Clinical Data
 * - عرض كل الأدوية اللي عندها clinical data
 * - إضافة clinical data لأي دواء يدوياً
 * - بحث في الأدوية
 */
import React, { useState, useEffect } from 'react';
import { Medicine, Language, TFunction } from '../types';
import { getClinicalData, saveClinicalData, ClinicalData } from '../utils/dailyMedicines';
import { callGenerateClinical } from '../utils/geminiProxy';

interface Props {
  allMedicines: Medicine[];
  language: Language;
  t: TFunction;
  onClose: () => void;
}

const EMPTY_FORM = { indication: '', dosage: '', sideEffects: '', pharmacistNote: '', mechanism: '', keyPoints: '' };

const ClinicalDataManager: React.FC<Props> = ({ allMedicines, language, onClose }) => {
  const ar = language === 'ar';
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Medicine | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [existing, setExisting] = useState<ClinicalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  const filtered = search.length >= 2
    ? allMedicines.filter(m =>
        m['Trade Name']?.toLowerCase().includes(search.toLowerCase()) ||
        m['Scientific Name']?.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 30)
    : [];

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    getClinicalData(selected.RegisterNumber).then(d => {
      if (d) { setExisting(d); setForm({ indication: d.indication||'', dosage: d.dosage||'', sideEffects: d.sideEffects||'', pharmacistNote: d.pharmacistNote||'', mechanism: d.mechanism||'', keyPoints: d.keyPoints||'' }); }
      else { setExisting(null); setForm(EMPTY_FORM); }
      setLoading(false);
    });
  }, [selected]);

  const handleGenerate = async () => {
    if (!selected) return;
    setGenerating(true);
    const result = await callGenerateClinical({
      tradeName: selected['Trade Name'],
      scientificName: selected['Scientific Name'] || '',
      strength: selected.Strength || '',
      form: selected.PharmaceuticalForm || '',
      language,
    });
    if (result) setForm({ indication: result.indication||'', dosage: result.dosage||'', sideEffects: result.sideEffects||'', pharmacistNote: result.pharmacistNote||'', mechanism: result.mechanism||'', keyPoints: result.keyPoints||'' });
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!selected || !form.indication.trim()) return;
    setLoading(true);
    try {
      const data: ClinicalData = { ...form, generatedAt: new Date().toISOString(), language };
      await saveClinicalData(selected.RegisterNumber, data);

      // حفظ لكل الأدوية بنفس المادة الفعالة (ماعدا keyPoints)
      const sciName = selected['Scientific Name']?.trim().toLowerCase();
      if (sciName && sciName !== 'n/a') {
        const siblings = allMedicines.filter(m =>
          m.RegisterNumber !== selected.RegisterNumber &&
          m['Scientific Name']?.trim().toLowerCase() === sciName
        );
        const sharedData: ClinicalData = { ...data, keyPoints: '' }; // keyPoints مش بيتشارك
        await Promise.all(siblings.map(s => saveClinicalData(s.RegisterNumber, sharedData).catch(() => {})));
      }

      setExisting(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { }
    setLoading(false);
  };

  const fields = [
    { key: 'indication' as const, label: ar ? '🩺 يستخدم لـ' : '🩺 Indication', rows: 3 },
    { key: 'dosage' as const, label: ar ? '💊 الجرعة' : '💊 Dosage', rows: 2 },
    { key: 'sideEffects' as const, label: ar ? '⚠️ الآثار الجانبية' : '⚠️ Side Effects', rows: 2 },
    { key: 'pharmacistNote' as const, label: ar ? '👨‍⚕️ تنبيه الصيدلاني' : '👨‍⚕️ Pharmacist Note', rows: 2 },
    { key: 'mechanism' as const, label: ar ? '🔬 آلية العمل' : '🔬 Mechanism', rows: 2 },
    { key: 'keyPoints' as const, label: ar ? '⭐ نقاط البيع (لهذا الدواء فقط)' : '⭐ Key Selling Points (this medicine only)', rows: 3 },
  ];

  return (
    <div className="fixed inset-0 z-[85] bg-light-bg dark:bg-dark-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-dark-card border-b border-slate-100 dark:border-slate-800 flex-shrink-0"
        style={{ paddingTop: 'calc(var(--android-status, 0px) + 52px)' }}>
        <button onClick={selected ? () => { setSelected(null); setSearch(''); } : onClose}
          className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl active:scale-90 transition-transform">
          <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className="flex-grow">
          <h1 className="font-black text-slate-800 dark:text-white text-sm">
            {ar ? '📋 إدارة المعلومات السريرية' : '📋 Clinical Data Manager'}
          </h1>
          {selected && <p className="text-[10px] text-primary truncate">{selected['Trade Name']}</p>}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar px-4 py-4">
        {!selected ? (
          <>
            {/* بحث */}
            <div className="relative mb-4">
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={ar ? 'ابحث باسم الدواء أو المادة الفعالة...' : 'Search by trade name or ingredient...'}
                className="w-full bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl px-4 py-3 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir={ar ? 'rtl' : 'ltr'}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">🔍</span>
            </div>

            {search.length < 2 && (
              <div className="text-center py-12 text-slate-400">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm font-bold">{ar ? 'ابحث عن دواء لإضافة معلوماته السريرية' : 'Search for a medicine to add clinical data'}</p>
              </div>
            )}

            <div className="space-y-2">
              {filtered.map(med => (
                <button key={med.RegisterNumber} onClick={() => setSelected(med)}
                  className="w-full bg-white dark:bg-dark-card rounded-2xl p-3.5 border border-slate-100 dark:border-dark-border text-right rtl:text-right ltr:text-left active:scale-[0.98] transition-all flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-slate-800 dark:text-white text-sm truncate">{med['Trade Name']}</p>
                    <p className="text-[10px] text-slate-400 truncate" dir="ltr">{med['Scientific Name']}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* Medicine info */}
            <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 border border-primary/15">
              <p className="font-black text-primary text-sm">{selected['Trade Name']}</p>
              <p className="text-[10px] text-slate-500 mt-0.5" dir="ltr">{selected['Scientific Name']} · {selected.Strength}</p>
              {existing && <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full mt-1 inline-block">✓ {ar ? 'موجود بالفعل' : 'Already exists'}</span>}
            </div>

            {/* Generate button */}
            <button onClick={handleGenerate} disabled={generating}
              className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl font-black text-sm active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2">
              {generating ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>{ar ? 'جاري التوليد...' : 'Generating...'}</>
              ) : (
                <>{ar ? '✨ توليد بالذكاء الاصطناعي' : '✨ Generate with AI'}</>
              )}
            </button>

            {/* Form fields */}
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                <textarea
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  rows={f.rows}
                  className="w-full bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  dir={ar ? 'rtl' : 'ltr'}
                />
              </div>
            ))}

            {/* Shared note */}
            <p className="text-[10px] text-slate-400 bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 border border-amber-100 dark:border-amber-800/30">
              💡 {ar
                ? 'سيتم تطبيق هذه المعلومات (ماعدا نقاط البيع) على جميع أدوية نفس المادة الفعالة تلقائياً'
                : 'This data (except key selling points) will auto-apply to all medicines with the same active ingredient'}
            </p>

            {/* Save */}
            <button onClick={handleSave} disabled={loading || !form.indication.trim()}
              className={`w-full py-3.5 rounded-2xl font-black text-sm active:scale-95 transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-slate-800 dark:bg-primary text-white'} disabled:opacity-50`}>
              {loading ? (ar ? 'جاري الحفظ...' : 'Saving...') : saved ? (ar ? '✓ تم الحفظ!' : '✓ Saved!') : (ar ? 'حفظ المعلومات' : 'Save Clinical Data')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalDataManager;
