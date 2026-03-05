/**
 * dataSync.ts
 *
 * Flow:
 * 1. أول فتح   → يحمل JSON من Storage (9147 دواء) → يحفظ في Cache
 * 2. كل فتح    → من Cache فوراً + يسمع لـ medicine_overrides (live)
 * 3. كل 24 ساعة → 1 read من app_meta يتحقق لو في نسخة جديدة من Storage
 * 4. لما الأدمن يعدل → يحفظ في medicine_overrides فقط → المستخدمين يشوفوا فوراً
 */

import { doc, getDoc, setDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
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

export interface SyncResult {
  medicines:   any[];
  supplements: any[];
  food:        any[];
  source:      'cache' | 'storage' | 'empty';
  updated:     boolean;
}

// ── Storage URLs ──────────────────────────────────────────────────────────────
const BUCKET = 'medainew-fa6a2.firebasestorage.app';
const STORAGE_URLS = {
  medicines:   `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/data%2Fmedicines.json?alt=media`,
  supplements: `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/data%2Fsupplements.json?alt=media`,
  food:        `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/data%2Ffood.json?alt=media`,
};

// ── تحقق من الـ timestamp (1 read فقط) ───────────────────────────────────────
async function fetchRemoteMeta(): Promise<CacheMeta | null> {
  try {
    if (FIREBASE_DISABLED || !db) return null;
    const snap = await getDoc(doc(db, 'app_meta', 'data_versions'));
    return snap.exists() ? (snap.data() as CacheMeta) : null;
  } catch { return null; }
}

// ── حمّل JSON من Storage ──────────────────────────────────────────────────────
async function fetchFromStorage(url: string): Promise<any[]> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('[dataSync] Storage fetch failed:', url, e);
    return [];
  }
}

// ── تحقق من updates في الخلفية ───────────────────────────────────────────────
async function checkForUpdatesInBackground(
  localMeta: CacheMeta | null,
  cachedMeds: any[], cachedSups: any[], cachedFood: any[]
): Promise<void> {
  try {
    const remoteMeta = await fetchRemoteMeta();
    const now = Date.now();
    const local = localMeta || { medicines_ts: 0, supplements_ts: 0, food_ts: 0, last_checked: 0 };
    await setItem(CACHE_KEYS.meta, { ...local, last_checked: now });
    if (!remoteMeta) return;

    const needsMeds = remoteMeta.medicines_ts > local.medicines_ts;
    const needsSups = remoteMeta.supplements_ts > local.supplements_ts;
    const needsFood = remoteMeta.food_ts > local.food_ts;
    if (!needsMeds && !needsSups && !needsFood) return;

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

    window.dispatchEvent(new CustomEvent('pharma:storage-updated', {
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

// ── الـ function الرئيسية ─────────────────────────────────────────────────────
export async function syncData(): Promise<SyncResult> {
  // جيب الـ Cache
  const [cachedMeds, cachedSups, cachedFood, cachedMeta] = await Promise.all([
    getItem<any[]>(CACHE_KEYS.medicines),
    getItem<any[]>(CACHE_KEYS.supplements),
    getItem<any[]>(CACHE_KEYS.food),
    getItem<CacheMeta>(CACHE_KEYS.meta),
  ]);

  const hasCachedData = cachedMeds && cachedMeds.length > 0;
  console.log('[dataSync] Cache:', hasCachedData ? `✅ ${cachedMeds!.length} items` : '❌ empty');

  if (hasCachedData) {
    const now = Date.now();
    const lastChecked = cachedMeta?.last_checked ?? 0;
    const foodEmpty = !cachedFood || cachedFood.length === 0;
    // تحقق دايماً لو الـ food فاضي — مش بس كل 24 ساعة
    const shouldCheck = (now - lastChecked) > 24 * 60 * 60 * 1000 || foodEmpty;
    if (shouldCheck) {
      // لو food فاضي — حمّله مباشرة بدون مقارنة timestamp
      if (foodEmpty) {
        console.log('[dataSync] Food cache empty — fetching from Storage...');
        const newFood = await fetchFromStorage(STORAGE_URLS.food);
        console.log('[dataSync] Food loaded:', newFood.length, 'items');
        if (newFood.length > 0) {
          const remoteMeta = await fetchRemoteMeta();
          await setItem(CACHE_KEYS.food, newFood);
          await setItem(CACHE_KEYS.meta, {
            ...(cachedMeta || { medicines_ts: 0, supplements_ts: 0 }),
            food_ts: remoteMeta?.food_ts ?? Date.now(),
            last_checked: now,
          });
          return {
            medicines:   cachedMeds!,
            supplements: cachedSups || [],
            food:        newFood,
            source: 'cache',
            updated: true,
          };
        }
      } else {
        checkForUpdatesInBackground(cachedMeta, cachedMeds!, cachedSups!, cachedFood ?? []);
      }
    }
    return {
      medicines:   cachedMeds!,
      supplements: cachedSups || [],
      food:        cachedFood || [],
      source: 'cache',
      updated: false,
    };
  }

  // مفيش Cache — حمّل من Storage
  console.log('[dataSync] Loading from Storage...');
  const [meds, sups, food] = await Promise.all([
    fetchFromStorage(STORAGE_URLS.medicines),
    fetchFromStorage(STORAGE_URLS.supplements),
    fetchFromStorage(STORAGE_URLS.food),
  ]);

  console.log('[dataSync] Storage:', meds.length, 'medicines,', sups.length, 'supplements');

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

  return { medicines: [], supplements: [], food: [], source: 'empty', updated: false };
}

// ── اسمع لـ medicine_overrides live ──────────────────────────────────────────
// بيتنادى عند أول تحميل وكل ما يحصل تعديل
export function listenToOverrides(
  onUpdate: (overrides: Map<string, any>) => void
): () => void {
  if (FIREBASE_DISABLED || !db) return () => {};

  const unsub = onSnapshot(
    collection(db, 'medicine_overrides'),
    (snap) => {
      const overrides = new Map<string, any>();
      snap.docs.forEach(d => overrides.set(d.id, { ...d.data(), RegisterNumber: d.id }));
      console.log('[dataSync] Overrides:', overrides.size, 'items');
      onUpdate(overrides);
    },
    (err) => console.warn('[dataSync] Overrides listen failed:', err)
  );

  return unsub;
}

// ── حفظ تعديل دواء (أدمن فقط) ───────────────────────────────────────────────
export async function saveOverride(medicine: any): Promise<void> {
  if (FIREBASE_DISABLED || !db) throw new Error('Firebase disabled');
  if (!medicine.RegisterNumber) throw new Error('No RegisterNumber');
  await setDoc(
    doc(db, 'medicine_overrides', medicine.RegisterNumber),
    { ...medicine, _updatedAt: Date.now() },
    { merge: true }
  );
}

// ── تحديث timestamp بعد رفع Storage ──────────────────────────────────────────
export async function bumpDataVersion(collectionName: string): Promise<void> {
  if (FIREBASE_DISABLED || !db) return;
  try {
    await setDoc(
      doc(db, 'app_meta', 'data_versions'),
      { [`${collectionName}_ts`]: Date.now() },
      { merge: true }
    );
  } catch (e) {
    console.error('[dataSync] bumpDataVersion failed:', e);
  }
}

// ── مسح الـ Cache ─────────────────────────────────────────────────────────────
export async function clearDataCache(): Promise<void> {
  await Promise.all(Object.values(CACHE_KEYS).map(k => removeItem(k)));
}
