import { Capacitor } from '@capacitor/core';

const REVIEW_KEY = 'ps_review_requested';
const OPEN_COUNT_KEY = 'ps_open_count';
const MIN_OPENS = 5; // بعد ٥ مرات فتح

export async function trackAppOpen() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const count = parseInt(localStorage.getItem(OPEN_COUNT_KEY) || '0') + 1;
    localStorage.setItem(OPEN_COUNT_KEY, String(count));

    // لو سبق وطلبنا Review → مش نكررها
    if (localStorage.getItem(REVIEW_KEY)) return;

    // بعد MIN_OPENS مرات فتح → نطلب Review
    if (count >= MIN_OPENS) {
      await requestReview();
    }
  } catch {}
}

async function requestReview() {
  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
    localStorage.setItem(REVIEW_KEY, 'true');
    console.log('✅ In-App Review requested');
  } catch (e) {
    console.log('In-App Review skipped:', e);
  }
}
