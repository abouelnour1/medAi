
import React, { useState, useEffect } from 'react';
import { Medicine, TFunction } from '../types';
import ClearIcon from './icons/ClearIcon';

interface EditMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicine: Medicine | null;
  onSave: (updatedMedicine: Medicine) => void;
  t: TFunction;
}

const EditMedicineModal: React.FC<EditMedicineModalProps> = ({ isOpen, onClose, medicine, onSave, t }) => {
  const [formData, setFormData] = useState<Medicine | null>(null);

  useEffect(() => {
    if (medicine) {
      setFormData({ ...medicine });
    }
  }, [medicine]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  const inputClass = "w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm dark:text-white";
  const labelClass = "block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest px-1";
  const sectionTitle = "text-xs font-black text-primary uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 mt-2";

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
             </div>
             <div>
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('editMedicine') || 'تعديل الصنف'}</h3>
                <p className="text-[10px] text-slate-400 font-bold">{formData.RegisterNumber}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ClearIcon />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-6 space-y-8 no-scrollbar">
          
          {/* Section: Basic Identity */}
          <div>
            <h4 className={sectionTitle}>البيانات الأساسية (Identity)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-full">
                 <label className={labelClass}>{t('tradeName')}</label>
                 <input type="text" name="Trade Name" value={formData['Trade Name']} onChange={handleChange} className={inputClass} required />
              </div>
              <div className="col-span-full">
                 <label className={labelClass}>{t('scientificName')}</label>
                 <input type="text" name="Scientific Name" value={formData['Scientific Name']} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                 <label className={labelClass}>{t('sar')}</label>
                 <input type="number" step="0.01" name="Public price" value={formData['Public price']} onChange={handleChange} className={inputClass} required />
              </div>
              <div>
                 <label className={labelClass}>{t('pharmaceuticalForm')}</label>
                 <input type="text" name="PharmaceuticalForm" value={formData.PharmaceuticalForm} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                 <label className={labelClass}>القوة (Strength)</label>
                 <input type="text" name="Strength" value={formData.Strength} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                 <label className={labelClass}>الوحدة (Unit)</label>
                 <input type="text" name="StrengthUnit" value={formData.StrengthUnit} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Section: Physical Appearance & Images */}
          <div>
            <h4 className={sectionTitle}>الخصائص المادية والصور (Physical)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="col-span-full">
                 <label className={labelClass}>{t('boxImage')} URL</label>
                 <input type="text" name="imgBox" value={formData.imgBox || ''} onChange={handleChange} className={inputClass} placeholder="https://..." />
               </div>
               <div>
                 <label className={labelClass}>صورة الفهرس 1 (Index 1) URL</label>
                 <input type="text" name="imgIndex1" value={formData.imgIndex1 || ''} onChange={handleChange} className={inputClass} placeholder="https://..." />
               </div>
               <div>
                 <label className={labelClass}>صورة الفهرس 2 (Index 2) URL</label>
                 <input type="text" name="imgIndex2" value={formData.imgIndex2 || ''} onChange={handleChange} className={inputClass} placeholder="https://..." />
               </div>
               <div>
                 <label className={labelClass}>{t('pillImage')} URL</label>
                 <input type="text" name="imgPill" value={formData.imgPill || ''} onChange={handleChange} className={inputClass} placeholder="https://..." />
               </div>
               <div>
                 <label className={labelClass}>{t('pillShape')}</label>
                 <input type="text" name="pillShape" value={formData.pillShape || ''} onChange={handleChange} className={inputClass} />
               </div>
               <div>
                 <label className={labelClass}>{t('scored')}</label>
                 <select name="pillScored" value={formData.pillScored || ''} onChange={handleChange} className={inputClass}>
                    <option value="">{t('pleaseSelectOrAdd')}</option>
                    <option value="Yes">{document.documentElement.lang === 'ar' ? 'نعم' : 'Yes'}</option>
                    <option value="No">{document.documentElement.lang === 'ar' ? 'لا' : 'No'}</option>
                 </select>
               </div>
               <div>
                 <label className={labelClass}>العلامات (Markings)</label>
                 <input type="text" name="pillMarkings" value={formData.pillMarkings || ''} onChange={handleChange} className={inputClass} />
               </div>
               <div>
                 <label className={labelClass}>الطعم (Taste)</label>
                 <input type="text" name="liquidTaste" value={formData.liquidTaste || ''} onChange={handleChange} className={inputClass} />
               </div>
               <div>
                 <label className={labelClass}>لون السائل (Color)</label>
                 <input type="text" name="liquidColor" value={formData.liquidColor || ''} onChange={handleChange} className={inputClass} />
               </div>
               <div className="col-span-full">
                 <label className={labelClass}>{t('notes')}</label>
                 <textarea name="physicalNotes" value={formData.physicalNotes || ''} onChange={handleChange} rows={3} className={inputClass} />
               </div>
            </div>
          </div>

          {/* Section: Manufacturer & Agent */}
          <div>
            <h4 className={sectionTitle}>التصنيع والوكلاء (Manufacturing)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-full">
                 <label className={labelClass}>{t('manufacturer')}</label>
                 <input type="text" name="Manufacture Name" value={formData['Manufacture Name']} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                 <label className={labelClass}>{t('countryOfManufacture')}</label>
                 <input type="text" name="Manufacture Country" value={formData['Manufacture Country']} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                 <label className={labelClass}>{t('mainAgent')}</label>
                 <input type="text" name="Main Agent" value={formData['Main Agent']} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Section: Storage & Shelf Life */}
          <div>
            <h4 className={sectionTitle}>التخزين والصلاحية (Logistics)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-full">
                 <label className={labelClass}>{t('storageConditions')} (EN)</label>
                 <input type="text" name="Storage conditions" value={formData['Storage conditions']} onChange={handleChange} className={inputClass} />
              </div>
              <div className="col-span-full">
                 <label className={labelClass}>{t('storageConditions')} (AR)</label>
                 <input type="text" name="Storage Condition Arabic" value={formData['Storage Condition Arabic']} onChange={handleChange} className={`${inputClass} text-right`} dir="rtl" />
              </div>
              <div>
                 <label className={labelClass}>{t('shelfLife')} (Months)</label>
                 <input type="text" name="shelfLife" value={formData.shelfLife} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                 <label className={labelClass}>كود ATC</label>
                 <input type="text" name="AtcCode1" value={formData.AtcCode1} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Section: Regulatory Status */}
          <div>
            <h4 className={sectionTitle}>الحالة القانونية (Regulatory)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
              <div>
                 <label className={labelClass}>{t('legalStatus')}</label>
                 <select name="Legal Status" value={formData['Legal Status']} onChange={handleChange} className={inputClass}>
                    <option value="OTC">OTC</option>
                    <option value="Prescription">Prescription</option>
                 </select>
              </div>
              <div>
                 <label className={labelClass}>الرقابة (Control)</label>
                 <select name="Product Control" value={formData['Product Control']} onChange={handleChange} className={inputClass}>
                    <option value="Uncontrolled">Uncontrolled</option>
                    <option value="Controlled">Controlled</option>
                    <option value="Restricted">Restricted</option>
                 </select>
              </div>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="p-4 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 sticky bottom-0 z-10">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
            {t('cancel')}
          </button>
          <button onClick={handleSave} className="px-8 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-black text-sm shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMedicineModal;
