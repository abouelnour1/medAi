import { useEffect, useRef } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { app, db } from '../firebase';

const VAPID_KEY = 'BNn53g7KGps9GuqXfKBgYyP3UmfSzed1F5OrEet036YyxA1QYGOg5hnqhgmGCqy98hgekzwWZAWHCIOk3x8bDgM';

export function useFCM(userId: string | undefined) {
  const tokenSaved = useRef(false);

  useEffect(() => {
    if (!userId || tokenSaved.current) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    const setup = async () => {
      try {
        // اطلب إذن الإشعارات
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const messaging = getMessaging(app);

        // جيب الـ FCM token
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (!token) return;

        // احفظه في Firestore
        await updateDoc(doc(db, 'users', userId), {
          fcmToken: token,
          notificationsEnabled: true,
          fcmUpdatedAt: new Date().toISOString(),
        });

        tokenSaved.current = true;
        console.log('✅ FCM token saved');

        // استقبل الإشعارات لما التطبيق مفتوح
        onMessage(messaging, (payload) => {
          console.log('📬 Foreground message:', payload);
          // اعرض إشعار يدوي لأن المتصفح مش بيعرضه لو التطبيق مفتوح
          if (payload.notification) {
            new Notification(payload.notification.title || 'PharmaSource', {
              body: payload.notification.body,
              icon: '/logo.png',
              badge: '/logo.png',
            });
          }
        });

      } catch (err) {
        console.warn('FCM setup error:', err);
      }
    };

    // نستنى ثانيتين بعد login عشان الـ UI يستقر
    const timer = setTimeout(setup, 2000);
    return () => clearTimeout(timer);
  }, [userId]);
}
