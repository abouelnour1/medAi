import React, { useState, memo, useMemo } from 'react';
import { Medicine, TFunction, Language, User, InsuranceDrug } from '../types';
import StarIcon from './icons/StarIcon';
import EditIcon from './icons/EditIcon';
import AssistantIcon from './icons/AssistantIcon';
import PillBottleIcon from './icons/PillBottleIcon';
import AlternativeIcon from './icons/AlternativeIcon';
import StethoscopeIcon from './icons/StethoscopeIcon';
import FactoryIcon from './icons/FactoryIcon';
import GlobeIcon from './icons/GlobeIcon';
import ShieldIcon from './icons/ShieldIcon';
import SparkleIcon from './icons/SparkleIcon';
import SearchIcon from './icons/SearchIcon';
import PillIcon from './icons/PillIcon';
import { getIngredientsList } from './MedicineCard';

const InfoCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 shadow-sm border border-slate-50 dark:border-slate-700/50 mb-4 animate-card">
        <div className="flex items-center gap-3 mb-4 border-b border-slate-50 dark:border-slate-700 pb-3">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center p-1.5">{icon}</div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</h3>
        </div>
        <div className="space-y-3">{children}</div>
    </div>
);

const DetailRow: React.FC<{ label: string; value?: string | number | null; isLast?: boolean }> = ({ label, value, isLast }) => {
  if (!value || String(value).trim() === '' || String(value).toLowerCase() === 'na') return null;
  return (
    <div className={`flex justify-between items-start gap-4 py-1.5`}>
      <dt className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">{label}</dt>
      <dd className="text-sm font-black text-slate-800 dark:text-slate-100 text-right leading-tight">{value}</dd>
    </div>
  );
};

interface MedicineDetailProps {
    medicine: Medicine;
    insuranceData: InsuranceDrug[];
    t: TFunction;
    language: Language;
    isFavorite: boolean;
    onToggleFavorite: (medicineId: string) => void;
    user?: User | null;
    onEdit?: (medicine: Medicine) => void;
    onDelete?: (medicine: Medicine) => void;
    onOpenAssistant?: () => void;
    onImageZoom: (allImages: string[], initialIndex: number, title: string, indexFlags: boolean[]) => void;
    onFindAlternative: (medicine: Medicine) => void;
}

const MedicineDetail: React.FC<MedicineDetailProps> = ({ medicine, insuranceData, t, language, isFavorite, onToggleFavorite, user, onEdit, onDelete, onOpenAssistant, onImageZoom, onFindAlternative }) => {
  const [isPhysicalOpen, setIsPhysicalOpen] = useState(false);
  const price = parseFloat(medicine['Public price']);
  const ingredients = useMemo(() => getIngredientsList(medicine), [medicine]);
  const isControlled = medicine['Product Control']?.toLowerCase() === 'controlled';
  const isRestricted = medicine['Product Control']?.toLowerCase() === 'restricted';

  const allImages = useMemo(() => {
      return [medicine.imgBox, medicine.imgIndex1, medicine.imgIndex2, medicine.imgPill].filter((img): img is string => !!img && img.trim() !== '');
  }, [medicine]);

  const imageFlags = useMemo(() => {
      const flags: boolean[] = [];
      if (medicine.imgBox) flags.push(false);
      if (medicine.imgIndex1) flags.push(true);
      if (medicine.imgIndex2) flags.push(true);
      if (medicine.imgPill) flags.push(false);
      return flags;
  }, [medicine]);

  const hasPhysicalInfo = useMemo(() => {
    return !!(medicine.pillShape || medicine.pillScored || medicine.pillMarkings || medicine.liquidTaste || medicine.liquidColor || medicine.physicalNotes);
  }, [medicine]);

  const ingredientsTitle = useMemo(() => {
      const base = t('quickActionIngredient');
      const unit = medicine.StrengthUnit;
      if (unit && unit.trim() !== '' && unit.toLowerCase() !== 'na') {
          return `${base} (${unit})`;
      }
      return base;
  }, [medicine, t]);

  return (
    <div className="space-y-6 pb-24">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border border-teal-100 dark:border-teal-800 rounded-[2.5rem] p-6 text-slate-800 dark:text-white shadow-xl shadow-teal-500/5 relative overflow-hidden animate-card">
          <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                    <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700 shadow-sm">
                        {medicine['Legal Status']}
                    </span>
                    {isControlled && (
                        <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg border border-purple-400">
                             {language === 'ar' ? 'خاضع للرقابة' : 'Controlled'}
                        </span>
                    )}
                    {isRestricted && (
                        <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg border border-orange-400">
                             {language === 'ar' ? 'مقيد' : 'Restricted'}
                        </span>
                    )}
                  </div>
                  <button 
                    onClick={() => onToggleFavorite(medicine.RegisterNumber)}
                    className={`p-2.5 rounded-2xl transition-all active:scale-90 ${isFavorite ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                  >
                    <div className="w-5 h-5"><StarIcon isFilled={isFavorite} /></div>
                  </button>
              </div>

              <div className="flex gap-4 items-center">
                  <div className="flex-grow min-w-0">
                      <h1 className="text-2xl font-black leading-tight text-teal-800 dark:text-white">{medicine['Trade Name']}</h1>
                      {!isNaN(price) && price > 0 && (
                          <div className="mt-4 flex items-baseline gap-1.5">
                              <span className="text-4xl font-black tracking-tighter text-teal-600 dark:text-teal-400">{price.toFixed(2)}</span>
                              <span className="text-sm font-bold opacity-60 text-slate-500 dark:text-slate-400">{t('sar')}</span>
                          </div>
                      )}
                  </div>
                  
                  {medicine.imgBox && (
                      <button 
                        onClick={() => onImageZoom([medicine.imgBox!], 0, medicine['Trade Name'], [false])}
                        className="flex-shrink-0 w-28 h-28 sm:w-36 sm:h-36 bg-white rounded-3xl p-2 shadow-2xl border border-slate-100 transform rotate-2 hover:rotate-0 transition-all active:scale-95"
                      >
                          <img src={medicine.imgBox} alt="" className="w-full h-full object-contain" />
                      </button>
                  )}
              </div>
          </div>
      </div>

      {/* Visual Assets */}
      {allImages.length > 1 && (
          <div className="grid grid-cols-4 gap-2 px-1 animate-card" style={{ animationDelay: '0.05s' }}>
              {allImages.map((img, idx) => {
                  if (idx === 0 && medicine.imgBox) return null; 
                  return (
                    <button 
                        key={idx} 
                        onClick={() => onImageZoom(allImages, idx, medicine['Trade Name'], imageFlags)}
                        className="relative aspect-square bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 p-1 group shadow-sm"
                    >
                        <img src={img} alt="" className="w-full h-full object-contain" />
                        {imageFlags[idx] && (
                            <div className="absolute top-1 right-1 bg-primary text-white p-0.5 rounded shadow-sm">
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                            </div>
                        )}
                    </button>
                  );
              })}
          </div>
      )}

      {/* Floating Action Bar */}
      <div className="grid grid-cols-2 gap-3 px-1 animate-card" style={{ animationDelay: '0.1s' }}>
          <button 
            onClick={() => onFindAlternative(medicine)}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-700 active:scale-95 transition-all font-black text-[11px] text-slate-700 dark:text-slate-200 uppercase tracking-tight"
          >
              <div className="w-5 h-5 text-primary"><AlternativeIcon /></div>
              {t('directAlternatives')}
          </button>
          <button 
            onClick={onOpenAssistant}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-700 active:scale-95 transition-all font-black text-[11px] text-slate-700 dark:text-slate-200 uppercase tracking-tight"
          >
              <div className="w-5 h-5 text-primary"><AssistantIcon /></div>
              AI Assistant
          </button>
      </div>

      {/* Physical Details Collapsible */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-700/50 mb-4 animate-card overflow-hidden">
          <button 
            onClick={() => setIsPhysicalOpen(!isPhysicalOpen)}
            className="w-full flex items-center justify-between p-5 focus:outline-none"
          >
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center p-1.5">
                      <PillIcon />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t('physicalDetails')}</h3>
              </div>
              <svg 
                className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isPhysicalOpen ? 'rotate-180' : ''}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
              >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
          </button>
          
          <div className={`transition-all duration-300 ease-in-out ${isPhysicalOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
              <div className="px-5 pb-5 pt-0 space-y-3 border-t border-slate-50 dark:border-slate-700 mt-2">
                  {hasPhysicalInfo ? (
                      <>
                        <DetailRow label={t('pharmaceuticalForm')} value={medicine.PharmaceuticalForm} />
                        <DetailRow label={t('pillShape')} value={medicine.pillShape} />
                        <DetailRow label={t('scored')} value={medicine.pillScored} />
                        <DetailRow label={t('markings')} value={medicine.pillMarkings} />
                        <DetailRow label={t('taste')} value={medicine.liquidTaste} />
                        <DetailRow label={t('liquidColor')} value={medicine.liquidColor} />
                        {medicine.physicalNotes && (
                            <div className="pt-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{t('notes')}</p>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-tight">{medicine.physicalNotes}</p>
                            </div>
                        )}
                      </>
                  ) : (
                      <p className="text-xs text-slate-400 italic text-center py-4">{t('noPhysicalData')}</p>
                  )}
              </div>
          </div>
      </div>

      {/* Ingredients Card */}
      <InfoCard title={ingredientsTitle} icon={<PillBottleIcon />}>
          <div className="grid grid-cols-1 gap-1.5">
              {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase leading-tight">{ing.name}</span>
                      <span className="bg-primary/5 text-primary text-[10px] font-black px-2 py-0.5 rounded-lg border border-primary/10">{ing.strength}</span>
                  </div>
              ))}
          </div>
      </InfoCard>

      {/* Regulatory Card */}
      <InfoCard title={t('regulatory')} icon={<ShieldIcon />}>
          <DetailRow label={t('atcCodeLabel')} value={medicine.AtcCode1} />
          <DetailRow label={t('productControlLabel')} value={language === 'ar' ? (isControlled ? 'خاضع للرقابة' : isRestricted ? 'مقيد' : 'غير مقيد') : medicine['Product Control']} />
          <DetailRow label={t('regNumLabel')} value={medicine.RegisterNumber} />
          <DetailRow label={t('descriptiveCode')} value={medicine['Description Code']} />
          <DetailRow label={t('distribution')} value={medicine['Distribute area']} isLast />
      </InfoCard>

      {/* Manufacturing Card */}
      <InfoCard title={t('manufacturing')} icon={<FactoryIcon />}>
          <DetailRow label={t('manufacturer')} value={medicine['Manufacture Name']} />
          <DetailRow label={t('originCountry')} value={medicine['Manufacture Country']} />
          <DetailRow label={t('marketingCompanyLabel')} value={medicine['Marketing Company']} />
          <DetailRow label={t('agentLabel')} value={medicine['Main Agent']} isLast />
      </InfoCard>

      {/* Storage Card */}
      <InfoCard title={t('storage')} icon={<GlobeIcon />}>
          <p className="text-sm font-black text-slate-700 dark:text-slate-200 leading-relaxed text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {language === 'ar' ? medicine['Storage Condition Arabic'] : medicine['Storage conditions']}
          </p>
          <DetailRow label={t('shelfLifeLabel')} value={medicine.shelfLife} isLast />
      </InfoCard>

      {user?.role === 'admin' && (
          <div className="pt-6 animate-card">
              <button 
                onClick={() => onEdit?.(medicine)}
                className="w-full py-4 bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-[2rem] font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
              >
                  <div className="w-5 h-5"><EditIcon /></div>
                  {language === 'ar' ? 'تعديل بيانات الدواء' : 'Edit Medicine Data'}
              </button>
          </div>
      )}
    </div>
  );
};

export default memo(MedicineDetail);