import { useState, useEffect } from 'react';

// الأندرويد WebView أبطأ في JS → نرفع الـ debounce تلقائياً
const isAndroid = typeof (window as any).Capacitor !== 'undefined'
  ? (window as any).Capacitor.getPlatform() === 'android'
  : /Android/i.test(navigator.userAgent);

const ANDROID_MULTIPLIER = 3.5; // 80ms → 280ms, 200ms → 700ms

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const effectiveDelay = isAndroid ? Math.round(delay * ANDROID_MULTIPLIER) : delay;
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), effectiveDelay);
    return () => clearTimeout(timer);
  }, [value, effectiveDelay]);
  return debouncedValue;
}
