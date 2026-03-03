/**
 * dataSync.ts — Firebase-First + Offline Cache
 * 
 * Flow:
 * 1. أول فتح → جيب من Firebase → احفظ في IndexedDB
 * 2. الفتحات الجاية → افتح من Cache فوراً، تحقق من Firebase في الخلفية
 * 3. مفيش نت → اشتغل من Cache بالكامل
 */

import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, FIREBASE_DISABLED } from '../firebase';
import { setItem, getItem } from './storage';

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
}

interface SyncResult {
  medicines: any[];
  supplements: any[];
  food: any[];
  source: 'cache' | 'firebase' | 'local_fallback';
  updated: boolean;
}

async function fetchRemoteMeta(): Promise<CacheMeta | null> {
  try {
    if (FIREBASE_DISABLED || !db) return null;
    const metaDoc = await getDoc(doc(db, 'app_meta', 'data_versions'));
    if (!metaDoc.exists()) return null;
    return metaDoc.data() as CacheMeta;
  } catch { return null; }
}

async function fetchCollection(name: string): Promise<any[]> {
  if (FIREBASE_DISABLED || !db) return [];
  try {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
  } catch (e) {
    console.warn(`[dataSync] Failed to fetch ${name}:`, e);
    return [];
  }
}

async function saveToCache(key: string, data: any[]): Promise<void> {
  await setItem(key, data);
}

async function loadFromCache<T>(key: string): Promise<T[] | null> {
  return getItem<T[]>(key);
}

export async function syncData(onProgress?: (msg: string) => void): Promise<SyncResult> {
  const report = (msg: string) => onProgress && onProgress(msg);

  // خطوة 1: حاول تحمّل من الـ Cache الأول
  const [cachedMeds, cachedSups, cachedFood, cachedMeta] = await Promise.all([
    loadFromCache<any>(CACHE_KEYS.medicines),
    loadFromCache<any>(CACHE_KEYS.supplements),
    loadFromCache<any>(CACHE_KEYS.food),
    getItem<CacheMeta>(CACHE_KEYS.meta),
  ]);

  const hasCachedData = cachedMeds && cachedMeds.length > 0;

  // خطوة 2: لو عندنا Cache ارجع بيه فوراً
  if (hasCachedData) {
    report('cache');
    checkForUpdatesInBackground(cachedMeta, cachedMeds!, cachedSups!, cachedFood!);
    return {
      medicines: cachedMeds!,
      supplements: cachedSups || [],
      food: cachedFood || [],
      source: 'cache',
      updated: false,
    };
  }

  // خطوة 3: مفيش Cache — جيب من Firebase
  report('firebase');
  try {
    const [meds, sups, food] = await Promise.all([
      fetchCollection('medicines'),
      fetchCollection('supplements'),
      fetchCollection('food'),
    ]);

    const now = Date.now();
    await Promise.all([
      saveToCache(CACHE_KEYS.medicines, meds),
      saveToCache(CACHE_KEYS.supplements, sups),
      saveToCache(CACHE_KEYS.food, food),
      setItem(CACHE_KEYS.meta, { medicines_ts: now, supplements_ts: now, food_ts: now }),
    ]);

    return { medicines: meds, supplements: sups, food: food, source: 'firebase', updated: true };
  } catch (e) {
    console.error('[dataSync] Firebase fetch failed:', e);
    return { medicines: [], supplements: [], food: [], source: 'local_fallback', updated: false };
  }
}

async function checkForUpdatesInBackground(
  localMeta: CacheMeta | null,
  cachedMeds: any[], cachedSups: any[], cachedFood: any[]
): Promise<void> {
  try {
    if (FIREBASE_DISABLED || !db) return;
    const remoteMeta = await fetchRemoteMeta();
    if (!remoteMeta) return;

    const now = Date.now();
    const local = localMeta || { medicines_ts: 0, supplements_ts: 0, food_ts: 0 };

    const needsMeds = remoteMeta.medicines_ts > local.medicines_ts;
    const needsSups = remoteMeta.supplements_ts > local.supplements_ts;
    const needsFood = remoteMeta.food_ts > local.food_ts;

    if (!needsMeds && !needsSups && !needsFood) return;

    const [meds, sups, food] = await Promise.all([
      needsMeds ? fetchCollection('medicines') : Promise.resolve(cachedMeds),
      needsSups ? fetchCollection('supplements') : Promise.resolve(cachedSups),
      needsFood ? fetchCollection('food') : Promise.resolve(cachedFood),
    ]);

    await Promise.all([
      needsMeds && saveToCache(CACHE_KEYS.medicines, meds),
      needsSups && saveToCache(CACHE_KEYS.supplements, sups),
      needsFood && saveToCache(CACHE_KEYS.food, food),
      setItem(CACHE_KEYS.meta, {
        medicines_ts: needsMeds ? now : local.medicines_ts,
        supplements_ts: needsSups ? now : local.supplements_ts,
        food_ts: needsFood ? now : local.food_ts,
      }),
    ]);

    window.dispatchEvent(new CustomEvent('pharma:data-updated', {
      detail: { medicines: meds, supplements: sups, food }
    }));
  } catch (e) {
    console.warn('[dataSync] Background sync failed silently:', e);
  }
}

export async function clearDataCache(): Promise<void> {
  await Promise.all([
    setItem(CACHE_KEYS.medicines, null),
    setItem(CACHE_KEYS.supplements, null),
    setItem(CACHE_KEYS.food, null),
    setItem(CACHE_KEYS.meta, null),
  ]);
}
