
import { MilkProduct } from '../types';

/**
 * بيانات الحليب المخصصة.
 * Custom Milk Data. 
 * Add items here using the new Unified structure.
 */

// Example:
// {
//   "brand": "Primalac",
//   "productName": "Primalac Premium 1",
//   "stageType": "Stage 1",
//   "ageRange": "0-6 Months",
//   "kcal": 66,
//   "protein": 1.3,
//   "fat": 3.5,
//   "carb": 7.4,
//   "keyFeatures": "Prebiotics",
//   "usp": "Quality formula from Switzerland"
// }

const RAW_CUSTOM_MILK: any[] = [];

export const CUSTOM_MILK_DATA: MilkProduct[] = RAW_CUSTOM_MILK.map((item, index) => ({
    id: `custom-milk-${Date.now()}-${index}`,
    brand: item.brand || 'Unknown',
    productName: item.productName || 'Unknown Product',
    stageType: item.stageType || '',
    ageRange: item.ageRange || '',
    kcal: parseFloat(item.kcal) || 0,
    protein: parseFloat(item.protein) || 0,
    fat: parseFloat(item.fat) || 0,
    carb: parseFloat(item.carb) || 0,
    keyFeatures: item.keyFeatures || '',
    usp: item.usp || ''
}));
