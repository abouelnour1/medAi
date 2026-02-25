import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Medicine, Language, TFunction } from '../types';
import { 
  getDailyFeatured, saveDailyFeatured, saveClinicalData, getClinicalData,
  getDailyMedicineCount, clearLocalCache,
  FeaturedMedicine, DailyFeatured, ClinicalData 
} from '../utils/dailyMedicines';
import { getScheduledMedicines } from '../utils/featuredSchedule';
import { callGenerateClinical } from '../utils/geminiProxy';
import { notifyDailyFeaturedChanged } from '../utils/pushNotifications';
import ClinicalDataEditorModal from './ClinicalDataEditorModal';
import ClinicalDataPage from './ClinicalDataPage';
import { getTopSearched } from '../utils/analytics';

interface Props {
  medicines: Medicine[];
  language: Language;
  t: TFunction;
  onSelect: (medicine: Medicine) => void;
  geminiApiKey?: string;
  isAdmin?: boolean;
  onNewDailyReady?: (medicines: FeaturedMedicine[]) => void; // callback لما تتغير الأدوية
}

// توليد Clinical Data بالـ Gemini
async function generateClinicalData(
  medicine: Medicine,
  language: Language,
  _apiKey: string,
  _useProxy: boolean = true
): Promise<ClinicalData | null> {
  // كل التوليد بيمشي عبر الـ Vercel proxy - مفيش SDK مباشر
  try {
    const result = await callGenerateClinical({
      tradeName: medicine['Trade Name'],
      scientificName: medicine['Scientific Name'] || '',
      strength: medicine.Strength || '',
      form: medicine.PharmaceuticalForm || '',
      language
    });
    if (!result) return null;
    return {
      indication: result.indication || '',
      dosage: result.dosage || '',
      sideEffects: result.sideEffects || '',
      pharmacistNote: result.pharmacistNote || '',
      mechanism: result.mechanism,
      generatedAt: new Date().toISOString(),
      language
    };
  } catch (e) {
    console.error('generateClinicalData via proxy failed:', e);
    return null;
  }
}


// كارت الدواء المميز
const FeaturedCard: React.FC<{
  medicine: FeaturedMedicine;
  index: number;
  ar: boolean;
  onSelect: () => void;
  onEditClinical?: () => void;
  onOpenClinical?: () => void;
  isAdminMode?: boolean;
}> = ({ medicine, index, ar, onSelect, onEditClinical, onOpenClinical, isAdminMode }) => {
  const colors = [
    'from-primary via-teal-600 to-emerald-700',
    'from-violet-600 via-purple-600 to-indigo-700',
    'from-rose-500 via-pink-600 to-rose-700',
  ];
  const icons = ['💊', '🌿', '⚕️'];

  return (
    <div className="flex-shrink-0 w-[80vw] max-w-[300px] snap-start">
      <div
        className={`relative overflow-hidden bg-gradient-to-br ${colors[index]} rounded-3xl shadow-xl active:scale-[0.97] transition-all`}
      >
        {/* زخرفة خلفية */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-8" />

        {/* Header الكارت */}
        <div className="p-4" onClick={onSelect}>
          <div className="flex items-start gap-3">
            {medicine.imgBox ? (
              <img
                src={medicine.imgBox}
                alt={medicine.tradeName}
                className="w-16 h-16 object-contain rounded-2xl bg-white/20 p-1.5 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 text-2xl">
                {icons[index]}
              </div>
            )}
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-1 mb-1">
                {medicine.isSponsored && (
                  <span className="bg-amber-400 text-amber-900 text-[8px] font-black px-1.5 py-0.5 rounded-full">
                    {ar ? 'مميز' : 'Featured'}
                  </span>
                )}
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                  medicine.legalStatus === 'Prescription' 
                    ? 'bg-rose-500/60 text-white' 
                    : 'bg-emerald-500/60 text-white'
                }`}>
                  {medicine.legalStatus === 'Prescription' ? 'Rx' : 'OTC'}
                </span>
              </div>
              <h3 className="text-white font-black text-sm leading-tight">{medicine.tradeName}</h3>
              <p className="text-white/60 text-[10px] mt-0.5 truncate">{medicine.scientificName}</p>
              {parseFloat(medicine.price) > 0 && (
                <p className="text-white/80 text-[11px] font-black mt-1">
                  {parseFloat(medicine.price).toFixed(2)} {ar ? 'ر.س' : 'SAR'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Clinical Data - زرار يفتح صفحة منفصلة */}
        {medicine.clinicalData && (
          <div className="px-4 pb-4">
            <button
              onClick={e => { e.stopPropagation(); onOpenClinical?.(); }}
              className="w-full flex items-center justify-between bg-white/15 hover:bg-white/25 rounded-2xl px-3 py-2.5 transition-all active:scale-95"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">📋</span>
                <div className="text-left">
                  <p className="text-white/90 text-[10px] font-black">
                    {ar ? 'المعلومات السريرية' : 'Clinical Info'}
                  </p>
                  <p className="text-white/50 text-[8px] truncate max-w-[150px]">
                    {medicine.clinicalData.indication?.slice(0, 40)}...
                  </p>
                </div>
              </div>
              <svg className="w-4 h-4 text-white/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        )}

        {!medicine.clinicalData && isAdminMode && onEditClinical && (
          <div className="px-4 pb-4">
            {/* زرار الإضافة اليدوية - للأدمن بس */}
            <button
              onClick={e => { e.stopPropagation(); onEditClinical(); }}
              className="w-full bg-white/15 hover:bg-white/25 rounded-2xl px-3 py-2 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <span className="text-white/80 text-[10px] font-black">
                ✏️ {ar ? 'أضف المعلومات السريرية' : 'Add clinical info'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// اختيار أدوية عشوائية مع seed اليوم
function selectDailyMedicines(medicines: Medicine[]): Medicine[] {
  if (!medicines.length) return [];
  const today = new Date().toISOString().split('T')[0];
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
  const shuffled = [...medicines].sort((a, b) => {
    const ha = (seed * 2654435761 + a.RegisterNumber.charCodeAt(0)) >>> 0;
    const hb = (seed * 2654435761 + b.RegisterNumber.charCodeAt(0)) >>> 0;
    return ha - hb;
  });
  return shuffled.slice(0, 10); // نرجع 10 عشان نكمل من بعدهم
}

const DailyFeaturedSection: React.FC<Props> = ({ medicines, language, t, onSelect, geminiApiKey, isAdmin, onNewDailyReady }) => {
  const [featured, setFeatured] = useState<FeaturedMedicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMed, setEditingMed] = useState<FeaturedMedicine | null>(null);
  const [clinicalPageMed, setClinicalPageMed] = useState<FeaturedMedicine | null>(null);
  const hasLoadedRef = useRef(false);
  // نحفظ الـ props في refs عشان نستخدمها في useCallback بدون إعادة إنشاء
  const medicinesRef = useRef(medicines);
  const geminiKeyRef = useRef(geminiApiKey);
  const languageRef = useRef(language);
  useEffect(() => { medicinesRef.current = medicines; }, [medicines]);
  useEffect(() => { geminiKeyRef.current = geminiApiKey; }, [geminiApiKey]);
  useEffect(() => { languageRef.current = language; }, [language]);
  const ar = language === 'ar';

  const loadOrGenerate = useCallback(async () => {
    const medicines = medicinesRef.current;
    const geminiApiKey = geminiKeyRef.current;
    const language = languageRef.current;
    if (!medicines.length) return;
    if (hasLoadedRef.current) return; // مرة واحدة بس
    hasLoadedRef.current = true;
    setIsLoading(true);

    const today = new Date().toISOString().split('T')[0];

    // جرب تجيب من Firestore الأول (cached)
    const cached = await getDailyFeatured();
    if (cached && cached.date === today && cached.medicines.length === 3) {
      // نجيب clinicalData للأدوية اللي مش عندها
      const enrichedCached = [...cached.medicines];
      let needsUpdate = false;
      for (let i = 0; i < enrichedCached.length; i++) {
        if (!enrichedCached[i].clinicalData) {
          try {
            const saved = await getClinicalData(enrichedCached[i].registerNumber);
            if (saved) {
              enrichedCached[i] = { ...enrichedCached[i], clinicalData: saved };
              needsUpdate = true;
            }
          } catch {}
        }
      }
      setFeatured(enrichedCached);
      setIsLoading(false);
      // لو في داتا جديدة نولدها بالـ AI في الخلفية
      if (geminiApiKey) {
        for (let i = 0; i < enrichedCached.length; i++) {
          if (enrichedCached[i].clinicalData) continue;
          try {
            const regNum = enrichedCached[i].registerNumber;
            const fullMed = medicines.find(m => m.RegisterNumber === regNum);
            if (!fullMed) continue;
            const clinical = await generateClinicalData(fullMed, language, geminiApiKey, true);
            if (clinical) {
              enrichedCached[i] = { ...enrichedCached[i], clinicalData: clinical };
              setFeatured([...enrichedCached]);
              await saveClinicalData(regNum, clinical);
            }
          } catch {}
        }
      }
      return;
    }

    // اقرأ الجدول اليدوي من الأدمن
    const scheduledRegNums = await getScheduledMedicines(today);
    let selected: Medicine[];
    // جيب العدد المطلوب من الإعدادات
    const targetCount = await getDailyMedicineCount();

    if (scheduledRegNums && scheduledRegNums.length > 0) {
      const scheduledList = scheduledRegNums
        .map(r => medicines.find(m => m.RegisterNumber === r))
        .filter(Boolean) as Medicine[];
      
      if (scheduledList.length >= targetCount) {
        selected = scheduledList.slice(0, targetCount);
      } else {
        const scheduled_ids = new Set(scheduledList.map(m => m.RegisterNumber));
        const autoSelected = selectDailyMedicines(medicines)
          .filter(m => !scheduled_ids.has(m.RegisterNumber));
        selected = [...scheduledList, ...autoSelected].slice(0, targetCount);
      }
    } else {
      selected = selectDailyMedicines(medicines).slice(0, targetCount);
    }
    const featuredMeds: FeaturedMedicine[] = selected.map((m, i) => ({
      tradeName: m['Trade Name'],
      scientificName: m['Scientific Name'],
      price: m['Public price'],
      form: m.PharmaceuticalForm,
      legalStatus: m['Legal Status'],
      imgBox: m.imgBox,
      isSponsored: i === 0, // الأول مميز
      registerNumber: m.RegisterNumber,
    }));

    // أول حاجة: نجيب الـ clinicalData المحفوظة من Firestore لو موجودة
    const enriched = [...featuredMeds];
    for (let i = 0; i < selected.length; i++) {
      try {
        const saved = await getClinicalData(selected[i].RegisterNumber);
        if (saved) {
          enriched[i] = { ...enriched[i], clinicalData: saved };
        }
      } catch {}
    }
    setFeatured([...enriched]);
    setIsLoading(false);

    // بعدين: أي دواء مش عنده data نولدها بالـ AI
    if (geminiApiKey) {
      let changed = false;
      for (let i = 0; i < selected.length; i++) {
        if (enriched[i].clinicalData) continue; // موجودة - skip
        try {
          const clinical = await generateClinicalData(selected[i], language, geminiApiKey, true);
          if (clinical) {
            enriched[i] = { ...enriched[i], clinicalData: clinical };
            setFeatured([...enriched]);
            await saveClinicalData(selected[i].RegisterNumber, clinical);
            changed = true;
          }
        } catch {}
      }

      // احفظ في Firestore اليومي
      const daily: DailyFeatured = {
        date: today,
        medicines: enriched,
        generatedAt: new Date().toISOString(),
      };
      await saveDailyFeatured(daily);
      // إشعار بالأدوية الجديدة
      const notifData = enriched.map(m => ({
        tradeName: m.tradeName,
        indication: m.clinicalData?.indication
      }));
      notifyDailyFeaturedChanged(notifData);
    } else {
      setIsLoading(false);
    }
  }, []); // مرة واحدة بس - الـ refs بتتحدث تلقائياً

  useEffect(() => {
    // ننتظر حتى تكون الأدوية جاهزة
    if (medicines.length > 0 && !hasLoadedRef.current) {
      loadOrGenerate();
    }
  }, [medicines.length > 0]); // يشتغل مرة لما الأدوية تتحمل

  if (isLoading) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 px-1 mb-3">
          <span className="text-base">✨</span>
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            {ar ? 'أدوية اليوم' : "Today's Featured"}
          </h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[0,1,2].map(i => (
            <div key={i} className="flex-shrink-0 w-[80vw] max-w-[300px] h-40 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!featured.length) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            {ar ? 'أدوية اليوم' : "Today's Featured"}
          </h2>
        </div>
        <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 flex items-center gap-1">
          🔥 {ar ? 'الأكثر بحثاً' : 'Trending'}
        </span>
      </div>

      {/* Horizontal scroll - نفس نون */}
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 no-scrollbar">
        {featured.map((med, i) => {
          const fullMed = medicines.find(m => m.RegisterNumber === med.registerNumber);
          return (
            <FeaturedCard
              key={med.registerNumber}
              medicine={med}
              index={i}
              ar={ar}
              onSelect={() => fullMed && onSelect(fullMed)}
              onEditClinical={() => setEditingMed(med)}
              onOpenClinical={() => setClinicalPageMed(med)}
              isAdminMode={isAdmin}
            />
          );
        })}
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 mt-2">
        {featured.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all ${i === 0 ? 'w-4 bg-primary' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`} />
        ))}
      </div>

      {/* Modal إدخال يدوي للمعلومات السريرية */}
      {clinicalPageMed && (
        <ClinicalDataPage
          registerNumber={clinicalPageMed.registerNumber}
          tradeName={clinicalPageMed.tradeName}
          scientificName={clinicalPageMed.scientificName}
          language={language}
          isAdmin={isAdmin}
          onClose={() => setClinicalPageMed(null)}
        />
      )}

      {editingMed && (
        <ClinicalDataEditorModal
          registerNumber={editingMed.registerNumber}
          tradeName={editingMed.tradeName}
          language={language}
          onClose={() => setEditingMed(null)}
          onSaved={async (data) => {
            const updated = featured.map(m =>
              m.registerNumber === editingMed.registerNumber
                ? { ...m, clinicalData: data }
                : m
            );
            setFeatured(updated);
            // حفظ الـ dailyFeatured المحدث في Firestore عشان يتذكره
            const today = new Date().toISOString().split('T')[0];
            await saveDailyFeatured({ date: today, medicines: updated, generatedAt: new Date().toISOString() });
            setEditingMed(null);
          }}
        />
      )}
    </div>
  );
};

export default DailyFeaturedSection;
