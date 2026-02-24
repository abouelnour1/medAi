import React, { useState, useEffect, useCallback } from 'react';
import { Medicine, Language, TFunction } from '../types';
import { 
  getDailyFeatured, saveDailyFeatured, saveClinicalData, getClinicalData,
  FeaturedMedicine, DailyFeatured, ClinicalData 
} from '../utils/dailyMedicines';
import { getScheduledMedicines } from '../utils/featuredSchedule';
import { getTopSearched } from '../utils/analytics';

interface Props {
  medicines: Medicine[];
  language: Language;
  t: TFunction;
  onSelect: (medicine: Medicine) => void;
  geminiApiKey?: string;
}

// توليد Clinical Data بالـ Gemini
async function generateClinicalData(
  medicine: Medicine,
  language: Language,
  apiKey: string
): Promise<ClinicalData | null> {
  try {
    const ar = language === 'ar';
    const prompt = ar
      ? `أنت صيدلاني سريري خبير. أعطني معلومات سريرية مختصرة ومهمة عن دواء:
الاسم التجاري: ${medicine['Trade Name']}
المادة الفعالة: ${medicine['Scientific Name']}
الشكل الصيدلاني: ${medicine.PharmaceuticalForm}
نوع المنتج: ${medicine['Product type']}

أجب بـ JSON فقط بهذا الشكل بالضبط:
{
  "indication": "يستخدم لعلاج... (2-3 استخدامات رئيسية)",
  "dosage": "الجرعة المعتادة للبالغين: ... | للأطفال: ... | تعديل في الكلى: ...",
  "sideEffects": "الأكثر شيوعاً: ... | تحذير: ...",
  "pharmacistNote": "تنبيه مهم للصيدلاني في جملة أو جملتين",
  "mechanism": "آلية العمل باختصار"
}`
      : `You are an expert clinical pharmacist. Give concise clinical info about:
Trade Name: ${medicine['Trade Name']}
Active Ingredient: ${medicine['Scientific Name']}
Form: ${medicine.PharmaceuticalForm}
Product Type: ${medicine['Product type']}

Reply with ONLY this JSON:
{
  "indication": "Used for... (2-3 main uses)",
  "dosage": "Adults: ... | Pediatric: ... | Renal adjustment: ...",
  "sideEffects": "Common: ... | Warning: ...",
  "pharmacistNote": "Key pharmacist alert in 1-2 sentences",
  "mechanism": "Brief mechanism of action"
}`;

    const { GoogleGenAI } = await import('@google/genai');
    const genai = new GoogleGenAI({ apiKey });
    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    const raw = result.text || '';
    // تنظيف الـ response من markdown
    const text = raw.replace(/```json[\s\S]*?```/g, m => m.replace(/```json|```/g, '')).replace(/```/g, '').trim();
    // استخراج أول JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response: ' + text.slice(0, 200));
    const parsed = JSON.parse(jsonMatch[0]);
    return { ...parsed, generatedAt: new Date().toISOString(), language };
  } catch (e) {
    console.error('Clinical data generation error:', e);
    return null;
  }
}

// اختيار 3 أدوية للعرض اليومي
function selectDailyMedicines(medicines: Medicine[]): Medicine[] {
  const today = new Date().toISOString().split('T')[0];
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);

  const topSearched = getTopSearched(20);

  let pool: Medicine[] = [];

  if (topSearched.length >= 3) {
    // من أكثر المبحوثين - نفضل المكملات
    const supplements = medicines.filter(m => m['Product type'] === 'Supplement');
    const others = medicines.filter(m => m['Product type'] !== 'Supplement');

    topSearched.forEach(ts => {
      const found = medicines.find(m =>
        m['Trade Name'].toLowerCase() === ts.name.toLowerCase()
      );
      if (found && pool.length < 6) pool.push(found);
    });

    // لو المكملات مش ممثلة - نضيف واحد
    const hasSupp = pool.some(m => m['Product type'] === 'Supplement');
    if (!hasSupp && supplements.length > 0) {
      pool.unshift(supplements[(seed * 7) % supplements.length]);
    }
  }

  // لو مفيش analytics كافية - نختار عشوائي ثابت لليوم
  if (pool.length < 3) {
    const withImage = medicines.filter(m => m.imgBox);
    const base = withImage.length > 0 ? withImage : medicines;
    for (let i = 0; i < 3 && pool.length < 3; i++) {
      const idx = (seed * (i + 3) * 17) % base.length;
      const m = base[idx];
      if (m && !pool.find(p => p.RegisterNumber === m.RegisterNumber)) pool.push(m);
    }
  }

  return pool.slice(0, 3);
}

// كارت الدواء المميز
const FeaturedCard: React.FC<{
  medicine: FeaturedMedicine;
  index: number;
  ar: boolean;
  onSelect: () => void;
}> = ({ medicine, index, ar, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
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

        {/* Clinical Data */}
        {medicine.clinicalData && (
          <div className="px-4 pb-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between bg-white/10 rounded-2xl px-3 py-2 mb-2"
            >
              <span className="text-white/80 text-[10px] font-black">
                {ar ? '📋 معلومات سريرية' : '📋 Clinical Info'}
              </span>
              <svg
                className={`w-3 h-3 text-white/60 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expanded && (
              <div className="space-y-2 animate-fade-in">
                {/* indication */}
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-white/50 text-[9px] font-black uppercase mb-1">
                    {ar ? 'يستخدم لـ' : 'Indication'}
                  </p>
                  <p className="text-white/90 text-[11px] leading-relaxed">
                    {medicine.clinicalData.indication}
                  </p>
                </div>
                {/* dosage */}
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-white/50 text-[9px] font-black uppercase mb-1">
                    💊 {ar ? 'الجرعة' : 'Dosage'}
                  </p>
                  <p className="text-white/90 text-[11px] leading-relaxed">
                    {medicine.clinicalData.dosage}
                  </p>
                </div>
                {/* pharmacist note */}
                <div className="bg-amber-500/30 rounded-2xl p-3 border border-amber-400/30">
                  <p className="text-amber-200 text-[9px] font-black uppercase mb-1">
                    ⚠️ {ar ? 'تنبيه الصيدلاني' : 'Pharmacist Note'}
                  </p>
                  <p className="text-white/90 text-[11px] leading-relaxed">
                    {medicine.clinicalData.pharmacistNote}
                  </p>
                </div>
              </div>
            )}

            {/* Side effects preview */}
            {!expanded && medicine.clinicalData.sideEffects && (
              <div className="bg-white/10 rounded-2xl px-3 py-2">
                <p className="text-white/60 text-[9px] truncate">
                  {medicine.clinicalData.sideEffects.split('|')[0]}
                </p>
              </div>
            )}
          </div>
        )}

        {!medicine.clinicalData && (
          <div className="px-4 pb-4">
            <div className="bg-white/10 rounded-2xl px-3 py-2.5 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-white/40 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div>
                <p className="text-white/70 text-[10px] font-black">
                  {ar ? '🤖 جاري توليد المعلومات السريرية...' : '🤖 Generating clinical info...'}
                </p>
                <p className="text-white/40 text-[8px] mt-0.5">
                  {ar ? 'بكرة هيظهر فوراً بدون انتظار' : 'Will load instantly next time'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DailyFeaturedSection: React.FC<Props> = ({ medicines, language, t, onSelect, geminiApiKey }) => {
  const [featured, setFeatured] = useState<FeaturedMedicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const ar = language === 'ar';

  const loadOrGenerate = useCallback(async () => {
    if (!medicines.length) return;
    setIsLoading(true);

    const today = new Date().toISOString().split('T')[0];

    // جرب تجيب من Firestore الأول (cached)
    const cached = await getDailyFeatured();
    if (cached && cached.date === today && cached.medicines.length === 3) {
      setFeatured(cached.medicines);
      setIsLoading(false);
      return;
    }

    // اقرأ الجدول اليدوي من الأدمن
    const scheduledRegNums = await getScheduledMedicines(today);
    let selected: Medicine[];
    if (scheduledRegNums && scheduledRegNums.length === 3) {
      // الأدمن جدول اليوم ده
      selected = scheduledRegNums
        .map(r => medicines.find(m => m.RegisterNumber === r))
        .filter(Boolean) as Medicine[];
    } else {
      // اختيار تلقائي
      selected = selectDailyMedicines(medicines);
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
          const clinical = await generateClinicalData(selected[i], language, geminiApiKey);
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
    } else {
      setIsLoading(false);
    }
  }, [medicines, language, geminiApiKey]);

  useEffect(() => {
    loadOrGenerate();
  }, [loadOrGenerate]);

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
    </div>
  );
};

export default DailyFeaturedSection;
