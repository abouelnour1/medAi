import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const ADMOB_BANNER_ID = Capacitor.getPlatform() === 'android'
  ? 'ca-app-pub-3940256099942544/6300978111'
  : 'ca-app-pub-3940256099942544/2934735716';

interface Props { isPremium: boolean; }

const AdBanner: React.FC<Props> = ({ isPremium }) => {
  useEffect(() => {
    if (isPremium || !Capacitor.isNativePlatform()) return;
    let active = true;

    const run = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod: any = await (Function('return import("@capacitor-community/admob")')() as Promise<any>);
        if (!mod || !active) return;
        await mod.AdMob.initialize({ testingDevices: [], initializeForTesting: false });
        await mod.AdMob.showBanner({
          adId: ADMOB_BANNER_ID,
          adSize: mod.BannerAdSize?.ADAPTIVE_BANNER ?? 'ADAPTIVE_BANNER',
          position: mod.BannerAdPosition?.BOTTOM_CENTER ?? 'BOTTOM_CENTER',
          margin: 0,
          isTesting: false,
        });
      } catch {}
    };

    run();

    return () => {
      active = false;
      (Function('return import("@capacitor-community/admob")')() as Promise<any>)
        .then((mod: any) => mod?.AdMob?.hideBanner?.())
        .catch(() => {});
    };
  }, [isPremium]);

  return null;
};

export default AdBanner;
