/**
 * Merge an extracted Excel file into the local master Excel using RegisterNumber.
 *
 * Existing RegisterNumber -> update the existing row in place.
 * New RegisterNumber      -> append a new row.
 * Rows in the master that are not present in the extract are kept unchanged.
 *
 * Usage:
 *   node scripts/mergeExcelByRegisterNumber.mjs --master food.xlsx --extract food-extract.xlsx
 *   node scripts/mergeExcelByRegisterNumber.mjs --master food.xlsx --extract food-extract.xlsx --out food-updated.xlsx
 */

import { resolve } from 'path';

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const masterPath = getArg('master');
const extractPath = getArg('extract');
const outPath = getArg('out') || masterPath;

if (!masterPath || !extractPath) {
  console.error('❌ Usage: node scripts/mergeExcelByRegisterNumber.mjs --master <master.xlsx> --extract <extract.xlsx> [--out <output.xlsx>]');
  process.exit(1);
}

let XLSX;
try {
  XLSX = await import('xlsx');
  XLSX = XLSX.default || XLSX;
} catch {
  console.error('❌ Missing xlsx package. Install it first: npm install xlsx');
  process.exit(1);
}

const normalizeKey = (value) => String(value ?? '').trim();

function readFirstSheet(filePath) {
  const workbook = XLSX.readFile(resolve(filePath), { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  return { workbook, sheetName, rows };
}

function findRegisterColumn(rows) {
  const aliases = [
    'RegisterNumber',
    'RegistrationNumber',
    'Registration Number',
    'Register Number',
    'RegNumber',
    'Reg No',
    'Reg. No.',
  ];
  const keys = new Set(rows.flatMap(row => Object.keys(row)));
  return aliases.find(alias => keys.has(alias)) || null;
}

console.log(`\n📘 Master:  ${masterPath}`);
console.log(`📥 Extract: ${extractPath}`);

const master = readFirstSheet(masterPath);
const extract = readFirstSheet(extractPath);

const masterKey = findRegisterColumn(master.rows);
const extractKey = findRegisterColumn(extract.rows);

if (!masterKey || !extractKey) {
  console.error('❌ RegisterNumber column was not found in both files.');
  console.error(`   Master key: ${masterKey || 'NOT FOUND'}`);
  console.error(`   Extract key: ${extractKey || 'NOT FOUND'}`);
  process.exit(1);
}

const masterIndex = new Map();
const duplicateMasterKeys = new Set();
master.rows.forEach((row, index) => {
  const key = normalizeKey(row[masterKey]);
  if (!key) return;
  if (masterIndex.has(key)) duplicateMasterKeys.add(key);
  else masterIndex.set(key, index);
});

if (duplicateMasterKeys.size > 0) {
  console.error(`❌ Master Excel contains duplicate RegisterNumber values (${duplicateMasterKeys.size}).`);
  console.error(`   Examples: ${Array.from(duplicateMasterKeys).slice(0, 10).join(', ')}`);
  console.error('   Fix duplicates before merging so the script never updates the wrong medicine.');
  process.exit(1);
}

let updated = 0;
let added = 0;
let skipped = 0;
const seenExtract = new Set();

for (const incoming of extract.rows) {
  const key = normalizeKey(incoming[extractKey]);
  if (!key) {
    skipped++;
    continue;
  }

  if (seenExtract.has(key)) {
    console.error(`❌ Extract contains duplicate RegisterNumber: ${key}`);
    process.exit(1);
  }
  seenExtract.add(key);

  // Normalize the key name to the master's existing column name.
  const normalizedIncoming = { ...incoming, [masterKey]: key };
  if (extractKey !== masterKey) delete normalizedIncoming[extractKey];

  const existingIndex = masterIndex.get(key);
  if (existingIndex !== undefined) {
    // Preserve columns that are local-only in the master while replacing fields
    // supplied by the fresh Firebase extract.
    master.rows[existingIndex] = {
      ...master.rows[existingIndex],
      ...normalizedIncoming,
    };
    updated++;
  } else {
    master.rows.push(normalizedIncoming);
    masterIndex.set(key, master.rows.length - 1);
    added++;
  }
}

const newSheet = XLSX.utils.json_to_sheet(master.rows);
master.workbook.Sheets[master.sheetName] = newSheet;
XLSX.writeFile(master.workbook, resolve(outPath));

console.log('\n✅ Merge complete');
console.log(`   🔄 Updated: ${updated}`);
console.log(`   ➕ Added:   ${added}`);
console.log(`   ⏭️ Skipped (no RegisterNumber): ${skipped}`);
console.log(`   📊 Total rows: ${master.rows.length}`);
console.log(`   💾 Saved: ${outPath}\n`);
