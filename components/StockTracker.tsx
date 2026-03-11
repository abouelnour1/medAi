import React, { useState, useEffect, useCallback } from 'react';
import { Medicine, TFunction } from '../types';
import { setItem, getItem } from '../utils/storage';

export interface StockLog {
  qty: number; date: string; note?: string;
}
export interface StockEntry {
  medicineId: string; tradeName: string; scientificName: string; form: string;
  quantity: number; minAlert: number; unit: string; note?: string; lastUpdated: string;
  history?: StockLog[];
}
export interface Facility {
  id: string; name: string; createdAt: string; stock: Record<string, StockEntry>;
}

const FACILITIES_KEY = 'stock_tracker_facilities';
const loadFacilities = async (): Promise<Facility[]> => {
  try { return (await getItem<Facility[]>(FACILITIES_KEY)) || []; } catch { return []; }
};
const saveFacilities = async (f: Facility[]) => { try { await setItem(FACILITIES_KEY, f); } catch {} };

// ── Bottom Sheet (fixed to viewport, not scroll container) ────────────────────
const Sheet: React.FC<{ onClose: () => void; children: React.ReactNode; tall?: boolean }> = ({ onClose, children, tall }) => {
  useEffect(() => {
    // نوقف الـ scroll على الـ main container مش الـ body
    const mainEl = document.getElementById('main-scroll-container');
    const bodyPrev = document.body.style.overflow;
    const mainPrev = mainEl ? mainEl.style.overflow : '';
    document.body.style.overflow = 'hidden';
    if (mainEl) mainEl.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = bodyPrev;
      if (mainEl) mainEl.style.overflow = mainPrev;
    };
  }, []);
  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'flex-end', justifyContent:'center', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}
      onClick={onClose}
      onTouchMove={e => e.preventDefault()}
    >
      <div style={{ width:'100%', maxWidth:520, maxHeight: tall ? '92vh' : '85vh', borderRadius:'2rem 2rem 0 0', display:'flex', flexDirection:'column', animation:'sheetUp .32s cubic-bezier(.22,1,.36,1)', paddingBottom:'env(safe-area-inset-bottom)' }}
        className="bg-white dark:bg-slate-900" onClick={e => e.stopPropagation()}>
        <style>{`@keyframes sheetUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 8px' }}>
          <div style={{ width:40, height:4, borderRadius:9 }} className="bg-slate-200 dark:bg-slate-700" />
        </div>
        {children}
      </div>
    </div>
  );
};

// ── Qty Control ───────────────────────────────────────────────────────────────
const QtyCtrl: React.FC<{ value: number; onChange: (v: number) => void; amber?: boolean }> = ({ value, onChange, amber }) => (
  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-2xl p-2">
    <button onClick={() => onChange(Math.max(0, value-1))} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-xl font-black shadow-sm active:scale-90 transition-transform text-slate-500">−</button>
    <input type="number" value={value} min={0} onChange={e => onChange(Math.max(0, parseInt(e.target.value)||0))} className={`flex-1 text-center text-2xl font-black bg-transparent outline-none ${amber ? 'text-amber-500' : 'text-teal-600 dark:text-teal-400'}`} />
    <button onClick={() => onChange(value+1)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black shadow-sm active:scale-90 transition-transform text-white ${amber ? 'bg-amber-400' : 'bg-teal-500'}`}>+</button>
  </div>
);

// ── Add Sheet ─────────────────────────────────────────────────────────────────
const AddSheet: React.FC<{ allMedicines: Medicine[]; existingIds: Set<string>; onAdd: (e: Omit<StockEntry,'lastUpdated'>) => void; onClose: () => void }> = ({ allMedicines, existingIds, onAdd, onClose }) => {
  const [step, setStep] = useState<'search'|'config'>('search');
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState<Medicine|null>(null);
  const [qty, setQty] = useState(0);
  const [minAlert, setMinAlert] = useState(5);
  const [unit, setUnit] = useState('box');
  const [note, setNote] = useState('');

  const results = search.trim().length >= 2
    ? allMedicines.filter(m => !existingIds.has(m.RegisterNumber)).filter(m => {
        const q = search.toLowerCase();
        return m['Trade Name'].toLowerCase().startsWith(q) || m['Scientific Name'].toLowerCase().startsWith(q);
      }).slice(0,30) : [];

  return (
    <Sheet onClose={onClose} tall>
      {step === 'search' ? (
        <>
          <div className="px-5 pb-3 flex-shrink-0">
            <p className="text-base font-black text-slate-800 dark:text-white mb-3">Add Medicine to Stock</p>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicine..."
                className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-semibold outline-none border-2 border-transparent focus:border-teal-400 dark:text-white" />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto no-scrollbar px-5 pb-6">
            {search.length < 2 ? <p className="text-center text-xs text-slate-300 py-14">Type at least 2 characters</p>
             : results.length === 0 ? <p className="text-center text-sm text-slate-400 py-14">No results</p>
             : <div className="space-y-2">
                {results.map(m => (
                  <button key={m.RegisterNumber} onClick={() => { setSel(m); setStep('config'); }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 active:scale-[0.98] transition-all text-left hover:bg-teal-50 dark:hover:bg-teal-900/20">
                    {m.imgBox ? <img src={m.imgBox} className="w-11 h-11 object-contain rounded-xl bg-white p-1 flex-shrink-0 shadow-sm" alt="" />
                     : <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 text-xl">💊</div>}
                    <div className="flex-grow min-w-0">
                      <p className="font-black text-sm text-slate-800 dark:text-white truncate">{m['Trade Name']}</p>
                      <p className="text-[10px] text-slate-400 truncate">{m['Scientific Name']}{m.PharmaceuticalForm ? ` • ${m.PharmaceuticalForm}` : ''}</p>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>
                ))}
              </div>
            }
          </div>
        </>
      ) : sel ? (
        <div className="flex-grow overflow-y-auto no-scrollbar px-5 pb-6 space-y-4">
          <button onClick={() => setStep('search')} className="flex items-center gap-1.5 text-xs text-slate-400 font-black active:scale-95">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>Back
          </button>
          <div className="flex items-center gap-3 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-800/30">
            {sel.imgBox ? <img src={sel.imgBox} className="w-14 h-14 object-contain rounded-xl bg-white p-1.5 flex-shrink-0 shadow-sm" alt="" />
             : <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center text-2xl flex-shrink-0">💊</div>}
            <div className="min-w-0"><p className="font-black text-sm text-slate-800 dark:text-white leading-tight">{sel['Trade Name']}</p><p className="text-[10px] text-slate-500 mt-0.5">{sel['Scientific Name']}</p></div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Unit Type</label>
            <div className="grid grid-cols-5 gap-1.5">
              {['box','strip','bottle','vial','sachet'].map(u => (
                <button key={u} onClick={() => setUnit(u)} className={`py-2.5 rounded-xl text-[10px] font-black transition-all ${unit===u ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{u}</button>
              ))}
            </div>
          </div>
          <div><label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Current Stock ({unit})</label><QtyCtrl value={qty} onChange={setQty} /></div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">⚠️ Alert when below</label>
            <p className="text-[10px] text-slate-300 mb-2">Shows LOW warning when stock hits this number</p>
            <QtyCtrl value={minAlert} onChange={setMinAlert} amber />
          </div>
          <div><label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. expiry date, shelf location..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-semibold outline-none dark:text-white placeholder:text-slate-300 border-2 border-transparent focus:border-teal-300" />
          </div>
          <button onClick={() => { onAdd({ medicineId:sel.RegisterNumber, tradeName:sel['Trade Name'], scientificName:sel['Scientific Name'], form:sel.PharmaceuticalForm||'', quantity:qty, minAlert, unit, note }); onClose(); }}
            className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all">
            Add to Stock ✓
          </button>
        </div>
      ) : null}
    </Sheet>
  );
};

// ── Edit Sheet ────────────────────────────────────────────────────────────────
const EditSheet: React.FC<{ entry: StockEntry; onSave: (q:number, m:number, n:string)=>void; onRemove:()=>void; onClose:()=>void }> = ({ entry, onSave, onRemove, onClose }) => {
  const [qty, setQty] = useState(entry.quantity);
  const [minAlert, setMinAlert] = useState(entry.minAlert);
  const [note, setNote] = useState(entry.note||'');
  const isLow = qty <= minAlert;
  return (
    <Sheet onClose={onClose} tall>
      <div className="flex-grow overflow-y-auto no-scrollbar px-5 pb-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-grow min-w-0 pr-3">
            <p className="font-black text-base text-slate-800 dark:text-white leading-tight truncate">{entry.tradeName}</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{entry.scientificName}</p>
          </div>
          {isLow && <span className="flex-shrink-0 text-[10px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-2 py-1 rounded-full">LOW ⚠️</span>}
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">Stock Level</span>
            <span className="text-[10px] font-black text-slate-400">Alert at {minAlert} {entry.unit}</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-teal-400 to-cyan-400'}`}
              style={{ width:`${Math.min(100, minAlert>0 ? Math.round(qty/(minAlert*3)*100) : 100)}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-slate-300">0</span>
            <span className={`text-[9px] font-black ${isLow ? 'text-amber-500' : 'text-teal-500'}`}>{qty} {entry.unit}</span>
          </div>
        </div>
        <div><label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Update Stock ({entry.unit})</label><QtyCtrl value={qty} onChange={setQty} /></div>
        <div className="grid grid-cols-4 gap-2">
          {[-10,-5,+5,+10].map(d => (
            <button key={d} onClick={() => setQty(q => Math.max(0,q+d))}
              className={`py-2.5 rounded-xl text-xs font-black active:scale-95 ${d<0 ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'bg-teal-50 dark:bg-teal-900/20 text-teal-600'}`}>
              {d>0?'+':''}{d}
            </button>
          ))}
        </div>
        <div><label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">⚠️ Alert below</label><QtyCtrl value={minAlert} onChange={setMinAlert} amber /></div>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note..."
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-semibold outline-none dark:text-white placeholder:text-slate-300 border-2 border-transparent focus:border-teal-300" />
        <div className="flex gap-2">
          <button onClick={() => { onSave(qty,minAlert,note); onClose(); }} className="flex-1 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-teal-500/20 active:scale-[0.98]">Save Changes</button>
          <button onClick={() => { if(window.confirm('Remove from stock?')){ onRemove(); onClose(); } }} className="w-14 py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-400 rounded-2xl flex items-center justify-center active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>

        {/* History */}
        {entry.history && entry.history.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">📋 Change History</p>
            <div className="space-y-1.5">
              {[...entry.history].reverse().slice(0, 8).map((log, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div>
                    <p className="text-xs font-black text-slate-600 dark:text-slate-300">{log.qty} {entry.unit}</p>
                    {log.note && <p className="text-[9px] text-slate-400 truncate max-w-[160px]">{log.note}</p>}
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold text-right">
                    {new Date(log.date).toLocaleDateString()}<br/>
                    <span className="text-slate-300">{new Date(log.date).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
};

// ── Stock Card ────────────────────────────────────────────────────────────────
const StockCard: React.FC<{ entry: StockEntry; onClick: ()=>void }> = ({ entry, onClick }) => {
  const isLow = entry.quantity <= entry.minAlert;
  const pct = entry.minAlert > 0 ? Math.min(100, Math.round(entry.quantity/(entry.minAlert*3)*100)) : Math.min(100,entry.quantity);
  return (
    <button onClick={onClick} className={`w-full text-left rounded-2xl p-4 border shadow-sm active:scale-[0.98] transition-all ${isLow ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-700/30' : 'bg-white dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/50'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${isLow ? 'bg-amber-400' : 'bg-teal-400'}`} style={{ minHeight:44 }} />
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="font-black text-sm text-slate-800 dark:text-white truncate flex-grow">{entry.tradeName}</p>
            {isLow && <span className="flex-shrink-0 text-[8px] font-black bg-amber-400 text-white px-1.5 py-0.5 rounded-full uppercase">Low</span>}
          </div>
          <p className="text-[10px] text-slate-400 truncate">{entry.scientificName}</p>
          {entry.note && <p className="text-[9px] text-slate-300 mt-0.5 truncate">📝 {entry.note}</p>}
          <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${isLow ? 'bg-amber-400' : 'bg-teal-400'}`} style={{ width:`${pct}%` }} />
          </div>
          <p className="text-[9px] text-slate-300 mt-1">Alert ≤ {entry.minAlert} {entry.unit} • {new Date(entry.lastUpdated).toLocaleDateString()}</p>
        </div>
        <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${isLow ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-teal-50 dark:bg-teal-900/20'}`}>
          <p className={`text-2xl font-black leading-none ${isLow ? 'text-amber-600' : 'text-teal-600 dark:text-teal-400'}`}>{entry.quantity}</p>
          <p className={`text-[8px] font-black uppercase mt-0.5 ${isLow ? 'text-amber-400' : 'text-teal-400'}`}>{entry.unit}</p>
        </div>
      </div>
    </button>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const StockTracker: React.FC<{ allMedicines: Medicine[]; t: TFunction; language: string }> = ({ allMedicines }) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [activeId, setActiveId] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [addingFacility, setAddingFacility] = useState(false);
  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editEntry, setEditEntry] = useState<StockEntry|null>(null);
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);

  useEffect(() => { loadFacilities().then(f => { setFacilities(f); if(f.length>0) setActiveId(f[0].id); setLoading(false); }); }, []);
  useEffect(() => { if(!loading) saveFacilities(facilities); }, [facilities, loading]);

  const active = facilities.find(f => f.id === activeId) || null;
  const stockList = active ? Object.values(active.stock) : [];
  const lowCount = stockList.filter(s => s.quantity <= s.minAlert).length;

  const filtered = stockList
    .filter(s => !lowOnly || s.quantity <= s.minAlert)
    .filter(s => !search || s.tradeName.toLowerCase().includes(search.toLowerCase()) || s.scientificName.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => { const al=a.quantity<=a.minAlert?0:1, bl=b.quantity<=b.minAlert?0:1; return al!==bl?al-bl:a.tradeName.localeCompare(b.tradeName); });

  const addFacility = () => {
    if(!newName.trim()) return;
    const f: Facility = { id:Date.now().toString(), name:newName.trim(), createdAt:new Date().toISOString(), stock:{} };
    setFacilities(prev => [...prev, f]); setActiveId(f.id); setNewName(''); setAddingFacility(false);
  };
  const deleteFacility = (id: string) => {
    if(!window.confirm('Delete this facility and all its stock data?')) return;
    const rest = facilities.filter(f => f.id !== id);
    setFacilities(rest); setActiveId(rest[0]?.id||null);
  };
  const addStock = useCallback((entry: Omit<StockEntry,'lastUpdated'>) => {
    if(!activeId) return;
    setFacilities(prev => prev.map(f => f.id===activeId ? { ...f, stock:{ ...f.stock, [entry.medicineId]:{ ...entry, lastUpdated:new Date().toISOString() } } } : f));
  }, [activeId]);
  const updateStock = useCallback((id: string, qty: number, minAlert: number, note: string) => {
    if(!activeId) return;
    const now = new Date().toISOString();
    setFacilities(prev => prev.map(f => {
      if(f.id !== activeId) return f;
      const old = f.stock[id];
      const newLog: StockLog = { qty, date: now, note };
      const history = [...(old.history || []), newLog].slice(-50); // آخر 50 تغيير
      return { ...f, stock:{ ...f.stock, [id]:{ ...old, quantity:qty, minAlert, note, lastUpdated:now, history } } };
    }));
  }, [activeId]);
  const removeStock = useCallback((id: string) => {
    if(!activeId) return;
    setFacilities(prev => prev.map(f => { if(f.id!==activeId) return f; const {[id]:_,...rest}=f.stock; return {...f,stock:rest}; }));
  }, [activeId]);

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const exportCSV = (facilityToExport: Facility) => {
    const BOM = '﻿';
    const headers = ['Trade Name','Scientific Name','Form','Unit','Quantity','Min Alert','Note','Last Updated'];
    const rows = Object.values(facilityToExport.stock).map(s => [
      s.tradeName, s.scientificName, s.form, s.unit,
      String(s.quantity), String(s.minAlert),
      s.note || '',
      new Date(s.lastUpdated).toLocaleString(),
    ].map(v => `"${v.replace(/"/g,'""')}"`).join(','));
    const csv = BOM + [headers.join(','), ...rows].join('
');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${facilityToExport.name}_Stock_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportHistoryCSV = (facilityToExport: Facility) => {
    const BOM = '﻿';
    const headers = ['Medicine','Scientific Name','Quantity','Date & Time','Note'];
    const rows: string[] = [];
    Object.values(facilityToExport.stock).forEach(s => {
      (s.history||[]).forEach(log => {
        rows.push([s.tradeName, s.scientificName, String(log.qty),
          new Date(log.date).toLocaleString(), log.note||'']
          .map(v => `"${v.replace(/"/g,'""')}"`).join(','));
      });
    });
    rows.sort(); // ترتيب حسب الاسم
    const csv = BOM + [headers.join(','), ...rows].join('
');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${facilityToExport.name}_History_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if(loading) return <div className="flex items-center justify-center py-24"><div className="w-5 h-5 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin"/></div>;

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      {showAdd && active && <AddSheet allMedicines={allMedicines} existingIds={new Set(stockList.map(s=>s.medicineId))} onAdd={addStock} onClose={() => setShowAdd(false)} />}
      {editEntry && <EditSheet entry={editEntry} onSave={(q,m,n) => updateStock(editEntry.medicineId,q,m,n)} onRemove={() => removeStock(editEntry.medicineId)} onClose={() => setEditEntry(null)} />}

      {/* Notice */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/15 rounded-2xl border border-amber-200/40">
        <span className="text-sm">⚠️</span>
        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Saved on this device only — data will be lost if app is uninstalled.</p>
      </div>

      {/* Facility tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {facilities.map(f => {
          const cnt = Object.keys(f.stock).length;
          const lows = Object.values(f.stock).filter(s => s.quantity<=s.minAlert).length;
          return (
            <button key={f.id} onClick={() => setActiveId(f.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all ${activeId===f.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700'}`}>
              <span>🏥</span>
              <span className="max-w-[90px] truncate">{f.name}</span>
              {cnt>0 && <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${activeId===f.id?'bg-white/20':'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>{cnt}</span>}
              {lows>0 && <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-amber-400 text-white">{lows}⚠</span>}
            </button>
          );
        })}
        <button onClick={() => setAddingFacility(true)} className="flex-shrink-0 px-3 py-2 rounded-2xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-400 active:scale-95">+ Add</button>
      </div>

      {addingFacility && (
        <div className="flex gap-2 animate-fade-in">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key==='Enter' && addFacility()}
            placeholder="e.g. Al Jazeera Medical Complex"
            className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-violet-300 rounded-2xl text-sm font-bold outline-none dark:text-white" />
          <button onClick={addFacility} className="px-4 py-3 bg-violet-600 text-white rounded-2xl font-black text-sm active:scale-95">Save</button>
          <button onClick={() => { setAddingFacility(false); setNewName(''); }} className="w-12 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl font-black active:scale-95 flex items-center justify-center">✕</button>
        </div>
      )}

      {facilities.length===0 && !addingFacility && (
        <div className="text-center py-20 bg-white dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
          <span className="text-5xl mb-4 block">🏥</span>
          <p className="font-black text-slate-500 text-base mb-1">No facilities yet</p>
          <p className="text-xs text-slate-300 mb-6">Add your first clinic, pharmacy or hospital</p>
          <button onClick={() => setAddingFacility(true)} className="px-6 py-3 bg-violet-600 text-white rounded-2xl font-black text-sm active:scale-95">+ Add Facility</button>
        </div>
      )}

      {active && (
        <>
          {/* Facility header */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-5 text-white shadow-xl shadow-violet-500/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Active Facility</p>
                <p className="text-lg font-black">{active.name}</p>
              </div>
              <button onClick={() => deleteFacility(active.id)} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center active:scale-90">
                <svg className="w-3.5 h-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[['Items',stockList.length,''],['Low Stock⚠️',lowCount,'text-amber-300'],[`OK`,stockList.length-lowCount,'']].map(([l,v,c]) => (
                <div key={String(l)} className={`rounded-2xl p-3 text-center ${Number(v)>0&&String(l).includes('Low')?'bg-amber-400/30':'bg-white/10'}`}>
                  <p className={`text-2xl font-black ${String(c)}`}>{v}</p>
                  <p className="text-[8px] uppercase font-black opacity-70 mt-0.5">{l}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAdd(true)} className="w-full flex items-center justify-center gap-2 py-3 bg-white/15 hover:bg-white/25 rounded-2xl font-black text-sm active:scale-95 border border-white/20 mb-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Add Medicine to Stock
            </button>
            {stockList.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => exportCSV(active)} className="flex items-center justify-center gap-1.5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-black text-xs active:scale-95 border border-white/10">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Export Stock
                </button>
                <button onClick={() => exportHistoryCSV(active)} className="flex items-center justify-center gap-1.5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-black text-xs active:scale-95 border border-white/10">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  Export History
                </button>
              </div>
            )}
          </div>

          {stockList.length > 0 && (
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stock..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 rounded-2xl text-xs font-semibold outline-none border border-slate-100 dark:border-slate-700 dark:text-white" />
              </div>
              {lowCount>0 && <button onClick={() => setLowOnly(v=>!v)} className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-[10px] font-black transition-all ${lowOnly?'bg-amber-500 text-white shadow-lg shadow-amber-500/20':'bg-amber-50 dark:bg-amber-900/20 text-amber-600'}`}>⚠️ {lowCount}</button>}
            </div>
          )}

          {stockList.length===0 && (
            <div className="text-center py-14 bg-white dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
              <span className="text-4xl mb-3 block">📦</span>
              <p className="font-black text-slate-400">No medicines tracked yet</p>
              <p className="text-xs text-slate-300 mt-1">Tap "Add Medicine to Stock" above</p>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map(entry => <StockCard key={entry.medicineId} entry={entry} onClick={() => setEditEntry(entry)} />)}
          </div>
        </>
      )}
    </div>
  );
};

export default StockTracker;
