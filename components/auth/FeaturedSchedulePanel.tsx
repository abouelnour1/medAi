import React, { useState, useEffect } from 'react';
import { Medicine, TFunction, Language } from '../../types';
import { 
  subscribeSchedule, saveScheduleDay, deleteScheduleDay,
  getWeekDays, formatDateAr, ScheduledDay
} from '../../utils/featuredSchedule';

interface Props {
  allMedicines: Medicine[];
  t: TFunction;
  language: Language;
  userId: string;
}

const FeaturedSchedulePanel: React.FC<Props> = ({ allMedicines, language, userId }) => {
  const ar = language === 'ar';
  const [schedule, setSchedule] = useState<Record<string, ScheduledDay>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const weekDays = getWeekDays(-1);

  useEffect(() => {
    const unsub = subscribeSchedule(s => { setSchedule(s); setLoading(false); });
    return () => unsub();
  }, []);

  const handleDayClick = (date: string) => {
    setSelectedDay(date);
    const existing = schedule[date];
    if (existing) {
      setSelectedMeds(existing.medicines);
      setNote(existing.note || '');
    } else {
      setSelectedMeds([]);
      setNote('');
    }
    setSearchQuery('');
  };

  const toggleMed = (regNum: string) => {
    setSelectedMeds(prev => 
      prev.includes(regNum)
        ? prev.filter(r => r !== regNum)
        : prev.length < 3 ? [...prev, regNum] : prev
    );
  };

  const handleSave = async () => {
    if (!selectedDay || selectedMeds.length === 0) return;
    setSaving(true);
    const day: ScheduledDay = {
      date: selectedDay,
      medicines: selectedMeds,
      note,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };
    const ok = await saveScheduleDay(day);
    if (ok) {
      setSchedule(prev => ({ ...prev, [selectedDay]: day }));
      setSelectedDay(null);
      alert(ar ? '✅ تم حفظ الجدول بنجاح' : '✅ Schedule saved successfully');
    } else {
      alert(ar ? '❌ فشل الحفظ - افتح الـ Console لمعرفة السبب' : '❌ Save failed - check Console for details');
    }
    setSaving(false);
  };

  const handleDelete = async (date: string) => {
    await deleteScheduleDay(date);
    setSchedule(prev => { const n = { ...prev }; delete n[date]; return n; });
    if (selectedDay === date) setSelectedDay(null);
  };

  const filteredMeds = allMedicines.filter(m =>
    m['Trade Name'].toLowerCase().includes(searchQuery.toLowerCase()) ||
    m['Scientific Name'].toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 30);

  const getMedName = (regNum: string) =>
    allMedicines.find(m => m.RegisterNumber === regNum)?.['Trade Name'] || regNum;

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-400 font-bold">
        {ar 
          ? 'جدول أدوية اليوم - اختر 1 أو 2 أو 3 أدوية. الباقي يُختار عشوائياً تلقائياً'
          : 'Featured schedule - pick 3 medicines per day. Unscheduled days auto-select.'}
      </p>

      {/* جدول الأيام */}
      <div className="grid grid-cols-4 gap-2">
        {weekDays.map(date => {
          const isToday = date === today;
          const isPast = date < today;
          const hasSchedule = !!schedule[date];
          
          return (
            <button
              key={date}
              onClick={() => !isPast && handleDayClick(date)}
              disabled={isPast}
              className={`relative p-2 rounded-2xl border-2 transition-all text-center
                ${selectedDay === date ? 'border-primary bg-primary/10' : 
                  hasSchedule ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' :
                  isToday ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' :
                  isPast ? 'border-slate-100 dark:border-slate-800 opacity-40' :
                  'border-slate-100 dark:border-slate-800 hover:border-primary/40'}
              `}
            >
              {isToday && (
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-amber-400 text-[7px] font-black text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  {ar ? 'اليوم' : 'Today'}
                </div>
              )}
              <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 mt-1">
                {ar ? formatDateAr(date).split(' ')[0] : new Date(date).toLocaleDateString('en', { weekday: 'short' })}
              </p>
              <p className="text-[11px] font-black text-slate-700 dark:text-white">
                {new Date(date).getDate()}
              </p>
              {hasSchedule && (
                <div className="flex justify-center gap-0.5 mt-1">
                  {schedule[date].medicines.slice(0, 3).map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-emerald-500" />
                  ))}
                </div>
              )}
              {!hasSchedule && !isPast && (
                <p className="text-[8px] text-slate-300 mt-1">{ar ? 'تلقائي' : 'Auto'}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* محرر اليوم المختار */}
      {selectedDay && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-4 space-y-3 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-700 dark:text-white text-sm">
              📅 {ar ? formatDateAr(selectedDay) : new Date(selectedDay).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            {schedule[selectedDay] && (
              <button
                onClick={() => handleDelete(selectedDay)}
                className="text-rose-400 text-[10px] font-black hover:text-rose-600"
              >
                🗑 {ar ? 'حذف الجدول' : 'Clear'}
              </button>
            )}
          </div>

          {/* الأدوية المختارة */}
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`flex-1 h-14 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all
                  ${selectedMeds[i] ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700'}
                `}
              >
                {selectedMeds[i] ? (
                  <>
                    <p className="text-[9px] font-black text-primary text-center px-1 leading-tight truncate w-full px-2">
                      {getMedName(selectedMeds[i])}
                    </p>
                    <button
                      onClick={() => toggleMed(selectedMeds[i])}
                      className="text-rose-400 text-[8px] mt-0.5"
                    >✕</button>
                  </>
                ) : (
                  <p className="text-slate-300 text-[9px] font-black">{i + 1}</p>
                )}
              </div>
            ))}
          </div>

          {/* البحث */}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={ar ? 'ابحث عن دواء...' : 'Search medicine...'}
            className="w-full bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-primary"
          />

          {/* نتائج البحث */}
          {searchQuery.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1.5 bg-white dark:bg-dark-card rounded-2xl p-2 border border-slate-100 dark:border-slate-700">
              {filteredMeds.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-4">{ar ? 'لا نتائج' : 'No results'}</p>
              ) : filteredMeds.map(m => {
                const isSelected = selectedMeds.includes(m.RegisterNumber);
                const isFull = selectedMeds.length >= 3 && !isSelected; // الحد الأقصى 3
                return (
                  <button
                    key={m.RegisterNumber}
                    onClick={() => !isFull && toggleMed(m.RegisterNumber)}
                    disabled={isFull}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left
                      ${isSelected ? 'bg-primary/10 border border-primary/30' :
                        isFull ? 'opacity-40' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
                    `}
                  >
                    {m.imgBox ? (
                      <img src={m.imgBox} className="w-8 h-8 rounded-lg object-contain bg-slate-100 flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm flex-shrink-0">💊</div>
                    )}
                    <div className="flex-grow min-w-0 text-left">
                      <p className="text-[11px] font-black text-slate-700 dark:text-white truncate">{m['Trade Name']}</p>
                      <p className="text-[9px] text-slate-400 truncate">{m['Scientific Name']}</p>
                    </div>
                    {isSelected && <span className="text-primary text-sm flex-shrink-0">✓</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* ملاحظة */}
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={ar ? 'ملاحظة اختيارية...' : 'Optional note...'}
            className="w-full bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2 text-xs outline-none focus:border-primary"
          />

          {/* زرار الحفظ */}
          <button
            onClick={handleSave}
            disabled={selectedMeds.length === 0 || saving}
            className="w-full py-3 bg-primary disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white font-black rounded-2xl transition-all active:scale-95"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {ar ? 'جاري الحفظ...' : 'Saving...'}
              </span>
            ) : selectedMeds.length === 0
              ? (ar ? 'اختر دواء واحد على الأقل' : 'Pick at least 1')
              : selectedMeds.length === 3
              ? (ar ? '✅ حفظ الجدول' : '✅ Save Schedule')
              : (ar ? `✅ حفظ (${selectedMeds.length}/3) - الباقي عشوائي` : `✅ Save (${selectedMeds.length}/3) - rest random`)
            }
          </button>
        </div>
      )}
    </div>
  );
};

export default FeaturedSchedulePanel;
