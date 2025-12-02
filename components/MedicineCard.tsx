
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

  const statusText = status === 'OTC' ? 'OTC' : status === 'Prescription' ? 'Rx' : status; // Shortened Prescription to Rx
  
  let colorClasses = 'bg-slate-100 text-light-text-secondary dark:bg-slate-700 dark:text-dark-text-secondary'; 
  if (status === 'OTC') {
    colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800';
  } else if (status === 'Prescription') {
    colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800';
  }
  
  // Compact sizes
  const sizeClasses = 'px-1.5 py-0.5 text-[10px]';

  return (
    <span className={`inline-block font-bold rounded-md ${sizeClasses} ${colorClasses} whitespace-nowrap`}>
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

    const sizeClasses = 'px-1.5 py-0.5 text-[10px]';

    return (
        <span className={`inline-block font-bold rounded-md ${sizeClasses} ${colorClasses} whitespace-nowrap`}>
            {displayType}
        </span>
    );
}

const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, onShortPress, onLongPress, onFindAlternative, isFavorite, onToggleFavorite, t, language }) => {
  if (!medicine) return null; 

  const price = parseFloat(medicine['Public price']);
  const rtlTruncateFixProps = language === 'ar' ? { dir: 'ltr' as const, style: { textAlign: 'right' as const } } : {};

  // --- Simplified Touch Logic ---
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const isLongPressTriggered = useRef(false);

  const startPress = () => {
      setIsPressing(true);
      isLongPressTriggered.current = false;
      timerRef.current = window.setTimeout(() => {
          isLongPressTriggered.current = true;
          if (navigator.vibrate) navigator.vibrate(50);
          onLongPress(medicine);
          setIsPressing(false);
      }, 600);
  };

  const endPress = () => {
      if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = undefined;
      }
      setIsPressing(false);
  };

  const handleClick = (e: React.MouseEvent) => {
      // If long press triggered, prevent default click action
      if (isLongPressTriggered.current) {
          e.preventDefault();
          e.stopPropagation();
          return;
      }
      onShortPress();
  };

  const productControl = medicine['Product Control'] || '';
  const isControlled = productControl.toLowerCase().includes('controlled') && !productControl.toLowerCase().includes('uncontrolled');
  const isRestricted = productControl.toLowerCase().includes('restricted');

  return (
    <div
      className={`relative bg-light-card dark:bg-dark-card rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer select-none transition-all duration-150 ${isPressing ? 'scale-[0.99] bg-slate-50 dark:bg-slate-800' : 'hover:border-primary/30'}`}
      
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      
      onTouchStart={startPress}
      onTouchEnd={endPress}
      // Removing explicit onTouchMove for cancel allows small finger adjustments without killing the click
      // The OS handles scroll vs click distinction mostly
      
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
      role="button"
      tabIndex={0}
    >
      
      <div className="p-2.5"> 
        <div className="flex items-start justify-between gap-2">
          {/* Main Info */}
          <div className="flex-grow min-w-0">
              <div className="flex items-center gap-1 text-[10px] text-light-text-secondary dark:text-dark-text-secondary mb-0.5">
                <FactoryIcon />
                <span className="truncate max-w-[150px]" {...rtlTruncateFixProps}>{medicine['Manufacture Name']}</span>
              </div>
              <h2 className="text-sm font-bold text-light-text dark:text-dark-text break-words leading-tight mb-0.5" {...rtlTruncateFixProps}>
                  {medicine['Trade Name']}
              </h2>
              <p className="text-[11px] text-light-text-secondary dark:text-dark-text-secondary truncate leading-tight" {...rtlTruncateFixProps}>
                  {medicine['Scientific Name']}
              </p>
          </div>

          {/* Price & Badges Column */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            {!isNaN(price) && (
              <div className="text-accent text-sm font-bold whitespace-nowrap">
                {price.toFixed(2)} <span className="text-[9px] font-normal text-light-text-secondary dark:text-dark-text-secondary">{t('sar')}</span>
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-1 max-w-[80px]">
                {(isControlled || isRestricted) ? (
                    <span className={`inline-block font-bold rounded-md px-1.5 py-0.5 text-[9px] text-white whitespace-nowrap shadow-sm ${isControlled ? 'bg-red-600' : 'bg-orange-500'}`}>
                        {isControlled ? 'CTRL' : 'REST'}
                    </span>
                ) : (
                    <LegalStatusBadge status={medicine['Legal Status']} size="sm" t={t} />
                )}
                <DrugTypeBadge type={medicine.DrugType} size="sm" t={t} />
            </div>
          </div>
        </div>

        {/* Footer Row */}
        <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"> 
            <div className="flex items-center gap-1.5 min-w-0 flex-grow">
                 <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {medicine.Strength} {medicine.StrengthUnit}
                </span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <div className="flex items-center gap-1 text-[10px] text-light-text-secondary dark:text-dark-text-secondary truncate">
                    <PillIcon />
                    <span className="truncate" {...rtlTruncateFixProps}>{medicine.PharmaceuticalForm}</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Stop bubbling to card click
                        onToggleFavorite(medicine.RegisterNumber);
                    }}
                    className={`p-1.5 rounded-full transition-colors ${isFavorite ? 'text-accent hover:text-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'text-gray-300 hover:text-accent'}`}
                >
                   <div className="h-4 w-4"><StarIcon isFilled={isFavorite} /></div>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Stop bubbling to card click
                        onFindAlternative(medicine);
                    }}
                    className="p-1.5 text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors rounded-full"
                >
                    <div className="h-4 w-4"><AlternativeIcon /></div>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MedicineCard);
