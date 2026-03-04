/**
 * dataSync.ts — Storage-First + Smart Cache
 *
 * Flow للمستخدم العادي:
 * 1. عنده Cache → يعرضه فوراً + يتحقق من timestamp في الخلفية (1 read)
 * 2. مفيش Cache → يحمّل من Storage (مرة واحدة فقط)
 *
 * Flow للأدمن:
 * 1. مفيش Cache → يحمّل من Storage أول (يوفر reads)
 * 2. بعدها → Firestore مباشرة (live دايماً)
 *
 * publish = يشغّل exportToStorage.mjs يدوياً → يرفع JSON جديد + يحدث timestamp
 * المستخدمين: عند كل فتح = 1 read من app_meta → لو timestamp اتغير → يحمل Storage
 */

import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db, FIREBASE_DISABLED } from '../firebase';
import { setItem, getItem } from './storage';

// ── Cache Keys ────────────────────────────────────────────────────────────────
const CACHE_KEYS = {
  medicines:   'pharma_medicines',
  supplements: 'pharma_supplements',
  food:        'pharma_food',
  meta:        'pharma_cache_meta',
};

interface CacheMeta {
  medicines_ts:   number;
  supplements_ts: number;
  food_ts:        number;
  last_checked:   number;
}

interface SyncResult {
  medicines:   any[];
  supplements: any[];
  food:        any[];
  source:      'cache' | 'storage' | 'firebase' | 'empty';
  updated:     boolean;
}

// ── Storage URLs ──────────────────────────────────────────────────────────────
const BUCKET = 'medainew-fa6a2.firebasestorage.app';
const STORAGE_URLS = {
  medicines:   `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/data%2Fmedicines.json?alt=media`,
  supplements: `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/data%2Fsupplements.json?alt=media`,
  food:        `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/data%2Ffood.json?alt=media`,
};

// ── جيب الـ timestamp من Firestore (1 read فقط) ───────────────────────────────
async function fetchRemoteMeta(): Promise<CacheMeta | null> {
  try {
    if (FIREBASE_DISABLED || !db) return null;
    const snap = await getDoc(doc(db, 'app_meta', 'data_versions'));
    return snap.exists() ? (snap.data() as CacheMeta) : null;
  } catch { return null; }
}

// ── جيب collection من Firestore (للأدمن فقط) ─────────────────────────────────
async function fetchCollection(name: string): Promise<any[]> {
  if (FIREBASE_DISABLED || !db) return [];
  try {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
  } catch (e) {
    console.warn(`[dataSync] Firestore fetch failed for ${name}:`, e);
    return [];
  }
}

// ── حمّل JSON من Firebase Storage ────────────────────────────────────────────
async function fetchFromStorage(url: string): Promise<any[]> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`[dataSync] Storage fetch failed: ${url}`, e);
    return [];
  }
}

// ── تحقق من updates في الخلفية (1 read فقط) ─────────────────────────────────
async function checkForUpdatesInBackground(
  localMeta: CacheMeta | null,
  cachedMeds: any[], cachedSups: any[], cachedFood: any[]
): Promise<void> {
  try {
    const remoteMeta = await fetchRemoteMeta();
    const now = Date.now();
    const local = localMeta || { medicines_ts: 0, supplements_ts: 0, food_ts: 0, last_checked: 0 };

    // حدّث وقت آخر تحقق
    await setItem(CACHE_KEYS.meta, { ...local, last_checked: now });

    if (!remoteMeta) return;

    const needsMeds = remoteMeta.medicines_ts > local.medicines_ts;
    const needsSups = remoteMeta.supplements_ts > local.supplements_ts;
    const needsFood = remoteMeta.food_ts > local.food_ts;

    if (!needsMeds && !needsSups && !needsFood) return;

    // في تحديث — حمّل من Storage
    const [newMeds, newSups, newFood] = await Promise.all([
      needsMeds ? fetchFromStorage(STORAGE_URLS.medicines) : Promise.resolve(cachedMeds),
      needsSups ? fetchFromStorage(STORAGE_URLS.supplements) : Promise.resolve(cachedSups),
      needsFood ? fetchFromStorage(STORAGE_URLS.food) : Promise.resolve(cachedFood),
    ]);

    await Promise.all([
      needsMeds && setItem(CACHE_KEYS.medicines, newMeds),
      needsSups && setItem(CACHE_KEYS.supplements, newSups),
      needsFood && setItem(CACHE_KEYS.food, newFood),
      setItem(CACHE_KEYS.meta, {
        medicines_ts:   needsMeds ? remoteMeta.medicines_ts   : local.medicines_ts,
        supplements_ts: needsSups ? remoteMeta.supplements_ts : local.supplements_ts,
        food_ts:        needsFood ? remoteMeta.food_ts        : local.food_ts,
        last_checked:   now,
      }),
    ]);

    // أبلغ الـ App إن في داتا جديدة
    window.dispatchEvent(new CustomEvent('pharma:data-updated', {
      detail: {
        medicines:   needsMeds ? newMeds : cachedMeds,
        supplements: needsSups ? newSups : cachedSups,
        food:        needsFood ? newFood : cachedFood,
      }
    }));
  } catch (e) {
    console.warn('[dataSync] Background check failed:', e);
  }
}

// ── الـ function الرئيسية للمستخدم العادي ────────────────────────────────────
export async function syncData(onProgress?: (msg: string) => void): Promise<SyncResult> {
  const report = (msg: string) => onProgress?.(msg);

  // خطوة 1: جيب الـ Cache
  const [cachedMeds, cachedSups, cachedFood, cachedMeta] = await Promise.all([
    getItem<any[]>(CACHE_KEYS.medicines),
    getItem<any[]>(CACHE_KEYS.supplements),
    getItem<any[]>(CACHE_KEYS.food),
    getItem<CacheMeta>(CACHE_KEYS.meta),
  ]);

  const hasCachedData = cachedMeds && cachedMeds.length > 0;

  // خطوة 2: لو عندنا Cache → اعرضه فوراً + تحقق في الخلفية
  if (hasCachedData) {
    report('cache');
    // تحقق من timestamp في الخلفية (1 read — مش blocking)
    checkForUpdatesInBackground(cachedMeta, cachedMeds!, cachedSups!, cachedFood!);
    return {
      medicines:   cachedMeds!,
      supplements: cachedSups || [],
      food:        cachedFood || [],
      source: 'cache',
      updated: false,
    };
  }

  // خطوة 3: مفيش Cache — حمّل من Storage
  report('storage');
  const [meds, sups, food] = await Promise.all([
    fetchFromStorage(STORAGE_URLS.medicines),
    fetchFromStorage(STORAGE_URLS.supplements),
    fetchFromStorage(STORAGE_URLS.food),
  ]);

  if (meds.length > 0) {
    const now = Date.now();
    await Promise.all([
      setItem(CACHE_KEYS.medicines, meds),
      setItem(CACHE_KEYS.supplements, sups),
      setItem(CACHE_KEYS.food, food),
      setItem(CACHE_KEYS.meta, { medicines_ts: now, supplements_ts: now, food_ts: now, last_checked: now }),
    ]);
    return { medicines: meds, supplements: sups, food, source: 'storage', updated: true };
  }

  // Storage فاضي — مشكلة في الـ rules أو الـ upload
  console.error('[dataSync] Storage is empty! Check Firebase Storage rules and make sure exportToStorage.mjs ran successfully.');
  return { medicines: [], supplements: [], food: [], source: 'empty', updated: false };
}

// ── الأدمن: Cache أول مرة ثم Firestore live ──────────────────────────────────
export async function syncDataForAdmin(): Promise<SyncResult> {
  // لو مفيش Cache → حمّل من Storage أول (توفير reads)
  const cached = await getItem<any[]>(CACHE_KEYS.medicines);
  if (!cached || cached.length === 0) {
    const [meds, sups, food] = await Promise.all([
      fetchFromStorage(STORAGE_URLS.medicines),
      fetchFromStorage(STORAGE_URLS.supplements),
      fetchFromStorage(STORAGE_URLS.food),
    ]);
    if (meds.length > 0) {
      const now = Date.now();
      await Promise.all([
        setItem(CACHE_KEYS.medicines, meds),
        setItem(CACHE_KEYS.supplements, sups),
        setItem(CACHE_KEYS.food, food),
        setItem(CACHE_KEYS.meta, { medicines_ts: now, supplements_ts: now, food_ts: now, last_checked: now }),
      ]);
    }
  }

  // الأدمن يشوف من Firestore مباشرة (live)
  const [fbMeds, fbSups, fbFood] = await Promise.all([
    fetchCollection('medicines'),
    fetchCollection('supplements'),
    fetchCollection('food'),
  ]);

  return {
    medicines:   fbMeds,
    supplements: fbSups,
    food:        fbFood,
    source:      'firebase',
    updated:     true,
  };
}

// ── تحديث timestamp بعد رفع الـ Storage ──────────────────────────────────────
export async function bumpDataVersion(collectionName: string): Promise<void> {
  if (FIREBASE_DISABLED || !db) return;
  try {
    const ref = doc(db, 'app_meta', 'data_versions');
    await setDoc(ref, { [`${collectionName}_ts`]: Date.now() }, { merge: true });
  } catch (e) {
    console.error('[dataSync] bumpDataVersion failed:', e);
  }
}

// ── مسح الـ Cache (للتطوير) ───────────────────────────────────────────────────
export async function clearDataCache(): Promise<void> {
  await Promise.all(Object.values(CACHE_KEYS).map(k => setItem(k, null)));
}
