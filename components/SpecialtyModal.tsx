import React, { useState } from 'react';
import { UserSpecialty, PhysicianSubSpecialty } from '../types';

interface SpecialtyModalProps {
  isOpen: boolean;
  onComplete: (specialty: UserSpecialty, subSpecialty?: PhysicianSubSpecialty) => void;
}

const SPECIALTIES: { key: UserSpecialty; icon: string; label: string }[] = [
  { key: 'Pharmacist',        icon: '💊', label: 'Pharmacist' },
  { key: 'Physician',         icon: '🩺', label: 'Physician' },
  { key: 'Nurse',             icon: '🩹', label: 'Nurse' },
  { key: 'Physical Therapist',icon: '🏃', label: 'Physical Therapist' },
  { key: 'Nutritionist',      icon: '🥗', label: 'Nutritionist' },
  { key: 'Other',             icon: '👤', label: 'Other' },
];

const PHYSICIAN_SUBS: PhysicianSubSpecialty[] = [
  'General Practice', 'Internal Medicine', 'Pediatrics', 'Surgery',
  'Obstetrics & Gynecology', 'Cardiology', 'Neurology', 'Oncology',
  'Orthopedics', 'Dermatology', 'Psychiatry', 'Ophthalmology',
  'ENT', 'Urology', 'Anesthesiology', 'Emergency Medicine', 'Other',
];

const SpecialtyModal: React.FC<SpecialtyModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState<'specialty' | 'subspecialty'>('specialty');
  const [selected, setSelected] = useState<UserSpecialty | null>(null);

  if (!isOpen) return null;

  const handleSpecialty = (s: UserSpecialty) => {
    setSelected(s);
    if (s === 'Physician') {
      setStep('subspecialty');
    } else {
      onComplete(s);
    }
  };

  const handleSubSpecialty = (sub: PhysicianSubSpecialty) => {
    onComplete('Physician', sub);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2rem] pb-10"
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)', maxHeight: '88vh', overflowY: 'auto' }}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>

        {step === 'specialty' ? (
          <div className="px-5 pb-4">
            {/* Header */}
            <div className="text-center mb-6 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-500/25">
                <span className="text-2xl">👋</span>
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Welcome!</h2>
              <p className="text-sm text-slate-400 mt-1">What's your specialty?</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {SPECIALTIES.map(s => (
                <button
                  key={s.key}
                  onClick={() => handleSpecialty(s.key)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 active:scale-95 transition-all hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                >
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 text-center leading-tight">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 pb-4">
            {/* Header */}
            <div className="text-center mb-6 pt-2">
              <button
                onClick={() => setStep('specialty')}
                className="absolute left-5 top-8 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/25">
                <span className="text-2xl">🩺</span>
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Your Specialty</h2>
              <p className="text-sm text-slate-400 mt-1">Select your medical specialty</p>
            </div>

            {/* Sub-specialties */}
            <div className="space-y-2">
              {PHYSICIAN_SUBS.map(sub => (
                <button
                  key={sub}
                  onClick={() => handleSubSpecialty(sub)}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 active:scale-[0.99] transition-all hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                >
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{sub}</span>
                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialtyModal;
