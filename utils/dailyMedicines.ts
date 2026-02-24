/**
 * Daily Featured Medicines - تلت أدوية يومياً مع AI clinical data
 * البيانات تتحفظ في Firestore وتتولد مرة واحدة في اليوم
 */

import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface ClinicalData {
  indication: string;           // يستخدم لـ
  dosage: string;               // الجرعة
  sideEffects: string;          // الآثار الجانبية
  pharmacistNote: string;       // تنبيه الصيدلاني
  mechanism?: string;           // آلية العمل (اختياري)
  generatedAt: string;          // وقت التوليد
  language: 'ar' | 'en';
}

export interface FeaturedMedicine {
  tradeName: string;
  scientificName: string;
  price: string;
  form: string;
  legalStatus: string;
  imgBox?: string;
  isSponsored: boolean;
  clinicalData?: ClinicalData;
  registerNumber: string;
}

export interface DailyFeatured {
  date: string;           // YYYY-MM-DD
  medicines: FeaturedMedicine[];
  generatedAt: string;
}

// جيب تاريخ اليوم
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

// اجلب البيانات اليومية من Firestore
export async function getDailyFeatured(): Promise<DailyFeatured | null> {
  try {
    const today = getTodayKey();
    const ref = doc(db, 'dailyFeatured', today);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as DailyFeatured;
    return null;
  } catch { return null; }
}

// احفظ البيانات اليومية في Firestore
export async function saveDailyFeatured(data: DailyFeatured): Promise<void> {
  try {
    const ref = doc(db, 'dailyFeatured', data.date);
    await setDoc(ref, data);
  } catch (e) { console.error('Save daily featured error:', e); }
}

// احفظ الـ Clinical Data لدواء معين
export async function saveClinicalData(
  registerNumber: string, 
  data: ClinicalData
): Promise<void> {
  try {
    const ref = doc(db, 'clinicalData', registerNumber);
    await setDoc(ref, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) { console.error('Save clinical data error:', e); }
}

// جيب الـ Clinical Data المحفوظة لدواء
export async function getClinicalData(registerNumber: string): Promise<ClinicalData | null> {
  try {
    const ref = doc(db, 'clinicalData', registerNumber);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as ClinicalData;
    return null;
  } catch { return null; }
}
