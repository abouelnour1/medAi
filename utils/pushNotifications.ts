import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const VAPID_KEY = (import.meta.env as any)['VITE_VAPID_KEY'] || '';

// ============================================
// طلب إذن + FCM Token (ويب)
// ============================================
export async function requestPushPermission(userId: string): Promise<string | null> {
  try {
    // على الأندرويد Native نستخدم Capacitor مباشرة
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      await setupCapacitorPush(userId, () => {});
      return 'android-native';
    }

    if (!('Notification' in window)) {
      throw new Error('المتصفح لا يدعم الإشعارات - استخدم التطبيق المثبت');
    }

    const permission = await Notification.requestPermission();
    if (permission === 'denied') throw new Error('تم رفض إذن الإشعارات');
    if (permission !== 'granted') return null;

    if (!VAPID_KEY) {
      // بدون VAPID key نستخدم الـ Service Worker مباشرة
      console.warn('VITE_VAPID_KEY غير موجود - الإشعارات تعمل بشكل محدود');
      // نحفظ في Firestore إن المستخدم وافق بس بدون token
      await updateDoc(doc(db, 'users', userId), {
        notificationsEnabled: true,
        fcmTokenUpdated: new Date().toISOString(),
      });
      return 'no-vapid-key';
    }

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
  } catch (error: any) {
    console.error('خطأ في الإشعارات:', error);
    throw error; // نرميه للـ App عشان يعرض رسالة واضحة
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

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { FirebaseMessaging } = await (Function('return import("@capacitor-firebase/messaging")')() as Promise<any>);

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
// إشعار محلي - أدوية اليوم الجديدة
// ============================================
export async function notifyDailyFeaturedChanged(medicines: { tradeName: string; indication?: string }[]): Promise<void> {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const names = medicines.slice(0, 3).map(m => m.tradeName).join(' · ');
    const firstIndication = medicines[0]?.indication;
    const body = firstIndication
      ? `${firstIndication.slice(0, 80)}...`
      : `Today's featured: ${names}`;

    const reg = await navigator.serviceWorker?.ready;
    if (reg?.showNotification) {
      await reg.showNotification('💊 أدوية اليوم - PharmaSource', {
        body,
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        tag: 'daily-featured',
        renotify: true,
        data: { url: '/' }
      } as NotificationOptions);
    } else {
      new Notification('💊 أدوية اليوم - PharmaSource', { body, icon: '/icon-192.png', tag: 'daily-featured' });
    }
  } catch (e) {
    console.log('Local notification skipped:', e);
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
