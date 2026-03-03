/**
 * uploadToFirebase.mjs
 * =====================
 * يرفع ملف JSON على Firebase Firestore
 * 
 * الاستخدام:
 *   node scripts/uploadToFirebase.mjs --collection medicines    --file medicines.json
 *   node scripts/uploadToFirebase.mjs --collection supplements  --file supplements.json
 *   node scripts/uploadToFirebase.mjs --collection food         --file food.json
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const firebaseConfig = {
  apiKey: "AIzaSyAazQzvW1KUFqj1wQYaUXXlogfp8lkU50s",
  authDomain: "medainew-fa6a2.firebaseapp.com",
  projectId: "medainew-fa6a2",
  storageBucket: "medainew-fa6a2.firebasestorage.app",
  messagingSenderId: "568872568132",
  appId: "1:568872568132:web:3b07d77360eb8f3d16c311",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const args = process.argv.slice(2);
const getArg = (name) => { const idx = args.indexOf(`--${name}`); return idx !== -1 ? args[idx + 1] : null; };

const collectionName = getArg('collection');
const filePath = getArg('file');

if (!collectionName || !filePath) {
  console.error('❌ استخدام: node uploadToFirebase.mjs --collection <اسم> --file <ملف.json>');
  process.exit(1);
}

async function upload() {
  console.log(`\n📦 بيرفع "${filePath}" على collection "${collectionName}"...`);
  
  const data = JSON.parse(readFileSync(resolve(filePath), 'utf-8'));
  if (!Array.isArray(data)) { console.error('❌ الملف لازم يكون array'); process.exit(1); }

  console.log(`📊 إجمالي السجلات: ${data.length}`);

  const BATCH_SIZE = 400;
  let uploaded = 0;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = data.slice(i, i + BATCH_SIZE);

    chunk.forEach((item, idx) => {
      const rawId = item.RegisterNumber || item.id || `item-${i + idx}`;
      const docId = String(rawId).replace(/[^a-zA-Z0-9\-_]/g, '_').slice(0, 100);
      const ref = doc(collection(db, collectionName), docId);
      batch.set(ref, { ...item, _uploadedAt: new Date().toISOString() });
    });

    await batch.commit();
    uploaded += chunk.length;
    console.log(`✅ ${uploaded}/${data.length} سجل...`);
  }

  // حدّث الـ metadata
  await setDoc(doc(db, 'app_meta', 'data_versions'), {
    [`${collectionName}_ts`]: Date.now(),
    [`${collectionName}_count`]: data.length,
    [`${collectionName}_updated`]: new Date().toISOString(),
  }, { merge: true });

  console.log(`\n🎉 تم رفع ${uploaded} سجل على "${collectionName}" بنجاح!`);
  process.exit(0);
}

upload().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
