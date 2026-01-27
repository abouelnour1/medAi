import React, { useState, useEffect } from 'react';
import { Cosmetic, TFunction } from '../types';
import ClearIcon from './icons/ClearIcon';

interface EditCosmeticModalProps {
  isOpen: boolean;
  onClose: () => void;
  cosmetic: Cosmetic | null;
  onSave: (updatedCosmetic: Cosmetic) => void;
  t: TFunction;
}

const EditCosmeticModal: React.FC<EditCosmeticModalProps> = ({ isOpen, onClose, cosmetic, onSave, t }) => {
  const [formData, setFormData] = useState<Cosmetic | null>(null);

  useEffect(() => {
    if (cosmetic) {
      setFormData({ ...cosmetic });
    }
  }, [cosmetic]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
  const sectionTitle = "text-xs font-black text-pink-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 mt-2";

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
             </div>
             <div>
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">تعديل منتج تجميل</h3>
                <p className="text-[10px] text-slate-400 font-bold">{formData.BrandName}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ClearIcon />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar">
          <div>
            <h4 className={sectionTitle}>البيانات الأساسية</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                 <label className={labelClass}>اسم الماركة (Brand)</label>
                 <input type="text" name="BrandName" value={formData.BrandName} onChange={handleChange} className={inputClass} required />
              </div>
              <div>
                 <label className={labelClass}>اسم المنتج (Specific Name - EN)</label>
                 <input type="text" name="SpecificName" value={formData.SpecificName} onChange={handleChange} className={inputClass} required />
              </div>
              <div>
                 <label className={labelClass}>اسم المنتج (بالعربية)</label>
                 <input type="text" name="SpecificNameAr" value={formData.SpecificNameAr || ''} onChange={handleChange} className={`${inputClass} text-right`} dir="rtl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className={labelClass}>السعر (SAR)</label>
                     <input type="text" name="Public price" value={formData["Public price"] || ''} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                     <label className={labelClass}>بلد التصنيع</label>
                     <input type="text" name="manufacturerCountryEn" value={formData.manufacturerCountryEn || ''} onChange={handleChange} className={inputClass} />
                  </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className={sectionTitle}>المكونات والتفاصيل</h4>
            <div className="space-y-4">
              <div>
                 <label className={labelClass}>المواد الفعالة (Active Ingredients)</label>
                 <textarea name="Active ingredient" value={formData["Active ingredient"] || ''} onChange={handleChange} rows={3} className={inputClass} />
              </div>
              <div>
                 <label className={labelClass}>المكونات الرئيسية (Key Ingredients)</label>
                 <textarea name="Key Ingredients" value={formData["Key Ingredients"] || ''} onChange={handleChange} rows={3} className={inputClass} />
              </div>
              <div>
                 <label className={labelClass}>مميزات المنتج (Highlights)</label>
                 <input type="text" name="Highlights" value={formData.Highlights || ''} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                 <label className={labelClass}>رابط صورة المنتج (Image URL)</label>
                 <input type="text" name="imgBox" value={formData.imgBox || ''} onChange={handleChange} className={inputClass} placeholder="https://..." />
              </div>
            </div>
          </div>
        </form>

        <div className="p-4 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 sticky bottom-0">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
            {t('cancel')}
          </button>
          <button onClick={handleSave} className="px-8 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black text-sm shadow-lg shadow-pink-500/20 transition-all active:scale-95 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCosmeticModal;