
import React, { useRef, useState } from 'react';
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

  const statusText = status === 'OTC' ? 'OTC' : status === 'Prescription' ? 'Prescription' : status;
  
  let colorClasses = 'bg-slate-100 text-light-text-secondary dark:bg-slate-700 dark:text-dark-text-secondary'; 
  if (status === 'OTC') {
    colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800';
  } else if (status === 'Prescription') {
    colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800';
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

const DrugTypeBadge: React.FC<{ type: string; size?: 'sm' | 'base', t: TFunction }> = ({ type, size = 'sm', t }) => {
    if (!type) return null;
    
    let displayType = '';
    let colorClasses = '';

    if (type === 'NCE') {
        displayType = 'Brand';
        colorClasses = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    } else if (type === 'Generic') {
        displayType = 'Generic';
        colorClasses = 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-800';
    } else {
        return null;
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
  if (!medicine) return null; 

  const price = parseFloat(medicine['Public price']);
  const rtlTruncateFixProps = language === 'ar' ? { dir: 'ltr' as const, style: { textAlign: 'right' as const } } : {};

  // --- Long Press & Scroll Logic ---
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const isLongPressTriggered = useRef(false);
  const startPos = useRef<{x: number, y: number} | null>(null);

  const handlePressStart = (e: React.TouchEvent | React.MouseEvent) => {
      setIsPressing(true);
      isLongPressTriggered.current = false;
      
      // Store start position to detect scrolling
      if ('touches' in e) {
          startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else {
          startPos.current = { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
      }
      
      timerRef.current = window.setTimeout(() => {
          isLongPressTriggered.current = true;
          if (navigator.vibrate) navigator.vibrate(50); // Feedback
          onLongPress(medicine);
          setIsPressing(false);
      }, 500); // 500ms delay for long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (startPos.current && timerRef.current) {
          const moveX = Math.abs(e.touches[0].clientX - startPos.current.x);
          const moveY = Math.abs(e.touches[0].clientY - startPos.current.y);
          
          // If moved more than 10px, assume scrolling and cancel everything
          if (moveX > 10 || moveY > 10) {
              clearTimeout(timerRef.current);
              timerRef.current = undefined;
              setIsPressing(false);
              startPos.current = null;
          }
      }
  };

  const handlePressEnd = () => {
      if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = undefined;
      }
      setIsPressing(false);
      startPos.current = null;
  };

  // The browser ONLY fires onClick if the user lifted their finger without scrolling significantly.
  const handleClick = (e: React.MouseEvent) => {
      // If a long press happened, ignore the click (don't open details)
      if (isLongPressTriggered.current) {
          e.preventDefault();
          e.stopPropagation();
          return;
      }
      onShortPress();
  };

  return (
    <div
      className={`bg-light-card dark:bg-dark-card rounded-xl shadow-md overflow-hidden cursor-pointer select-none min-h-min border border-slate-100 dark:border-slate-800 transition-transform duration-100 ${isPressing ? 'scale-[0.98] bg-slate-50 dark:bg-slate-800' : 'active:scale-[0.98]'}`}
      
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchMove={handleTouchMove} // CRITICAL: Cancel long press on scroll
      
      onClick={handleClick}

      onContextMenu={(e) => {
          e.preventDefault();
      }}
      role="button"
      tabIndex={0}
      aria-label={t('viewDetails', { name: medicine['Trade Name'] })}
    >
      <div className="p-3 pointer-events-none"> {/* content ignores pointer events to let parent handle clicks */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-grow min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
                <FactoryIcon />
                <span className="truncate" {...rtlTruncateFixProps}>{medicine['Manufacture Name']}</span>
              </div>
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
                <DrugTypeBadge type={medicine.DrugType} size="sm" t={t} />
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs pointer-events-auto"> {/* Re-enable pointer events for buttons */}
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
                        if (timerRef.current) clearTimeout(timerRef.current);
                        onToggleFavorite(medicine.RegisterNumber);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className={`p-1.5 transition-colors rounded-full ${isFavorite ? 'text-accent hover:text-amber-500' : 'text-gray-400 hover:text-accent'}`}
                    title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                    aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                >
                   <div className="h-5 w-5"><StarIcon isFilled={isFavorite} /></div>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (timerRef.current) clearTimeout(timerRef.current);
                        onFindAlternative(medicine);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
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
