/**
 * سكريبت تحميل الخطوط محلياً - شغّله مرة واحدة بس
 * node scripts/download-fonts.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const FONTS_DIR = path.join(__dirname, '../public/fonts');
if (!fs.existsSync(FONTS_DIR)) fs.mkdirSync(FONTS_DIR, { recursive: true });

const fonts = [
  { weight: 300, file: 'Cairo-Light.woff2' },
  { weight: 400, file: 'Cairo-Regular.woff2' },
  { weight: 500, file: 'Cairo-Medium.woff2' },
  { weight: 600, file: 'Cairo-SemiBold.woff2' },
  { weight: 700, file: 'Cairo-Bold.woff2' },
  { weight: 900, file: 'Cairo-Black.woff2' },
];

function fetchCSSAndGetURLs() {
  return new Promise((resolve, reject) => {
    const url = 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;900&display=swap';
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // استخراج URLs من الـ CSS
        const matches = [...data.matchAll(/font-weight:\s*(\d+)[^}]*src:\s*url\(([^)]+)\)/gs)];
        const urls = {};
        matches.forEach(m => { urls[m[1]] = m[2]; });
        resolve({ css: data, urls });
      });
    }).on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { try { fs.unlinkSync(dest); } catch(e){} reject(err); });
  });
}

async function main() {
  console.log('📥 جاري جلب URLs الخطوط من Google Fonts...');
  
  try {
    const { urls } = await fetchCSSAndGetURLs();
    console.log(`وجدت ${Object.keys(urls).length} خطوط`);

    for (const font of fonts) {
      const url = urls[font.weight];
      if (!url) { console.log(`⚠️  مش لاقي ${font.weight}`); continue; }
      const dest = path.join(FONTS_DIR, font.file);
      try {
        await download(url, dest);
        console.log(`✅ ${font.file}`);
      } catch(e) {
        console.log(`❌ فشل ${font.file}: ${e.message}`);
      }
    }
  } catch(e) {
    console.log('❌ فشل الاتصال بـ Google Fonts:', e.message);
    console.log('📌 حمّل الخطوط يدوياً من: https://fonts.google.com/specimen/Cairo');
    return;
  }

  // كتابة fonts.css
  const css = fonts.map(f => `@font-face {
  font-family: 'Cairo';
  src: url('/fonts/${f.file}') format('woff2');
  font-weight: ${f.weight};
  font-style: normal;
  font-display: swap;
}`).join('\n\n');

  fs.writeFileSync(path.join(FONTS_DIR, 'fonts.css'), css);
  console.log('\n✅ fonts.css جاهز! الخطوط الآن تعمل offline.');
}

main();
