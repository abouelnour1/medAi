import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Medicine, TFunction } from '../types';
import { setItem, getItem } from '../utils/storage';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface StockEntry {
  medicineId: string;
  tradeName: string;
  scientificName: string;
  form: string;
  quantity: number;
  minAlert: number; // تنبيه لو وصل الحد ده
  unit: string;     // box / strip / bottle
  note?: string;
  lastUpdated: string;
}

export interface Facility {
  id: string;
  name: string;
  createdAt: string;
  stock: Record<string, StockEntry>; // key = medicineId
}

// ── Storage helpers ────────────────────────────────────────────────────────────
const FACILITIES_KEY = 'stock_tracker_facilities';

const loadFacilities = async (): Promise<Facility[]> => {
  try {
    const data = await getItem<Facility[]>(FACILITIES_KEY);
    return data || [];
  } catch { return []; }
};

const saveFacilities = async (facilities: Facility[]) => {
  try { await setItem(FACILITIES_KEY, facilities); } catch {}
};

// ── Add Medicine Modal ─────────────────────────────────────────────────────────
const AddStockModal: React.FC<{
  allMedicines: Medicine[];
  existingIds: Set<string>;
  onAdd: (entry: Omit<StockEntry, 'lastUpdated'>) => void;
  onClose: () => void;
}> = ({ allMedicines, existingIds, onAdd, onClose }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Medicine | null>(null);
  const [qty, setQty] = useState(0);
  const [minAlert, setMinAlert] = useState(5);
  const [unit, setUnit] = useState('box');
  const [note, setNote] = useState('');

  const results = search.trim().length >= 2
    ? allMedicines
        .filter(m => !existingIds.has(m.RegisterNumber))
        .filter(m => {
          const q = search.toLowerCase();
          return String(m['Trade Name']).toLowerCase().startsWith(q) ||
                 String(m['Scientific Name']).toLowerCase().startsWith(q);
        }).slice(0, 25)
    : [];

  const handleConfirm = () => {
    if (!selected) return;
    onAdd({
      medicineId: selected.RegisterNumber,
      tradeName: selected['Trade Name'],
      scientificName: selected['Scientific Name'],
      form: selected.PharmaceuticalForm || '',
      quantity: qty,
      minAlert,
      unit,
      note,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2rem] flex flex-col"
        style={{ maxHeight: '90vh', animation: 'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>

        {!selected ? (
          /* Step 1: Search */
          <>
            <div className="px-5 pb-3 flex-shrink-0">
              <p className="text-sm font-black text-slate-800 dark:text-white mb-3">Add Medicine to Stock</p>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search medicine..."
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-semibold outline-none border-2 border-transparent focus:border-teal-400 dark:text-white" />
              </div>
            </div>
            <div className="overflow-y-auto no-scrollbar px-5 pb-6 flex-grow">
              {search.trim().length < 2 && <p className="text-center text-xs text-slate-300 py-10">Type at least 2 characters</p>}
              {search.trim().length >= 2 && results.length === 0 && <p className="text-center text-sm text-slate-400 py-10">No results</p>}
              <div className="space-y-1.5">
                {results.map(m => (
                  <button key={m.RegisterNumber} onClick={() => setSelected(m)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 active:scale-[0.99] transition-all text-left">
                    {m.imgBox
                      ? <img src={m.imgBox} className="w-10 h-10 object-contain rounded-xl bg-white p-1 flex-shrink-0" alt="" />
                      : <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0 text-lg">💊</div>}
                    <div className="flex-grow min-w-0">
                      <p className="font-black text-sm text-slate-800 dark:text-white truncate">{m['Trade Name']}</p>
                      <p className="text-[10px] text-slate-400 truncate">{m['Scientific Name']} • {m.PharmaceuticalForm}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Step 2: Set quantity */
          <div className="px-5 pb-6 overflow-y-auto no-scrollbar">
            <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs text-slate-400 font-black mb-4 active:scale-95 transition-transform">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>

            {/* Medicine preview */}
            <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-2xl mb-5">
              {selected.imgBox
                ? <img src={selected.imgBox} className="w-12 h-12 object-contain rounded-xl bg-white p-1 flex-shrink-0" alt="" />
                : <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-xl flex-shrink-0">💊</div>}
              <div className="min-w-0">
                <p className="font-black text-sm text-slate-800 dark:text-white truncate">{selected['Trade Name']}</p>
                <p className="text-[10px] text-slate-400">{selected['Scientific Name']}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Unit */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Unit</label>
                <div className="flex gap-2">
                  {['box','strip','bottle','vial','sachet'].map(u => (
                    <button key={u} onClick={() => setUnit(u)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${unit===u ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Quantity */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Current Stock</label>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl p-3">
                  <button onClick={() => setQty(q => Math.max(0, q-1))}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-xl font-black shadow-sm active:scale-90 transition-transform">−</button>
                  <input type="number" value={qty} min={0}
                    onChange={e => setQty(Math.max(0, parseInt(e.target.value)||0))}
                    className="flex-1 text-center text-2xl font-black text-slate-800 dark:text-white bg-transparent outline-none" />
                  <button onClick={() => setQty(q => q+1)}
                    className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center text-xl font-black shadow-sm active:scale-90 transition-transform">+</button>
                </div>
              </div>

              {/* Min Alert */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Alert when below</label>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl p-3">
                  <button onClick={() => setMinAlert(q => Math.max(0, q-1))}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-xl font-black shadow-sm active:scale-90 transition-transform">−</button>
                  <input type="number" value={minAlert} min={0}
                    onChange={e => setMinAlert(Math.max(0, parseInt(e.target.value)||0))}
                    className="flex-1 text-center text-xl font-black text-amber-500 bg-transparent outline-none" />
                  <button onClick={() => setMinAlert(q => q+1)}
                    className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center text-xl font-black shadow-sm active:scale-90 transition-transform">+</button>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Note (optional)</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. expiry date, location..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-semibold outline-none dark:text-white placeholder:text-slate-300" />
              </div>

              <button onClick={handleConfirm}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all">
                Add to Stock
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Edit Quantity Modal ────────────────────────────────────────────────────────
const EditQtyModal: React.FC<{
  entry: StockEntry;
  onSave: (qty: number, note: string) => void;
  onRemove: () => void;
  onClose: () => void;
}> = ({ entry, onSave, onRemove, onClose }) => {
  const [qty, setQty] = useState(entry.quantity);
  const [note, setNote] = useState(entry.note || '');
  const [minAlert, setMinAlert] = useState(entry.minAlert);

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2rem] p-5"
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>

        <p className="font-black text-slate-800 dark:text-white truncate mb-1">{entry.tradeName}</p>
        <p className="text-xs text-slate-400 mb-5">{entry.scientificName}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Stock ({entry.unit})</label>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl p-3">
              <button onClick={() => setQty(q => Math.max(0, q-1))}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-xl font-black shadow-sm active:scale-90 transition-transform">−</button>
              <input type="number" value={qty} min={0} onChange={e => setQty(Math.max(0, parseInt(e.target.value)||0))}
                className="flex-1 text-center text-2xl font-black text-slate-800 dark:text-white bg-transparent outline-none" />
              <button onClick={() => setQty(q => q+1)}
                className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center text-xl font-black shadow-sm active:scale-90 transition-transform">+</button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Alert below</label>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl p-3">
              <button onClick={() => setMinAlert(q => Math.max(0, q-1))}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-xl font-black shadow-sm active:scale-90 transition-transform">−</button>
              <input type="number" value={minAlert} min={0} onChange={e => setMinAlert(Math.max(0, parseInt(e.target.value)||0))}
                className="flex-1 text-center text-xl font-black text-amber-500 bg-transparent outline-none" />
              <button onClick={() => setMinAlert(q => q+1)}
                className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center text-xl font-black shadow-sm active:scale-90 transition-transform">+</button>
            </div>
          </div>

          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Note..."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-semibold outline-none dark:text-white placeholder:text-slate-300" />

          <div className="flex gap-2">
            <button onClick={() => { onSave(qty, note); onClose(); }}
              className="flex-1 py-3.5 bg-teal-500 text-white rounded-2xl font-black text-sm active:scale-95 transition-transform">Save</button>
            <button onClick={() => { if (window.confirm('Remove from stock?')) { onRemove(); onClose(); } }}
              className="w-12 py-3.5 bg-rose-50 dark:bg-rose-900/20 text-rose-400 rounded-2xl font-black text-sm active:scale-95 transition-transform flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const StockTracker: React.FC<{ allMedicines: Medicine[]; t: TFunction; language: string }> = ({ allMedicines, t, language }) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [activeFacilityId, setActiveFacilityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [newFacilityName, setNewFacilityName] = useState('');
  const [showAddStock, setShowAddStock] = useState(false);
  const [editEntry, setEditEntry] = useState<StockEntry | null>(null);
  const [stockSearch, setStockSearch] = useState('');
  const [showLowOnly, setShowLowOnly] = useState(false);

  // Load
  useEffect(() => {
    loadFacilities().then(f => {
      setFacilities(f);
      if (f.length > 0) setActiveFacilityId(f[0].id);
      setLoading(false);
    });
  }, []);

  // Save on change
  useEffect(() => {
    if (!loading) saveFacilities(facilities);
  }, [facilities, loading]);

  const activeFacility = facilities.find(f => f.id === activeFacilityId) || null;

  // ── Facility actions ──
  const addFacility = () => {
    if (!newFacilityName.trim()) return;
    const f: Facility = { id: Date.now().toString(), name: newFacilityName.trim(), createdAt: new Date().toISOString(), stock: {} };
    setFacilities(prev => [...prev, f]);
    setActiveFacilityId(f.id);
    setNewFacilityName('');
    setShowAddFacility(false);
  };

  const deleteFacility = (id: string) => {
    if (!window.confirm('Delete this facility and all its stock data?')) return;
    setFacilities(prev => prev.filter(f => f.id !== id));
    if (activeFacilityId === id) setActiveFacilityId(facilities.find(f => f.id !== id)?.id || null);
  };

  // ── Stock actions ──
  const addStock = useCallback((entry: Omit<StockEntry, 'lastUpdated'>) => {
    if (!activeFacilityId) return;
    const full: StockEntry = { ...entry, lastUpdated: new Date().toISOString() };
    setFacilities(prev => prev.map(f => f.id === activeFacilityId
      ? { ...f, stock: { ...f.stock, [entry.medicineId]: full } } : f));
  }, [activeFacilityId]);

  const updateStock = useCallback((medicineId: string, qty: number, note: string) => {
    if (!activeFacilityId) return;
    setFacilities(prev => prev.map(f => f.id === activeFacilityId ? {
      ...f, stock: { ...f.stock, [medicineId]: { ...f.stock[medicineId], quantity: qty, note, lastUpdated: new Date().toISOString() } }
    } : f));
  }, [activeFacilityId]);

  const removeStock = useCallback((medicineId: string) => {
    if (!activeFacilityId) return;
    setFacilities(prev => prev.map(f => {
      if (f.id !== activeFacilityId) return f;
      const { [medicineId]: _, ...rest } = f.stock;
      return { ...f, stock: rest };
    }));
  }, [activeFacilityId]);

  // ── Computed ──
  const stockList = activeFacility ? Object.values(activeFacility.stock) : [];
  const lowStock = stockList.filter(s => s.quantity <= s.minAlert);

  const filtered = stockList
    .filter(s => !showLowOnly || s.quantity <= s.minAlert)
    .filter(s => !stockSearch || s.tradeName.toLowerCase().includes(stockSearch.toLowerCase()) || s.scientificName.toLowerCase().includes(stockSearch.toLowerCase()))
    .sort((a, b) => a.tradeName.localeCompare(b.tradeName));

  const existingIds = new Set(stockList.map(s => s.medicineId));

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in pb-6">
      {/* Modals */}
      {showAddStock && activeFacility && (
        <AddStockModal allMedicines={allMedicines} existingIds={existingIds} onAdd={addStock} onClose={() => setShowAddStock(false)} />
      )}
      {editEntry && (
        <EditQtyModal
          entry={editEntry}
          onSave={(qty, note) => updateStock(editEntry.medicineId, qty, note)}
          onRemove={() => removeStock(editEntry.medicineId)}
          onClose={() => setEditEntry(null)}
        />
      )}

      {/* ⚠️ Local storage notice */}
      <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-700/30">
        <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold leading-relaxed">
          Stock data is saved on this device only. If you uninstall the app, this data will be lost.
        </p>
      </div>

      {/* Facilities tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {facilities.map(f => (
          <button key={f.id} onClick={() => setActiveFacilityId(f.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              activeFacilityId === f.id
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700'
            }`}>
            {f.name}
            {activeFacilityId === f.id && Object.keys(f.stock).length > 0 && (
              <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-[9px]">{Object.keys(f.stock).length}</span>
            )}
          </button>
        ))}
        <button onClick={() => setShowAddFacility(true)}
          className="flex-shrink-0 px-3 py-2 rounded-2xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-400 active:scale-95 transition-transform">
          + Facility
        </button>
      </div>

      {/* Add facility inline */}
      {showAddFacility && (
        <div className="flex gap-2">
          <input autoFocus value={newFacilityName} onChange={e => setNewFacilityName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addFacility()}
            placeholder="Facility name..."
            className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-teal-300 rounded-2xl text-sm font-bold outline-none dark:text-white" />
          <button onClick={addFacility} className="px-4 py-3 bg-teal-500 text-white rounded-2xl font-black text-sm active:scale-95">Add</button>
          <button onClick={() => { setShowAddFacility(false); setNewFacilityName(''); }} className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl font-black text-sm active:scale-95">✕</button>
        </div>
      )}

      {/* No facility */}
      {facilities.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
          <span className="text-4xl mb-3 block">🏥</span>
          <p className="font-black text-slate-400 text-sm">No facilities yet</p>
          <p className="text-xs text-slate-300 mt-1">Add your first facility to start tracking</p>
        </div>
      )}

      {/* Active Facility Content */}
      {activeFacility && (
        <>
          {/* Header card */}
          <div className="bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950 rounded-3xl p-5 text-white shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Facility</p>
                <p className="text-lg font-black leading-tight">{activeFacility.name}</p>
              </div>
              <button onClick={() => deleteFacility(activeFacility.id)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 active:scale-90 transition-transform">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div className="flex gap-4 mb-4">
              <div>
                <p className="text-2xl font-black">{stockList.length}</p>
                <p className="text-[9px] uppercase font-black opacity-60">Total Items</p>
              </div>
              {lowStock.length > 0 && (
                <div>
                  <p className="text-2xl font-black text-amber-400">{lowStock.length}</p>
                  <p className="text-[9px] uppercase font-black opacity-60">Low Stock ⚠️</p>
                </div>
              )}
            </div>
            <button onClick={() => setShowAddStock(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl font-black text-sm active:scale-95 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Medicine
            </button>
          </div>

          {/* Search + filter */}
          {stockList.length > 0 && (
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" value={stockSearch} onChange={e => setStockSearch(e.target.value)} placeholder="Search stock..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 rounded-2xl text-xs font-semibold outline-none border border-slate-100 dark:border-slate-700 dark:text-white" />
              </div>
              {lowStock.length > 0 && (
                <button onClick={() => setShowLowOnly(v => !v)}
                  className={`px-3 py-2.5 rounded-2xl text-[10px] font-black transition-all ${showLowOnly ? 'bg-amber-500 text-white' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'}`}>
                  ⚠️ Low ({lowStock.length})
                </button>
              )}
            </div>
          )}

          {/* Empty state */}
          {stockList.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
              <span className="text-3xl mb-2 block">📦</span>
              <p className="font-black text-slate-400 text-sm">No medicines in stock</p>
              <p className="text-xs text-slate-300 mt-1">Tap "Add Medicine" to get started</p>
            </div>
          )}

          {/* Stock list */}
          <div className="space-y-2">
            {filtered.map(entry => {
              const isLow = entry.quantity <= entry.minAlert;
              const pct = entry.minAlert > 0 ? Math.min(100, Math.round(entry.quantity / (entry.minAlert * 3) * 100)) : 100;
              return (
                <button key={entry.medicineId} onClick={() => setEditEntry(entry)}
                  className="w-full text-left bg-white dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm active:scale-[0.99] transition-all">
                  <div className="flex items-start gap-3">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {isLow && <span className="text-[9px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-1.5 py-0.5 rounded-full">LOW</span>}
                        <p className="font-black text-sm text-slate-800 dark:text-white truncate">{entry.tradeName}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{entry.scientificName}</p>
                      {entry.note && <p className="text-[10px] text-slate-300 mt-0.5 truncate">📝 {entry.note}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-2xl font-black ${isLow ? 'text-amber-500' : 'text-teal-600'}`}>{entry.quantity}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{entry.unit}</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-amber-400' : 'bg-teal-400'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-300 mt-1">Alert at {entry.minAlert} {entry.unit} • Updated {new Date(entry.lastUpdated).toLocaleDateString()}</p>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default StockTracker;
