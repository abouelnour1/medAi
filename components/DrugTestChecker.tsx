import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Language, Medicine } from '../types';

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

function activeMatchesSci(active: string, sciName: string): boolean {
  const activeNorm = active.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sciWords = sciName.toLowerCase().split(/[\s\/,+\-()]+/)
    .map(w => w.replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length >= 3);
  return sciWords.some(w =>
    w === activeNorm ||
    (activeNorm.length >= 5 && w.startsWith(activeNorm)) ||
    (activeNorm.length >= 5 && activeNorm.startsWith(w) && w.length >= 5)
  );
}

interface Props {
  onClose: () => void;
  initialDrugName?: string;
  language?: Language;
  allMedicines: Medicine[];
  onMedicineSelect?: (m: Medicine) => void;
}

type View = 'home' | 'active_detail';

const DrugTestChecker: React.FC<Props> = ({
  onClose, initialDrugName, language = 'ar', allMedicines, onMedicineSelect
}) => {
  const ar = language === 'ar';
  const [query, setQuery] = useState(initialDrugName || '');
  const [debouncedQuery, setDebouncedQuery] = useState(initialDrugName || '');
  const [selectedActive, setSelectedActive] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('home');
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleQueryChange = (val: string) => {
    setQuery(val);
    setDebouncedQuery(val); // بدون debounce — فوري
  };

  useEffect(() => { setVisible(true); }, []);

  const handleClose = () => {
    setVisible(false);
    onClose();
  };

  // الرجوع = أغلق الـ modal
  const handleBack = () => {
    handleClose();
  };

  const tradeSearchResults = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const matched = new Set<string>();
    DRUG_TEST_DATA.forEach(d => {
      if (d.active.toLowerCase().includes(q)) matched.add(d.active);
    });
    allMedicines.forEach(m => {
      const tradeName = String(m['Trade Name'] || '').toLowerCase();
      if (tradeName.includes(q)) {
        const sciName = String(m['Scientific Name'] || '');
        DRUG_TEST_DATA.forEach(d => {
          if (activeMatchesSci(d.active, sciName)) matched.add(d.active);
        });
      }
    });
    return Array.from(matched).sort();
  }, [debouncedQuery, allMedicines]);

  const medicinesForActive = useMemo(() => {
    if (!selectedActive) return [];
    return allMedicines
      .filter(m => activeMatchesSci(selectedActive, String(m['Scientific Name'] || '')))
      .slice(0, 40);
  }, [selectedActive, allMedicines]);

  const activeEntries = useMemo(
    () => DRUG_TEST_DATA.filter(d => d.active === selectedActive),
    [selectedActive]
  );

  const filteredActives = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (q.length < 2) return ALL_ACTIVES;
    return ALL_ACTIVES.filter(a => a.toLowerCase().includes(q));
  }, [debouncedQuery]);

  const handleSelectActive = (active: string) => {
    setSelectedActive(active);
    setCurrentView('active_detail');
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center"
      style={{ backgroundColor: visible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)', transition: 'background-color 220ms ease' }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-dark-card rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          height: '82vh',          /* ارتفاع ثابت دايماً */
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 220ms cubic-bezier(0.32,0.72,0,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-violet-500 to-purple-600 px-5 pt-5 pb-4 flex-shrink-0">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/30 rounded-full" />
          <div className="flex items-center gap-3">
            {currentView === 'active_detail' && (
              <button
                onClick={e => { e.stopPropagation(); setCurrentView('home'); setSelectedActive(null); }}
                className="text-white/80 active:scale-90 transition-transform flex-shrink-0"
              >
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
                  ? (ar ? `${medicinesForActive.length} دواء في القاعدة` : `${medicinesForActive.length} drugs in database`)
                  : (ar ? 'ابحث بالاسم التجاري أو تصفح المواد الفعالة' : 'Search or browse active ingredients')}
              </p>
            </div>
            <button onClick={e => { e.stopPropagation(); handleClose(); }} className="text-white/80 active:scale-90 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Detail View ── */}
        {currentView === 'active_detail' && selectedActive && (
          <div className="flex-1 overflow-y-auto overscroll-contain">
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

            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {ar ? `أدوية في قاعدة البيانات (${medicinesForActive.length})` : `In Database (${medicinesForActive.length})`}
              </p>
            </div>

            {medicinesForActive.length === 0 ? (
              <p className="text-center text-slate-400 text-xs font-bold py-6">
                {ar ? 'لا توجد أدوية مسجلة لهذه المادة' : 'No registered drugs found'}
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 pb-4">
                {medicinesForActive.map((m, i) => (
                  <button
                    key={i}
                    onClick={e => { e.stopPropagation(); onMedicineSelect?.(m); handleClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 active:bg-slate-100 transition-colors"
                  >
                    {/* الاسم على اليسار */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-black text-sm text-slate-800 dark:text-white truncate text-left">{String(m['Trade Name'] || '')}</p>
                      <p className="text-[10px] text-slate-400 truncate text-left">{String(m['Scientific Name'] || '')}</p>
                    </div>
                    {/* السعر والسهم على اليمين */}
                    {m['Public price'] && parseFloat(String(m['Public price'])) > 0 && (
                      <p className="text-xs font-black text-primary flex-shrink-0">
                        {parseFloat(String(m['Public price'])).toFixed(2)} <span className="text-[9px]">SAR</span>
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
                  ref={inputRef}
                  type="text"
                  defaultValue={query}
                  onChange={e => handleQueryChange(e.target.value)}
                  placeholder={ar ? 'ابحث باسم الدواء أو المادة الفعالة...' : 'Search drug or active name...'}
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

              {query.trim().length >= 2 && (
                <div className="mt-2 space-y-1">
                  {tradeSearchResults.length > 0 ? (
                    <>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                        {ar ? 'مواد فعالة مطابقة' : 'Matching Actives'}
                      </p>
                      {tradeSearchResults.map(active => {
                        const entry = DRUG_TEST_DATA.find(d => d.active === active);
                        return (
                          <button
                            key={active}
                            onClick={e => { e.stopPropagation(); handleSelectActive(active); }}
                            className="w-full flex items-center justify-between p-2.5 bg-violet-50 dark:bg-violet-900/20 rounded-xl active:scale-[0.98] transition-all border border-violet-100 dark:border-violet-800/30"
                          >
                            <p className="text-sm font-black text-slate-800 dark:text-white text-left">{active}</p>
                            {entry && (
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${CLASS_COLORS[entry.falsePositive] || 'bg-slate-100 text-slate-500'}`}>
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
                      <p className="text-xs font-bold text-emerald-600">
                        {ar ? 'لا يوجد تأثير معروف على تحليل المخدرات' : 'No known drug test interference'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* القائمة — fixed height scroll */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-dark-border sticky top-0 bg-white dark:bg-dark-card z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {ar ? `المواد الفعالة (${filteredActives.length})` : `Active Ingredients (${filteredActives.length})`}
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
                      onClick={e => { e.stopPropagation(); handleSelectActive(active); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 active:bg-slate-100 transition-colors"
                    >
                      {/* الاسم على اليسار */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-black text-sm text-slate-800 dark:text-white truncate text-left">{active}</p>
                        <p className="text-[10px] text-slate-400 text-left">
                          {dbCount > 0
                            ? (ar ? `${dbCount} دواء في القاعدة` : `${dbCount} in database`)
                            : (ar ? 'غير مسجل' : 'not in database')}
                        </p>
                      </div>
                      {/* الـ badge والسهم على اليمين */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {entries.length > 1 && (
                          <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full">
                            {entries.length}
                          </span>
                        )}
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full hidden sm:block ${CLASS_COLORS[entries[0]?.falsePositive] || ''}`}>
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
