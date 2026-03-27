/**
 * Fuzzy Search - يتسامح مع الأخطاء الإملائية الحقيقية فقط
 * مثال: "pkmer"     → "PK-Merz"     (الداش مش مهم)
 * مثال: "amoxcilin" → "Amoxicillin" (خطأ إملائي)
 * مثال: "foti"      → "Forti"       (حرف مقلوب)
 */

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// نشيل الداش والمسافات لمقارنة موحّدة
function normalize(s: string): string {
  return s.toLowerCase().replace(/[-\s.,/]+/g, '');
}

export function fuzzyScore(text: string, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  const t = text.toLowerCase();
  const tNorm = normalize(text);  // pk-merz → pkmerz
  const qNorm = normalize(query); // pkmer   → pkmer

  // ── الطبقة 1: تطابق بعد حذف الداش ──
  if (tNorm === qNorm) return 1;
  if (tNorm.startsWith(qNorm)) return 0.95;
  if (tNorm.includes(qNorm)) return 0.85;

  // ── الطبقة 2: تطابق في كلمة واحدة (بدون normalize) ──
  const words = t.split(/[\s\-,./]+/);
  for (const word of words) {
    if (word.startsWith(q)) return 0.80;
    if (word.includes(q)) return 0.70;
  }

  // ── الطبقة 3: Prefix fuzzy على كل كلمة ──
  if (q.length >= 4) {
    for (const word of words) {
      // لو الحرف الأول مختلف خالص → مش prefix fuzzy
      if (!word.startsWith(q[0])) continue;
      if (word.length >= q.length) {
        const p1 = word.substring(0, q.length);
        if (levenshtein(p1, q) === 1) return 0.65;
        if (word.length > q.length) {
          const p2 = word.substring(0, q.length + 1);
          if (levenshtein(p2, q) === 1) return 0.62;
        }
      }
    }
    // نجرب كمان على الـ normalized (مفيد لـ pk-mer → pkmer)
    if (tNorm.length >= qNorm.length && tNorm[0] === qNorm[0]) {
      const pn = tNorm.substring(0, qNorm.length);
      if (levenshtein(pn, qNorm) === 1) return 0.63;
    }
  }

  // ── الطبقة 4: Full-word fuzzy ──
  const maxErrors = Math.min(2, Math.floor(q.length / 4));
  if (maxErrors === 0) return 0;

  for (const word of words) {
    if (Math.abs(word.length - q.length) > maxErrors + 1) continue;
    const dist = levenshtein(word, q);
    if (dist <= maxErrors) {
      return 0.5 * (1 - dist / q.length);
    }
  }

  return 0;
}

export function fuzzyMatch(text: string, query: string): boolean {
  return fuzzyScore(text, query) > 0;
}
