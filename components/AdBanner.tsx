import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

// AdMob Unit IDs — استبدل بالـ IDs الحقيقية من AdMob console
// للتست استخدم الـ test IDs دول
const ADMOB_BANNER_ID = Capacitor.getPlatform() === 'android'
  ? 'ca-app-pub-3940256099942544/6300978111' // TEST ID — استبدل بـ real ID
  : 'ca-app-pub-3940256099942544/2934735716'; // iOS TEST ID

interface Props {
  isPremium: boolean;
}

const AdBanner: React.FC<Props> = ({ isPremium }) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (isPremium) return; // مش هنحمل أي إعلانات للـ premium
    if (!Capacitor.isNativePlatform()) return; // AdMob native only

    let isMounted = true;

    const initAdMob = async () => {
      try {
        // @ts-ignore — AdMob plugin
        const { AdMob, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');

        await AdMob.initialize({
          testingDevices: [],
          initializeForTesting: false,
        });

        await AdMob.showBanner({
          adId: ADMOB_BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: false,
        });

        if (isMounted) setAdLoaded(true);
      } catch (e) {
        console.warn('AdMob error:', e);
        if (isMounted) setAdError(true);
      }
    };

    initAdMob();

    return () => {
      isMounted = false;
      // إخفاء الـ banner لما الـ component يتشيل
      (async () => {
        try {
          // @ts-ignore
          const { AdMob } = await import('@capacitor-community/admob');
          await AdMob.hideBanner();
        } catch {}
      })();
    };
  }, [isPremium]);

  // لو premium أو مش native → مش بنعرض حاجة
  if (isPremium || !Capacitor.isNativePlatform()) return null;

  // Placeholder للـ web preview بس
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[50] flex items-center justify-center bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700" style={{ height: 50, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">📢 Ad Banner Placeholder</p>
      </div>
    );
  }

  return null; // Native AdMob يتحكم في الـ banner نفسه
};

export default AdBanner;
