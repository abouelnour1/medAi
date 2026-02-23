import React from 'react';
import { Medicine, Language } from '../types';

interface CompareBarProps {
  compareList: Medicine[];
  onRemove: (medicine: Medicine) => void;
  onCompare: () => void;
  onClose: () => void;
  language: Language;
}

const CompareBar: React.FC<CompareBarProps> = ({ compareList, onRemove, onCompare, onClose, language }) => {
  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 animate-slide-up max-w-2xl mx-auto">
      <div className="bg-primary text-white rounded-[2rem] p-4 shadow-2xl shadow-primary/30 border border-primary-light/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-black uppercase tracking-widest opacity-80">
            {language === 'ar' ? '⚖️ مقارنة الأدوية' : '⚖️ Compare Medicines'}
          </span>
          <button onClick={onClose} className="opacity-70 hover:opacity-100 text-white">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mb-3">
          {compareList.map(med => (
            <div key={med.RegisterNumber} className="flex-1 bg-white/20 rounded-2xl p-2.5 relative">
              <button onClick={() => onRemove(med)} className="absolute -top-1 -right-1 w-4 h-4 bg-white text-primary rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              <p className="font-black text-[11px] truncate leading-tight">{med['Trade Name']}</p>
              <p className="text-[9px] opacity-70 truncate">{med.Strength} {med.StrengthUnit}</p>
            </div>
          ))}
          {compareList.length < 2 && (
            <div className="flex-1 bg-white/10 rounded-2xl p-2.5 border-2 border-dashed border-white/30 flex items-center justify-center">
              <p className="text-[10px] opacity-50 font-bold text-center">{language === 'ar' ? 'اختر دواء ثاني' : 'Pick 2nd med'}</p>
            </div>
          )}
        </div>
        {compareList.length === 2 && (
          <button onClick={onCompare} className="w-full bg-white text-primary font-black text-sm py-2.5 rounded-2xl active:scale-95 transition-all shadow-lg">
            {language === 'ar' ? '🔍 عرض المقارنة' : '🔍 Show Comparison'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CompareBar;
