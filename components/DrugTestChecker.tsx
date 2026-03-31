import React, { useState, useMemo } from 'react';
import { Language, Medicine } from '../types';

// ── بيانات تحليل المخدرات ───────────────────────────────────────────────────
const DRUG_TEST_DATA = [{"active":"Sertraline","falsePositive":"Benzodiazepines","basis":"Immunoassay cross-reactivity"},{"active":"Sertraline","falsePositive":"LSD","basis":"Cross-reactivity with immunoassay"},{"active":"Venlafaxine","falsePositive":"PCP (Phencyclidine)","basis":"Structural similarity to PCP"},{"active":"Desvenlafaxine","falsePositive":"PCP (Phencyclidine)","basis":"Structural similarity to PCP"},{"active":"Bupropion","falsePositive":"Amphetamines","basis":"Structural similarity to phenethylamines"},{"active":"Fluoxetine","falsePositive":"Amphetamines","basis":"Cross-reactivity with immunoassay"},{"active":"Trazodone","falsePositive":"Amphetamines","basis":"Metabolite m-CPP cross-reactivity"},{"active":"Quetiapine","falsePositive":"Methadone","basis":"Immunoassay cross-reactivity"},{"active":"Ranitidine","falsePositive":"Amphetamines","basis":"Cross-reactivity with immunoassay"},{"active":"Pantoprazole","falsePositive":"THC (Cannabinoids)","basis":"Immunoassay interference"},{"active":"Ibuprofen","falsePositive":"THC (Cannabinoids)","basis":"Interference with enzyme immunoassay"},{"active":"Naproxen","falsePositive":"THC (Cannabinoids)","basis":"Interference with enzyme immunoassay"},{"active":"Pseudoephedrine","falsePositive":"Amphetamines","basis":"Structural similarity (sympathomimetic amine)"},{"active":"Ephedrine","falsePositive":"Amphetamines","basis":"Structural similarity (sympathomimetic amine)"},{"active":"Phenylephrine","falsePositive":"Amphetamines","basis":"Structural similarity"},{"active":"Dextromethorphan","falsePositive":"Opiates / PCP","basis":"Structural similarity to levorphanol/PCP"},{"active":"Diphenhydramine","falsePositive":"Methadone / PCP","basis":"Cross-reactivity with immunoassay"},{"active":"Promethazine","falsePositive":"Amphetamines / Methadone","basis":"Cross-reactivity with immunoassay"},{"active":"Chlorpromazine","falsePositive":"Amphetamines / Methadone","basis":"Cross-reactivity with immunoassay"},{"active":"Labetalol","falsePositive":"Amphetamines","basis":"Cross-reactivity with immunoassay"},{"active":"Propranolol","falsePositive":"Amphetamines","basis":"Cross-reactivity with immunoassay"},{"active":"Methylphenidate","falsePositive":"Amphetamines","basis":"Structural similarity"},{"active":"Ciprofloxacin","falsePositive":"Opiates","basis":"Cross-reactivity with immunoassay"},{"active":"Levofloxacin","falsePositive":"Opiates","basis":"Cross-reactivity with immunoassay"},{"active":"Ofloxacin","falsePositive":"Opiates","basis":"Cross-reactivity with immunoassay"},{"active":"Rifampin","falsePositive":"Opiates","basis":"Cross-reactivity with immunoassay"},{"active":"Verapamil","falsePositive":"Methadone","basis":"Cross-reactivity with immunoassay"},{"active":"Diltiazem","falsePositive":"LSD","basis":"Cross-reactivity with immunoassay"},{"active":"Metformin","falsePositive":"Amphetamines","basis":"Reported cross-reactivity in some assays"},{"active":"Trimeprazine","falsePositive":"Amphetamines","basis":"Cross-reactivity with immunoassay"},{"active":"Oxaprozin","falsePositive":"Benzodiazepines","basis":"Cross-reactivity with immunoassay"},{"active":"Efavirenz","falsePositive":"THC (Cannabinoids)","basis":"Immunoassay interference"},{"active":"Selegiline","falsePositive":"Amphetamines","basis":"Metabolizes to l-amphetamine/l-methamphetamine"},{"active":"Vicks VapoInhaler","falsePositive":"Amphetamines","basis":"Contains l-methamphetamine"},{"active":"Poppy Seeds","falsePositive":"Opiates","basis":"Contain trace amounts of morphine/codeine"},{"active":"Coca Leaf Tea","falsePositive":"Cocaine","basis":"Contains trace amounts of cocaine"},{"active":"Amitriptyline","falsePositive":"LSD","basis":"Cross-reactivity with immunoassay"},{"active":"Clomipramine","falsePositive":"LSD","basis":"Cross-reactivity with immunoassay"},{"active":"Cyclobenzaprine","falsePositive":"Tricyclic Antidepressants","basis":"Structural similarity"},{"active":"Carbamazepine","falsePositive":"Tricyclic Antidepressants","basis":"Structural similarity"}];

const ALL_ACTIVES = Array.from(new Set(DRUG_TEST_DATA.map(d => d.active))).sort();

const CLASS_COLORS: Record<string, string> = {
  'Amphetamines':              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Opiates':                   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Opiates / PCP':             'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Benzodiazepines':           'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Methadone':                 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  'Methadone / PCP':           'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  'PCP (Phencyclidine)':       'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  'THC (Cannabinoids)':        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'LSD':                       'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  'Cocaine':                   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Tricyclic Antidepressants': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  'Amphetamines / Methadone':  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

// ── مطابقة اسم المادة مع الـ Scientific Name في الداتا ──────────────────────
function activeMatchesSci(active: string, sciName: string): boolean {
  const a = active.toLowerCase();
  const s = sciName.toLowerCase();
  // مطابقة مباشرة أو الاسم موجود كـ substring
  return s.includes(a) || a.includes(s.split(' ')[0]);
}

// ── الكومبوننت ───────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  initialDrugName?: string;
  language?: Language;
  allMedicines: Medicine[];             // الأدوية من قاعدة البيانات
  onMedicineSelect?: (m: Medicine) => void;  // فتح تفاصيل الدواء
}

type View = 'home' | 'active_detail';

const DrugTestChecker: React.FC<Props> = ({
  onClose, initialDrugName, language = 'ar', allMedicines, onMedicineSelect
}) => {
  const ar = language === 'ar';
  const [query, setQuery]               = useState(initialDrugName || '');
  const [selectedActive, setSelectedActive] = useState<string | null>(null);
  const [currentView, setCurrentView]   = useState<View>('home');

  // ── البحث: بالاسم التجاري أو المادة الفعالة ────────────────────────────
  const tradeSearchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const matched = new Set<string>();
    DRUG_TEST_DATA.forEach(d => {
      if (d.active.toLowerCase().includes(q)) matched.add(d.active);
    });
    // بحث في الأدوية من قاعدة البيانات عشان يطلع المادة الفعالة
    allMedicines.forEach(m => {
      const tradeName = String(m['Trade Name'] || '').toLowerCase();
      const sciName   = String(m['Scientific Name'] || '').toLowerCase();
      if (tradeName.includes(q) || sciName.includes(q)) {
        // لو الـ scientific name يطابق مادة في قائمتنا
        DRUG_TEST_DATA.forEach(d => {
          if (activeMatchesSci(d.active, sciName)) matched.add(d.active);
        });
      }
    });
    return Array.from(matched).sort();
  }, [query, allMedicines]);

  // ── الأدوية من قاعدة البيانات للمادة الفعالة المختارة ──────────────────
  const medicinesForActive = useMemo(() => {
    if (!selectedActive) return [];
    const active = selectedActive.toLowerCase();
    return allMedicines.filter(m => {
      const sci = String(m['Scientific Name'] || '').toLowerCase();
      return activeMatchesSci(active, sci);
    }).slice(0, 30);
  }, [selectedActive, allMedicines]);

  // ── تفاصيل المادة الفعالة ───────────────────────────────────────────────
  const activeEntries = useMemo(
    () => DRUG_TEST_DATA.filter(d => d.active === selectedActive),
    [selectedActive]
  );

  const handleSelectActive = (active: string) => {
    setSelectedActive(active);
    setCurrentView('active_detail');
  };

  const handleBack = () => {
    setSelectedActive(null);
    setCurrentView('home');
  };

  const filteredActives = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return ALL_ACTIVES;
    return ALL_ACTIVES.filter(a => a.toLowerCase().includes(q));
  }, [query]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-dark-card rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-violet-500 to-purple-600 px-5 pt-5 pb-4 flex-shrink-0">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/30 rounded-full" />
          <div className="flex items-center gap-3">
            {currentView === 'active_detail' && (
              <button onClick={handleBack} className="text-white/80 active:scale-90 transition-transform flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
            )}
            <div className="w-9 h-9 bg-white/20 rounded-2xl flex items-center justify-center text-lg flex-shrink-0">🧪</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-black text-sm leading-tight">
                {currentView === 'active_detail' ? selectedActive : (ar ? 'تحليل المخدرات — إيجابية كاذبة' : 'Drug Test False Positives')}
              </h2>
              <p className="text-white/70 text-[10px] font-semibold mt-0.5">
                {currentView === 'active_detail'
                  ? (ar ? `${medicinesForActive.length} دواء في قاعدة البيانات` : `${medicinesForActive.length} drugs in database`)
                  : (ar ? 'ابحث بالاسم التجاري أو تصفح المواد الفعالة' : 'Search by trade name or browse actives')}
              </p>
            </div>
            <button onClick={onClose} className="text-white/80 active:scale-90 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Detail View ── */}
        {currentView === 'active_detail' && selectedActive && (
          <div className="flex-1 overflow-y-auto">
            {/* الإيجابيات الكاذبة */}
            <div className="px-4 pt-4 space-y-2">
              {activeEntries.map((entry, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/40">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {ar ? 'يظهر كـ' : 'False Positive For'}
                    </p>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${CLASS_COLORS[entry.falsePositive] || 'bg-slate-100 text-slate-600'}`}>
                      {entry.falsePositive}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-start gap-2">
                    <span className="text-sm flex-shrink-0">⚗️</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">{entry.basis}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* الأدوية من قاعدة البيانات */}
            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {ar ? `أدوية في قاعدة البيانات (${medicinesForActive.length})` : `In Database (${medicinesForActive.length})`}
              </p>
            </div>

            {medicinesForActive.length === 0 ? (
              <div className="px-4 pb-4 text-center">
                <p className="text-slate-400 text-xs font-bold py-4">{ar ? 'لا توجد أدوية مسجلة لهذه المادة' : 'No registered drugs found for this active'}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 pb-4">
                {medicinesForActive.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => { onMedicineSelect?.(m); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 active:bg-slate-100 transition-colors text-right"
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm">💊</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-slate-800 dark:text-white truncate">{String(m['Trade Name'] || '')}</p>
                      <p className="text-[10px] text-slate-400 truncate">{String(m['Scientific Name'] || '')}</p>
                    </div>
                    {m['Public price'] && parseFloat(String(m['Public price'])) > 0 && (
                      <p className="text-xs font-black text-primary flex-shrink-0">
                        {parseFloat(String(m['Public price'])).toFixed(2)} <span className="text-[9px] font-bold">SAR</span>
                      </p>
                    )}
                    <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                ))}
              </div>
            )}

            <p className="text-[9px] text-slate-400 text-center pb-4 px-4 leading-relaxed">
              {ar ? '⚠️ للإرشاد فقط. نتيجة إيجابية كاذبة تحتاج تأكيد بفحص GC-MS' : '⚠️ For reference only. Confirm with GC-MS testing'}
            </p>
          </div>
        )}

        {/* ── Home View ── */}
        {currentView === 'home' && (
          <>
            {/* Search */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-dark-border flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={ar ? 'ابحث باسم الدواء أو المادة الفعالة...' : 'Search drug or active name...'}
                  autoFocus
                  className="w-full pl-10 pr-9 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:border-violet-400 transition-colors"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                {query && (
                  <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* نتايج البحث */}
              {query.trim().length >= 2 && (
                <div className="mt-2 space-y-1">
                  {tradeSearchResults.length > 0 ? (
                    <>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                        {ar ? 'مواد فعالة مطابقة' : 'Matching Active Ingredients'}
                      </p>
                      {tradeSearchResults.map(active => {
                        const entry = DRUG_TEST_DATA.find(d => d.active === active);
                        return (
                          <button
                            key={active}
                            onClick={() => handleSelectActive(active)}
                            className="w-full flex items-center justify-between p-2.5 bg-violet-50 dark:bg-violet-900/20 rounded-xl active:scale-[0.98] transition-all border border-violet-100 dark:border-violet-800/30"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">💊</span>
                              <p className="text-sm font-black text-slate-800 dark:text-white">{active}</p>
                            </div>
                            {entry && (
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${CLASS_COLORS[entry.falsePositive] || 'bg-slate-100 text-slate-500'}`}>
                                {entry.falsePositive}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 px-1 py-1">
                      <span>✅</span>
                      <p className="text-xs font-bold text-emerald-600">{ar ? 'لا يوجد تأثير معروف على تحليل المخدرات' : 'No known drug test interference'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* قائمة المواد الفعالة */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-dark-border">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {ar ? `تصفح المواد الفعالة (${filteredActives.length})` : `Browse Active Ingredients (${filteredActives.length})`}
                </p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredActives.map(active => {
                  const entries = DRUG_TEST_DATA.filter(d => d.active === active);
                  const dbCount = allMedicines.filter(m =>
                    activeMatchesSci(active, String(m['Scientific Name'] || ''))
                  ).length;
                  return (
                    <button
                      key={active}
                      onClick={() => handleSelectActive(active)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 active:bg-slate-100 transition-colors text-right"
                    >
                      <div className="w-8 h-8 bg-violet-50 dark:bg-violet-900/20 rounded-xl flex items-center justify-center flex-shrink-0 text-sm">💊</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-slate-800 dark:text-white truncate">{active}</p>
                        <p className="text-[10px] text-slate-400">
                          {dbCount > 0
                            ? (ar ? `${dbCount} دواء في القاعدة` : `${dbCount} in database`)
                            : (ar ? 'غير مسجل' : 'not registered')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {entries.length > 1 && (
                          <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full">
                            {entries.length}
                          </span>
                        )}
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${CLASS_COLORS[entries[0]?.falsePositive] || ''}`}>
                          {entries[0]?.falsePositive}
                        </span>
                        <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DrugTestChecker;
