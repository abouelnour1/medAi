import { Capacitor } from '@capacitor/core';

// ============================================
// Firebase Analytics (Native Android/iOS)
// ============================================
async function getFirebaseAnalytics() {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
    return FirebaseAnalytics;
  } catch { return null; }
}

export async function logMedicineView(tradeName: string, registerNumber: string, productType?: string) {
  const fa = await getFirebaseAnalytics();
  if (fa) {
    await fa.logEvent({ name: 'view_medicine', params: { medicine_name: tradeName, register_number: registerNumber, product_type: productType || 'Human' } });
  }
  // أيضاً احفظ في localStorage للـ Admin Dashboard
  trackMedicineView(tradeName, registerNumber);
}

export async function logSearch(searchTerm: string, resultsCount: number, mode: string) {
  const fa = await getFirebaseAnalytics();
  if (fa) {
    await fa.logEvent({ name: 'search', params: { search_term: searchTerm.substring(0, 100), results_count: resultsCount, search_mode: mode } });
  }
  trackSearch(searchTerm);
}

export async function logShareMedicine(tradeName: string) {
  const fa = await getFirebaseAnalytics();
  if (fa) await fa.logEvent({ name: 'share_medicine', params: { medicine_name: tradeName } });
}

export async function logFavoriteToggle(tradeName: string, action: 'add' | 'remove') {
  const fa = await getFirebaseAnalytics();
  if (fa) await fa.logEvent({ name: 'favorite_toggle', params: { medicine_name: tradeName, action } });
}

export async function logTabSwitch(tab: string) {
  const fa = await getFirebaseAnalytics();
  if (fa) await fa.logEvent({ name: 'tab_switch', params: { tab_name: tab } });
}

export async function setUserSpecialty(specialty: string) {
  const fa = await getFirebaseAnalytics();
  if (fa) {
    try { await fa.setUserProperty({ key: 'specialty', value: specialty }); } catch {}
  }
}

// ============================================
// Local Analytics (localStorage) — للـ Admin Dashboard
// ============================================
const MEDICINE_VIEWS_KEY = 'ps_analytics_medicine_views';
const SEARCH_TERMS_KEY = 'ps_analytics_searches';

function getLocalData(key: string): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}

function saveLocalData(key: string, data: Record<string, number>) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export function trackMedicineView(tradeName: string, _registerNumber?: string) {
  const data = getLocalData(MEDICINE_VIEWS_KEY);
  data[tradeName] = (data[tradeName] || 0) + 1;
  saveLocalData(MEDICINE_VIEWS_KEY, data);
}

export function trackSearch(term: string) {
  if (!term || term.length < 2) return;
  const data = getLocalData(SEARCH_TERMS_KEY);
  data[term] = (data[term] || 0) + 1;
  saveLocalData(SEARCH_TERMS_KEY, data);
}

export function getTopSearched(limit = 10): { term: string; count: number }[] {
  const data = getLocalData(SEARCH_TERMS_KEY);
  return Object.entries(data)
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getTopMedicineViews(limit = 10): { name: string; count: number }[] {
  const data = getLocalData(MEDICINE_VIEWS_KEY);
  return Object.entries(data)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getTotalSearches(): number {
  const data = getLocalData(SEARCH_TERMS_KEY);
  return Object.values(data).reduce((sum, v) => sum + v, 0);
}

export function clearAnalytics() {
  localStorage.removeItem(MEDICINE_VIEWS_KEY);
  localStorage.removeItem(SEARCH_TERMS_KEY);
}
