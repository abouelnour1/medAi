import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const VAPID_KEY = (import.meta.env as any)['VITE_VAPID_KEY'] || 'BNn53g7KGps9GuqXfKBgYyP3UmfSzed1F5OrEet036YyxA1QYGOg5hnqhgmGCqy98hgekzwWZAWHClOk3x8bDgM';

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

    // نسجل الـ FCM Service Worker صريح عشان الـ token يكون ثابت
    let swReg: ServiceWorkerRegistration | undefined;
    try {
      // نلاقي الـ SW المسجل أو نسجله
      const registrations = await navigator.serviceWorker.getRegistrations();
      swReg = registrations.find(r => r.active?.scriptURL.includes('firebase-messaging-sw'));
      if (!swReg) {
        swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;
      }
    } catch (swErr) {
      console.warn('SW registration failed, trying without:', swErr);
    }

    console.log('🔑 VAPID KEY:', VAPID_KEY?.substring(0, 20) + '...');
    console.log('🔧 SW Registration:', swReg?.scope);

    const token = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    console.log('📱 FCM Token result:', token ? token.substring(0, 30) + '...' : 'NULL/EMPTY');

    if (token) {
      await updateDoc(doc(db, 'users', userId), {
        fcmToken: token,
        fcmTokenUpdated: new Date().toISOString(),
        notificationsEnabled: true,
        platform: 'web'
      });
      console.log('✅ Token saved to Firestore');
      return token;
    }
    console.warn('⚠️ getToken returned empty - check VAPID key and SW');
    return null;
  } catch (error: any) {
    console.error('❌ خطأ في الإشعارات:', error.code, error.message);
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
      const title = payload.notification?.title || 'Easy Drug';
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
  onNotification: (title: string, body: string, data?: any) => void,
  onTap?: (data?: any) => void
) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

    // طلب الإذن
    const permResult = await FirebaseMessaging.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.log('Push permission denied');
      return;
    }

    // جلب وحفظ الـ Token
    const tokenResult = await FirebaseMessaging.getToken();
    if (tokenResult.token) {
      await updateDoc(doc(db, 'users', userId), {
        fcmToken: tokenResult.token,
        fcmTokenUpdated: new Date().toISOString(),
        notificationsEnabled: true,
        platform: 'android'
      });
      console.log('✅ Android FCM Token saved:', tokenResult.token.substring(0, 20) + '...');
    }

    // helper: احفظ الإشعار في Firestore
    // نستخدم Map لمنع duplicates في نفس الجلسة بدون Firestore query
    // منع duplicates: نحفظ hash في localStorage يدوم 5 دقايق
    const NOTIF_DEDUP_KEY = 'pharma_notif_dedup';
    const getDedupSet = (): Set<string> => {
      try {
        const raw = JSON.parse(localStorage.getItem(NOTIF_DEDUP_KEY) || '{}');
        const now = Date.now();
        // نمسح القديم
        const fresh: Record<string,number> = {};
        Object.entries(raw).forEach(([k,v]) => { if (now - (v as number) < 5*60*1000) fresh[k] = v as number; });
        return new Set(Object.keys(fresh));
      } catch { return new Set(); }
    };
    const addToDedup = (key: string) => {
      try {
        const raw = JSON.parse(localStorage.getItem(NOTIF_DEDUP_KEY) || '{}');
        raw[key] = Date.now();
        localStorage.setItem(NOTIF_DEDUP_KEY, JSON.stringify(raw));
      } catch {}
    };

    const saveNotifToFirestore = async (title: string, body: string, data?: any) => {
      try {
        const key = `${title}:${body}:${data?.relatedMedicineId || data?.medicineId || ''}`;
        const dedup = getDedupSet();
        if (dedup.has(key)) return; // duplicate
        addToDedup(key);

        const { collection, addDoc } = await import('firebase/firestore');
        await addDoc(collection(db, 'users', userId, 'notifications'), {
          title,
          body,
          timestamp: Date.now(),
          type: 'info',
          isRead: false,
          ...(data?.relatedMedicineId ? { relatedMedicineId: data.relatedMedicineId } : {}),
          ...(data?.medicineId ? { relatedMedicineId: data.medicineId } : {}),
        });
      } catch (e) {
        console.log('saveNotifToFirestore error:', e);
      }
    };

    // استقبال الإشعارات وهو مفتوح
    await FirebaseMessaging.addListener('notificationReceived', async (event: any) => {
      const title = event.notification?.title || 'Easy Drug';
      const body = event.notification?.body || '';
      const data = event.notification?.data;
      await saveNotifToFirestore(title, body, data);
      onNotification(title, body, data);
    });

    // لما المستخدم يضغط على الإشعار
    // لو التطبيق كان شغال → الإشعار اتحفظ من notificationReceived → navigation بس
    // لو التطبيق كان مقفول → notificationReceived ماتبعتش → نحفظ هنا
    await FirebaseMessaging.addListener('notificationActionPerformed', async (event: any) => {
      const title = event.notification?.title || 'Easy Drug';
      const body  = event.notification?.body  || '';
      const data  = event.notification?.data;

      // نحاول نحفظ — الـ dedup هيمنع التكرار لو اتحفظ قبل كده
      await saveNotifToFirestore(title, body, data);

      if (onTap) {
        onTap(data);
      } else {
        onNotification(title, body, data);
      }
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
      await reg.showNotification('💊 أدوية اليوم - Easy Drug', {
        body,
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        tag: 'daily-featured',
        renotify: true,
        data: { url: '/' }
      } as NotificationOptions);
    } else {
      new Notification('💊 أدوية اليوم - Easy Drug', { body, icon: '/icon-192.png', tag: 'daily-featured' });
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
