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
    <div className={`flex justify-between items-start gap-4 py-1.5 ${!isLast ? '' : ''}`}>
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
  const price = parseFloat(medicine['Public price']);
  const ingredients = useMemo(() => getIngredientsList(medicine), [medicine]);

  return (
    <div className="space-y-6 pb-24">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden animate-card">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
              <div className="flex justify-between items-start">
                  <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                      {medicine['Legal Status']}
                  </span>
                  <button 
                    onClick={() => onToggleFavorite(medicine.RegisterNumber)}
                    className={`p-3 rounded-2xl transition-all active:scale-90 ${isFavorite ? 'bg-white text-orange-500 shadow-lg' : 'bg-white/10 text-white'}`}
                  >
                    <div className="w-6 h-6"><StarIcon isFilled={isFavorite} /></div>
                  </button>
              </div>
              <h1 className="text-3xl font-black mt-6 leading-tight drop-shadow-md">{medicine['Trade Name']}</h1>
              
              {!isNaN(price) && price > 0 && (
                  <div className="mt-8 flex items-baseline gap-2">
                      <span className="text-5xl font-black tracking-tighter">{price.toFixed(2)}</span>
                      <span className="text-lg font-bold opacity-80">{t('sar')}</span>
                  </div>
              )}
          </div>
      </div>

      {/* Modern Floating Action Bar */}
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

      {/* Ingredients Card */}
      <InfoCard title={t('quickActionIngredient')} icon={<PillBottleIcon />}>
          <div className="grid grid-cols-1 gap-2">
              {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">{ing.name}</span>
                      <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-lg">{ing.strength}</span>
                  </div>
              ))}
          </div>
      </InfoCard>

      {/* Regulatory Card */}
      <InfoCard title="التنظيم والرقابة" icon={<ShieldIcon />}>
          <DetailRow label="كود ATC" value={medicine.AtcCode1} />
          <DetailRow label="التحكم بالمنتج" value={medicine['Product Control']} />
          <DetailRow label="رقم التسجيل" value={medicine.RegisterNumber} />
          <DetailRow label="نطاق التوزيع" value={medicine['Distribute area']} isLast />
      </InfoCard>

      {/* Manufacturing Card */}
      <InfoCard title="الشركة والتصنيع" icon={<FactoryIcon />}>
          <DetailRow label="المصنع" value={medicine['Manufacture Name']} />
          <DetailRow label="بلد المنشأ" value={medicine['Manufacture Country']} />
          <DetailRow label="الوكيل" value={medicine['Main Agent']} isLast />
      </InfoCard>

      {/* Storage Card */}
      <InfoCard title="ظروف التخزين" icon={<GlobeIcon />}>
          <p className="text-sm font-black text-slate-700 dark:text-slate-200 leading-relaxed text-right" dir="rtl">
              {medicine['Storage Condition Arabic']}
          </p>
          <p className="text-[10px] font-bold text-slate-400 mt-2 italic" dir="ltr">{medicine['Storage conditions']}</p>
      </InfoCard>

      {user?.role === 'admin' && (
          <div className="pt-6 animate-card">
              <button 
                onClick={() => onEdit?.(medicine)}
                className="w-full py-4 bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-[2rem] font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
              >
                  <div className="w-5 h-5"><EditIcon /></div>
                  تعديل بيانات الدواء
              </button>
          </div>
      )}
    </div>
  );
};

export default memo(MedicineDetail);