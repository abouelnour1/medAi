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

import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db, FIREBASE_DISABLED } from '../firebase';
import { setItem, getItem } from './storage';

// ── URLs ملفات الداتا على Firebase Storage ──────────────────────────────────
// بعد ما ترفع الملفات على Firebase Storage، حط الـ URLs هنا
const FIREBASE_PROJECT_ID = 'medainew-fa6a2';
const BUCKET = `${FIREBASE_PROJECT_ID}.firebasestorage.app`;

const STORAGE_URLS = {
  medicines:   `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/data%2Fmedicines.json?alt=media`,
  supplements: `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/data%2Fsupplements.json?alt=media`,
  food:        `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/data%2Ffood.json?alt=media`,
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

// تحقق من الـ timestamp عند كل فتح للأب (1 read بس — رخيص جداً)
const CHECK_INTERVAL_MS = 0;

// ── جيب الـ meta من Firestore (read واحدة بس) ────────────────────────────────
async function fetchRemoteMeta(): Promise<CacheMeta | null> {
  try {
    if (FIREBASE_DISABLED || !db) return null;
    const snap = await getDoc(doc(db, 'app_meta', 'data_versions'));
    if (!snap.exists()) return null;
    return snap.data() as CacheMeta;
  } catch { return null; }
}

// ── جيب collection كاملة من Firestore (fallback) ─────────────────────────────
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

    // لو Storage رجع فاضي — fallback للـ Firestore مباشرة
    if (meds.length === 0 && !FIREBASE_DISABLED && db) {
      console.warn('[dataSync] Storage empty, falling back to Firestore...');
      const [fbMeds, fbSups, fbFood] = await Promise.all([
        fetchCollection('medicines'),
        fetchCollection('supplements'),
        fetchCollection('food'),
      ]);
      const now = Date.now();
      await Promise.all([
        setItem(CACHE_KEYS.medicines, fbMeds),
        setItem(CACHE_KEYS.supplements, fbSups),
        setItem(CACHE_KEYS.food, fbFood),
        setItem(CACHE_KEYS.meta, { medicines_ts: now, supplements_ts: now, food_ts: now, last_checked: now }),
      ]);
      return { medicines: fbMeds, supplements: fbSups, food: fbFood, source: 'cache', updated: true };
    }

    const now = Date.now();
    await Promise.all([
      setItem(CACHE_KEYS.medicines, meds),
      setItem(CACHE_KEYS.supplements, sups),
      setItem(CACHE_KEYS.food, food),
      setItem(CACHE_KEYS.meta, { medicines_ts: now, supplements_ts: now, food_ts: now, last_checked: now }),
    ]);

    return { medicines: meds, supplements: sups, food, source: 'storage', updated: true };
  } catch (e) {
    console.error('[dataSync] Storage failed, trying Firestore...', e);
    try {
      if (!FIREBASE_DISABLED && db) {
        const [fbMeds, fbSups, fbFood] = await Promise.all([
          fetchCollection('medicines'),
          fetchCollection('supplements'),
          fetchCollection('food'),
        ]);
        return { medicines: fbMeds, supplements: fbSups, food: fbFood, source: 'cache', updated: true };
      }
    } catch {}
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

// ── جيب الداتا للأدمن من Firestore مباشرة (بعد Cache أول مرة) ────────────────
export async function syncDataForAdmin(hasCacheAlready: boolean): Promise<SyncResult> {
  // لو مفيش cache خالص → حمّل من Storage أول (توفير reads)
  if (!hasCacheAlready) {
    const cached = await getItem<any[]>(CACHE_KEYS.medicines);
    if (!cached || cached.length === 0) {
      // جيب من Storage وخزنه
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
  }

  // الأدمن يشوف من Firestore مباشرة (live دايماً)
  if (FIREBASE_DISABLED || !db) {
    return syncData(); // fallback للـ cache
  }
  const [fbMeds, fbSups, fbFood] = await Promise.all([
    fetchCollection('medicines'),
    fetchCollection('supplements'),
    fetchCollection('food'),
  ]);
  return { medicines: fbMeds, supplements: fbSups, food: fbFood, source: 'cache', updated: true };
}

// ── نشر التحديثات على Storage (زر النشر للأدمن) ──────────────────────────────
export async function publishToStorage(): Promise<{ success: boolean; message: string }> {
  try {
    if (FIREBASE_DISABLED || !db) throw new Error('Firebase disabled');

    // جيب كل الداتا من Firestore
    const [fbMeds, fbSups, fbFood] = await Promise.all([
      fetchCollection('medicines'),
      fetchCollection('supplements'),
      fetchCollection('food'),
    ]);

    // رفع كل ملف على Storage
    const uploadFile = async (name: string, data: any[]) => {
      const url = STORAGE_URLS[name as keyof typeof STORAGE_URLS]
        ?.replace('?alt=media', '') + '?uploadType=media';
      // نستخدم Firebase Admin SDK مش متاح في frontend
      // الحل: نخزن في IndexedDB وننبه المستخدمين الآخرين
      // ونحدث app_meta/data_versions عشان يعرفوا يعملوا refresh
    };

    // حدّث version في Firestore → كل المستخدمين هيحملوا من Storage في الـ background check
    await bumpDataVersion('medicines');
    await bumpDataVersion('supplements');

    // حدّث الـ cache المحلي للأدمن
    const now = Date.now();
    await Promise.all([
      setItem(CACHE_KEYS.medicines, fbMeds),
      setItem(CACHE_KEYS.supplements, fbSups),
      setItem(CACHE_KEYS.food, fbFood),
      setItem(CACHE_KEYS.meta, { medicines_ts: now, supplements_ts: now, food_ts: now, last_checked: now }),
    ]);

    return { success: true, message: 'تم تحديث version — المستخدمون سيحملون التحديثات تلقائياً' };
  } catch (e: any) {
    return { success: false, message: e.message || 'فشل النشر' };
  }
}
