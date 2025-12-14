
import { MilkProduct } from '../types';

interface RawStandardMilk {
  "Brand": string;
  "Stage": string;
  "Age Range": string;
  "Key Features / Ingredients": string;
  "Key Differences": string;
}

/**
 * بيانات الحليب المخصصة.
 * يمكنك إضافة الحليب العادي في مصفوفة RAW_CUSTOM_STANDARD_MILK بالتنسيق الذي تفضله.
 */

// 1. ضع بيانات الحليب العادي هنا بنفس التنسيق الذي أرسلته
const RAW_CUSTOM_STANDARD_MILK: RawStandardMilk[] = [
    /* مثال:
    {
        "Brand": "Primalac 1",
        "Stage": "1",
        "Age Range": "0-6 Months",
        "Key Features / Ingredients": "Swiss quality, contains DHA & ARA.",
        "Key Differences": "High quality protein source."
    }
    */
];

// 2. إذا كان لديك حليب خاص (Special) ضعه هنا بتنسيق التطبيق الداخلي
const CUSTOM_SPECIAL_MILK: MilkProduct[] = [
    /*
    {
        id: "custom-special-1",
        name: "Novalac AC",
        type: "Special",
        specialType: "Comfort",
        indication: "Colic",
        features: "Low lactose",
        differences: "For colic"
    }
    */
];

// --- لا تقم بتعديل الكود في الأسفل (يقوم بالتحويل تلقائياً) ---

const normalizedCustomStandard: MilkProduct[] = RAW_CUSTOM_STANDARD_MILK.map((item, index) => ({
    id: `custom-std-${Date.now()}-${index}`,
    name: item.Brand || 'Unknown Brand',
    type: 'Standard',
    stage: item.Stage || '',
    ageRange: item["Age Range"] || '',
    features: item["Key Features / Ingredients"] || '',
    differences: item["Key Differences"] || ''
}));

export const CUSTOM_MILK_DATA: MilkProduct[] = [
    ...normalizedCustomStandard,
    ...CUSTOM_SPECIAL_MILK
];
