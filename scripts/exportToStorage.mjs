/**
 * exportToStorage.mjs
 * 
 * بيصدّر الداتا من Firestore لـ JSON files ويرفعها على Firebase Storage
 * 
 * شغّله بعد أي تحديث كبير للداتا:
 *   node scripts/exportToStorage.mjs
 * 
 * متطلبات:
 *   npm install firebase-admin
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Init Firebase Admin ───────────────────────────────────────────────────────
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../serviceAccountKey.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
});

const db = getFirestore();
const bucket = getStorage().bucket();

// ── جيب collection كاملة ──────────────────────────────────────────────────────
async function fetchCollection(name) {
  console.log(`📥 Fetching ${name}...`);
  const snap = await db.collection(name).get();
  const data = snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
  console.log(`   ✅ ${data.length} documents`);
  return data;
}

// ── ارفع JSON على Storage ─────────────────────────────────────────────────────
async function uploadJSON(filename, data) {
  const json = JSON.stringify(data);
  const file = bucket.file(`data/${filename}`);
  
  await file.save(json, {
    metadata: {
      contentType: 'application/json',
      cacheControl: 'public, max-age=3600', // CDN cache ساعة
    },
  });

  // اعمل الملف public
  await file.makePublic();
  
  const url = `https://storage.googleapis.com/${bucket.name}/data/${filename}`;
  console.log(`   ☁️  Uploaded: ${url}`);
  return url;
}

// ── حدّث app_meta/data_versions ──────────────────────────────────────────────
async function bumpVersions(collections) {
  const now = Date.now();
  const update = {};
  collections.forEach(c => { update[`${c}_ts`] = now; });
  await db.doc('app_meta/data_versions').set(update, { merge: true });
  console.log(`\n✅ app_meta/data_versions updated`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Export to Firebase Storage\n');

  const collections = ['medicines', 'supplements', 'food'];
  
  for (const name of collections) {
    try {
      const data = await fetchCollection(name);
      if (data.length === 0) {
        console.log(`   ⚠️  Empty — skipping upload`);
        continue;
      }
      await uploadJSON(`${name}.json`, data);
    } catch (e) {
      console.error(`❌ Failed for ${name}:`, e.message);
    }
  }

  await bumpVersions(collections);
  
  console.log('\n🎉 Done! All users will get the new data on next check.');
  process.exit(0);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
