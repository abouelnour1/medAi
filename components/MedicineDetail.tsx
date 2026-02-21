
import React, { useState, memo, useMemo } from 'react';
import { Medicine, TFunction, Language, User, InsuranceDrug } from '../types';
import StarIcon from './icons/StarIcon';
import EditIcon from './icons/EditIcon';
import AssistantIcon from './icons/AssistantIcon';
import PillBottleIcon from './icons/PillBottleIcon';
import AlternativeIcon from './icons/AlternativeIcon';
import FactoryIcon from './icons/FactoryIcon';
import GlobeIcon from './icons/GlobeIcon';
import ShieldIcon from './icons/ShieldIcon';
import CameraIcon from './icons/CameraIcon';
import PillIcon from './icons/PillIcon';
import { getIngredientsList } from './MedicineCard';

const InfoCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-dark-card rounded-[2rem] p-5 shadow-sm border border-slate-50 dark:border-dark-border mb-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-4 border-b border-slate-50 dark:border-dark-border pb-3">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center p-1.5">{icon}</div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-dark-muted">{title}</h3>
        </div>
        <div className="space-y-3">{children}</div>
    </div>
);

const DetailRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
  if (!value || String(value).trim() === '' || String(value).toLowerCase() === 'na') return null;
  return (
    <div className="flex justify-between items-start gap-4 py-1.5">
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

const MedicineDetail: React.FC<MedicineDetailProps> = ({ medicine, t, language, isFavorite, onToggleFavorite, user, onEdit, onOpenAssistant, onImageZoom, onFindAlternative }) => {
  const [isPhysicalOpen, setIsPhysicalOpen] = useState(false);
  const price = parseFloat(medicine['Public price']);
  const ingredients = useMemo(() => getIngredientsList(medicine), [medicine]);
  const isControlled = medicine['Product Control']?.toLowerCase() === 'controlled';
  const isRestricted = medicine['Product Control']?.toLowerCase() === 'restricted';

  const productImages = useMemo(() => {
    const list: string[] = [];
    if (medicine.imgBox) list.push(medicine.imgBox);
    if (medicine.imgPill) list.push(medicine.imgPill);
    if (medicine.imgIndex1) list.push(medicine.imgIndex1);
    if (medicine.imgIndex2) list.push(medicine.imgIndex2);
    return list;
  }, [medicine]);

  const handleGoogleImageSearch = () => {
    // تم التعديل ليبحث فقط عن اسم الدواء التجاري مباشرة كما طلبت
    const q = encodeURIComponent(medicine['Trade Name']);
    window.open(`https://www.google.com/search?tbm=isch&q=${q}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-slate-900 dark:to-slate-900/50 border border-teal-100 dark:border-dark-border rounded-[2.5rem] p-6 shadow-xl relative">
          <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <span className="bg-white dark:bg-dark-card px-3 py-1 rounded-full text-[9px] font-black uppercase border border-slate-100 dark:border-dark-border">{medicine['Legal Status']}</span>
                {isControlled && <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase">Controlled</span>}
                {isRestricted && <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase">Restricted</span>}
              </div>
              <div className="flex gap-2">
                  <button onClick={handleGoogleImageSearch} className="p-2.5 bg-white dark:bg-dark-card text-slate-400 dark:text-dark-muted hover:text-primary rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border active:scale-90 transition-all">
                      <div className="w-5 h-5"><CameraIcon /></div>
                  </button>
                  <button onClick={() => onToggleFavorite(medicine.RegisterNumber)} className={`p-2.5 rounded-2xl active:scale-90 transition-all ${isFavorite ? 'bg-amber-500 text-white shadow-lg' : 'bg-white dark:bg-dark-card text-slate-400 dark:text-dark-muted border border-slate-100 dark:border-dark-border'}`}>
                    <div className="w-5 h-5"><StarIcon isFilled={isFavorite} /></div>
                  </button>
              </div>
          </div>
          <div className="flex gap-4 items-center">
              <div className="flex-grow min-w-0">
                  <h1 className="text-2xl font-black text-teal-800 dark:text-teal-400 leading-tight">{medicine['Trade Name']}</h1>
                  {price > 0 && <div className="mt-4 flex items-baseline gap-1.5"><span className="text-4xl font-black text-teal-600 dark:text-teal-300">{price.toFixed(2)}</span><span className="text-sm font-bold text-slate-500">{t('sar')}</span></div>}
              </div>
              {medicine.imgBox && (
                  <button onClick={() => onImageZoom(productImages, 0, medicine['Trade Name'], productImages.map(() => false))} className="flex-shrink-0 w-28 h-28 bg-white rounded-3xl p-2 shadow-2xl border border-slate-100 active:scale-95 transition-all overflow-hidden">
                      <img src={medicine.imgBox} alt="" className="w-full h-full object-contain" />
                  </button>
              )}
          </div>
      </div>

      {productImages.length > 1 && (
          <div className="px-1 overflow-x-auto no-scrollbar flex gap-3 animate-fade-in">
              {productImages.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => onImageZoom(productImages, idx, medicine['Trade Name'], productImages.map(() => false))}
                    className="flex-shrink-0 w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 p-1 shadow-sm overflow-hidden active:scale-90 transition-transform"
                  >
                      <img src={img} className="w-full h-full object-contain" alt={`View ${idx}`} />
                  </button>
              ))}
          </div>
      )}

      <div className="grid grid-cols-2 gap-3 px-1">
          <button onClick={() => onFindAlternative(medicine)} className="flex items-center justify-center gap-2 bg-white dark:bg-dark-card p-4 rounded-3xl shadow-sm border dark:border-slate-800 active:scale-95 transition-all font-black text-[11px] uppercase">
              <div className="w-5 h-5 text-primary"><AlternativeIcon /></div>
              {t('directAlternatives')}
          </button>
          <button onClick={onOpenAssistant} className="flex items-center justify-center gap-2 bg-white dark:bg-dark-card p-4 rounded-3xl shadow-sm border dark:border-slate-800 active:scale-95 transition-all font-black text-[11px] uppercase">
              <div className="w-5 h-5 text-primary"><AssistantIcon /></div>
              AI Assistant
          </button>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-[2rem] shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">
          <button onClick={() => setIsPhysicalOpen(!isPhysicalOpen)} className="w-full flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center p-1.5"><PillIcon /></div>
                  <h3 className="text-[11px] font-black uppercase text-slate-400 dark:text-dark-muted">{t('physicalDetails')}</h3>
              </div>
              <svg className={`w-4 h-4 text-slate-300 transition-transform ${isPhysicalOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div className={`${isPhysicalOpen ? 'max-h-[500px] opacity-100 p-5 pt-0' : 'max-h-0 opacity-0 overflow-hidden'} transition-all duration-300`}>
                <div className="space-y-3 border-t border-slate-100 dark:border-dark-border pt-3 mt-2">
                    <DetailRow label={t('pharmaceuticalForm')} value={medicine.PharmaceuticalForm} />
                    <DetailRow label={t('pillShape')} value={medicine.pillShape} />
                    <DetailRow label={t('scored')} value={medicine.pillScored} />
                    <DetailRow label={t('markings')} value={medicine.pillMarkings} />
                    <DetailRow label={t('notes')} value={medicine.physicalNotes} />
                </div>
          </div>
      </div>

      <InfoCard title={t('quickActionIngredient')} icon={<PillBottleIcon />}>
          <div className="grid grid-cols-1 gap-1.5">
              {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">{ing.name}</span>
                      <span className="bg-primary/5 text-primary text-[10px] font-black px-2 py-0.5 rounded-lg">{ing.strength}</span>
                  </div>
              ))}
          </div>
      </InfoCard>

      <InfoCard title={t('regulatory')} icon={<ShieldIcon />}>
          <DetailRow label={t('regNumLabel')} value={medicine.RegisterNumber} />
          <DetailRow label={t('productControlLabel')} value={medicine['Product Control']} />
          <DetailRow label={t('atcCodeLabel')} value={medicine.AtcCode1} />
      </InfoCard>

      <InfoCard title={t('manufacturing')} icon={<FactoryIcon />}>
          <DetailRow label={t('manufacturer')} value={medicine['Manufacture Name']} />
          <DetailRow label={t('marketingCompanyLabel')} value={medicine['Marketing Company']} />
          <DetailRow label={t('agentLabel')} value={medicine['Main Agent']} />
      </InfoCard>

      <InfoCard title={t('storage')} icon={<GlobeIcon />}>
          <p className="text-sm font-black text-slate-700 dark:text-slate-300 leading-relaxed text-right">{language === 'ar' ? medicine['Storage Condition Arabic'] : medicine['Storage conditions']}</p>
          <DetailRow label={t('shelfLifeLabel')} value={medicine.shelfLife} />
      </InfoCard>

      {user && (user.role === 'admin' || user.role === 'company') && (
          <div className="pt-6">
              <button onClick={() => onEdit?.(medicine)} className="w-full py-4 bg-slate-800 dark:bg-primary text-white rounded-[2rem] font-black flex items-center justify-center gap-2 active:scale-95 shadow-xl transition-all">
                  <div className="w-5 h-5"><EditIcon /></div>
                  {language === 'ar' ? 'تعديل بيانات الدواء' : 'Edit Medicine Data'}
              </button>
          </div>
      )}
    </div>
  );
};
export default memo(MedicineDetail);
