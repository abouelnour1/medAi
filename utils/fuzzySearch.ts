/**
 * Fuzzy Search - يتسامح مع الأخطاء الإملائية
 * مثال: "amxcilin" يجيب "Amoxicillin"
 */

// حساب Levenshtein distance بين كلمتين
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

// حساب درجة التشابه بين النص والبحث (0 = لا يتطابق, 1 = تطابق كامل)
export function fuzzyScore(text: string, query: string): number {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  // تطابق مباشر = أعلى درجة
  if (t === q) return 1;
  if (t.startsWith(q)) return 0.95;
  if (t.includes(q)) return 0.85;

  // تطابق جزئي لكل كلمة في الاسم
  const words = t.split(/[\s-,]+/);
  for (const word of words) {
    if (word.startsWith(q)) return 0.80;
    if (word.includes(q)) return 0.70;
  }

  // Fuzzy: نقارن أجزاء من النص بنفس طول البحث
  const qLen = q.length;
  let bestDist = Infinity;
  
  // نجرب كل نافذة بنفس طول الـ query في النص
  for (let i = 0; i <= t.length - qLen + 2; i++) {
    const window = t.slice(i, i + qLen);
    const dist = levenshtein(window, q);
    if (dist < bestDist) bestDist = dist;
  }

  // نحسب الدرجة - أقل errors = درجة أعلى
  const maxAllowedErrors = Math.floor(qLen * 0.35); // 35% tolerance
  if (bestDist > maxAllowedErrors) return 0;
  
  return 0.6 * (1 - bestDist / qLen);
}

// هل النص يطابق البحث (مع tolerance للأخطاء)
export function fuzzyMatch(text: string, query: string): boolean {
  return fuzzyScore(text, query) > 0;
}
