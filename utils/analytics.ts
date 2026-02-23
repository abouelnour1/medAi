/**
 * Search Analytics - تتبع أكثر الأدوية بحثاً
 * بيخزن محلياً بدون سيرفر
 */

const KEY = 'pharmasource_analytics_v1';
const MAX_ENTRIES = 500;

interface AnalyticsData {
  searches: Record<string, number>;   // tradeName → count
  lastUpdated: string;
}

function load(): AnalyticsData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { searches: {}, lastUpdated: new Date().toISOString() };
}

function save(data: AnalyticsData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

// تسجيل بحث عن دواء
export function trackMedicineView(tradeName: string) {
  if (!tradeName) return;
  const data = load();
  data.searches[tradeName] = (data.searches[tradeName] || 0) + 1;
  data.lastUpdated = new Date().toISOString();
  
  // تنظيف لو كبر كتير
  const entries = Object.entries(data.searches);
  if (entries.length > MAX_ENTRIES) {
    const sorted = entries.sort((a, b) => b[1] - a[1]).slice(0, MAX_ENTRIES);
    data.searches = Object.fromEntries(sorted);
  }
  save(data);
}

// جلب أكثر الأدوية بحثاً
export function getTopSearched(limit = 10): Array<{ name: string; count: number }> {
  const data = load();
  return Object.entries(data.searches)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

// إجمالي عمليات البحث
export function getTotalSearches(): number {
  const data = load();
  return Object.values(data.searches).reduce((a, b) => a + b, 0);
}

// مسح البيانات
export function clearAnalytics() {
  localStorage.removeItem(KEY);
}
