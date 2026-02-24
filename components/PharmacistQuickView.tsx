import React from 'react';
import { Medicine, Language, TFunction } from '../types';

interface PharmacistQuickViewProps {
  medicine: Medicine;
  language: Language;
  t: TFunction;
  onClose: () => void;
  onOpenFull: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

const Badge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${color}`}>{label}</span>
);

const PharmacistQuickView: React.FC<PharmacistQuickViewProps> = ({
  medicine, language, t, onClose, onOpenFull, isFavorite, onToggleFavorite
}) => {
  const price = parseFloat(medicine['Public price']);
  const isControlled = medicine['Product Control']?.toLowerCase() === 'controlled';
  const isOTC = medicine['Legal Status']?.toLowerCase() === 'otc';
  const isGeneric = medicine.DrugType?.toLowerCase().includes('generic');
  const ar = language === 'ar';

  const sciNames = String(medicine['Scientific Name'] || '').split(',').map(s => s.trim()).filter(Boolean);
  const strengths = String(medicine.Strength || '').split(',').map(s => s.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-dark-card rounded-t-[2.5rem] p-5 pb-[calc(6rem+env(safe-area-inset-bottom))] shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-grow min-w-0">
            <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
              {medicine['Trade Name']}
            </h2>
            <p className="text-[11px] text-slate-400 font-bold mt-0.5">{medicine['Manufacture Name']}</p>
          </div>
          {medicine.imgBox && (
            <img src={medicine.imgBox} className="w-16 h-16 object-contain rounded-2xl bg-slate-50 p-1 flex-shrink-0 border border-slate-100" alt="" />
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {isControlled && <Badge label={ar ? 'مخدر' : 'Controlled'} color="bg-red-100 text-red-600" />}
          {isOTC ? <Badge label="OTC" color="bg-green-100 text-green-600" /> : <Badge label={ar ? 'بوصفة' : 'Rx'} color="bg-blue-100 text-blue-600" />}
          {isGeneric ? <Badge label={ar ? 'جنيس' : 'Generic'} color="bg-slate-100 text-slate-600" /> : <Badge label={ar ? 'أصيل' : 'Brand'} color="bg-amber-100 text-amber-600" />}
          {medicine.PharmaceuticalForm && <Badge label={medicine.PharmaceuticalForm} color="bg-primary/10 text-primary" />}
        </div>

        {/* المواد الفعالة والتركيز */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 mb-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
            {ar ? 'المواد الفعالة' : 'Active Ingredients'}
          </p>
          <div className="space-y-1.5">
            {sciNames.map((name, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{name}</span>
                <span className="text-[11px] font-black text-primary ml-2 flex-shrink-0">
                  {strengths[i] || strengths[0] || ''} {medicine.StrengthUnit || ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* صف معلومات سريعة */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{ar ? 'السعر' : 'Price'}</p>
            <p className="text-base font-black text-primary">{price > 0 ? `${price.toFixed(2)} ﷼` : '—'}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{ar ? 'العبوة' : 'Pack'}</p>
            <p className="text-base font-black text-slate-700 dark:text-white">{medicine.PackageSize || '—'}</p>
            {medicine.SizeUnit && <p className="text-[8px] text-slate-400">{medicine.SizeUnit}</p>}
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{ar ? 'الصلاحية' : 'Shelf Life'}</p>
            <p className="text-base font-black text-slate-700 dark:text-white">{medicine.shelfLife || '—'}</p>
            {medicine.shelfLife && <p className="text-[8px] text-slate-400">{ar ? 'شهر' : 'mo'}</p>}
          </div>
        </div>

        {/* التخزين */}
        {(medicine['Storage Condition Arabic'] || medicine['Storage conditions']) && (
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-4">
            <span className="text-base flex-shrink-0">🌡️</span>
            <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300 leading-relaxed">
              {language === 'ar' ? medicine['Storage Condition Arabic'] : medicine['Storage conditions']}
            </p>
          </div>
        )}

        {/* أزرار الأكشن */}
        <div className="flex gap-2">
          <button
            onClick={onOpenFull}
            className="flex-1 bg-primary text-white font-black text-sm py-3 rounded-2xl active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            {ar ? 'عرض التفاصيل الكاملة' : 'Full Details'}
          </button>
          <button
            onClick={() => onToggleFavorite(medicine.RegisterNumber)}
            className={`p-3 rounded-2xl active:scale-90 transition-all ${isFavorite ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PharmacistQuickView;
