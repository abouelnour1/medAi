/**
 * dataSync.ts — Storage-First + Smart Cache
 *
 * Flow:
 * 1. أول فتح → يحمّل JSON من Firebase Storage (مرة واحدة لكل المستخدمين)
 * 2. الفتحات الجاية → من IndexedDB فوراً (zero reads)
 * 3. في الخلفية → يتحقق من app_meta/data_versions (read واحدة بس)
 *    لو في تحديث → يحمّل JSON جديد من Storage
 * 4. مفيش نت → يشتغل من Cache بالكامل
 *
 * النتيجة: بدل N_users × N_docs reads يومياً → N_users × 1 read كل تحديث
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, FIREBASE_DISABLED } from '../firebase';
import { setItem, getItem } from './storage';

// ── URLs ملفات الداتا على Firebase Storage ──────────────────────────────────
// بعد ما ترفع الملفات على Firebase Storage، حط الـ URLs هنا
const FIREBASE_PROJECT_ID = 'medainew-fa6a2';

const STORAGE_URLS = {
  medicines:   `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_PROJECT_ID}.firebasestorage.app/o/data%2Fmedicines.json?alt=media`,
  supplements: `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_PROJECT_ID}.firebasestorage.app/o/data%2Fsupplements.json?alt=media`,
  food:        `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_PROJECT_ID}.firebasestorage.app/o/data%2Ffood.json?alt=media`,
};

const CACHE_KEYS = {
  medicines:   'cache:medicines',
  supplements: 'cache:supplements',
  food:        'cache:food',
  meta:        'cache:meta',
};

interface CacheMeta {
  medicines_ts: number;
  supplements_ts: number;
  food_ts: number;
  // وقت آخر تحقق — عشان منضربش Firestore كل فتحة
  last_checked: number;
}

interface SyncResult {
  medicines: any[];
  supplements: any[];
  food: any[];
  source: 'cache' | 'storage' | 'empty';
  updated: boolean;
}

// كم ساعة نستنى قبل ما نتحقق من updates (6 ساعات)
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

// ── جيب الـ meta من Firestore (read واحدة بس) ────────────────────────────────
async function fetchRemoteMeta(): Promise<CacheMeta | null> {
  try {
    if (FIREBASE_DISABLED || !db) return null;
    const snap = await getDoc(doc(db, 'app_meta', 'data_versions'));
    if (!snap.exists()) return null;
    return snap.data() as CacheMeta;
  } catch { return null; }
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

// ── الـ function الرئيسية ─────────────────────────────────────────────────────
export async function syncData(onProgress?: (msg: string) => void): Promise<SyncResult> {
  const report = (msg: string) => onProgress?.(msg);

  // خطوة 1: حاول تحمّل من الـ Cache الأول
  const [cachedMeds, cachedSups, cachedFood, cachedMeta] = await Promise.all([
    getItem<any[]>(CACHE_KEYS.medicines),
    getItem<any[]>(CACHE_KEYS.supplements),
    getItem<any[]>(CACHE_KEYS.food),
    getItem<CacheMeta>(CACHE_KEYS.meta),
  ]);

  const hasCachedData = cachedMeds && cachedMeds.length > 0;

  // خطوة 2: لو عندنا Cache ارجع بيه فوراً
  if (hasCachedData) {
    report('cache');

    // تحقق في الخلفية — بس لو فات وقت كافي من آخر تحقق
    const now = Date.now();
    const lastChecked = cachedMeta?.last_checked ?? 0;
    const shouldCheck = (now - lastChecked) > CHECK_INTERVAL_MS;

    if (shouldCheck) {
      checkForUpdatesInBackground(cachedMeta, cachedMeds!, cachedSups!, cachedFood!);
    }

    return {
      medicines:   cachedMeds!,
      supplements: cachedSups || [],
      food:        cachedFood || [],
      source: 'cache',
      updated: false,
    };
  }

  // خطوة 3: مفيش Cache — حمّل من Firebase Storage
  report('storage');
  try {
    const [meds, sups, food] = await Promise.all([
      fetchFromStorage(STORAGE_URLS.medicines),
      fetchFromStorage(STORAGE_URLS.supplements),
      fetchFromStorage(STORAGE_URLS.food),
    ]);

    const now = Date.now();
    const meta: CacheMeta = {
      medicines_ts: now,
      supplements_ts: now,
      food_ts: now,
      last_checked: now,
    };

    await Promise.all([
      setItem(CACHE_KEYS.medicines, meds),
      setItem(CACHE_KEYS.supplements, sups),
      setItem(CACHE_KEYS.food, food),
      setItem(CACHE_KEYS.meta, meta),
    ]);

    return { medicines: meds, supplements: sups, food, source: 'storage', updated: true };
  } catch (e) {
    console.error('[dataSync] Storage fetch failed:', e);
    return { medicines: [], supplements: [], food: [], source: 'empty', updated: false };
  }
}

// ── تحقق من updates في الخلفية (read واحدة من Firestore) ─────────────────────
async function checkForUpdatesInBackground(
  localMeta: CacheMeta | null,
  cachedMeds: any[], cachedSups: any[], cachedFood: any[]
): Promise<void> {
  try {
    if (FIREBASE_DISABLED || !db) return;

    const remoteMeta = await fetchRemoteMeta();
    const now = Date.now();

    // حدّث وقت آخر تحقق حتى لو مفيش updates
    const local = localMeta || { medicines_ts: 0, supplements_ts: 0, food_ts: 0, last_checked: 0 };
    await setItem(CACHE_KEYS.meta, { ...local, last_checked: now });

    if (!remoteMeta) return;

    const needsMeds = remoteMeta.medicines_ts > local.medicines_ts;
    const needsSups = remoteMeta.supplements_ts > local.supplements_ts;
    const needsFood = remoteMeta.food_ts > local.food_ts;

    if (!needsMeds && !needsSups && !needsFood) return;

    // في تحديث — حمّل الملفات الجديدة من Storage
    const [meds, sups, food] = await Promise.all([
      needsMeds ? fetchFromStorage(STORAGE_URLS.medicines) : Promise.resolve(cachedMeds),
      needsSups ? fetchFromStorage(STORAGE_URLS.supplements) : Promise.resolve(cachedSups),
      needsFood ? fetchFromStorage(STORAGE_URLS.food) : Promise.resolve(cachedFood),
    ]);

    await Promise.all([
      needsMeds && setItem(CACHE_KEYS.medicines, meds),
      needsSups && setItem(CACHE_KEYS.supplements, sups),
      needsFood && setItem(CACHE_KEYS.food, food),
      setItem(CACHE_KEYS.meta, {
        medicines_ts: needsMeds ? remoteMeta.medicines_ts : local.medicines_ts,
        supplements_ts: needsSups ? remoteMeta.supplements_ts : local.supplements_ts,
        food_ts: needsFood ? remoteMeta.food_ts : local.food_ts,
        last_checked: now,
      }),
    ]);

    window.dispatchEvent(new CustomEvent('pharma:data-updated', {
      detail: { medicines: meds, supplements: sups, food }
    }));

    console.log('[dataSync] Background update applied ✅');
  } catch (e) {
    console.warn('[dataSync] Background check failed silently:', e);
  }
}

// ── الأدمن يحدّث الـ timestamp بعد أي تعديل ─────────────────────────────────
export async function bumpDataVersion(collection: 'medicines' | 'supplements' | 'food'): Promise<void> {
  try {
    if (FIREBASE_DISABLED || !db) return;
    const field = `${collection}_ts`;
    await setDoc(doc(db, 'app_meta', 'data_versions'), {
      [field]: Date.now()
    }, { merge: true });
    console.log(`[dataSync] Bumped ${field} ✅`);
  } catch (e) {
    console.warn('[dataSync] Failed to bump version:', e);
  }
}

// ── مسح الـ Cache (للأدمن أو عند الحاجة) ─────────────────────────────────────
export async function clearDataCache(): Promise<void> {
  await Promise.all([
    setItem(CACHE_KEYS.medicines, null),
    setItem(CACHE_KEYS.supplements, null),
    setItem(CACHE_KEYS.food, null),
    setItem(CACHE_KEYS.meta, null),
  ]);
}
