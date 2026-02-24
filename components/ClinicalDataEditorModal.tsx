import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { getClinicalData, saveClinicalData, ClinicalData } from '../utils/dailyMedicines';

interface Props {
  registerNumber: string;
  tradeName: string;
  language: Language;
  onClose: () => void;
  onSaved: (data: ClinicalData) => void;
}

const ClinicalDataEditorModal: React.FC<Props> = ({ registerNumber, tradeName, language, onClose, onSaved }) => {
  const ar = language === 'ar';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ClinicalData, 'generatedAt' | 'language'>>({
    indication: '',
    dosage: '',
    sideEffects: '',
    pharmacistNote: '',
    mechanism: '',
  });

  useEffect(() => {
    getClinicalData(registerNumber).then(existing => {
      if (existing) {
        setForm({
          indication: existing.indication || '',
          dosage: existing.dosage || '',
          sideEffects: existing.sideEffects || '',
          pharmacistNote: existing.pharmacistNote || '',
          mechanism: existing.mechanism || '',
        });
      }
      setLoading(false);
    });
  }, [registerNumber]);

  const handleSave = async () => {
    if (!form.indication.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const data: ClinicalData = {
        ...form,
        generatedAt: new Date().toISOString(),
        language,
      };
      await saveClinicalData(registerNumber, data);
      onSaved(data);
      onClose();
    } catch (e: any) {
      const code = e?.code || '';
      const msg = code === 'permission-denied' 
        ? (ar ? '❌ مش مسموح - تأكد إنك مسجل دخول كأدمن' : '❌ Permission denied - login as admin')
        : code === 'unavailable'
        ? (ar ? '❌ مفيش اتصال بالإنترنت' : '❌ No internet connection')
        : (ar ? `❌ فشل الحفظ: ${e?.message || 'خطأ غير معروف'}` : `❌ Save failed: ${e?.message || 'Unknown error'}`);
      setError(msg);
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'indication',     labelAr: '🩺 يستخدم لـ',           labelEn: '🩺 Indication',          rows: 3 },
    { key: 'dosage',         labelAr: '💊 الجرعة',               labelEn: '💊 Dosage',               rows: 3 },
    { key: 'sideEffects',    labelAr: '⚠️ الآثار الجانبية',      labelEn: '⚠️ Side Effects',         rows: 2 },
    { key: 'pharmacistNote', labelAr: '👨‍⚕️ تنبيه الصيدلاني',   labelEn: '👨‍⚕️ Pharmacist Note',    rows: 2 },
    { key: 'mechanism',      labelAr: '🔬 آلية العمل',           labelEn: '🔬 Mechanism',             rows: 2 },
  ] as const;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      style={{ touchAction: 'none' }}
    >
      <div 
        className="absolute left-0 right-0 bg-white dark:bg-dark-card rounded-t-[2rem] shadow-2xl flex flex-col"
        style={{ 
          bottom: 'calc(80px + env(safe-area-inset-bottom))',
          maxHeight: 'calc(100dvh - 160px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <div>
            <h2 className="font-black text-slate-800 dark:text-white text-sm">
              📋 {ar ? 'المعلومات السريرية' : 'Clinical Data'}
            </h2>
            <p className="text-[10px] text-primary font-bold mt-0.5">{tradeName}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-y-auto flex-grow p-5 space-y-4" style={{overscrollBehavior: "contain"}}>
            {fields.map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                  {ar ? f.labelAr : f.labelEn}
                </label>
                <textarea
                  dir="auto"
                  rows={f.rows}
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary resize-none leading-relaxed"
                  placeholder={ar ? `اكتب ${f.labelAr}...` : `Enter ${f.labelEn}...`}
                />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mx-5 mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        <div className="px-5 py-4 flex gap-2 flex-shrink-0 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-500 font-black rounded-2xl text-sm">
            {ar ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={handleSave} disabled={saving || !form.indication}
            className="flex-1 py-3 bg-primary disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2">
            {saving 
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>{ar ? 'حفظ...' : 'Saving...'}</>
              : `✅ ${ar ? 'حفظ' : 'Save'}`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicalDataEditorModal;
