/**
 * exportToStorage.mjs
 *
 * بيعمل:
 * 1. يجيب الداتا من Storage (medicines.json)
 * 2. يجيب التعديلات من medicine_overrides في Firestore
 * 3. يدمجهم مع بعض
 * 4. يرفع JSON جديد كامل على Storage
 * 5. يمسح medicine_overrides (اختياري — بتختار في السؤال)
 * 6. يحدث app_meta/data_versions timestamp
 *
 * node scripts/exportToStorage.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Init Firebase Admin ───────────────────────────────────────────────────────
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../serviceAccountKey.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
});

const db      = getFirestore();
const bucket  = getStorage().bucket();
const BUCKET_NAME = `${serviceAccount.project_id}.firebasestorage.app`;

// ── سؤال في الـ terminal ──────────────────────────────────────────────────────
function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim().toLowerCase()); }));
}

// ── جيب JSON من Storage ───────────────────────────────────────────────────────
async function fetchFromStorage(filename) {
  try {
    const url = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/data%2F${filename}?alt=media`;
    const res  = await fetch(url);
    if (!res.ok) { console.log(`   ⚠️  Storage file not found: ${filename}`); return []; }
    return await res.json();
  } catch (e) {
    console.log(`   ⚠️  Could not fetch ${filename}:`, e.message);
    return [];
  }
}

// ── جيب overrides من Firestore ───────────────────────────────────────────────
async function fetchOverrides() {
  try {
    const snap = await db.collection('medicine_overrides').get();
    const map  = new Map();
    snap.docs.forEach(d => map.set(d.id, { ...d.data(), RegisterNumber: d.id }));
    console.log(`   ✅ ${map.size} overrides found`);
    return map;
  } catch (e) {
    console.log(`   ⚠️  Could not fetch overrides:`, e.message);
    return new Map();
  }
}

// ── ارفع JSON على Storage ─────────────────────────────────────────────────────
async function uploadJSON(filename, data) {
  const file = bucket.file(`data/${filename}`);
  await file.save(JSON.stringify(data), {
    metadata: { contentType: 'application/json', cacheControl: 'public, max-age=3600' },
  });
  await file.makePublic();
  console.log(`   ☁️  Uploaded: https://storage.googleapis.com/${bucket.name}/data/${filename}`);
}

// ── مسح medicine_overrides ────────────────────────────────────────────────────
async function clearOverrides() {
  const snap  = await db.collection('medicine_overrides').get();
  const batch = db.batch();
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  console.log(`   🗑️  Cleared ${snap.size} overrides from Firestore`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Export + Merge to Firebase Storage\n');

  // خطوة 1: جيب الـ overrides
  console.log('📥 Fetching medicine_overrides from Firestore...');
  const overrides = await fetchOverrides();

  if (overrides.size === 0) {
    console.log('   ℹ️  No overrides — Storage already up to date.');
    const ans = await ask('\nUpdate timestamp anyway? (y/n): ');
    if (ans !== 'y') { process.exit(0); }
  }

  // خطوة 2: جيب الداتا الحالية من Storage وادمجها مع الـ overrides
  const toProcess = ['medicines', 'supplements', 'food'];
  const uploaded  = [];

  for (const name of toProcess) {
    console.log(`\n📦 Processing ${name}...`);

    const storageData = await fetchFromStorage(`${name}.json`);
    console.log(`   📂 Storage: ${storageData.length} items`);

    if (overrides.size > 0) {
      // Merge: Override يفوق Storage
      const dataMap = new Map(storageData.map(d => [d.RegisterNumber || d._docId, d]));
      overrides.forEach((override, id) => {
        const existing = dataMap.get(id);
        if (existing) {
          dataMap.set(id, { ...existing, ...override });
        } else {
          // دواء جديد أضافه الأدمن
          dataMap.set(id, override);
        }
      });
      const merged = Array.from(dataMap.values());
      console.log(`   🔀 Merged: ${merged.length} items`);
      await uploadJSON(`${name}.json`, merged);
    } else {
      // مفيش overrides — ارفع كما هي
      if (storageData.length > 0) await uploadJSON(`${name}.json`, storageData);
    }
    uploaded.push(name);
  }

  // خطوة 3: سؤال مسح الـ overrides
  if (overrides.size > 0) {
    const ans = await ask(`\n🗑️  Clear medicine_overrides from Firestore? (y/n): `);
    if (ans === 'y') await clearOverrides();
    else console.log('   ⏭️  Kept overrides in Firestore');
  }

  // خطوة 4: حدّث الـ timestamp
  const now    = Date.now();
  const update = {};
  uploaded.forEach(c => { update[`${c}_ts`] = now; });
  await db.doc('app_meta/data_versions').set(update, { merge: true });
  console.log('\n✅ app_meta/data_versions updated');
  console.log('🎉 Done! Users will get the new data on next check.\n');
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
