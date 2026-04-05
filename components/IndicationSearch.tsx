import React, { useState, useMemo } from 'react';
import { Medicine, Language, TFunction } from '../types';
import MedicineCard from './MedicineCard';

interface Props {
  indications: Record<string, { icd10Code: string; drugs: { s: string; a?: string; c?: string; m?: string; n?: string }[] }>;
  medicines: Medicine[];
  language: Language;
  t: TFunction;
  onMedicineSelect: (m: Medicine) => void;
  onMedicineLongPress: (m: Medicine) => void;
  onFindAlternative: (m: Medicine) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

const IndicationSearch: React.FC<Props> = ({
  indications, medicines, language, t,
  onMedicineSelect, onMedicineLongPress, onFindAlternative,
  favorites, onToggleFavorite
}) => {
  const ar = language === 'ar';
  const [query, setQuery] = useState('');
  const [selectedIndication, setSelectedIndication] = useState<string | null>(null);
  const [selectedSciName, setSelectedSciName] = useState<string | null>(null);

  // Step 1: قائمة الأمراض المطابقة
  const matchedIndications = useMemo(() => {
    if (!query.trim() || Object.keys(indications).length === 0) return [];
    const q = query.toLowerCase();
    return Object.entries(indications)
      .filter(([name, data]) =>
        name.toLowerCase().includes(q) ||
        (data.icd10Code || '').toLowerCase().includes(q)
      )
      .slice(0, 30)
      .map(([name, data]) => ({ name, icd10Code: data.icd10Code, drugCount: (data.drugs || []).length }));
  }, [query, indications]);

  // Step 2: المواد الفعالة للمرض المختار
  const activeIngredients = useMemo(() => {
    if (!selectedIndication) return [];
    const data = indications[selectedIndication];
    if (!data) return [];
    // group by scientific name
    const map = new Map<string, { atcCode: string; drugClass: string; mdd: string; notes: string; medCount: number }>();
    (data.drugs || []).forEach(d => {
      const sci = (d.s || '').trim();
      if (!sci) return;
      const medCount = medicines.filter(m =>
        String(m['Scientific Name'] || '').toLowerCase() === sci.toLowerCase()
      ).length;
      if (!map.has(sci)) {
        map.set(sci, { atcCode: d.a || '', drugClass: d.c || '', mdd: d.m || '', notes: d.n || '', medCount });
      }
    });
    return Array.from(map.entries())
      .map(([sci, info]) => ({ sci, ...info }))
      .sort((a, b) => b.medCount - a.medCount);
  }, [selectedIndication, indications, medicines]);

  // Step 3: الأدوية للمادة الفعالة المختارة
  const selectedMedicines = useMemo(() => {
    if (!selectedSciName) return [];
    return medicines.filter(m =>
      String(m['Scientific Name'] || '').toLowerCase() === selectedSciName.toLowerCase()
    );
  }, [selectedSciName, medicines]);

  const handleBack = () => {
    if (selectedSciName) { setSelectedSciName(null); return; }
    if (selectedIndication) { setSelectedIndication(null); return; }
    setQuery('');
  };

  const showBack = selectedIndication !== null;

  return (
    <div className="animate-fade-in">
      {/* Search input */}
      <div className="relative mb-4">
        {showBack && (
          <button onClick={handleBack}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-primary z-10">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
        )}
        <input
          type="text"
          value={selectedIndication
            ? (selectedSciName || selectedIndication)
            : query}
          onChange={e => {
            if (selectedIndication) return;
            setQuery(e.target.value);
          }}
          readOnly={!!selectedIndication}
          placeholder={ar ? 'ابحث عن مرض... مثال: Hypertension' : 'Search disease... e.g. Hypertension'}
          className={`w-full h-12 ${showBack ? 'pl-10' : 'pl-4'} pr-10 bg-white dark:bg-dark-card border-2 border-slate-100 dark:border-dark-border rounded-2xl text-sm font-semibold text-slate-700 dark:text-white outline-none focus:border-primary/40 transition-colors placeholder-slate-300`}
        />
        {(query || selectedIndication) && (
          <button onClick={() => { setQuery(''); setSelectedIndication(null); setSelectedSciName(null); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Step 1: Disease list */}
      {!selectedIndication && query.trim().length > 0 && (
        <div className="space-y-2">
          {matchedIndications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-black text-sm">
              {Object.keys(indications).length === 0
                ? (ar ? 'جاري تحميل بيانات الأمراض...' : 'Loading disease data...')
                : (ar ? 'لا توجد نتائج' : 'No results found')}
            </div>
          ) : matchedIndications.map(ind => (
            <button key={ind.name} onClick={() => setSelectedIndication(ind.name)}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm active:scale-[0.98] transition-all text-left">
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-slate-800 dark:text-white truncate">{ind.name}</p>
                {ind.icd10Code && <p className="text-[10px] text-slate-400 mt-0.5">ICD-10: {ind.icd10Code}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className="text-[10px] font-black bg-teal-100 dark:bg-teal-900/30 text-teal-600 px-2 py-0.5 rounded-full">
                  {ind.drugCount} {ar ? 'مادة' : 'drugs'}
                </span>
                <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Active ingredients */}
      {selectedIndication && !selectedSciName && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-1">
            {ar ? 'المواد الفعالة' : 'Active Ingredients'} · {activeIngredients.length}
          </p>
          <div className="space-y-2">
            {activeIngredients.map(ing => (
              <button key={ing.sci} onClick={() => setSelectedSciName(ing.sci)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm active:scale-[0.98] transition-all text-left">
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-slate-800 dark:text-white">{ing.sci}</p>
                  {ing.drugClass && <p className="text-[10px] text-slate-400 truncate mt-0.5">{ing.drugClass}</p>}
                  {ing.mdd && <p className="text-[10px] text-teal-600 mt-0.5">Max: {ing.mdd}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {ing.medCount > 0 && (
                    <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
                      {ing.medCount} {ar ? 'دواء' : 'meds'}
                    </span>
                  )}
                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Medicines */}
      {selectedSciName && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-1">
            {selectedMedicines.length} {ar ? 'دواء' : 'medicines'}
          </p>
          {selectedMedicines.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-black text-sm">
              {ar ? 'لا توجد أدوية مسجلة' : 'No registered medicines found'}
            </div>
          ) : (
            <div className="space-y-2">
              {selectedMedicines.map(med => (
                <MedicineCard key={med.RegisterNumber} medicine={med}
                  onShortPress={() => onMedicineSelect(med)}
                  onLongPress={onMedicineLongPress}
                  onFindAlternative={onFindAlternative}
                  isFavorite={favorites.includes(med.RegisterNumber)}
                  onToggleFavorite={onToggleFavorite}
                  t={t} language={language}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!selectedIndication && !query.trim() && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <p className="font-black text-slate-400 text-sm">{ar ? 'ابحث عن مرض للبدء' : 'Search for a disease to start'}</p>
          <p className="text-[10px] text-slate-300 mt-1">{ar ? 'مثال: Hypertension, Diabetes' : 'e.g. Hypertension, Diabetes'}</p>
        </div>
      )}
    </div>
  );
};

export default IndicationSearch;
