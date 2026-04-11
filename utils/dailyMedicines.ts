/**
 * Daily Featured Medicines - تلت أدوية يومياً مع AI clinical data
 * البيانات تتحفظ في Firestore وتتولد مرة واحدة في اليوم
 */

import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

const LOCAL_CACHE_KEY = 'pharma_daily_featured_v2';

interface LocalCache {
  data: DailyFeatured;
  savedAt: number; // timestamp ms
}

// حفظ في localStorage
function saveLocalCache(data: DailyFeatured): void {
  try {
    const cache: LocalCache = { data, savedAt: Date.now() };
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

// جيب من localStorage لو مش فات ٢٤ ساعة
function getLocalCache(): DailyFeatured | null {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!raw) return null;
    const cache: LocalCache = JSON.parse(raw);
    const age = Date.now() - cache.savedAt;
    const today = new Date().toISOString().split('T')[0];
    // صالح لو: نفس اليوم + مش فات ٢٤ ساعة
    if (cache.data.date === today && age < 24 * 60 * 60 * 1000) {
      return cache.data;
    }
    return null;
  } catch { return null; }
}

// امسح الـ cache (لما الأدمن يغير الجدول)
export function clearLocalCache(): void {
  try { localStorage.removeItem(LOCAL_CACHE_KEY); } catch {}
}

export interface ClinicalData {
  indication: string;           // يستخدم لـ
  dosage: string;               // الجرعة
  sideEffects: string;          // الآثار الجانبية
  pharmacistNote: string;       // تنبيه الصيدلاني
  mechanism?: string;           // آلية العمل (اختياري)
  keyPoints?: string;           // نقاط البيع المميزة (اختياري)
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

// جيب وحفظ إعداد عدد أدوية اليوم
export async function getDailyMedicineCount(): Promise<number> {
  try {
    const ref = doc(db, 'settings', 'dailyFeatured');
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data().medicineCount || 3;
    return 3;
  } catch { return 3; }
}

export async function saveDailyMedicineCount(count: number): Promise<void> {
  try {
    const ref = doc(db, 'settings', 'dailyFeatured');
    await setDoc(ref, { medicineCount: count }, { merge: true });
  } catch (e: any) {
    console.error('❌ Save medicine count error:', e?.code, e?.message);
    throw e;
  }
}

// جيب تاريخ اليوم
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

// اجلب البيانات اليومية - localStorage أولاً، بعدين Firestore
export async function getDailyFeatured(): Promise<DailyFeatured | null> {
  // أولاً: جرب الـ local cache
  const local = getLocalCache();
  if (local) return local;
  // تانياً: Firestore
  try {
    const today = getTodayKey();
    const ref = doc(db, 'dailyFeatured', today);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as DailyFeatured;
      saveLocalCache(data); // احفظ locally عشان المرة الجاية
      return data;
    }
    return null;
  } catch { return null; }
}

// احفظ البيانات اليومية في Firestore
export async function saveDailyFeatured(data: DailyFeatured): Promise<boolean> {
  try {
    const ref = doc(db, 'dailyFeatured', data.date);
    await setDoc(ref, data);
    saveLocalCache(data); // حفظ محلي كمان
    console.log('✅ Daily featured saved for:', data.date);
    return true;
  } catch (e: any) { 
    console.error('❌ Save daily featured error:', e?.code, e?.message);
    throw e;
  }
}

// احفظ الـ Clinical Data لدواء معين
export async function saveClinicalData(
  registerNumber: string,
  data: ClinicalData,
  siblingRegisterNumbers?: string[]  // أرقام تسجيل الأدوية بنفس المادة الفعالة
): Promise<{ success: boolean; sharedCount: number }> {
  const ref = doc(db, 'clinicalData', registerNumber);
  await setDoc(ref, { ...data, updatedAt: new Date().toISOString() }, { merge: true });

  // حفظ على الأدوية بنفس المادة الفعالة (ماعدا keyPoints)
  const sharedData = { ...data, keyPoints: '', updatedAt: new Date().toISOString() };
  let siblingsToSave = siblingRegisterNumbers || [];

  // Fallback: لو مش موجودين، نجيبهم بـ Scientific Name من Firestore
  if (siblingsToSave.length === 0 && data.indication) {
    try {
      const medRef = doc(db, 'medicines', registerNumber);
      const medSnap = await getDoc(medRef);
      if (medSnap.exists()) {
        const medData = medSnap.data();
        const sciName = medData?.['Scientific Name']?.trim();
        if (sciName && sciName.toLowerCase() !== 'n/a' && sciName !== '') {
          // نجيب كل الأدوية بنفس المادة الفعالة (مش بس نفس القوة)
          // عشان المريض ممكن يكون عنده نفس الدواء بقوة مختلفة
          const siblingsSnap = await getDocs(
            query(collection(db, 'medicines'), where('Scientific Name', '==', sciName))
          );
          siblingsToSave = siblingsSnap.docs
            .map(d => d.id)
            .filter(id => id !== registerNumber);
        }
      }
    } catch { /* Firestore fallback failed silently */ }
  }

  let sharedCount = 0;
  if (siblingsToSave.length > 0) {
    const results = await Promise.allSettled(
      siblingsToSave.map(rn => setDoc(doc(db, 'clinicalData', rn), sharedData, { merge: true }))
    );
    sharedCount = results.filter(r => r.status === 'fulfilled').length;
  }

  return { success: true, sharedCount };
}

// جيب الـ Clinical Data المحفوظة لدواء
// ── In-memory cache — يمنع Firestore call لكل فتح ──────────────────────────
const _clinicalCache = new Map<string, ClinicalData | null>();

export async function getClinicalData(registerNumber: string): Promise<ClinicalData | null> {
  // لو موجود في الـ cache — ارجع فوراً بدون network
  if (_clinicalCache.has(registerNumber)) return _clinicalCache.get(registerNumber) ?? null;
  try {
    const ref  = doc(db, 'clinicalData', registerNumber);
    const snap = await getDoc(ref);
    const data = snap.exists() ? (snap.data() as ClinicalData) : null;
    _clinicalCache.set(registerNumber, data);
    return data;
  } catch {
    _clinicalCache.set(registerNumber, null); // cache الـ miss عشان منعيدش المحاولة
    return null;
  }
}

// ── Clinical Reference Data (from R2) ────────────────────────────────────────
export interface ClinicalReference {
  scientificName: string;
  drugName: string;
  source: string;
  indications: string;
  mechanism: string;
  adultDose: string;
  pediatricDose: string;
  contraindications: string;
  interactions: string;
  pregnancy: string;
  lactation: string;
  renalDosing: string;
  hepaticDosing: string;
  g6pd: string;
  // Full (untruncated) text versions — populated from Full Text sheet
  indications_full?: string;
  mechanism_full?: string;
  adultDose_full?: string;
  pediatricDose_full?: string;
  contraindications_full?: string;
  interactions_full?: string;
  pregnancy_full?: string;
  lactation_full?: string;
  renalDosing_full?: string;
  hepaticDosing_full?: string;
  g6pd_full?: string;
}

const R2_CLINICAL_URL = 'https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/clinical_reference_full.json';
const CLINICAL_CACHE_KEY = 'easydrug_clinical_ref_v2';
const CLINICAL_CACHE_TS  = 'easydrug_clinical_ref_ts';
const CLINICAL_TTL       = 7 * 24 * 60 * 60 * 1000; // أسبوع

let _clinicalRefMap: Record<string, ClinicalReference> | null = null;

async function getClinicalRefMap(): Promise<Record<string, ClinicalReference>> {
  if (_clinicalRefMap) return _clinicalRefMap;
  try {
    // محاول تحمل من localStorage
    const cacheAge = Date.now() - parseInt(localStorage.getItem(CLINICAL_CACHE_TS) || '0');
    const cached   = localStorage.getItem(CLINICAL_CACHE_KEY);
    if (cached && cacheAge < CLINICAL_TTL) {
      _clinicalRefMap = JSON.parse(cached);
      return _clinicalRefMap!;
    }
    // جيب من R2
    const res = await fetch(R2_CLINICAL_URL);
    if (res.ok) {
      const data = await res.json();
      _clinicalRefMap = data;
      try {
        localStorage.setItem(CLINICAL_CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CLINICAL_CACHE_TS, String(Date.now()));
      } catch {}
      return _clinicalRefMap!;
    }
  } catch {}
  return {};
}

// Normalize new JSON format (with _summary/_full) into ClinicalReference shape
function normalizeRef(raw: any): ClinicalReference {
  const FIELDS = ['indications','mechanism','adultDose','pediatricDose','contraindications','interactions','pregnancy','lactation','renalDosing','hepaticDosing','g6pd'] as const;
  const out: any = {
    scientificName: raw.drugName || '',
    drugName: raw.drugName || '',
    source: raw.source || '',
  };
  for (const f of FIELDS) {
    // Support both old format (plain field) and new format (_summary/_full)
    out[f] = raw[`${f}_summary`] ?? raw[f] ?? '';
    out[`${f}_full`] = raw[`${f}_full`] ?? raw[f] ?? '';
  }
  return out as ClinicalReference;
}

export async function getClinicalReference(scientificName: string): Promise<ClinicalReference | null> {
  const map = await getClinicalRefMap();
  if (!map || Object.keys(map).length === 0) return null;
  const key = scientificName.toLowerCase().trim();
  // بحث مباشر
  if (map[key]) return normalizeRef(map[key]);
  // بحث بالكلمة الأولى (مثلاً "amoxicillin" من "amoxicillin/clavulanic acid")
  const first = key.split(/[\/\s,+]+/)[0];
  if (first && map[first]) return normalizeRef(map[first]);
  // بحث جزئي
  const found = Object.keys(map).find(k => k.includes(first) || first.includes(k));
  return found ? normalizeRef(map[found]) : null;
}

// Pre-load in background
export function prefetchClinicalRef() {
  getClinicalRefMap().catch(() => {});
}
