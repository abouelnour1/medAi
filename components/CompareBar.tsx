import React, { useEffect, useState } from 'react';
import { Medicine, Language } from '../types';

interface CompareBarProps {
  compareList: Medicine[];
  onRemove: (medicine: Medicine) => void;
  onCompare: () => void;
  onClose: () => void;
  language: Language;
}

const CompareBar: React.FC<CompareBarProps> = ({ compareList, onRemove, onCompare, onClose, language }) => {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (compareList.length > 0) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 500);
      return () => clearTimeout(t);
    }
  }, [compareList.length]);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes compareCardIn {
          from { opacity: 0; transform: translateY(10px) scale(0.93); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div
        className="fixed left-4 right-4 z-40 max-w-2xl mx-auto"
        style={{
          bottom: 'calc(5.5rem + env(safe-area-inset-bottom) + 16px)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(130%) scale(0.88)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        }}
      >
        <div className="bg-primary text-white rounded-[2rem] p-4 shadow-2xl shadow-primary/30 border border-primary-light/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-widest opacity-80">
              {language === 'ar' ? '⚖️ مقارنة الأدوية' : '⚖️ Compare Medicines'}
            </span>
            <button onClick={onClose} className="opacity-70 hover:opacity-100 text-white transition-opacity active:scale-90">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            {compareList.map((med, idx) => (
              <div
                key={med.RegisterNumber}
                className="flex-1 min-w-0 bg-white/20 rounded-2xl p-2.5 relative"
                style={{
                  animation: 'compareCardIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                  animationDelay: `${idx * 0.07}s`,
                  opacity: 0,
                }}
              >
                <button
                  onClick={() => onRemove(med)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-white text-primary rounded-full flex items-center justify-center shadow-sm active:scale-75 transition-transform"
                >
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                    <path d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
                <p className="font-black text-[11px] leading-tight break-words overflow-hidden" style={{wordBreak:'break-word',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{med['Trade Name']}</p>
                <p className="text-[9px] opacity-70 truncate">{med.Strength} {med.StrengthUnit}</p>
              </div>
            ))}
            {compareList.length < 2 && (
              <div className="flex-1 bg-white/10 rounded-2xl p-2.5 border-2 border-dashed border-white/30 flex items-center justify-center">
                <p className="text-[10px] opacity-50 font-bold text-center">
                  {language === 'ar' ? 'اختر دواء ثاني' : 'Pick 2nd med'}
                </p>
              </div>
            )}
          </div>

          {compareList.length === 2 && (
            <button
              onClick={onCompare}
              className="w-full bg-white text-primary font-black text-sm py-2.5 rounded-2xl active:scale-95 transition-all shadow-lg"
              style={{
                animation: 'compareCardIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards',
                opacity: 0,
              }}
            >
              {language === 'ar' ? '🔍 عرض المقارنة' : '🔍 Show Comparison'}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default CompareBar;
