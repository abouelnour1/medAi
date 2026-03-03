/**
 * excelToJson.mjs
 * ================
 * يحوّل ملف Excel لـ JSON جاهز للرفع على Firebase
 * 
 * الاستخدام:
 *   node scripts/excelToJson.mjs --file medicines.xlsx --out medicines.json
 *   node scripts/excelToJson.mjs --file food.xlsx      --out food.json
 *   node scripts/excelToJson.mjs --file cosmetics.xlsx --out cosmetics.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// ======= قراءة الـ arguments =======
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const filePath = getArg('file');
const outPath = getArg('out');

if (!filePath || !outPath) {
  console.error('❌ استخدام: node excelToJson.mjs --file <excel> --out <output.json>');
  process.exit(1);
}

// تحقق إن xlsx مثبت
let XLSX;
try {
  XLSX = await import('xlsx');
  XLSX = XLSX.default || XLSX;
} catch {
  console.error('❌ محتاج تثبت xlsx أول: npm install xlsx');
  process.exit(1);
}

console.log(`\n📂 بيقرأ "${filePath}"...`);

const workbook = XLSX.readFile(resolve(filePath));
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

console.log(`📊 عدد السجلات: ${data.length}`);
console.log(`📋 الأعمدة: ${Object.keys(data[0] || {}).join(', ')}`);

// نظّف الـ data من القيم الفاضية
const cleaned = data.map(row => {
  const obj = {};
  for (const [k, v] of Object.entries(row)) {
    const key = String(k).trim();
    const val = v === null || v === undefined ? '' : String(v).trim();
    if (key && key !== '__EMPTY') {
      obj[key] = val;
    }
  }
  return obj;
}).filter(row => Object.values(row).some(v => v !== ''));

writeFileSync(resolve(outPath), JSON.stringify(cleaned, null, 2), 'utf-8');
console.log(`\n✅ تم الحفظ في "${outPath}" — ${cleaned.length} سجل جاهز للرفع`);
