/**
 * dataSync.ts
 *
 * Flow:
 * 1. أول فتح   → يحمل JSON من R2 → يحفظ في Cache
 * 2. كل فتح    → من Cache فوراً (مفيش network) + يسمع لـ medicine_overrides (live)
 * 3. كل 48 ساعة فقط → 1 read من app_meta يتحقق لو في نسخة جديدة
 * 4. لما الأدمن يعدل → يحفظ في medicine_overrides فقط → المستخدمين يشوفوا فوراً
 */

import { doc, getDoc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { db, FIREBASE_DISABLED } from '../firebase';
import { setItem, getItem, removeItem } from './storage';

// ── Constants ─────────────────────────────────────────────────────────────────
const CHECK_INTERVAL_MS = 48 * 60 * 60 * 1000; // 48 ساعة
const FOOD_RETRY_MS     = 30 * 60 * 1000;       // 30 دقيقة — مش 10

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
  food_last_attempt?: number;
}

export interface SyncResult {
  medicines:   any[];
  supplements: any[];
  food:        any[];
  source:      'cache' | 'storage' | 'empty';
  updated:     boolean;
}

// ── R2 URLs ───────────────────────────────────────────────────────────────────
const R2_BASE = 'https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev';
const STORAGE_URLS = {
  medicines:   `${R2_BASE}/medicines.json`,
  supplements: `${R2_BASE}/supplements.json`,
  food:        `${R2_BASE}/food.json`,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fetchRemoteMeta(): Promise<CacheMeta | null> {
  try {
    if (FIREBASE_DISABLED || !db) return null;
    const snap = await getDoc(doc(db, 'app_meta', 'data_versions'));
    return snap.exists() ? (snap.data() as CacheMeta) : null;
  } catch { return null; }
}

async function fetchJSON(url: string): Promise<any[]> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // بعض الملفات فيها escape sequences غلط — نحاول نصلحها
    try {
      return await res.json();
    } catch {
      const text = await res.clone().text();
      const fixed = fixInvalidEscapes(text);
      return JSON.parse(fixed);
    }
  } catch (e) {
    console.warn('[dataSync] fetch failed:', url, e);
    return [];
  }
}

function fixInvalidEscapes(s: string): string {
  const result: string[] = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] === '\\' && i + 1 < s.length) {
      const next = s[i + 1];
      if ('"\\\/bfnrt'.includes(next)) {
        result.push(s[i], s[i + 1]);
        i += 2;
      } else if (next === 'u' && i + 5 < s.length) {
        result.push(s.substring(i, i + 6));
        i += 6;
      } else {
        // invalid escape — skip backslash
        i++;
      }
    } else {
      result.push(s[i]);
      i++;
    }
  }
  return result.join('');
}

// ── Background update check (runs silently, NO reload unless data changed) ───
async function checkForUpdatesInBackground(
  localMeta: CacheMeta,
  cachedMeds: any[], cachedSups: any[], cachedFood: any[]
): Promise<void> {
  try {
    const remoteMeta = await fetchRemoteMeta();
    const now = Date.now();

    // حدّث last_checked بغض النظر عن النتيجة
    await setItem(CACHE_KEYS.meta, { ...localMeta, last_checked: now });

    if (!remoteMeta) return; // Firebase مش متاح — مش مشكلة

    const needsMeds = remoteMeta.medicines_ts > (localMeta.medicines_ts ?? 0);
    const needsSups = remoteMeta.supplements_ts > (localMeta.supplements_ts ?? 0);
    const needsFood = remoteMeta.food_ts > (localMeta.food_ts ?? 0);

    if (!needsMeds && !needsSups && !needsFood) {
      console.log('[dataSync] ✅ Data is up to date, no download needed');
      return;
    }

    console.log('[dataSync] 🔄 New data detected, downloading...');
    const [newMeds, newSups, newFood] = await Promise.all([
      needsMeds ? fetchJSON(STORAGE_URLS.medicines)   : Promise.resolve(cachedMeds),
      needsSups ? fetchJSON(STORAGE_URLS.supplements) : Promise.resolve(cachedSups),
      needsFood ? fetchJSON(STORAGE_URLS.food)        : Promise.resolve(cachedFood),
    ]);

    await Promise.all([
      needsMeds && newMeds.length > 0 && setItem(CACHE_KEYS.medicines, newMeds),
      needsSups && newSups.length > 0 && setItem(CACHE_KEYS.supplements, newSups),
      needsFood && newFood.length > 0 && setItem(CACHE_KEYS.food, newFood),
      setItem(CACHE_KEYS.meta, {
        medicines_ts:   needsMeds && newMeds.length > 0 ? remoteMeta.medicines_ts   : localMeta.medicines_ts,
        supplements_ts: needsSups && newSups.length > 0 ? remoteMeta.supplements_ts : localMeta.supplements_ts,
        food_ts:        needsFood && newFood.length > 0 ? remoteMeta.food_ts        : localMeta.food_ts,
        last_checked:   now,
      }),
    ]);

    // بلّغ الـ App بالتحديث — بس لو في جديد فعلاً
    window.dispatchEvent(new CustomEvent('pharma:storage-updated', {
      detail: {
        medicines:   needsMeds && newMeds.length > 0 ? newMeds : cachedMeds,
        supplements: needsSups && newSups.length > 0 ? newSups : cachedSups,
        food:        needsFood && newFood.length > 0 ? newFood : cachedFood,
      }
    }));
  } catch (e) {
    console.warn('[dataSync] Background check failed:', e);
  }
}

// ── Main sync function ────────────────────────────────────────────────────────
export async function syncData(): Promise<SyncResult> {
  const [cachedMeds, cachedSups, cachedFood, cachedMeta] = await Promise.all([
    getItem<any[]>(CACHE_KEYS.medicines),
    getItem<any[]>(CACHE_KEYS.supplements),
    getItem<any[]>(CACHE_KEYS.food),
    getItem<CacheMeta>(CACHE_KEYS.meta),
  ]);

  const hasMeds = cachedMeds && cachedMeds.length > 0;
  const hasSups = cachedSups && cachedSups.length > 0;
  const hasFood = cachedFood && cachedFood.length > 0;

  // ── كيس 1: مفيش cache خالص ────────────────────────────────────────────────
  if (!hasMeds) {
    // لو مفيش نت = مستحيل نجيب داتا — return empty فوراً، App هيعرض "need internet"
    if (!navigator.onLine) {
      console.log('[dataSync] ❌ No cache + offline — cannot load data');
      return { medicines: [], supplements: [], food: [], source: 'empty', updated: false };
    }

    console.log('[dataSync] 🚀 First launch — fetching all data from R2...');
    const [meds, sups, food] = await Promise.all([
      fetchJSON(STORAGE_URLS.medicines),
      fetchJSON(STORAGE_URLS.supplements),
      fetchJSON(STORAGE_URLS.food),
    ]);

    if (meds.length > 0) {
      const now = Date.now();
      await Promise.all([
        setItem(CACHE_KEYS.medicines,   meds),
        setItem(CACHE_KEYS.supplements, sups),
        setItem(CACHE_KEYS.food,        food),
        setItem(CACHE_KEYS.meta, {
          medicines_ts: now, supplements_ts: now, food_ts: now, last_checked: now
        }),
      ]);
      console.log('[dataSync] ✅ First load done:', meds.length, 'medicines');
      return { medicines: meds, supplements: sups, food, source: 'storage', updated: true };
    }

    return { medicines: [], supplements: [], food: [], source: 'empty', updated: false };
  }

  // ── كيس 2: Cache موجود — return فوراً + load food لو ناقص ────────────────
  // food فاضي؟ — حاول مرة بس كل 30 دقيقة
  if (!hasFood) {
    const lastAttempt = cachedMeta?.food_last_attempt ?? 0;
    if (Date.now() - lastAttempt > FOOD_RETRY_MS) {
      console.log('[dataSync] 🍎 Food missing — fetching...');
      await setItem(CACHE_KEYS.meta, { ...(cachedMeta ?? {}), food_last_attempt: Date.now() });
      fetchJSON(STORAGE_URLS.food).then(async (newFood) => {
        if (newFood.length > 0) {
          await setItem(CACHE_KEYS.food, newFood);
          window.dispatchEvent(new CustomEvent('pharma:storage-updated', {
            detail: { medicines: cachedMeds!, supplements: cachedSups || [], food: newFood }
          }));
        }
      });
    }
  }

  // ── كيس 3: هل مضى 48 ساعة على آخر check؟ ────────────────────────────────
  const lastChecked = cachedMeta?.last_checked ?? 0;
  const hoursSinceCheck = (Date.now() - lastChecked) / (1000 * 60 * 60);

  if ((Date.now() - lastChecked) > CHECK_INTERVAL_MS) {
    console.log(`[dataSync] ⏰ ${hoursSinceCheck.toFixed(0)}h since last check — checking for updates...`);
    // في الخلفية — مش بيحجب الـ UI
    checkForUpdatesInBackground(
      cachedMeta ?? { medicines_ts: 0, supplements_ts: 0, food_ts: 0, last_checked: 0 },
      cachedMeds!, cachedSups || [], cachedFood || []
    );
  } else {
    console.log(`[dataSync] 💾 From cache — next check in ${(48 - hoursSinceCheck).toFixed(0)}h`);
  }

  // Return cache فوراً دايماً
  return {
    medicines:   cachedMeds!,
    supplements: cachedSups || [],
    food:        cachedFood || [],
    source:      'cache',
    updated:     false,
  };
}

// ── Live overrides listener ───────────────────────────────────────────────────
export function listenToOverrides(
  onUpdate: (overrides: Map<string, any>) => void
): () => void {
  if (FIREBASE_DISABLED || !db) return () => {};

  // hash من آخر snapshot — نتجاهل reconnect snapshots بدون تغيير حقيقي
  let lastHash = '';
  let isFirstSnapshot = true;

  const buildHash = (snap: any): string =>
    snap.docs
      .map((d: any) => `${d.id}:${d.data()._updatedAt ?? d.data()['Last Update'] ?? ''}`)
      .sort()
      .join('|');

  const unsub = onSnapshot(
    collection(db, 'medicine_overrides'),
    { includeMetadataChanges: false }, // تجاهل metadata-only changes (reconnect)
    (snap) => {
      // تجاهل لو مفيش docs أصلاً
      if (snap.empty && isFirstSnapshot) {
        isFirstSnapshot = false;
        return;
      }

      const newHash = buildHash(snap);

      // الـ snapshot الأول — نطبّق دايماً (بيانات أولية)
      if (isFirstSnapshot) {
        isFirstSnapshot = false;
        lastHash = newHash;
        const overrides = new Map<string, any>();
        snap.docs.forEach((d: any) => overrides.set(d.id, { ...d.data(), RegisterNumber: d.id }));
        if (overrides.size > 0) {
          console.log('[dataSync] ✅ Initial overrides:', overrides.size, 'items');
          onUpdate(overrides);
        }
        return;
      }

      // Snapshots بعد كده — نتحقق من تغيير حقيقي
      if (newHash === lastHash) {
        console.log('[dataSync] Overrides: reconnect snapshot, no real change — skipped');
        return;
      }

      // في تغيير فعلي — تحقق إن في docs اتغيرت فعلاً مش بس reconnect
      const hasRealChange = snap.docChanges().some(
        change => change.type === 'added' || change.type === 'modified' || change.type === 'removed'
      );
      if (!hasRealChange) return;

      lastHash = newHash;
      const overrides = new Map<string, any>();
      snap.docs.forEach((d: any) => overrides.set(d.id, { ...d.data(), RegisterNumber: d.id }));
      console.log('[dataSync] ✅ Real override change detected:', overrides.size, 'items');
      onUpdate(overrides);
    },
    (err) => console.warn('[dataSync] Overrides listen failed:', err)
  );

  return unsub;
}

// ── Admin: save override ──────────────────────────────────────────────────────
export async function saveOverride(medicine: any): Promise<void> {
  if (FIREBASE_DISABLED || !db) throw new Error('Firebase disabled');
  if (!medicine.RegisterNumber) throw new Error('No RegisterNumber');
  await setDoc(
    doc(db, 'medicine_overrides', medicine.RegisterNumber),
    { ...medicine, _updatedAt: Date.now() },
    { merge: true }
  );
}

// ── Admin: bump version after uploading new data ──────────────────────────────
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

// ── Clear cache (for debugging / admin) ──────────────────────────────────────
export async function clearDataCache(): Promise<void> {
  await Promise.all(Object.values(CACHE_KEYS).map(k => removeItem(k)));
}
