import React, { useRef } from 'react';
import { Medicine, TFunction, Language } from '../types';
import PillIcon from './icons/PillIcon';
import AlternativeIcon from './icons/AlternativeIcon';
import FactoryIcon from './icons/FactoryIcon';
import StarIcon from './icons/StarIcon';

interface MedicineCardProps {
  medicine: Medicine;
  onShortPress: () => void;
  onLongPress: (medicine: Medicine) => void;
  onFindAlternative: (medicine: Medicine) => void;
  isFavorite: boolean;
  onToggleFavorite: (medicineId: string) => void;
  t: TFunction;
  language: Language;
}

const LegalStatusBadge: React.FC<{ status: string; size?: 'sm' | 'base', t: TFunction }> = ({ status, size = 'sm', t }) => {
  if (!status) return null;

  // Force English Text logic
  const lowerStatus = status.toLowerCase();
  let statusText = status;
  let colorClasses = 'bg-slate-100 text-light-text-secondary dark:bg-slate-700 dark:text-dark-text-secondary'; // Default

  if (lowerStatus.includes('otc')) {
    statusText = 'OTC';
    // Green for OTC
    colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800';
  } else if (lowerStatus.includes('prescription')) {
    statusText = 'Prescription';
    // Red for Prescription to distinguish clearly
    colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800';
  }
  
  const sizeClasses = size === 'sm' 
    ? 'px-2.5 py-0.5 text-xs' 
    : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-block font-bold rounded-full ${sizeClasses} ${colorClasses}`}>
      {statusText}
    </span>
  );
};

const DrugTypeBadge: React.FC<{ type: string; size?: 'sm' | 'base' }> = ({ type, size = 'sm' }) => {
    if (!type) return null;
    
    let displayType = '';
    let colorClasses = '';

    // Always use English for Brand/Generic as requested
    if (type === 'NCE') {
        displayType = 'Brand'; 
        colorClasses = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    } else if (type === 'Generic') {
        displayType = 'Generic';
        colorClasses = 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-800';
    } else {
        return null; // Don't show if undefined or other types not specified
    }

    const sizeClasses = size === 'sm' 
        ? 'px-2.5 py-0.5 text-xs' 
        : 'px-3 py-1 text-sm';

    return (
        <span className={`inline-block font-bold rounded-full ${sizeClasses} ${colorClasses} ml-1 rtl:mr-1`}>
            {displayType}
        </span>
    );
}


const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, onShortPress, onLongPress, onFindAlternative, isFavorite, onToggleFavorite, t, language }) => {
  if (!medicine) return null; // Crash protection

  const price = parseFloat(medicine['Public price']);
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
    if (pressTimer.current !== undefined) {
      window.clearTimeout(pressTimer.current);
    }
  };

  const handlePointerCancel = () => {
    if (pressTimer.current !== undefined) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = undefined;
    }
    isScrolling.current = false;
  };

  const handleClick = () => {
    if (pressTimer.current !== undefined && !isScrolling.current) {
      onShortPress();
    }
  };
  
  const rtlTruncateFixProps = language === 'ar' ? { dir: 'ltr' as const, style: { textAlign: 'right' as const } } : {};

  return (
    <div
      className="bg-light-card dark:bg-dark-card rounded-xl shadow-md overflow-hidden transform hover:shadow-lg transition-all duration-300 cursor-pointer select-none min-h-min"
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
      <div className="p-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-grow min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
                <FactoryIcon />
                <span className="truncate" {...rtlTruncateFixProps}>{medicine['Manufacture Name']}</span>
              </div>
              {/* Removed truncate to allow text wrapping and prevent overlap */}
              <h2 className="text-base font-bold text-light-text dark:text-dark-text break-words whitespace-normal leading-tight mb-1" {...rtlTruncateFixProps}>{medicine['Trade Name']}</h2>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary break-words whitespace-normal leading-snug" {...rtlTruncateFixProps}>{medicine['Scientific Name']}</p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
            {!isNaN(price) && (
              <div className="text-accent text-lg font-bold whitespace-nowrap">
                {price.toFixed(2)} <span className="text-xs font-normal text-light-text-secondary dark:text-dark-text-secondary">{t('sar')}</span>
              </div>
            )}
            <div className="flex flex-col items-end gap-1">
                <LegalStatusBadge status={medicine['Legal Status']} size="sm" t={t} />
                <DrugTypeBadge type={medicine.DrugType} size="sm" />
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-light-text dark:text-dark-text truncate">
                    {medicine.Strength} {medicine.StrengthUnit}
                </span>
            </div>
            <div className="flex items-center gap-1">
                <div className="flex items-center gap-1.5 min-w-0 text-light-text-secondary dark:text-dark-text-secondary">
                    <PillIcon />
                    <span className="truncate max-w-[100px]" {...rtlTruncateFixProps}>{medicine.PharmaceuticalForm}</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(medicine.RegisterNumber);
                    }}
                    className={`p-1.5 transition-colors rounded-full ${isFavorite ? 'text-accent hover:text-amber-500' : 'text-gray-400 hover:text-accent'}`}
                    title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                    aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                >
                   <div className="h-5 w-5"><StarIcon isFilled={isFavorite} /></div>
                </button>
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