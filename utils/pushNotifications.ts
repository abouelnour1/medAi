import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const VAPID_KEY = (import.meta.env as any)['VITE_VAPID_KEY'] || '';

// ============================================
// طلب إذن + FCM Token (ويب)
// ============================================
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
        notificationsEnabled: true,
        platform: 'web'
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('خطأ في الإشعارات:', error);
    return null;
  }
}

// ============================================
// استقبال الإشعارات وهو مفتوح (Foreground - ويب)
// ============================================
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

// ============================================
// Capacitor Native Push (أندرويد APK)
// ============================================
export async function setupCapacitorPush(
  userId: string,
  onNotification: (title: string, body: string, data?: any) => void
) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

    // طلب الإذن
    const { receive } = await FirebaseMessaging.requestPermissions();
    if (receive !== 'granted') return;

    // جلب وحفظ الـ Token
    const { token } = await FirebaseMessaging.getToken();
    if (token) {
      await updateDoc(doc(db, 'users', userId), {
        fcmToken: token,
        fcmTokenUpdated: new Date().toISOString(),
        notificationsEnabled: true,
        platform: 'android'
      });
      console.log('✅ Android FCM Token saved');
    }

    // استقبال الإشعارات وهو مفتوح
    await FirebaseMessaging.addListener('notificationReceived', (event: any) => {
      const { title, body } = event.notification;
      onNotification(title || 'PharmaSource', body || '', event.notification.data);
    });

    // استقبال الإشعارات لما يضغط عليها
    await FirebaseMessaging.addListener('notificationActionPerformed', (event: any) => {
      const { title, body } = event.notification;
      onNotification(title || 'PharmaSource', body || '', event.notification.data);
    });

    console.log('✅ Android Native Push ready');
  } catch (error) {
    console.log('Capacitor Push setup skipped:', error);
  }
}

// ============================================
// تعطيل الإشعارات
// ============================================
export async function disablePushNotifications(userId: string) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      notificationsEnabled: false,
      fcmToken: null
    });
  } catch (e) {
    console.error(e);
  }
}
