import React, { useState, useRef, useCallback } from 'react';
import { Medicine, Language, User } from '../types';

interface PrescriptionDrug {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  notes: string;
}

interface PrescriptionViewProps {
  language: Language;
  user: User | null;
  allMedicines: Medicine[];
  onBack: () => void;
}

const FREQUENCIES_AR = ['مرة يومياً', 'مرتين يومياً', 'ثلاث مرات يومياً', 'كل 8 ساعات', 'كل 12 ساعة', 'عند الحاجة', 'قبل النوم'];
const FREQUENCIES_EN = ['Once daily', 'Twice daily', 'Three times daily', 'Every 8 hours', 'Every 12 hours', 'As needed', 'At bedtime'];

const generateId = () => Math.random().toString(36).slice(2, 9);

const PrescriptionView: React.FC<PrescriptionViewProps> = ({ language, user, allMedicines, onBack }) => {
  const ar = language === 'ar';
  const [tab, setTab] = useState<'manual' | 'online'>('manual');

  // ── Doctor / Clinic Info ────────────────────────────────────────────────
  const [doctorName,    setDoctorName]    = useState((user as any)?.username || '');
  const [specialty,     setSpecialty]     = useState((user as any)?.specialty || (user as any)?.subSpecialty || '');
  const [institution,   setInstitution]   = useState('');
  const [licenseNo,     setLicenseNo]     = useState('');

  // ── Patient Info ───────────────────────────────────────────────────────
  const [patientName,   setPatientName]   = useState('');
  const [patientId,     setPatientId]     = useState('');
  const [patientAge,    setPatientAge]    = useState('');
  const [patientGender, setPatientGender] = useState<'M'|'F'|''>('');
  const [patientWeight, setPatientWeight] = useState('');
  const [diagnosis,     setDiagnosis]     = useState('');

  // ── Drugs ──────────────────────────────────────────────────────────────
  const [drugs, setDrugs] = useState<PrescriptionDrug[]>([
    { id: generateId(), name: '', dose: '', frequency: '', duration: '', notes: '' }
  ]);
  const [drugSearch, setDrugSearch]   = useState<Record<string, string>>({});
  const [drugDropdown, setDrugDropdown] = useState<string | null>(null);

  // ── Stamp ──────────────────────────────────────────────────────────────
  const [stampText, setStampText] = useState('');

  // ── Print ref ─────────────────────────────────────────────────────────
  const printRef = useRef<HTMLDivElement>(null);

  const today = new Date().toLocaleDateString(ar ? 'ar-SA' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // Drug search suggestions
  const getDrugSuggestions = useCallback((query: string) => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return allMedicines
      .filter(m => m['Trade Name']?.toLowerCase().includes(q) || m['Scientific Name']?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allMedicines]);

  const updateDrug = (id: string, field: keyof PrescriptionDrug, value: string) => {
    setDrugs(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const addDrug = () => setDrugs(prev => [...prev, { id: generateId(), name: '', dose: '', frequency: '', duration: '', notes: '' }]);
  const removeDrug = (id: string) => setDrugs(prev => prev.filter(d => d.id !== id));

  const handlePrint = async () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;

    const isAndroid = typeof (window as any).Capacitor !== 'undefined'
      && (window as any).Capacitor.getPlatform() === 'android';

    const css = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: white; direction: ${ar ? 'rtl' : 'ltr'}; }
      .rx-print { max-width: 800px; margin: 0 auto; padding: 20px; }
      .rx-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2px solid #0d9488; margin-bottom: 16px; }
      .rx-logo { font-size: 28px; font-weight: 900; color: #0d9488; }
      .rx-doc-info h2 { font-size: 16px; font-weight: 700; color: #111; }
      .rx-doc-info p { font-size: 11px; color: #555; margin-top: 2px; }
      .rx-patient { background: #f0fdf9; border: 1px solid #99f6e4; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; flex-wrap: wrap; gap: 8px 24px; }
      .rx-patient-field { font-size: 11px; } .rx-patient-field span { font-weight: 700; }
      .rx-diagnosis { background: #fff7ed; border-left: 3px solid #f59e0b; padding: 8px 12px; border-radius: 4px; margin-bottom: 14px; font-size: 11px; }
      .rx-symbol { font-size: 42px; font-weight: 900; color: #0d9488; line-height: 1; margin-bottom: 10px; }
      .rx-drug { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
      .rx-drug:nth-child(even) { background: #f9fafb; }
      .rx-drug-header { font-weight: 700; background: #f0fdf9 !important; border-radius: 4px; }
      .rx-drug-name { font-weight: 700; color: #0d9488; font-size: 12px; }
      .rx-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 32px; padding-top: 16px; border-top: 1px dashed #ccc; }
      .rx-stamp { border: 2px solid #0d9488; border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 9px; font-weight: 700; color: #0d9488; }
      .rx-sig { text-align: center; } .rx-sig .line { border-top: 1px solid #111; width: 140px; margin: 0 auto 4px; }
      .rx-date { font-size: 11px; color: #555; }
      @media print { @page { margin: 10mm; } }
    `;

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <title>${ar ? 'وصفة طبية' : 'Prescription'}</title>
      <style>${css}</style>
      </head><body>
      <div class="rx-print">${printContent}</div>
      ${isAndroid ? `<script>
        window.onload = function() {
          setTimeout(function(){ window.print(); }, 300);
        };
      <\/script>` : ''}
      </body></html>`;

    if (isAndroid) {
      try {
        // نحفظ الـ HTML في Filesystem ثم نفتحه عبر Capacitor Browser
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Browser } = await import('@capacitor/browser');

        const fileName = 'prescription_' + Date.now() + '.html';
        await Filesystem.writeFile({
          path: fileName,
          data: btoa(unescape(encodeURIComponent(fullHtml))),
          directory: Directory.Cache,
          encoding: 'base64' as any,
        });

        const result = await Filesystem.getUri({
          path: fileName,
          directory: Directory.Cache,
        });

        await Browser.open({
          url: result.uri,
          presentationStyle: 'popover',
        });
        return;
      } catch (err) {
        console.error('Android print error:', err);
        // fallback: share as text
        try {
          const { Share } = await import('@capacitor/share');
          await Share.share({
            title: ar ? 'وصفة طبية' : 'Prescription',
            text: printRef.current?.innerText || '',
            dialogTitle: ar ? 'مشاركة الوصفة' : 'Share Prescription',
          });
        } catch {}
        return;
      }
    }

    // ويب / iOS — نفتح نافذة جديدة
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(fullHtml);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  };

  const inputCls = `w-full px-3 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/30 outline-none transition-all`;
  const labelCls = `block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1`;

  return (
    <div className="min-h-full pb-20" style={{ direction: ar ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-dark-bg border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={ar ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 dark:text-white">{ar ? 'الوصفة الطبية' : 'Prescription'}</h1>
            <p className="text-[10px] text-slate-400">{ar ? 'إنشاء وطباعة وصفة طبية' : 'Create & print prescriptions'}</p>
          </div>
        </div>
        <button onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 text-white rounded-xl text-xs font-black active:scale-95 transition-all shadow-sm shadow-teal-200">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
          </svg>
          {ar ? 'طباعة' : 'Print'}
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          {[
            { id: 'manual', labelAr: '✏️ وصفة يدوية', labelEn: '✏️ Manual Rx' },
            { id: 'online', labelAr: '👨‍⚕️ طلب من دكتور', labelEn: '👨‍⚕️ Request from Doctor' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${tab === t.id ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-400'}`}>
              {ar ? t.labelAr : t.labelEn}
            </button>
          ))}
        </div>
      </div>

      {tab === 'online' ? (
        <div className="px-4 py-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
          <h3 className="text-base font-black text-slate-700 dark:text-slate-200 mb-2">{ar ? 'التطبيب عن بُعد' : 'Telemedicine'}</h3>
          <p className="text-sm text-slate-400 font-medium mb-6">{ar ? 'خدمة الاستشارة مع دكتور أونلاين قيد التطوير' : 'Online doctor consultation coming soon'}</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-xs font-black rounded-xl border border-amber-200 dark:border-amber-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {ar ? 'قريباً' : 'Coming Soon'}
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-4 pt-2">

          {/* Doctor Info */}
          <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
              <h2 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{ar ? 'بيانات الطبيب' : 'Doctor Info'}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{ar ? 'اسم الطبيب' : 'Doctor Name'}</label>
                <input value={doctorName} onChange={e => setDoctorName(e.target.value)} className={inputCls} placeholder={ar ? 'د. محمد أحمد' : 'Dr. John Smith'} />
              </div>
              <div>
                <label className={labelCls}>{ar ? 'رقم الترخيص' : 'License No.'}</label>
                <input value={licenseNo} onChange={e => setLicenseNo(e.target.value)} className={inputCls} placeholder="SA-12345" />
              </div>
              <div>
                <label className={labelCls}>{ar ? 'التخصص' : 'Specialty'}</label>
                <input value={specialty} onChange={e => setSpecialty(e.target.value)} className={inputCls} placeholder={ar ? 'طب عام' : 'General Practice'} />
              </div>
              <div>
                <label className={labelCls}>{ar ? 'المؤسسة' : 'Institution'}</label>
                <input value={institution} onChange={e => setInstitution(e.target.value)} className={inputCls} placeholder={ar ? 'مستشفى / عيادة' : 'Hospital / Clinic'} />
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <h2 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{ar ? 'بيانات المريض' : 'Patient Info'}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>{ar ? 'اسم المريض' : 'Patient Name'}</label>
                <input value={patientName} onChange={e => setPatientName(e.target.value)} className={inputCls} placeholder={ar ? 'الاسم الكامل' : 'Full name'} />
              </div>
              <div>
                <label className={labelCls}>{ar ? 'رقم الهوية' : 'ID Number'}</label>
                <input value={patientId} onChange={e => setPatientId(e.target.value)} className={inputCls} placeholder="1234567890" />
              </div>
              <div>
                <label className={labelCls}>{ar ? 'العمر' : 'Age'}</label>
                <input value={patientAge} onChange={e => setPatientAge(e.target.value)} className={inputCls} placeholder={ar ? 'مثال: 35' : 'e.g. 35'} type="number" />
              </div>
              <div>
                <label className={labelCls}>{ar ? 'الجنس' : 'Gender'}</label>
                <select value={patientGender} onChange={e => setPatientGender(e.target.value as any)} className={inputCls}>
                  <option value="">{ar ? 'اختر' : 'Select'}</option>
                  <option value="M">{ar ? 'ذكر' : 'Male'}</option>
                  <option value="F">{ar ? 'أنثى' : 'Female'}</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>{ar ? 'الوزن (كجم)' : 'Weight (kg)'}</label>
                <input value={patientWeight} onChange={e => setPatientWeight(e.target.value)} className={inputCls} placeholder="70" type="number" />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>{ar ? 'التشخيص / السبب' : 'Diagnosis / Reason'}</label>
                <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} className={inputCls} placeholder={ar ? 'مثال: التهاب الحلق الحاد' : 'e.g. Acute pharyngitis'} />
              </div>
            </div>
          </div>

          {/* Drugs */}
          <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                </div>
                <h2 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{ar ? 'الأدوية والجرعات' : 'Medications & Doses'}</h2>
              </div>
              <span className="text-[10px] font-black text-teal-500 bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded-full">{drugs.length} {ar ? 'دواء' : 'drugs'}</span>
            </div>

            <div className="space-y-4">
              {drugs.map((drug, idx) => (
                <div key={drug.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">{ar ? `دواء ${idx + 1}` : `Drug ${idx + 1}`}</span>
                    {drugs.length > 1 && (
                      <button onClick={() => removeDrug(drug.id)} className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center active:scale-90 transition-all">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>

                  {/* Drug name with autocomplete */}
                  <div className="relative mb-2">
                    <label className={labelCls}>{ar ? 'اسم الدواء' : 'Drug Name'}</label>
                    <input
                      value={drugSearch[drug.id] ?? drug.name}
                      onChange={e => {
                        const v = e.target.value;
                        setDrugSearch(prev => ({ ...prev, [drug.id]: v }));
                        updateDrug(drug.id, 'name', v);
                        setDrugDropdown(v.length >= 2 ? drug.id : null);
                      }}
                      onFocus={() => { if ((drugSearch[drug.id] ?? drug.name).length >= 2) setDrugDropdown(drug.id); }}
                      onBlur={() => setTimeout(() => setDrugDropdown(null), 200)}
                      className={inputCls}
                      placeholder={ar ? 'ابحث أو اكتب اسم الدواء' : 'Search or type drug name'}
                    />
                    {drugDropdown === drug.id && getDrugSuggestions(drugSearch[drug.id] ?? drug.name).length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-44 overflow-y-auto">
                        {getDrugSuggestions(drugSearch[drug.id] ?? drug.name).map(m => (
                          <button key={m.RegisterNumber} onMouseDown={() => {
                            const name = `${m['Trade Name']} ${m.Strength}${m.StrengthUnit}`;
                            updateDrug(drug.id, 'name', name);
                            setDrugSearch(prev => ({ ...prev, [drug.id]: name }));
                            setDrugDropdown(null);
                          }} className="w-full text-left px-3 py-2.5 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0">
                            <p className="text-xs font-black text-teal-700 dark:text-teal-300">{m['Trade Name']}</p>
                            <p className="text-[10px] text-slate-400">{m['Scientific Name']} · {m.Strength}{m.StrengthUnit}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <label className={labelCls}>{ar ? 'الجرعة' : 'Dose'}</label>
                      <input value={drug.dose} onChange={e => updateDrug(drug.id, 'dose', e.target.value)} className={inputCls} placeholder={ar ? 'مثال: قرص 500mg' : 'e.g. 1 tab 500mg'} />
                    </div>
                    <div>
                      <label className={labelCls}>{ar ? 'التكرار' : 'Frequency'}</label>
                      <select value={drug.frequency} onChange={e => updateDrug(drug.id, 'frequency', e.target.value)} className={inputCls}>
                        <option value="">{ar ? 'اختر' : 'Select'}</option>
                        {(ar ? FREQUENCIES_AR : FREQUENCIES_EN).map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>{ar ? 'المدة' : 'Duration'}</label>
                      <input value={drug.duration} onChange={e => updateDrug(drug.id, 'duration', e.target.value)} className={inputCls} placeholder={ar ? 'مثال: 7 أيام' : 'e.g. 7 days'} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{ar ? 'ملاحظات' : 'Notes'}</label>
                    <input value={drug.notes} onChange={e => updateDrug(drug.id, 'notes', e.target.value)} className={inputCls} placeholder={ar ? 'مع الأكل، بعد الأكل...' : 'With food, after meals...'} />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addDrug} className="w-full mt-3 py-3 rounded-xl border-2 border-dashed border-teal-200 dark:border-teal-800 text-teal-500 text-xs font-black active:scale-95 transition-all hover:bg-teal-50 dark:hover:bg-teal-900/10 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              {ar ? 'إضافة دواء آخر' : 'Add Another Drug'}
            </button>
          </div>

          {/* Stamp */}
          <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/></svg>
              </div>
              <h2 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{ar ? 'ختم الطبيب' : "Doctor's Stamp"}</h2>
            </div>
            <label className={labelCls}>{ar ? 'نص الختم (سيظهر في دائرة)' : 'Stamp Text (shown in circle)'}</label>
            <input value={stampText} onChange={e => setStampText(e.target.value)} className={inputCls}
              placeholder={ar ? 'د. محمد / طب عام / جدة' : 'Dr. Smith / GP / Riyadh'} />
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ar ? 'معاينة الوصفة' : 'Prescription Preview'}</p>
            </div>

            {/* Printable prescription */}
            <div ref={printRef} className="rx-print p-5" style={{ fontFamily: 'Arial, sans-serif', direction: ar ? 'rtl' : 'ltr', fontSize: '12px', color: '#111', background: 'white' }}>

              {/* RX Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: '2.5px solid #0d9488', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#0d9488', lineHeight: 1 }}>℞</div>
                  {doctorName && <div style={{ fontWeight: 700, fontSize: '15px', marginTop: '4px' }}>{ar ? 'د. ' : 'Dr. '}{doctorName}</div>}
                  {specialty && <div style={{ fontSize: '11px', color: '#555' }}>{specialty}</div>}
                  {licenseNo && <div style={{ fontSize: '10px', color: '#888' }}>{ar ? 'رقم الترخيص: ' : 'Lic. No.: '}{licenseNo}</div>}
                </div>
                <div style={{ textAlign: ar ? 'left' : 'right' }}>
                  {institution && <div style={{ fontWeight: 700, fontSize: '13px' }}>{institution}</div>}
                  <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>{today}</div>
                </div>
              </div>

              {/* Patient */}
              {(patientName || patientId || patientAge) && (
                <div style={{ background: '#f0fdf9', border: '1px solid #99f6e4', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px 20px' }}>
                  {patientName && <span style={{ fontSize: '11px' }}><strong>{ar ? 'المريض: ' : 'Patient: '}</strong>{patientName}</span>}
                  {patientId   && <span style={{ fontSize: '11px' }}><strong>{ar ? 'الهوية: ' : 'ID: '}</strong>{patientId}</span>}
                  {patientAge  && <span style={{ fontSize: '11px' }}><strong>{ar ? 'العمر: ' : 'Age: '}</strong>{patientAge} {ar ? 'سنة' : 'yrs'}</span>}
                  {patientGender && <span style={{ fontSize: '11px' }}><strong>{ar ? 'الجنس: ' : 'Gender: '}</strong>{patientGender === 'M' ? (ar ? 'ذكر' : 'Male') : (ar ? 'أنثى' : 'Female')}</span>}
                  {patientWeight && <span style={{ fontSize: '11px' }}><strong>{ar ? 'الوزن: ' : 'Weight: '}</strong>{patientWeight} kg</span>}
                </div>
              )}

              {/* Diagnosis */}
              {diagnosis && (
                <div style={{ background: '#fff7ed', borderLeft: ar ? 'none' : '3px solid #f59e0b', borderRight: ar ? '3px solid #f59e0b' : 'none', padding: '8px 12px', borderRadius: '4px', marginBottom: '14px', fontSize: '11px' }}>
                  <strong>{ar ? 'التشخيص: ' : 'Diagnosis: '}</strong>{diagnosis}
                </div>
              )}

              {/* Drugs Table */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr', gap: '6px', padding: '7px 10px', background: '#f0fdf9', borderRadius: '6px', marginBottom: '4px' }}>
                  {[ar ? 'الدواء' : 'Medication', ar ? 'الجرعة' : 'Dose', ar ? 'التكرار' : 'Frequency', ar ? 'المدة' : 'Duration'].map(h => (
                    <span key={h} style={{ fontSize: '10px', fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                  ))}
                </div>
                {drugs.filter(d => d.name).map((drug, i) => (
                  <div key={drug.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr', gap: '6px', padding: '8px 10px', background: i % 2 === 0 ? '#fafafa' : 'white', borderBottom: '1px solid #f0f0f0', borderRadius: '4px' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '12px', color: '#0d9488' }}>{drug.name}</span>
                      {drug.notes && <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>{drug.notes}</div>}
                    </div>
                    <span style={{ fontSize: '11px' }}>{drug.dose}</span>
                    <span style={{ fontSize: '11px' }}>{drug.frequency}</span>
                    <span style={{ fontSize: '11px' }}>{drug.duration}</span>
                  </div>
                ))}
              </div>

              {/* Footer: stamp + signature */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '24px', paddingTop: '14px', borderTop: '1px dashed #ccc' }}>
                {stampText ? (
                  <div style={{ width: '80px', height: '80px', border: '2.5px solid #0d9488', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '9px', fontWeight: 700, color: '#0d9488', padding: '8px', lineHeight: '1.3' }}>
                    {stampText}
                  </div>
                ) : (
                  <div style={{ width: '80px', height: '80px', border: '2px dashed #ccc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#aaa' }}>
                    {ar ? 'الختم' : 'Stamp'}
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #111', width: '140px', marginBottom: '4px' }} />
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#555' }}>{ar ? 'توقيع الطبيب' : "Doctor's Signature"}</div>
                  {doctorName && <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>{ar ? 'د. ' : 'Dr. '}{doctorName}</div>}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default PrescriptionView;
