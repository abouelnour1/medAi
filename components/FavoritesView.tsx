import React, { createPortal } from 'react-dom';
import { Medicine, TFunction, Language } from '../types';
import MedicineCard from './MedicineCard';
import StarIcon from './icons/StarIcon';
import { getItem, setItem } from '../utils/storage';

interface FavoritesViewProps {
  favoriteIds: string[];
  allMedicines: Medicine[];
  onMedicineSelect: (medicine: Medicine) => void;
  onMedicineLongPress: (medicine: Medicine) => void;
  onFindAlternative: (medicine: Medicine) => void;
  toggleFavorite: (medicineId: string) => void;
  t: TFunction;
  language: Language;
}

// ── Send to Order/Tracker Sheet ───────────────────────────────────────────────
const SendSheet: React.FC<{
  medicines: Medicine[];
  onClose: () => void;
}> = ({ medicines, onClose }) => {
  const [sent, setSent] = React.useState<'order'|'tracker'|null>(null);

  const sendToOrder = () => {
    const raw = localStorage.getItem('pharma_order_list');
    const items: any[] = raw ? JSON.parse(raw) : [];
    const existingIds = new Set(items.map((i: any) => i.medicine.RegisterNumber));
    let added = 0;
    medicines.forEach(m => {
      if (!existingIds.has(m.RegisterNumber)) {
        items.push({ medicine: m, quantity: 1, note: '' });
        added++;
      }
    });
    localStorage.setItem('pharma_order_list', JSON.stringify(items));
    setSent('order');
    setTimeout(onClose, 1200);
  };

  const sendToTracker = async () => {
    try {
      const { getItem: gi, setItem: si } = await import('../utils/storage');
      const facilities: any[] = (await gi('stock_tracker_facilities')) || [];
      if (facilities.length === 0) {
        alert('Please add a facility in Stock Tracker first.');
        return;
      }
      // نضيف للـ facility الأولى
      const f = facilities[0];
      let added = 0;
      medicines.forEach(m => {
        if (!f.stock[m.RegisterNumber]) {
          f.stock[m.RegisterNumber] = {
            medicineId: m.RegisterNumber, tradeName: m['Trade Name'],
            scientificName: m['Scientific Name'], form: m.PharmaceuticalForm || '',
            quantity: 0, minAlert: 5, unit: 'box', lastUpdated: new Date().toISOString(), history: []
          };
          added++;
        }
      });
      await si('stock_tracker_facilities', facilities);
      setSent('tracker');
      setTimeout(onClose, 1200);
    } catch { alert('Error adding to tracker'); }
  };

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'flex-end', justifyContent:'center', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}
      onClick={onClose} onTouchMove={e => e.preventDefault()}>
      <div style={{ width:'100%', maxWidth:520, borderRadius:'2rem 2rem 0 0', paddingBottom:'env(safe-area-inset-bottom)', animation:'sfUp .3s cubic-bezier(.22,1,.36,1)' }}
        className="bg-white dark:bg-slate-900 p-6" onClick={e => e.stopPropagation()}>
        <style>{`@keyframes sfUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        <div className="flex justify-center mb-5"><div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700"/></div>

        {sent ? (
          <div className="text-center py-6">
            <span className="text-5xl">{sent === 'order' ? '🛒' : '📦'}</span>
            <p className="font-black text-slate-800 dark:text-white mt-3">
              {medicines.length} medicine{medicines.length > 1 ? 's' : ''} added to {sent === 'order' ? 'Order List' : 'Stock Tracker'} ✓
            </p>
          </div>
        ) : (
          <>
            <p className="font-black text-base text-slate-800 dark:text-white mb-1">Send {medicines.length} medicine{medicines.length > 1 ? 's' : ''} to...</p>
            <p className="text-xs text-slate-400 mb-5">Already existing items will be skipped</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={sendToOrder}
                className="flex flex-col items-center gap-2 py-5 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-800/30 active:scale-95 transition-transform">
                <span className="text-3xl">🛒</span>
                <span className="font-black text-sm text-teal-700 dark:text-teal-400">Order List</span>
                <span className="text-[10px] text-teal-500">Add to next order</span>
              </button>
              <button onClick={sendToTracker}
                className="flex flex-col items-center gap-2 py-5 bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-800/30 active:scale-95 transition-transform">
                <span className="text-3xl">📦</span>
                <span className="font-black text-sm text-violet-700 dark:text-violet-400">Stock Tracker</span>
                <span className="text-[10px] text-violet-500">Track inventory</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const FavoritesView: React.FC<FavoritesViewProps> = ({
  favoriteIds, allMedicines, onMedicineSelect, onMedicineLongPress,
  onFindAlternative, toggleFavorite, t, language,
}) => {
  const [sortBy, setSortBy] = React.useState<'added'|'name'|'price'>('added');
  const [selectMode, setSelectMode] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [showSend, setShowSend] = React.useState(false);
  const ar = language === 'ar';

  const favMeds = React.useMemo(() => {
    const set = new Set(favoriteIds);
    const meds = allMedicines.filter(m => set.has(m.RegisterNumber));
    if (sortBy === 'name') return [...meds].sort((a,b) => a['Trade Name'].localeCompare(b['Trade Name']));
    if (sortBy === 'price') return [...meds].sort((a,b) => parseFloat(a['Public price']||'0') - parseFloat(b['Public price']||'0'));
    return favoriteIds.map(id => meds.find(m => m.RegisterNumber === id)).filter(Boolean) as typeof meds;
  }, [favoriteIds, allMedicines, sortBy]);

  const selectedMeds = favMeds.filter(m => selected.has(m.RegisterNumber));

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll = () => setSelected(new Set(favMeds.map(m => m.RegisterNumber)));
  const clearSelect = () => { setSelected(new Set()); setSelectMode(false); };

  if (favMeds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
        <div className="w-16 h-16 text-accent"><StarIcon isFilled /></div>
        <h2 className="text-2xl font-bold mt-4 text-slate-800 dark:text-white">{t('noFavorites')}</h2>
        <p className="mt-1 text-slate-400">{t('noFavoritesSubtitle')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in pb-4">
      {showSend && selectedMeds.length > 0 && (
        <SendSheet medicines={selectedMeds} onClose={() => { setShowSend(false); clearSelect(); }} />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {/* Sort */}
        {!selectMode && (
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 flex-grow">
            {(['added','name','price'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`flex-1 py-1.5 rounded-xl text-[10px] font-black transition-all ${sortBy===s ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}>
                {s === 'added' ? '🕐 Added' : s === 'name' ? '🔤 Name' : '💰 Price'}
              </button>
            ))}
          </div>
        )}

        {/* Select mode actions */}
        {selectMode && (
          <div className="flex items-center gap-2 flex-grow">
            <button onClick={selectAll} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black text-slate-500 active:scale-95">All</button>
            <span className="text-xs font-black text-slate-400">{selected.size} selected</span>
            <div className="flex-grow"/>
            {selected.size > 0 && (
              <button onClick={() => setShowSend(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 text-white rounded-xl text-xs font-black active:scale-95 shadow-lg shadow-teal-500/20">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                Send
              </button>
            )}
          </div>
        )}

        {/* Select toggle */}
        <button onClick={() => selectMode ? clearSelect() : setSelectMode(true)}
          className={`px-3 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${selectMode ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'bg-violet-50 dark:bg-violet-900/20 text-violet-600'}`}>
          {selectMode ? '✕ Cancel' : '☑ Select'}
        </button>
      </div>

      {/* Medicine list */}
      {favMeds.map(med => (
        <div key={med.RegisterNumber} className="relative">
          {selectMode && (
            <button onClick={() => toggleSelect(med.RegisterNumber)}
              className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                selected.has(med.RegisterNumber)
                  ? 'bg-teal-500 border-teal-500'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
              }`}>
              {selected.has(med.RegisterNumber) && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              )}
            </button>
          )}
          <div onClick={selectMode ? () => toggleSelect(med.RegisterNumber) : undefined}
            className={selectMode ? 'cursor-pointer' : ''}>
            <MedicineCard
              medicine={med}
              onShortPress={selectMode ? () => toggleSelect(med.RegisterNumber) : () => onMedicineSelect(med)}
              onLongPress={selectMode ? () => {} : onMedicineLongPress}
              onFindAlternative={onFindAlternative}
              isFavorite={true}
              onToggleFavorite={toggleFavorite}
              t={t}
              language={language}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FavoritesView;
