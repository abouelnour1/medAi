import React, { useRef } from 'react';
import { Medicine, TFunction, Language } from '../types';
import PillIcon from './icons/PillIcon';
import AlternativeIcon from './icons/AlternativeIcon';

interface MedicineCardProps {
  medicine: Medicine;
  onShortPress: () => void;
  onLongPress: (medicine: Medicine) => void;
  onFindAlternative: (medicine: Medicine) => void;
  t: TFunction;
  language: Language;
}

const LegalStatusBadge: React.FC<{ status: string; size?: 'sm' | 'base', t: TFunction }> = ({ status, size = 'sm', t }) => {
  if (!status) return null;

  const statusText = status === 'OTC' ? t('otc') : status === 'Prescription' ? t('prescription') : status;
  
  let colorClasses = 'bg-slate-100 text-light-text-secondary dark:bg-slate-700 dark:text-dark-text-secondary'; // Default
  if (status === 'OTC') {
    colorClasses = 'bg-secondary/10 text-green-700 dark:bg-secondary/20 dark:text-green-300';
  } else if (status === 'Prescription') {
    colorClasses = 'bg-primary/10 text-primary-dark dark:bg-primary/20 dark:text-primary-light';
  }
  
  const sizeClasses = size === 'sm' 
    ? 'px-2.5 py-0.5 text-xs' 
    : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-block font-semibold rounded-full ${sizeClasses} ${colorClasses}`}>
      {statusText}
    </span>
  );
};


const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, onShortPress, onLongPress, onFindAlternative, t, language }) => {
  const price = parseFloat(medicine['Public price']);
  // FIX: Explicitly pass an initial value to useRef to resolve the "Expected 1 arguments, but got 0" error.
  const pressTimer = useRef<number | undefined>(undefined);
  const startCoords = useRef({ x: 0, y: 0 });
  const isScrolling = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    isScrolling.current = false;
    startCoords.current = { x: e.clientX, y: e.clientY };
    pressTimer.current = window.setTimeout(() => {
      // only trigger long press if not scrolling
      if (!isScrolling.current) {
        onLongPress(medicine);
        pressTimer.current = undefined; // Prevent click from firing
      }
    }, 1000); // Increased to 1s for a more deliberate long press
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (pressTimer.current === undefined) return;

    const dx = Math.abs(e.clientX - startCoords.current.x);
    const dy = Math.abs(e.clientY - startCoords.current.y);
    if (dx > 10 || dy > 10) { // If pointer moves more than 10px, it's a scroll
      isScrolling.current = true;
      // This is a scroll, so cancel the timer and prevent click.
      window.clearTimeout(pressTimer.current);
      pressTimer.current = undefined;
    }
  };

  const handlePointerUp = () => {
    // On pointer up, we should always clear a pending timer.
    // If the timer already fired (long press) or was cancelled (scroll), pressTimer.current will be undefined.
    // This check prevents calling clearTimeout(undefined), which causes the error.
    if (pressTimer.current !== undefined) {
      window.clearTimeout(pressTimer.current);
    }
  };

  const handlePointerCancel = () => {
    // If the gesture is cancelled (e.g., by the browser), clear the timer.
    if (pressTimer.current !== undefined) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = undefined;
    }
    isScrolling.current = false;
  };

  const handleClick = () => {
    // Only trigger short press if timer was set (not fired) AND we were not scrolling.
    // The timer is set to `undefined` after a long press or a scroll, so this check works for both cases.
    if (pressTimer.current !== undefined && !isScrolling.current) {
      onShortPress();
    }
  };

  return (
    <div
      className="bg-light-card dark:bg-dark-card rounded-xl shadow-md overflow-hidden transform hover:shadow-lg transition-all duration-300 cursor-pointer select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()} // Prevents context menu on long press
      role="button"
      tabIndex={0}
      aria-label={t('viewDetails', { name: medicine['Trade Name'] })}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-grow">
            <h2 className="text-lg font-bold text-light-text dark:text-dark-text">{medicine['Trade Name']}</h2>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{medicine['Scientific Name']}</p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
            <div className="text-accent text-xl font-bold whitespace-nowrap">
              {isNaN(price) ? 'N/A' : price.toFixed(2)} <span className="text-sm font-normal text-light-text-secondary dark:text-dark-text-secondary">{t('sar')}</span>
            </div>
            <LegalStatusBadge status={medicine['Legal Status']} size="sm" t={t} />
            {medicine['Product type'] === 'Supplement' && (
              <span className="inline-block font-semibold rounded-full px-2.5 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {t('notCoveredShort')}
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm text-light-text-secondary dark:text-dark-text-secondary">
          <div className="flex items-center gap-2">
            <PillIcon />
            <span className="truncate">{medicine.PharmaceuticalForm}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{medicine.Strength} {medicine.StrengthUnit}</span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onFindAlternative(medicine);
                }}
                className="p-1.5 text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors rounded-full"
                title={t('findAlternativeTooltip')}
                aria-label={t('findAlternativesButton', { name: medicine['Trade Name'] })}
            >
                <AlternativeIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineCard;