import React, { useMemo } from 'react';
import { Medicine, Language, TFunction } from '../types';
import { getTopSearched } from '../utils/analytics';

interface Props {
  medicines: Medicine[];
  language: Language;
  t: TFunction;
  onSelect: (medicine: Medicine) => void;
}

const facts = [
  (m: Medicine, ar: boolean) => ar
    ? `هل تعلم أن ${m['Trade Name']} يحتوي على ${m['Scientific Name']} كمادة فعالة؟`
    : `Did you know ${m['Trade Name']} contains ${m['Scientific Name']} as its active ingredient?`,
  (m: Medicine, ar: boolean) => ar
    ? `${m['Trade Name']} متاح بسعر ${parseFloat(m['Public price']).toFixed(2)} ر.س`
    : `${m['Trade Name']} is available at ${parseFloat(m['Public price']).toFixed(2)} SAR`,
  (m: Medicine, ar: boolean) => ar
    ? `${m['Trade Name']} - ${m.PharmaceuticalForm} - من إنتاج ${m['Manufacture Name']}`
    : `${m['Trade Name']} - ${m.PharmaceuticalForm} - by ${m['Manufacture Name']}`,
];

const MedicineOfTheDay: React.FC<Props> = ({ medicines, language, t, onSelect }) => {
  const ar = language === 'ar';

  const medicine = useMemo(() => {
    if (!medicines.length) return null;

    // نجيب أكثر الأدوية بحثاً من Analytics
    const topSearched = getTopSearched(10);

    if (topSearched.length > 0) {
      // نختار من أعلى 10 مبحوثاً - يتغير كل يوم عشان ما يتكررش
      const dayIndex = Math.floor(Date.now() / 86400000) % Math.min(topSearched.length, 10);
      const topName = topSearched[dayIndex].name;
      const found = medicines.find(m =>
        m['Trade Name'].toLowerCase() === topName.toLowerCase()
      );
      if (found) return found;
    }

    // fallback: لو مفيش analytics بعد، نختار عشوائي ثابت لليوم
    const dayIndex = Math.floor(Date.now() / 86400000) % medicines.length;
    return medicines[dayIndex];
  }, [medicines]);

  const fact = useMemo(() => {
    if (!medicine) return '';
    const factIndex = Math.floor(Date.now() / 86400000) % facts.length;
    return facts[factIndex](medicine, ar);
  }, [medicine, ar]);

  if (!medicine) return null;

  const price = parseFloat(medicine['Public price']);
  const isRx = medicine['Legal Status'] === 'Prescription';

  return (
    <div
      onClick={() => onSelect(medicine)}
      className="relative overflow-hidden bg-gradient-to-br from-primary via-teal-600 to-emerald-700 rounded-3xl p-5 shadow-xl shadow-primary/25 active:scale-[0.98] transition-all cursor-pointer mb-4"
    >
      {/* خلفية زخرفية */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />

      {/* Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">💊</span>
          <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">
            {ar ? 'دواء اليوم' : 'Medicine of the Day'}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5">
          <span className="text-[9px]">🔥</span>
          <span className="text-white/70 text-[9px] font-black">
            {ar ? 'الأكثر بحثاً' : 'Trending'}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-3">
        {/* صورة الدواء */}
        {medicine.imgBox ? (
          <img
            src={medicine.imgBox}
            alt={medicine['Trade Name']}
            className="w-20 h-20 object-contain rounded-2xl bg-white/20 p-1.5 flex-shrink-0 backdrop-blur-sm"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">💊</span>
          </div>
        )}

        <div className="flex-grow min-w-0">
          <h3 className="text-white font-black text-lg leading-tight truncate">
            {medicine['Trade Name']}
          </h3>
          <p className="text-white/70 text-[11px] font-bold truncate mt-0.5">
            {medicine['Scientific Name']}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {isRx ? (
              <span className="bg-rose-500/80 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Rx</span>
            ) : (
              <span className="bg-emerald-500/80 text-white text-[9px] font-black px-2 py-0.5 rounded-full">OTC</span>
            )}
            <span className="bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
              {medicine.PharmaceuticalForm}
            </span>
            {price > 0 && (
              <span className="bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                {price.toFixed(2)} ر.س
              </span>
            )}
          </div>
        </div>
      </div>

      {/* المعلومة اليومية */}
      <div className="mt-3 bg-white/10 rounded-2xl px-3 py-2 backdrop-blur-sm">
        <p className="text-white/90 text-[11px] font-bold leading-relaxed">{fact}</p>
      </div>

      <p className="text-white/40 text-[9px] text-center mt-2 font-bold">
        {ar ? 'اضغط لعرض التفاصيل الكاملة ←' : 'Tap for full details →'}
      </p>
    </div>
  );
};

export default MedicineOfTheDay;
