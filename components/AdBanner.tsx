import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const ADMOB_BANNER_ID = Capacitor.getPlatform() === 'android'
  ? 'ca-app-pub-3940256099942544/6300978111' // TEST ID
  : 'ca-app-pub-3940256099942544/2934735716';

interface Props {
  isPremium: boolean;
}

const AdBanner: React.FC<Props> = ({ isPremium }) => {
  useEffect(() => {
    if (isPremium || !Capacitor.isNativePlatform()) return;

    let active = true;

    const showAd = async () => {
      try {
        // AdMob بيشتغل على native بس — الـ import هيفشل على web وده متوقع
        const mod = await import(/* @vite-ignore */ '@capacitor-community/admob');
        if (!mod || !active) return;
        const { AdMob, BannerAdSize, BannerAdPosition } = mod;
        await AdMob.initialize({ testingDevices: [], initializeForTesting: false });
        await AdMob.showBanner({
          adId: ADMOB_BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: false,
        });
      } catch {}
    };

    showAd();

    return () => {
      active = false;
      import(/* @vite-ignore */ '@capacitor-community/admob')
        .then(({ AdMob }) => AdMob.hideBanner())
        .catch(() => {});
    };
  }, [isPremium]);

  // لا شيء يُعرض في الـ DOM — AdMob native بيتحكم في الـ banner
  return null;
};

export default AdBanner;

export default AdBanner;
