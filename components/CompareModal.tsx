import React from 'react';
import { Medicine, Language } from '../types';

interface CompareModalProps {
  medicines: Medicine[];
  onClose: () => void;
  language: Language;
}

const Row: React.FC<{ label: string; a?: string | number | null; b?: string | number | null; highlight?: boolean }> = ({ label, a, b, highlight }) => {
  const aStr = String(a || '—');
  const bStr = String(b || '—');
  const isDiff = aStr !== bStr && aStr !== '—' && bStr !== '—';
  return (
    <div className={`grid grid-cols-[1fr_auto_1fr] gap-2 py-2.5 border-b border-slate-100 dark:border-dark-border ${highlight ? 'bg-primary/3 rounded-xl px-2' : ''}`}>
      <div className={`text-right text-sm font-bold ${isDiff ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>{aStr}</div>
      <div className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest self-center px-1 whitespace-nowrap">{label}</div>
      <div className={`text-left text-sm font-bold ${isDiff ? 'text-secondary' : 'text-slate-700 dark:text-slate-200'}`}>{bStr}</div>
    </div>
  );
};

const CompareModal: React.FC<CompareModalProps> = ({ medicines, onClose, language }) => {
  const [a, b] = medicines;
  const priceA = parseFloat(a['Public price']);
  const priceB = parseFloat(b['Public price']);
  const cheaper = priceA < priceB ? 'a' : priceB < priceA ? 'b' : 'same';

  return (
    <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex items-end justify-center" style={{padding: "1rem 1rem calc(7.5rem + env(safe-area-inset-bottom))"}} onClick={onClose}>
      <div className="bg-white dark:bg-dark-card rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-dark-border">
          <h2 className="text-base font-black text-slate-800 dark:text-white">
            {language === 'ar' ? '⚖️ مقارنة الأدوية' : '⚖️ Compare Medicines'}
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full active:scale-90 transition-all">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[75vh] p-5 space-y-4">
          {/* Names Header */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="bg-primary/10 rounded-2xl p-3 text-center">
              <p className="font-black text-primary text-sm leading-tight">{a['Trade Name']}</p>
              <p className="text-[9px] text-slate-400 mt-1">{a['Manufacture Name']}</p>
            </div>
            <div className="bg-secondary/10 rounded-2xl p-3 text-center">
              <p className="font-black text-secondary text-sm leading-tight">{b['Trade Name']}</p>
              <p className="text-[9px] text-slate-400 mt-1">{b['Manufacture Name']}</p>
            </div>
          </div>

          {/* السعر مع تمييز الأرخص */}
          <div className={`grid grid-cols-2 gap-3`}>
            <div className={`rounded-2xl p-3 text-center ${cheaper === 'a' ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-400' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{language === 'ar' ? 'السعر' : 'Price'}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{priceA > 0 ? `${priceA.toFixed(2)} ${language === 'ar' ? 'ر.س' : 'SAR'}` : '—'}</p>
              {cheaper === 'a' && <p className="text-[9px] font-black text-green-600 mt-1">✅ {language === 'ar' ? 'الأرخص' : 'Cheaper'}</p>}
            </div>
            <div className={`rounded-2xl p-3 text-center ${cheaper === 'b' ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-400' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{language === 'ar' ? 'السعر' : 'Price'}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{priceB > 0 ? `${priceB.toFixed(2)} ${language === 'ar' ? 'ر.س' : 'SAR'}` : '—'}</p>
              {cheaper === 'b' && <p className="text-[9px] font-black text-green-600 mt-1">✅ {language === 'ar' ? 'الأرخص' : 'Cheaper'}</p>}
            </div>
          </div>

          {/* Price Difference Visual */}
          {priceA > 0 && priceB > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-3 text-center">
                {language === 'ar' ? 'مقارنة السعر' : 'Price Comparison'}
              </p>
              <div className="space-y-2">
                {[{name: a['Trade Name'], price: priceA, color: 'bg-primary'}, {name: b['Trade Name'], price: priceB, color: 'bg-violet-500'}].map((item, i) => {
                  const maxP = Math.max(priceA, priceB);
                  const pct = Math.round((item.price / maxP) * 100);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <p className="text-[9px] font-black text-slate-500 w-20 truncate text-right flex-shrink-0">{item.name}</p>
                      <div className="flex-grow bg-slate-100 dark:bg-slate-700 rounded-full h-5 overflow-hidden">
                        <div className={`${item.color} h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700`} style={{width: `${pct}%`}}>
                          <span className="text-white text-[8px] font-black">{item.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {cheaper !== 'same' && (
                <p className="text-center text-[10px] font-black text-emerald-600 mt-2">
                  {language === 'ar' 
                    ? `توفير ${Math.abs(priceA - priceB).toFixed(2)} ر.س (${Math.round(Math.abs(priceA - priceB) / Math.max(priceA, priceB) * 100)}%)`
                    : `Save ${Math.abs(priceA - priceB).toFixed(2)} SAR (${Math.round(Math.abs(priceA - priceB) / Math.max(priceA, priceB) * 100)}%)`
                  }
                </p>
              )}
            </div>
          )}

          {/* التفاصيل */}
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 space-y-1">
            <Row label={language === 'ar' ? 'المادة الفعالة' : 'Active Ingredient'} a={a['Scientific Name']} b={b['Scientific Name']} />
            <Row label={language === 'ar' ? 'التركيز' : 'Strength'} a={`${a.Strength} ${a.StrengthUnit}`} b={`${b.Strength} ${b.StrengthUnit}`} />
            <Row label={language === 'ar' ? 'الشكل' : 'Form'} a={a.PharmaceuticalForm} b={b.PharmaceuticalForm} />
            <Row label={language === 'ar' ? 'حجم العبوة' : 'Pack Size'} a={`${a.PackageSize} ${a.SizeUnit}`} b={`${b.PackageSize} ${b.SizeUnit}`} />
            <Row label={language === 'ar' ? 'النوع' : 'Type'} a={a.DrugType} b={b.DrugType} />
            <Row label={language === 'ar' ? 'الحالة القانونية' : 'Legal Status'} a={a['Legal Status']} b={b['Legal Status']} />
            <Row label={language === 'ar' ? 'التوزيع' : 'Distribution'} a={a['Distribute area']} b={b['Distribute area']} />
            <Row label={language === 'ar' ? 'الدولة' : 'Country'} a={a['Manufacture Country']} b={b['Manufacture Country']} />
            <Row label={language === 'ar' ? 'مدة الصلاحية' : 'Shelf Life'} a={a.shelfLife ? `${a.shelfLife} ${language === 'ar' ? 'شهر' : 'months'}` : null} b={b.shelfLife ? `${b.shelfLife} ${language === 'ar' ? 'شهر' : 'months'}` : null} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareModal;
