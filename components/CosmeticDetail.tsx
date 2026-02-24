import React from 'react';
import { Cosmetic, TFunction, Language, User } from '../types';
import EditIcon from './icons/EditIcon';
import CosmeticsIcon from './icons/CosmeticsIcon';
import CameraIcon from './icons/CameraIcon';
import FactoryIcon from './icons/FactoryIcon';
import SparkleIcon from './icons/SparkleIcon';

const DetailRow: React.FC<{ label: string; value?: string | null; valueClassName?: string }> = ({ label, value, valueClassName }) => {
  if (!value || String(value).trim() === '') return null;
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
      <dt className="text-sm font-medium leading-6 text-slate-400">{label}</dt>
      <dd className={`mt-1 text-sm leading-6 text-slate-800 dark:text-slate-100 sm:col-span-2 sm:mt-0 ${valueClassName || ''}`}>{value}</dd>
    </div>
  );
};

interface CosmeticDetailProps {
    cosmetic: Cosmetic;
    t: TFunction;
    language: Language;
    user?: User | null;
    onEdit?: (cosmetic: Cosmetic) => void;
    onTransferToFood?: (cosmetic: Cosmetic) => void;
}

const CosmeticDetail: React.FC<CosmeticDetailProps> = ({ cosmetic, t, language, user, onEdit, onTransferToFood }) => {
  const handleImageSearch = () => {
      const query = `${cosmetic.BrandName} ${cosmetic.SpecificName}`;
      window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, '_blank');
  };

  const handleEditClick = () => {
      if (!user) {
          alert(t('loginRequired'));
          return;
      }
      if (user.role === 'admin' || user.role === 'company') {
          onEdit?.(cosmetic);
      } else {
          alert(t('onlyCompanyCanEdit') + "\n\n" + t('pleaseUseCompanyAccount'));
      }
  };

  const price = parseFloat(cosmetic["Public price"] || "");

  return (
    <div className="bg-white dark:bg-slate-900 min-h-full rounded-2xl shadow-sm animate-fade-in overflow-hidden border border-slate-100 dark:border-slate-800">
      
      {/* Visual Header */}
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start gap-4">
              <div className="flex-grow">
                  <div className="flex items-center gap-2 text-xs font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest mb-2">
                      <div className="h-4 w-4"><CosmeticsIcon /></div>
                      {cosmetic.BrandName}
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                      {cosmetic.SpecificName}
                  </h2>
                  {cosmetic.SpecificNameAr && (
                    <p className="text-lg font-bold text-slate-500 mt-1" dir="rtl">{cosmetic.SpecificNameAr}</p>
                  )}
              </div>
              <div className="flex gap-2">
                  <button 
                    onClick={handleImageSearch} 
                    className="p-2.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-400 hover:text-blue-500 border border-slate-100 dark:border-slate-700 active:scale-95 transition-transform"
                    title={t('searchImage')}
                  >
                    <div className="h-5 w-5"><CameraIcon /></div>
                  </button>
                  
                  <button 
                      onClick={handleEditClick} 
                      className={`p-2.5 rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center ${user?.role === 'admin' || user?.role === 'company' ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-slate-200 text-slate-400'}`}
                      aria-label="Edit Cosmetic"
                      title={t('editProposal')}
                  >
                      <div className="h-5 w-5"><EditIcon /></div>
                  </button>
              </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
               <div className="flex flex-wrap items-center gap-4">
                    {!isNaN(price) && (
                        <div className="bg-pink-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-pink-500/20">
                            <span className="text-xl font-black">{price.toFixed(2)} ﷼</span>
                            <span className="text-sm font-black">﷼</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-500 bg-white/50 dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-white/20">
                        <div className="h-4 w-4"><FactoryIcon /></div>
                        <span className="text-xs font-bold truncate max-w-[150px]">{cosmetic.manufacturerNameEn}</span>
                    </div>
               </div>

               {user?.role === 'admin' && (
                   <button 
                    onClick={() => onTransferToFood?.(cosmetic)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                       {t('transferToFood')}
                   </button>
               )}
          </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Product Image Holder */}
        {cosmetic.imgBox && (
            <div className="flex justify-center">
                <div className="w-48 h-48 bg-white rounded-3xl p-2 shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
                    <img src={cosmetic.imgBox} alt={cosmetic.SpecificName} className="max-w-full max-h-full object-contain" />
                </div>
            </div>
        )}

        {/* Categories Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Primary Category</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{cosmetic.FirstSubCategoryEn}</p>
                <p className="text-xs text-slate-500 font-medium" dir="rtl">{cosmetic.FirstSubCategoryAr}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Sub-Category</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{cosmetic.SecondSubCategoryEn}</p>
                <p className="text-xs text-slate-500 font-medium" dir="rtl">{cosmetic.SecondSubCategoryAr}</p>
            </div>
        </div>

        {/* Ingredients Section */}
        <div className="space-y-4">
             <div className="border-l-4 border-pink-500 pl-4 py-1">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('quickActionIngredient')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{cosmetic["Active ingredient"] || 'N/A'}</p>
             </div>

             <div className="border-l-4 border-purple-500 pl-4 py-1">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Key Components</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{cosmetic["Key Ingredients"] || 'N/A'}</p>
             </div>
        </div>

        {/* Highlights */}
        {cosmetic.Highlights && (
            <div className="bg-gradient-to-r from-pink-500/5 to-transparent p-4 rounded-xl border border-pink-500/10">
                <div className="flex items-center gap-2 text-pink-600 mb-2">
                    <div className="w-4 h-4"><SparkleIcon /></div>
                    <span className="text-xs font-black uppercase">Product Highlights</span>
                </div>
                <p className="text-sm italic text-slate-600 dark:text-slate-400">{cosmetic.Highlights}</p>
            </div>
        )}

        {/* Footer Data */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
            <dl className="divide-y divide-slate-50 dark:divide-slate-800/50">
                <DetailRow label="Brand" value={cosmetic.BrandName} />
                <DetailRow label="Manufacturer" value={cosmetic.manufacturerNameEn} />
                <DetailRow label="Country" value={cosmetic.manufacturerCountryEn} />
                <DetailRow label="Registration ID" value={cosmetic.id} />
            </dl>
        </div>
      </div>
    </div>
  );
};

export default CosmeticDetail;