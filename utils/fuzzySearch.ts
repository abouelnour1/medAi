export function norm(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function prefixAlign(q: string, t: string): number {
  const m = q.length, n = t.length;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) { dp[i] = new Array(n + 1).fill(0); dp[i][0] = i; }
  for (let j = 1; j <= n; j++) dp[0][j] = 0;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = q[i-1] === t[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  let best = 999;
  const maxJ = Math.min(n, q.length + 3);
  for (let j = q.length - 1; j <= maxJ; j++) if (dp[m][j] < best) best = dp[m][j];
  return best;
}

export function fuzzyScore(text: string, query: string): number {
  const t = norm(text), q = norm(query);
  if (!q) return 0;
  if (t === q) return 1;
  if (t.startsWith(q)) return 0.9;
  if (t.includes(q)) return 0.7;
  return 0;
}
export function fuzzyMatch(text: string, query: string): boolean {
  return fuzzyScore(text, query) > 0;
}
export interface SearchResult { tier: number; score: number; }
export function scoreSearch(tradeName: string, sciName: string, query: string): SearchResult {
  const score = Math.max(fuzzyScore(tradeName, query), fuzzyScore(sciName, query));
  return { tier: score > 0 ? 1 : 99, score };
}
