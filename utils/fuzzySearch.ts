/**
 * Fuzzy Search - يتسامح مع الأخطاء الإملائية الحقيقية فقط
 * مثال: "amoxcilin" يجيب "Amoxicillin"
 * مثال: "hepl" يجيب "Hepaform" (خطأ حرف واحد في البداية)
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

export function fuzzyScore(text: string, query: string): number {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  // تطابق مباشر
  if (t === q) return 1;
  if (t.startsWith(q)) return 0.95;
  if (t.includes(q)) return 0.85;

  // تطابق في كلمة واحدة من الاسم المركب
  const words = t.split(/[\s\-,./]+/);
  for (const word of words) {
    if (word.startsWith(q)) return 0.80;
    if (word.includes(q)) return 0.70;
  }

  // Prefix Fuzzy: قارن الـ query بـ prefix بنفس الطول من كل كلمة
  // يصلح حالة "hepl" → "hepaform" — خطأ حرف واحد في البداية
  if (q.length >= 4) {
    for (const word of words) {
      if (word.length >= q.length) {
        const prefix = word.substring(0, q.length);
        const dist = levenshtein(prefix, q);
        if (dist === 1) return 0.65;
      }
    }
  }

  // Full-word Fuzzy: نقارن الـ query بكل كلمة كاملة
  // بنسمح بـ خطأ واحد لكل 4 حروف بحد أقصى خطأين
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
