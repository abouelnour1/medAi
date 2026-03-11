import React, { useState, useEffect, useCallback } from 'react';
import { Medicine, TFunction } from '../types';

export interface OrderItem {
  medicine: Medicine;
  quantity: number;
  note?: string;
}

interface OrderListProps {
  allMedicines: Medicine[];
  t: TFunction;
  language: string;
  onCountChange?: (count: number) => void;
}

const STORAGE_KEY = 'pharma_order_list';

const loadOrder = (): OrderItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveOrder = (items: OrderItem[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
};

// Export to Excel using SheetJS via CDN (already available in the app bundle context)
const exportToExcel = (items: OrderItem[]) => {
  // Build CSV instead — universally supported, opens in Excel
  const BOM = '\uFEFF';
  const headers = ['Trade Name', 'Scientific Name', 'Pharmaceutical Form', 'Manufacturer', 'Public Price (SAR)', 'Quantity', 'Total (SAR)', 'Note'];
  const rows = items.map(item => {
    const price = parseFloat(item.medicine['Public price']) || 0;
    const total = (price * item.quantity).toFixed(2);
    return [
      item.medicine['Trade Name'],
      item.medicine['Scientific Name'],
      item.medicine.PharmaceuticalForm || '',
      item.medicine['Manufacture Name'] || '',
      price.toFixed(2),
      item.quantity,
      total,
      item.note || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  // Total row
  const grandTotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.medicine['Public price']) || 0) * item.quantity;
  }, 0);
  rows.push(['', '', '', '', '', `"Total"`, `"${grandTotal.toFixed(2)}"`, ''].join(','));

  const csv = BOM + [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PharmaOrder_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Add Medicine Search Modal ──────────────────────────────────────────
const AddMedicineModal: React.FC<{
  allMedicines: Medicine[];
  existingIds: Set<string>;
  onAdd: (m: Medicine) => void;
  onClose: () => void;
}> = ({ allMedicines, existingIds, onAdd, onClose }) => {
  const [search, setSearch] = useState('');

  const results = search.trim().length >= 2
    ? allMedicines
        .filter(m => !existingIds.has(m.RegisterNumber))
        .filter(m => {
          const q = search.toLowerCase();
          return String(m['Trade Name']).toLowerCase().startsWith(q) ||
                 String(m['Scientific Name']).toLowerCase().startsWith(q);
        })
        .slice(0, 30)
    : [];

  // lock body scroll
  React.useEffect(() => {
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
      style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'flex-end', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}
      onClick={onClose}
      onTouchMove={e => e.preventDefault()}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2rem] flex flex-col"
        style={{ maxHeight: '85vh', animation: 'orderSheetUp 0.3s cubic-bezier(0.22,1,0.36,1)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes orderSheetUp { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }`}</style>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
        <div className="px-4 pb-3 flex-shrink-0">
          <p className="text-sm font-black text-slate-700 dark:text-white mb-3">Add Medicine</p>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search medicine..."
              className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-semibold outline-none border-2 border-transparent focus:border-teal-400 dark:text-white"
            />
          </div>
        </div>
        <div className="overflow-y-auto no-scrollbar px-4 pb-6 flex-grow">
          {results.length === 0 && search.trim().length >= 2 && (
            <p className="text-center text-sm text-slate-400 py-8">No results</p>
          )}
          {results.length === 0 && search.trim().length < 2 && (
            <p className="text-center text-xs text-slate-300 py-8">Type at least 2 characters</p>
          )}
          <div className="space-y-1.5">
            {results.map(m => (
              <button
                key={m.RegisterNumber}
                onClick={() => { onAdd(m); onClose(); }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 active:scale-[0.99] transition-all text-left"
              >
                {m.imgBox
                  ? <img src={m.imgBox} className="w-10 h-10 object-contain rounded-xl bg-white p-1 flex-shrink-0" alt="" />
                  : <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0 text-base">💊</div>
                }
                <div className="flex-grow min-w-0">
                  <p className="font-black text-sm text-slate-800 dark:text-white truncate">{m['Trade Name']}</p>
                  <p className="text-[10px] text-slate-400 truncate">{m['Scientific Name']}</p>
                </div>
                <span className="text-xs font-black text-teal-600 flex-shrink-0">
                  {parseFloat(m['Public price']) > 0 ? parseFloat(m['Public price']).toFixed(2) + ' SAR' : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────
const OrderList: React.FC<OrderListProps> = ({ allMedicines, t, language, onCountChange }) => {
  const [items, setItems] = useState<OrderItem[]>(loadOrder);
  const [showAdd, setShowAdd] = useState(false);
  const [exported, setExported] = useState(false);

  useEffect(() => { saveOrder(items); onCountChange?.(items.length); }, [items]);

  const addItem = useCallback((m: Medicine) => {
    setItems(prev => [...prev, { medicine: m, quantity: 1 }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.medicine.RegisterNumber !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => i.medicine.RegisterNumber === id ? { ...i, quantity: qty } : i));
  }, []);

  const updateNote = useCallback((id: string, note: string) => {
    setItems(prev => prev.map(i => i.medicine.RegisterNumber === id ? { ...i, note } : i));
  }, []);

  const handleExport = () => {
    exportToExcel(items);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const totalPrice = items.reduce((sum, i) => sum + (parseFloat(i.medicine['Public price']) || 0) * i.quantity, 0);
  const existingIds = new Set(items.map(i => i.medicine.RegisterNumber));

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {showAdd && (
        <AddMedicineModal
          allMedicines={allMedicines}
          existingIds={existingIds}
          onAdd={addItem}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Header Card */}
      <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-3xl p-5 text-white shadow-lg shadow-teal-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Order List</p>
            <p className="text-2xl font-black">{items.length} <span className="text-sm font-bold opacity-80">items</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total</p>
            <p className="text-xl font-black">{totalPrice.toFixed(2)} <span className="text-xs opacity-80">SAR</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-black text-sm active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Medicine
          </button>
          <button
            onClick={handleExport}
            disabled={items.length === 0}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm active:scale-95 transition-all ${
              exported ? 'bg-emerald-400 text-white' : 'bg-white text-teal-600 disabled:opacity-40'
            }`}
          >
            {exported ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Exported!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
          <span className="text-4xl mb-3 block">🛒</span>
          <p className="font-black text-slate-400 text-sm">Your order list is empty</p>
          <p className="text-xs text-slate-300 mt-1">Add medicines to get started</p>
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        {items.map(item => {
          const price = parseFloat(item.medicine['Public price']) || 0;
          return (
            <div key={item.medicine.RegisterNumber} className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm">
              <div className="flex items-start gap-3">
                {item.medicine.imgBox
                  ? <img src={item.medicine.imgBox} className="w-12 h-12 object-contain rounded-xl bg-slate-50 p-1 flex-shrink-0" alt="" />
                  : <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0 text-xl">💊</div>
                }
                <div className="flex-grow min-w-0">
                  <p className="font-black text-sm text-slate-800 dark:text-white truncate">{item.medicine['Trade Name']}</p>
                  <p className="text-[10px] text-slate-400 truncate">{item.medicine['Scientific Name']}</p>
                  <p className="text-[10px] text-teal-600 font-bold mt-0.5">
                    {price > 0 ? `${price.toFixed(2)} SAR × ${item.quantity} = ${(price * item.quantity).toFixed(2)} SAR` : 'Price N/A'}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.medicine.RegisterNumber)}
                  className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-400 active:scale-90 transition-transform flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Quantity + Note */}
              <div className="flex items-center gap-2 mt-3">
                {/* Qty control */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-1">
                  <button
                    onClick={() => updateQty(item.medicine.RegisterNumber, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-600 flex items-center justify-center text-slate-500 font-black active:scale-90 transition-transform shadow-sm"
                  >−</button>
                  <input
                    type="number"
                    value={item.quantity}
                    min={1}
                    onChange={e => updateQty(item.medicine.RegisterNumber, parseInt(e.target.value) || 1)}
                    className="w-10 text-center font-black text-sm text-slate-800 dark:text-white bg-transparent outline-none"
                  />
                  <button
                    onClick={() => updateQty(item.medicine.RegisterNumber, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-600 flex items-center justify-center text-teal-500 font-black active:scale-90 transition-transform shadow-sm"
                  >+</button>
                </div>
                {/* Note */}
                <input
                  type="text"
                  value={item.note || ''}
                  onChange={e => updateNote(item.medicine.RegisterNumber, e.target.value)}
                  placeholder="Note..."
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-xs font-semibold outline-none dark:text-white placeholder:text-slate-300"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Clear All */}
      {items.length > 0 && (
        <button
          onClick={() => { if (window.confirm('Clear all items?')) setItems([]); }}
          className="w-full py-3 text-xs font-black text-rose-400 active:scale-95 transition-transform"
        >
          Clear All
        </button>
      )}
    </div>
  );
};

export default OrderList;
