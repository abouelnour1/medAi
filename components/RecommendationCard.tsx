import React from 'react';
import { TFunction, Recommendation, ProductSuggestion } from '../types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  t: TFunction;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, t }) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 my-2 border border-slate-200 dark:border-slate-700 w-full">
      <div className="mb-3">
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('recommendation')}</p>
        <h3 className="text-lg font-bold text-primary dark:text-primary-light">{recommendation.category}</h3>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-sm text-light-text dark:text-dark-text mb-1">{t('rationale')}</h4>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{recommendation.rationale}</p>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-light-text dark:text-dark-text mb-2">{t('suggestedProducts')}</h4>
        <div className="space-y-2">
          {recommendation.products.map((product, index) => (
            <div key={index} className="bg-white dark:bg-slate-700 p-2 rounded-md border border-slate-100 dark:border-slate-600">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-light-text dark:text-dark-text">{product.name}</p>
                  <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{product.concentration}</p>
                </div>
                {product.price && product.price !== 'N/A' && (
                  <p className="font-bold text-accent text-sm whitespace-nowrap">{product.price} {t('sar')}</p>
                )}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-600">
                  <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary"><strong className="font-semibold text-light-text dark:text-dark-text">{t('sellingPoint')}: </strong>{product.selling_point}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;