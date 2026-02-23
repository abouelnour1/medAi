import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const VAPID_KEY = (import.meta.env as any)['VITE_VAPID_KEY'] || '';

export async function requestPushPermission(userId: string): Promise<string | null> {
  try {
    if (!('Notification' in window)) return null;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const { getMessaging, getToken } = await import('firebase/messaging');
    const { app } = await import('../firebase');
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token) {
      await updateDoc(doc(db, 'users', userId), {
        fcmToken: token,
        fcmTokenUpdated: new Date().toISOString(),
        notificationsEnabled: true
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('خطأ في الإشعارات:', error);
    return null;
  }
}

export async function setupForegroundNotifications(
  onNotification: (title: string, body: string, data?: any) => void
) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const { getMessaging, onMessage } = await import('firebase/messaging');
    const { app } = await import('../firebase');
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || 'PharmaSource';
      const body = payload.notification?.body || '';
      onNotification(title, body, payload.data);
    });
  } catch (error) {
    console.error(error);
  }
}

// للأندرويد Native - يتم تفعيله يدوياً بعد: npm install @capacitor-firebase/messaging
export async function setupCapacitorPush(
  _userId: string,
  _onNotification: (title: string, body: string) => void
) {
  // TODO: بعد تنصيب @capacitor-firebase/messaging ارفع التعليق
  // const { Capacitor } = await import('@capacitor/core');
  // if (!Capacitor.isNativePlatform()) return;
  // const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
  // ...
}

export async function disablePushNotifications(userId: string) {
  try {
    await updateDoc(doc(db, 'users', userId), { notificationsEnabled: false, fcmToken: null });
  } catch (e) {
    console.error(e);
  }
}
