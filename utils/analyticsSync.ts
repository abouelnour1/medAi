/**
 * Hybrid Analytics Sync
 * بيجمع إحصائيات اليوزر مرة واحدة في اليوم في Firestore
 * عشان الأدمن يشوف إحصائيات كل المستخدمين
 */
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getTopSearched, getTopMedicineViews, getTotalSearches } from './analytics';

const SYNC_KEY = 'ps_analytics_last_sync';

export async function syncAnalyticsToFirestore(userId: string, specialty?: string) {
  try {
    // مرة واحدة في اليوم بس
    const lastSync = localStorage.getItem(SYNC_KEY);
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    if (lastSync === today) return;

    const topSearches = getTopSearched(5);
    const topMedicines = getTopMedicineViews(5);
    const totalSearches = getTotalSearches();

    if (totalSearches === 0 && topMedicines.length === 0) return;

    // احفظ في Firestore تحت users/{userId}/analytics/{date}
    await setDoc(doc(db, 'users', userId, 'analytics', today), {
      date: today,
      specialty: specialty || 'unknown',
      totalSearches,
      topSearches: topSearches.map(s => ({ term: s.term, count: s.count })),
      topMedicines: topMedicines.map(m => ({ name: m.name, count: m.count })),
      syncedAt: Date.now(),
    });

    localStorage.setItem(SYNC_KEY, today);
    console.log('✅ Analytics synced to Firestore');
  } catch (e) {
    console.log('Analytics sync skipped:', e);
  }
}
