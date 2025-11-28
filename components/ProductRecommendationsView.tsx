
import React from 'react';
import { TFunction } from '../types';
import PillBottleIcon from './icons/PillBottleIcon';

export interface RecommendedProduct {
  tradeName: string;
  scientificName: string;
  price: string;
  reason: string;
  form?: string;
}

interface ProductRecommendationsViewProps {
  content: string;
  t: TFunction;
}

const ProductRecommendationsView: React.FC<ProductRecommendationsViewProps> = ({ content, t }) => {
  let products: RecommendedProduct[] = [];

  try {
    const match = content.match(/---PRODUCTS_START---\s*([\s\S]*?)\s*---PRODUCTS_END---/);
    const jsonStr = match ? match[1] : content;
    // Clean potential markdown code blocks
    const cleanJson = jsonStr.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
    products = JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse product recommendations", e);
    return <div className="text-red-500 text-sm">Error loading product suggestions.</div>;
  }

  if (!Array.isArray(products) || products.length === 0) {
      return null;
  }

  return (
    <div className="w-full space-y-3 my-2">
      {products.map((product, index) => {
        const hasPrice = product.price && product.price !== '0' && product.price.toLowerCase() !== 'n/a' && product.price !== 'غير متوفر';
        
        return (
            <div key={index} className="flex flex-col bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="text-primary dark:text-primary-light flex-shrink-0">
                            <PillBottleIcon />
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{product.tradeName}</h4>
                    </div>
                    {hasPrice && (
                        <span className="flex-shrink-0 text-sm font-bold text-white bg-secondary px-2 py-0.5 rounded-full shadow-sm">
                            {product.price} {t('sar')}
                        </span>
                    )}
                </div>

                {/* Body */}
                <div className="p-3 space-y-2">
                    <div className="flex justify-between items-start gap-2 text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{t('scientificName')}:</span>
                        <span className="text-slate-700 dark:text-slate-300 text-right font-mono">{product.scientificName}</span>
                    </div>
                    {product.form && (
                        <div className="flex justify-between items-start gap-2 text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">{t('pharmaceuticalForm')}:</span>
                            <span className="text-slate-700 dark:text-slate-300 text-right">{product.form}</span>
                        </div>
                    )}
                    
                    {/* Reason/Selling Point */}
                    <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            <span className="font-bold text-accent">💡 Note: </span>
                            {product.reason}
                        </p>
                    </div>
                </div>
            </div>
        );
      })}
    </div>
  );
};

export default ProductRecommendationsView;
