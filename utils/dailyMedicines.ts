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
  // Old fields (backward compat)
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
  pregnancyCategory?: string;
  pregnancyStatus?: string;
  lactationStatus?: string;
  g6pdRisk?: string;
  diabetesEffect?: string;
  hypertensionEffect?: string;
  // New fields from pregnancy/lactation file
  drugClass?: string;
  dosage?: string;
  maternalConsiderations?: string;
  fetalConsiderations?: string;
  breastfeedingSafety?: string;
  drugInteractionsText?: string;
  summaryNotes?: string;
  lactationCategory?: string;
  pregnancyCategoryInfo?: { label: string; color: string; bg: string; emoji: string };
  lactationCategoryInfo?: { label: string; color: string; bg: string; emoji: string };
  descriptionCodes?: string[];
  registerNumbers?: string[];
  mappedScientificName?: string; string;
}

const R2_CLINICAL_URL = 'https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/clinical_reference_full.json';
const CLINICAL_CACHE_KEY = 'easydrug_clinical_ref_v3';
const CLINICAL_CACHE_TS  = 'easydrug_clinical_ref_ts_v3';
const CLINICAL_TTL       = 7 * 24 * 60 * 60 * 1000;

let _clinicalRefMap: Record<string, ClinicalReference> | null = null;

async function getClinicalRefMap(): Promise<Record<string, ClinicalReference>> {
  if (_clinicalRefMap) return _clinicalRefMap;

  try {
    const cacheAge = Date.now() - parseInt(localStorage.getItem(CLINICAL_CACHE_TS) || '0');
    const cached   = localStorage.getItem(CLINICAL_CACHE_KEY);
    if (cached && cacheAge < CLINICAL_TTL) {
      _clinicalRefMap = JSON.parse(cached);
      return _clinicalRefMap!;
    }
    const res = await fetch(R2_CLINICAL_URL);
    if (res.ok) {
      const data = await res.json();
      _clinicalRefMap = data;
      _descCodeIndex = null;
      _regNumIndex = null;
      try {
        localStorage.setItem(CLINICAL_CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CLINICAL_CACHE_TS, String(Date.now()));
      } catch {}
    }
  } catch {}

  return _clinicalRefMap || {};
}

// ── Drug name normalization (same logic as ClinicalReferencePage) ────────────
const _SALT_RE = /\s+(hydrochloride|hcl|sodium|potassium|sulfate|sulphate|maleate|fumarate|tartrate|acetate|phosphate|citrate|gluconate|mesylate|besylate|oxalate|bromide|chloride|nitrate|succinate|valerate|propionate|dipropionate|butyrate|furoate|monohydrate|trihydrate|anhydrous|dihydrate|monosodium|disodium)\b/gi;

const _SYNONYMS: Record<string, string> = {
  'hyoscine': 'scopolamine',
  'salbutamol': 'albuterol',
  'paracetamol': 'acetaminophen',
  'acetaminophen': 'paracetamol',
  'albuterol': 'salbutamol',
  // miconazole → clotrimazole (same azole antifungal class, similar clinical data)
  'miconazole': 'clotrimazole',
};

function _normDrug(name: string): string {
  return name.toLowerCase().trim().replace(/-/g, '/').replace(_SALT_RE, '').replace(/\s+/g, ' ').trim();
}

function _drugKeys(raw: string): string[] {
  const norm = _normDrug(raw);
  const orig = raw.toLowerCase().trim();
  const firstWord = norm.split(/[\s\/,+]+/)[0];
  const parts = norm.split(/[\/,+]+/).map((p: string) => p.trim()).filter(Boolean);
  const candidates = [norm, orig, firstWord, ...parts].filter(Boolean);
  if (_SYNONYMS[norm]) candidates.push(_SYNONYMS[norm]);
  if (_SYNONYMS[firstWord]) candidates.push(_SYNONYMS[firstWord]);
  return [...new Set(candidates)];
}

// ── Lazy-built reverse indexes for descriptionCode and registerNumber ────────
let _descCodeIndex: Record<string, string> | null = null;  // descCode -> map key
let _regNumIndex: Record<string, string> | null = null;    // registerNumber -> map key

function _buildIndexes(map: Record<string, ClinicalReference>) {
  _descCodeIndex = {};
  _regNumIndex = {};
  for (const key of Object.keys(map)) {
    const entry = map[key] as any;
    if (Array.isArray(entry.descriptionCodes)) {
      for (const dc of entry.descriptionCodes) {
        _descCodeIndex![dc] = key;
        // Also index by the ATC-like prefix (first segment before '-')
        const prefix = dc.split('-')[0];
        if (prefix && !_descCodeIndex![prefix]) _descCodeIndex![prefix] = key;
      }
    }
    if (Array.isArray(entry.registerNumbers)) {
      for (const rn of entry.registerNumbers) {
        _regNumIndex![rn] = key;
      }
    }
  }
}

export async function getClinicalReference(
  scientificName: string,
  tradeName?: string,
  descriptionCode?: string,
  registerNumber?: string
): Promise<ClinicalReference | null> {
  const map = await getClinicalRefMap();
  if (!map || Object.keys(map).length === 0) return null;

  // Build indexes once per cache load
  if (!_descCodeIndex || !_regNumIndex) _buildIndexes(map);

  // 1. Lookup by registerNumber (most precise)
  if (registerNumber && _regNumIndex![registerNumber]) {
    const k = _regNumIndex![registerNumber];
    if (map[k]) return map[k];
  }

  // 2. Lookup by descriptionCode
  if (descriptionCode) {
    const hit = _descCodeIndex![descriptionCode] || _descCodeIndex![descriptionCode.split('-')[0]];
    if (hit && map[hit]) return map[hit];
  }

  // 3. Name-based lookup (existing logic)
  const mapKeys = Object.keys(map);
  const normMap: Record<string, string> = {};
  for (const k of mapKeys) normMap[k] = _normDrug(k);

  for (const raw of [scientificName, tradeName ?? ''].filter(Boolean)) {
    const candidates = _drugKeys(raw);

    for (const c of candidates) {
      if (map[c]) return map[c];
    }
    for (const c of candidates) {
      const found = mapKeys.find(k => normMap[k] === c);
      if (found) return map[found];
    }
    const firstWord = candidates[candidates.length - 1];
    if (firstWord && firstWord.length >= 4) {
      const found = mapKeys.find(k => {
        const nk = normMap[k];
        return nk.startsWith(firstWord) || firstWord.startsWith(nk.split(/[\s\/,+]+/)[0]);
      });
      if (found) return map[found];
    }
  }

  return null;
}


// ── Pregnant / Lactation Data (from R2) ─────────────────────────────────────
const R2_PREGNANT_URL = 'https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/pregnant_drugs.json';

let _pregRefMap: Record<string, any> | null = null;

async function getPregRefMap(): Promise<Record<string, any>> {
  if (_pregRefMap) return _pregRefMap;
  try {
    const res = await fetch(R2_PREGNANT_URL);
    if (res.ok) _pregRefMap = await res.json();
  } catch {}
  return _pregRefMap || {};
}

// Map FDA pregnancy category (A/B/C/D/X) → SafetyBadge value
function _pregCatToStatus(cat: string): string {
  const c = (cat || '').replace(/[^A-Za-z]/g, '').toUpperCase();
  if (c === 'A' || c === 'B') return 'Safe';
  if (c === 'C') return 'Caution';
  if (c === 'D') return 'Avoid';
  if (c === 'X') return 'X';
  return 'Unknown';
}

// Map lactation category (S/NS/NSC) → SafetyBadge value
function _lactCatToStatus(cat: string): string {
  const c = (cat || '').trim().toUpperCase();
  if (c === 'S') return 'Safe';
  if (c === 'NSC') return 'Caution';
  if (c === 'NS') return 'Avoid';
  return 'Unknown';
}

// Normalize drug name for matching (same logic as clinical ref)
function _normPregName(name: string): string {
  return name.toLowerCase().trim().replace(/\s*(hydrochloride|hcl|sodium|potassium|sulfate|sulphate)\b/gi, '').replace(/\s+/g, ' ').trim();
}

export interface PregReferenceData {
  pregnancyStatus: string;
  lactationStatus: string;
  pregnancyCategory: string;
  lactationCategory: string;
  maternalConsiderations: string;
  fetalConsiderations: string;
  breastfeedingSafety: string;
  dosage: string;
  summaryNotes: string;
  drugInteractions: string;
  drugClass: string;
  indications: string;
  mechanism: string;
}

export async function getPregReference(scientificName: string, tradeName?: string): Promise<PregReferenceData | null> {
  const map = await getPregRefMap();
  if (!map || Object.keys(map).length === 0) return null;

  const keys = Object.keys(map);
  const normMap: Record<string, string> = {};
  for (const k of keys) normMap[k] = _normPregName(k);

  const candidates: string[] = [];
  for (const raw of [scientificName, tradeName ?? ''].filter(Boolean)) {
    const n = _normPregName(raw);
    candidates.push(n, n.split(/[\s\/,+]+/)[0]);
  }

  let entry: any = null;
  for (const c of candidates) {
    if (map[c]) { entry = map[c]; break; }
    const found = keys.find(k => normMap[k] === c || normMap[k].startsWith(c) || c.startsWith(normMap[k].split(/[\s,]+/)[0]));
    if (found) { entry = map[found]; break; }
  }

  if (!entry) return null;

  return {
    pregnancyCategory:      entry.pregnancyCategory || '',
    lactationCategory:      entry.lactationCategory || '',
    pregnancyStatus:        _pregCatToStatus(entry.pregnancyCategory || ''),
    lactationStatus:        _lactCatToStatus(entry.lactationCategory || ''),
    maternalConsiderations: entry.maternalConsiderations || '',
    fetalConsiderations:    entry.fetalConsiderations || '',
    breastfeedingSafety:    entry.breastfeedingSafety || '',
    dosage:                 entry.dosage || '',
    summaryNotes:           entry.summaryNotes || '',
    drugInteractions:       entry.drugInteractions || '',
    drugClass:              entry.drugClass || '',
    indications:            entry.indications || '',
    mechanism:              entry.mechanism || '',
  };
}

// Pre-load in background
export function prefetchPregRef() {
  getPregRefMap().catch(() => {});
}

// Pre-load in background
export function prefetchClinicalRef() {
  getClinicalRefMap().catch(() => {});
}
