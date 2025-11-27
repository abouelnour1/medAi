
import React from 'react';
import { Cosmetic, TFunction, Language, User } from '../types';
import EditIcon from './icons/EditIcon';
import CosmeticsIcon from './icons/CosmeticsIcon';
import CameraIcon from './icons/CameraIcon';

const DetailRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  if (!value || String(value).trim() === '') return null;
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
      <dt className="text-sm font-medium leading-6 text-light-text-secondary dark:text-dark-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-light-text dark:text-dark-text sm:col-span-2 sm:mt-0">{value}</dd>
    </div>
  );
};

interface CosmeticDetailProps {
    cosmetic: Cosmetic;
    t: TFunction;
    language: Language;
    user?: User | null;
    onEdit?: (cosmetic: Cosmetic) => void;
}

const CosmeticDetail: React.FC<CosmeticDetailProps> = ({ cosmetic, t, language, user, onEdit }) => {
  const handleImageSearch = () => {
      const brand = cosmetic.BrandName || '';
      const name = cosmetic.SpecificName || '';
      const query = `${brand} ${name}`;
      
      const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm animate-fade-in space-y-8">
      <div>
        <div className="px-2 sm:px-0">
          <div className="flex items-center justify-between gap-4">
              <div className="flex-grow">
                  <div className="flex items-center gap-1.5 text-xs text-primary dark:text-primary-light font-semibold mb-1">
                    <div className="h-4 w-4"><CosmeticsIcon /></div>
                    <span className="truncate">{cosmetic.BrandName}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold leading-7 text-light-text dark:text-dark-text">
                      {language === 'ar' ? cosmetic.SpecificNameAr || cosmetic.SpecificName : cosmetic.SpecificName}
                  </h2>
              </div>
              
              <div className="flex items-center gap-2">
                  <button
                      onClick={handleImageSearch}
                      className="p-2 rounded-full transition-colors text-gray-400 bg-gray-100 dark:bg-slate-800 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 flex-shrink-0"
                      title={t('searchImage')}
                  >
                      <div className="h-6 w-6">
                          <CameraIcon />
                      </div>
                  </button>
                  {user?.role === 'admin' && onEdit && (
                      <button
                          onClick={() => onEdit(cosmetic)}
                          className="p-2 rounded-full transition-colors text-gray-400 bg-gray-100 dark:bg-slate-800 hover:text-primary hover:bg-primary/10 flex-shrink-0"
                          title="Edit Cosmetic"
                      >
                          <div className="h-6 w-6">
                              <EditIcon />
                          </div>
                      </button>
                  )}
              </div>
          </div>
        </div>
        
        <div className="mt-6 border-t border-slate-100 dark:border-slate-800">
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            <DetailRow label={t('brandName')} value={cosmetic.BrandName} />
            
            <DetailRow label="Category (En)" value={cosmetic.FirstSubCategoryEn} />
            <DetailRow label="Category (Ar)" value={cosmetic.FirstSubCategoryAr} />
            
            <DetailRow label="Sub-Category (En)" value={cosmetic.SecondSubCategoryEn} />
            <DetailRow label="Sub-Category (Ar)" value={cosmetic.SecondSubCategoryAr} />
            
            <DetailRow label="Manufacturer" value={cosmetic.manufacturerNameEn} />
            <DetailRow label={t('countryOfManufacture')} value={language === 'ar' ? cosmetic.manufacturerCountryAr : cosmetic.manufacturerCountryEn} />
            
            <DetailRow label={t('quickActionIngredient')} value={cosmetic["Active ingredient"]} />
            <DetailRow label="Key Ingredients" value={cosmetic["Key Ingredients"]} />
            <DetailRow label="Highlights" value={cosmetic.Highlights} />
          </dl>
        </div>
      </div>
    </div>
  );
};

export default CosmeticDetail;
