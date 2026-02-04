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
  const [isRegNumLocked, setIsRegNumLocked] = useState(true);

  useEffect(() => {
    if (medicine) {
      setFormData({ ...medicine });
      setIsRegNumLocked(true);
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

        <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-6 space-y-8 no-scrollbar">
          <div>
            <h4 className={sectionTitle}>البيانات الأساسية (Identity)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-full">
                 <div className="flex justify-between items-end mb-1">
                    <label className={labelClass}>{t('registrationNumber')} *</label>
                    <button 
                        type="button"
                        onClick={() => setIsRegNumLocked(!isRegNumLocked)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase transition-all ${isRegNumLocked ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}
                        title={isRegNumLocked ? t('unlock') : t('lock')}
                    >
                        {isRegNumLocked ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                {t('lock')}
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2z" /></svg>
                                {t('unlock')}
                            </>
                        )}
                    </button>
                 </div>
                 <input 
                    type="text" 
                    name="RegisterNumber" 
                    value={formData.RegisterNumber} 
                    onChange={handleChange} 
                    className={`${inputClass} ${isRegNumLocked ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`} 
                    required 
                    readOnly={isRegNumLocked}
                 />
              </div>
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
              <div className="col-span-full">
                 <label className={labelClass}>نبذة / وصف (Text Description)</label>
                 <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className={inputClass} placeholder="اكتب وصفاً مفصلاً للمنتج هنا..." />
              </div>
            </div>
          </div>

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

          <div>
            <h4 className={sectionTitle}>الخصائص المادية والصور (Physical)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="col-span-full">
                 <label className={labelClass}>{t('boxImage')} URL</label>
                 <input type="text" name="imgBox" value={formData.imgBox || ''} onChange={handleChange} className={inputClass} placeholder="https://..." />
               </div>
               <div>
                 <label className={labelClass}>{t('pillShape')}</label>
                 <input type="text" name="pillShape" value={formData.pillShape || ''} onChange={handleChange} className={inputClass} />
               </div>
               <div className="col-span-full">
                 <label className={labelClass}>{t('notes')}</label>
                 <textarea name="physicalNotes" value={formData.physicalNotes || ''} onChange={handleChange} rows={3} className={inputClass} />
               </div>
            </div>
          </div>

          <div>
            <h4 className={sectionTitle}>التنظيم (Regulatory)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
              <div>
                 <label className={labelClass}>{t('legalStatus')}</label>
                 <select name="Legal Status" value={formData['Legal Status']} onChange={handleChange} className={inputClass}>
                    <option value="OTC">OTC</option>
                    <option value="Prescription">Prescription</option>
                 </select>
              </div>
              <div>
                 <label className={labelClass}>{t('descriptiveCode')}</label>
                 <input type="text" name="Description Code" value={formData['Description Code']} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>
        </form>

        <div className="p-4 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 sticky bottom-0 z-10">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
            {t('cancel')}
          </button>
          <button onClick={handleSave} className="px-8 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-black text-sm shadow-lg transition-all active:scale-95 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMedicineModal;