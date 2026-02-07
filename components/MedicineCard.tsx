
import React, { useRef, useState, useMemo } from 'react';
import { Medicine, TFunction, Language } from '../types';
import PillIcon from './icons/PillIcon';
import AlternativeIcon from './icons/AlternativeIcon';
import FactoryIcon from './icons/FactoryIcon';
import StarIcon from './icons/StarIcon';

// نمط للبحث عن وجود تركيزات داخل النص (أرقام متبوعة بوحدات قياس)
const CONCENTRATION_PATTERN = /\d+\s*(mg|mcg|ml|g|iu|%|unit|mc|units|mmol)/i;

/**
 * دالة لدمج المواد الفعالة مع تركيزاتها في سطر واحد (طبيعي)
 * تمنع التكرار إذا كان التركيز موجوداً بالفعل في اسم المادة
 */
export const zipIngredients = (medicine: Medicine): string => {
    const sciNames = String(medicine['Scientific Name'] || '').split(',').map(s => s.trim());
    const strengths = String(medicine.Strength || '').split(',').map(s => s.trim());

    if (sciNames.length === 0 || (sciNames.length === 1 && sciNames[0] === 'N/A')) return 'N/A';

    return sciNames.map((name, index) => {
        // إذا كان الاسم يحتوي بالفعل على تركيز (مثل mg أو mcg)، نعرض الاسم فقط
        if (CONCENTRATION_PATTERN.test(name)) {
            return name;
        }

        const s = strengths[index] || strengths[0] || '';
        const combo = s.trim();
        
        // عرض القوة الرقمية فقط بدون الوحدة في نتائج البحث
        return combo ? `${name} (${combo})` : name;
    }).join(', ');
};

/**
 * دالة لتحويل بيانات المواد الفعالة والتركيزات لمصفوفة كائنات (للعرض المفصل داخلياً)
 */
export const getIngredientsList = (medicine: Medicine): { name: string, strength: string, unit: string }[] => {
    const sciNames = String(medicine['Scientific Name'] || '').split(',').map(s => s.trim());
    const strengths = String(medicine.Strength || '').split(',').map(s => s.trim());
    const units = String(medicine.StrengthUnit || '').split(',').map(s => s.trim());

    if (sciNames.length === 0 || (sciNames.length === 1 && sciNames[0] === 'N/A')) return [];

    return sciNames.map((name, index) => {
        const hasConcentration = CONCENTRATION_PATTERN.test(name);
        
        return {
            name: name,
            strength: hasConcentration ? '' : (strengths[index] || strengths[0] || ''),
            unit: hasConcentration ? '' : (units[index] || units[0] || '')
        };
    });
};

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

  const statusText = status === 'OTC' ? 'OTC' : status === 'Prescription' ? 'Rx' : status; 
  
  let colorClasses = 'bg-slate-100 text-light-text-secondary dark:bg-slate-700 dark:text-dark-text-secondary'; 
  if (status === 'OTC') {
    colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800';
  } else if (status === 'Prescription') {
    colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800';
  }
  
  const sizeClasses = 'px-1.5 py-0.5 text-[10px]';

  return (
    <span className={`inline-block font-bold rounded-md ${sizeClasses} ${colorClasses} whitespace-nowrap`}>
      {statusText}
    </span>
  );
};

const DrugTypeBadge: React.FC<{ type: string; subType?: string; size?: 'sm' | 'base', t: TFunction }> = ({ type, subType, size = 'sm', t }) => {
    if (!type) return null;
    
    let displayType = '';
    let colorClasses = '';

    const isBrand = type === 'NCE' || (type === 'Biological' && subType === 'Biological');
    const isGeneric = type === 'Generic' || (type === 'Biological' && subType === 'Biosimilar');

    if (isBrand) {
        displayType = 'Brand';
        colorClasses = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    } else if (isGeneric) {
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

  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const startPos = useRef({ x: 0, y: 0 });
  const isLongPressTriggered = useRef(false);

  const ingredientsString = useMemo(() => zipIngredients(medicine), [medicine]);

  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
      setIsPressing(true);
      isLongPressTriggered.current = false;
      
      if ('touches' in e) {
          startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else {
          startPos.current = { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
      }

      timerRef.current = window.setTimeout(() => {
          isLongPressTriggered.current = true;
          if (navigator.vibrate) navigator.vibrate(50);
          onLongPress(medicine);
          setIsPressing(false);
      }, 700);
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
      if (!timerRef.current) return;
      
      let clientX, clientY;
      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }

      const moveX = Math.abs(clientX - startPos.current.x);
      const moveY = Math.abs(clientY - startPos.current.y);

      if (moveX > 10 || moveY > 10) {
          clearTimeout(timerRef.current);
          timerRef.current = undefined;
          setIsPressing(false);
      }
  };

  const endPress = () => {
      if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = undefined;
      }
      setIsPressing(false);
  };

  const handleClick = (e: React.MouseEvent) => {
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
      onMouseMove={handleMove}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchMove={handleMove}
      onTouchEnd={endPress}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
      role="button"
      tabIndex={0}
    >
      <div className="p-2.5"> 
        <div className="flex items-start justify-between gap-2">
          <div className="flex-grow min-w-0">
              <div className="flex items-center gap-1 text-[10px] text-light-text-secondary dark:text-dark-text-secondary mb-0.5">
                <FactoryIcon />
                <span className="truncate max-w-[150px]" {...rtlTruncateFixProps}>{medicine['Manufacture Name']}</span>
              </div>
              <h2 className="text-sm font-bold text-light-text dark:text-dark-text break-words leading-tight mb-1" {...rtlTruncateFixProps}>
                  {medicine['Trade Name']}
              </h2>
              
              {/* المواد الفعالة باللون الأسود وبخط عادي */}
              <p className="text-[11px] text-black dark:text-white font-normal leading-tight line-clamp-2" {...rtlTruncateFixProps}>
                  {ingredientsString}
              </p>
          </div>

          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            {!isNaN(price) && (
              <div className="text-orange-600 dark:text-orange-400 text-sm font-black whitespace-nowrap">
                {price.toFixed(2)} <span className="text-[9px] font-normal text-light-text-secondary dark:text-dark-text-secondary">{t('sar')}</span>
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-1 max-w-[80px]">
                {(isControlled || isRestricted) ? (
                    <span className={`inline-block font-bold rounded-md px-1.5 py-0.5 text-[9px] text-white whitespace-nowrap shadow-sm ${isControlled ? 'bg-red-600' : 'bg-orange-50'}`}>
                        {isControlled ? 'CTRL' : 'REST'}
                    </span>
                ) : (
                    <LegalStatusBadge status={medicine['Legal Status']} size="sm" t={t} />
                )}
                <DrugTypeBadge type={medicine.DrugType} subType={medicine['Sub-Type']} size="sm" t={t} />
            </div>
          </div>
        </div>

        <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"> 
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0 flex-grow">
                <div className="flex items-center gap-1 text-[10px] text-light-text-secondary dark:text-dark-text-secondary truncate font-bold">
                    <PillIcon />
                    <span className="truncate" {...rtlTruncateFixProps}>{medicine.PharmaceuticalForm}</span>
                </div>
                {medicine.shelfLife && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-blue-500 dark:text-blue-400">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <span>{medicine.shelfLife}M</span>
                    </div>
                  </>
                )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(medicine.RegisterNumber);
                    }}
                    className={`p-1.5 rounded-full transition-colors ${isFavorite ? 'text-accent hover:text-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'text-gray-300 hover:text-accent'}`}
                >
                   <div className="h-4 w-4"><StarIcon isFilled={isFavorite} /></div>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
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
