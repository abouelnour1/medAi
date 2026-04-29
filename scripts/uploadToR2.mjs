/**
 * uploadToR2.mjs
 *
 * بيرفع renal_drugs.json و clinical_reference_full.json على Cloudflare R2
 * الاستخدام: node scripts/uploadToR2.mjs
 *
 * المتطلبات في .env.local:
 *   VITE_R2_ACCOUNT_ID=...
 *   VITE_R2_ACCESS_KEY_ID=...
 *   VITE_R2_SECRET_ACCESS_KEY=...
 *   VITE_R2_BUCKET_NAME=...
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = join(__dirname, '../.env.local');
  if (!existsSync(envPath)) { console.error('❌  .env.local not found'); process.exit(1); }
  const lines = readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();

const ACCOUNT_ID = env.VITE_R2_ACCOUNT_ID;
const ACCESS_KEY = env.VITE_R2_ACCESS_KEY_ID;
const SECRET_KEY = env.VITE_R2_SECRET_ACCESS_KEY;
const BUCKET     = env.VITE_R2_BUCKET_NAME;

if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY || !BUCKET) {
  console.error('❌  Missing R2 credentials in .env.local');
  console.error('    Required: VITE_R2_ACCOUNT_ID, VITE_R2_ACCESS_KEY_ID, VITE_R2_SECRET_ACCESS_KEY, VITE_R2_BUCKET_NAME');
  process.exit(1);
}

// ── AWS Signature V4 for R2 ────────────────────────────────────────────────────
import { createHmac, createHash } from 'crypto';

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}
function hmacSHA256(key, data) {
  return createHmac('sha256', key).update(data).digest();
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate    = hmacSHA256('AWS4' + key, dateStamp);
  const kRegion  = hmacSHA256(kDate, regionName);
  const kService = hmacSHA256(kRegion, serviceName);
  return hmacSHA256(kService, 'aws4_request');
}

function signRequest({ method, host, path, body, contentType }) {
  const now      = new Date();
  const amzDate  = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const region   = 'auto';
  const service  = 's3';

  const payloadHash = sha256(body);
  const canonHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

  const canonRequest = [method, path, '', canonHeaders, signedHeaders, payloadHash].join('\n');
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256(canonRequest)}`;

  const sigKey = getSignatureKey(SECRET_KEY, dateStamp, region, service);
  const signature = createHmac('sha256', sigKey).update(stringToSign).digest('hex');

  const authHeader = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { amzDate, payloadHash, authHeader };
}

// ── Upload File ────────────────────────────────────────────────────────────────
async function uploadFile(filename, localPath) {
  console.log(`📤  Uploading ${filename}...`);

  const body = readFileSync(localPath);
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const path = `/${BUCKET}/${filename}`;
  const contentType = 'application/json';

  const { amzDate, payloadHash, authHeader } = signRequest({
    method: 'PUT', host, path, body, contentType
  });

  const url = `https://${host}${path}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Host': host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'Authorization': authHeader,
    },
    body,
  });

  if (res.ok || res.status === 200) {
    console.log(`✅  ${filename} uploaded successfully`);
  } else {
    const text = await res.text();
    console.error(`❌  Failed to upload ${filename}: ${res.status} ${text}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
const FILES = [
  { filename: 'renal_drugs.json',            localPath: join(__dirname, '../data/renal_drugs.json') },
  { filename: 'clinical_reference_full.json', localPath: join(__dirname, '../data/clinical_reference_full.json') },
];

for (const f of FILES) {
  if (!existsSync(f.localPath)) {
    console.warn(`⚠️   File not found locally, skipping: ${f.localPath}`);
    continue;
  }
  await uploadFile(f.filename, f.localPath);
}

console.log('\n🎉  Done!');
