import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { getClinicalData, saveClinicalData, ClinicalData } from '../utils/dailyMedicines';
import { hapticSuccess, hapticError } from '../utils/haptics';

interface Props {
  registerNumber: string;
  tradeName: string;
  scientificName?: string;
  language: Language;
  isAdmin?: boolean;
  allMedicines?: import('../types').Medicine[];  // لتطبيق الـ clinical على نفس المادة الفعالة
  onClose: () => void;
}

const ClinicalDataPage: React.FC<Props> = ({ registerNumber, tradeName, scientificName, language, isAdmin, allMedicines, onClose }) => {
  const ar = language === 'ar';

  // Lock background scroll + scroll the page itself to top
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const mainScroll = document.getElementById('main-scroll-container');
    if (mainScroll) mainScroll.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      const mainScroll2 = document.getElementById('main-scroll-container');
      if (mainScroll2) mainScroll2.style.overflow = '';
    };
  }, []);
  const [data, setData] = useState<ClinicalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ indication: '', dosage: '', sideEffects: '', pharmacistNote: '', mechanism: '', keyPoints: '' });

  useEffect(() => {
    getClinicalData(registerNumber).then(d => {
      if (d) { setData(d); setForm({ indication: d.indication||'', dosage: d.dosage||'', sideEffects: d.sideEffects||'', pharmacistNote: d.pharmacistNote||'', mechanism: d.mechanism||'', keyPoints: d.keyPoints||'' }); }
      setLoading(false);
    });
  }, [registerNumber]);

  const [sharedMsg, setSharedMsg] = useState('');

  const handleSave = async () => {
    if (!form.indication.trim()) return;
    setSaving(true); setError(null); setSharedMsg('');
    try {
      const saved: ClinicalData = { ...form, generatedAt: new Date().toISOString(), language };

      // نجيب أرقام تسجيل الأدوية بنفس المادة الفعالة
      let siblingNums: string[] = [];
      if (allMedicines && scientificName && scientificName.trim().toLowerCase() !== 'n/a') {
        const sciLower = scientificName.trim().toLowerCase();
        siblingNums = allMedicines
          .filter(m => m.RegisterNumber !== registerNumber &&
                       m['Scientific Name']?.trim().toLowerCase() === sciLower)
          .map(m => m.RegisterNumber);
      }

      const result = await saveClinicalData(registerNumber, saved, siblingNums);
      setData(saved); setEditing(false);
      hapticSuccess();

      // Feedback للمستخدم
      if (result.sharedCount > 0) {
        setSharedMsg(
          language === 'ar'
            ? `✅ تم الحفظ وتطبيق البيانات على ${result.sharedCount} دواء آخر بنفس المادة الفعالة`
            : `✅ Saved and applied to ${result.sharedCount} other medicines with the same active ingredient`
        );
        setTimeout(() => setSharedMsg(''), 5000);
      }
    } catch (e: any) {
      hapticError();
      setError(e?.code === 'permission-denied' ? 'Permission denied - admin only' : `Error: ${e?.message}`);
    } finally { setSaving(false); }
  };

  const fields = [
    { key: 'indication' as const,     emoji: '🩺', labelAr: 'يستخدم لـ',         labelEn: 'Indication',       rows: 3 },
    { key: 'dosage' as const,         emoji: '💊', labelAr: 'الجرعة',             labelEn: 'Dosage',           rows: 3 },
    { key: 'sideEffects' as const,    emoji: '⚠️', labelAr: 'الآثار الجانبية',   labelEn: 'Side Effects',     rows: 2 },
    { key: 'pharmacistNote' as const, emoji: '👨‍⚕️', labelAr: 'تنبيه الصيدلاني', labelEn: 'Pharmacist Note',  rows: 2 },
    { key: 'mechanism' as const,      emoji: '🔬', labelAr: 'آلية العمل',        labelEn: 'Mechanism',        rows: 2 },
    { key: 'keyPoints' as const,      emoji: '⭐', labelAr: 'نقاط البيع المميزة', labelEn: 'Key Selling Points', rows: 3 },
  ];

  return (
    <div className="fixed inset-0 z-[80] bg-light-bg dark:bg-dark-bg flex flex-col">
      {/* Safe area spacer - يعوض ارتفاع status bar + الـ app header */}
      <div className="flex-shrink-0 bg-white dark:bg-dark-card" style={{ height: 'calc(env(safe-area-inset-top, 0px) + 60px)' }} />
      
      {/* Header - تحت الـ safe area */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-dark-card flex-shrink-0 shadow-sm">
        <button onClick={onClose} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl active:scale-90 transition-transform flex-shrink-0">
          <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className="flex-grow min-w-0">
          <h1 className="font-black text-slate-800 dark:text-white text-sm truncate">{tradeName}</h1>
          {scientificName && <p className="text-[10px] text-slate-400 truncate">{scientificName}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[9px] font-black px-2 py-1 bg-primary/10 text-primary rounded-full">📋</span>
          {isAdmin && !editing && data && (
            <button onClick={() => setEditing(true)} className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl active:scale-90 transition-transform">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto px-4 py-4 pb-[calc(80px+env(safe-area-inset-bottom))]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : !data && !editing ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">📋</span>
            <p className="font-black text-slate-600 dark:text-slate-400 text-sm mb-1">
              {ar ? 'لا توجد معلومات سريرية بعد' : 'No clinical data yet'}
            </p>
            {isAdmin && (
              <button onClick={() => setEditing(true)} className="mt-4 px-5 py-2.5 bg-primary text-white font-black text-xs rounded-2xl active:scale-95 transition-transform">
                ✏️ {ar ? 'أضف الآن' : 'Add Now'}
              </button>
            )}
          </div>
        ) : editing ? (
          <div className="space-y-4">
            {fields.map(f => (
              <div key={f.key}>
                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <span>{f.emoji}</span>{ar ? f.labelAr : f.labelEn}
                </label>
                <textarea dir="auto" rows={f.rows} value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary resize-none leading-relaxed transition-colors"
                  placeholder={ar ? `اكتب ${f.labelAr}...` : `Enter ${f.labelEn}...`}
                />
              </div>
            ))}
            {error && <p className="text-xs text-red-500 font-bold px-1">{error}</p>}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditing(false)} className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-500 font-black rounded-2xl text-sm active:scale-95 transition-transform">
                {ar ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={handleSave} disabled={saving || !form.indication.trim()}
                className="flex-1 py-3 bg-primary disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
                {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>{ar ? 'حفظ...' : 'Saving...'}</> : `✅ ${ar ? 'حفظ' : 'Save'}`}
              </button>
            </div>
          </div>
        ) : data && (
          <div className="space-y-3">
            {fields.filter(f => data[f.key]).map(f => (
              <div key={f.key} className={`rounded-2xl p-4 ${
              f.key === 'keyPoints' ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-700/50' :
              f.key === 'pharmacistNote' ? 'bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800' :
              f.key === 'sideEffects' ? 'bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30' :
              'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'}`}>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${
                  f.key === 'keyPoints' ? 'text-amber-600' :
                  f.key === 'pharmacistNote' ? 'text-amber-500' :
                  f.key === 'sideEffects' ? 'text-red-400' : 'text-slate-400'}`}>
                  {f.emoji} {ar ? f.labelAr : f.labelEn}
                </p>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{data[f.key]}</p>
              </div>
            ))}
            <p className="text-[9px] text-slate-300 dark:text-slate-600 text-center pt-2">
              {ar ? 'آخر تحديث: ' : 'Last updated: '}{new Date(data.generatedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalDataPage;
