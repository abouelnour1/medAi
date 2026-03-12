# 🔔 FCM Push Notifications — دليل الإعداد الكامل

## الخطوة ١: VAPID Key (للـ Web/PWA)

1. روح **Firebase Console** → مشروعك
2. **Project Settings** ⚙️ → تبويب **Cloud Messaging**
3. تحت **Web configuration** → **Generate key pair**
4. انسخ الـ key وحطه في `.env.local`:
   ```
   VITE_VAPID_KEY=BEl62iUYgUivxI...
   ```
5. كمان حطه في **Vercel** → Settings → Environment Variables

---

## الخطوة ٢: Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

**Functions اللي هتتدبلوي:**
- `sendNotification` — للأدمن يبعت push
- `priceChangeAlert` — تلقائي لما سعر دواء يتغير
- `notifyDailyFeatured` — تلقائي لأدوية اليوم
- `geminiProxy` — موجود بالفعل
- `generateClinical` — موجود بالفعل

---

## الخطوة ٣: android/app — google-services.json

تأكد إن ملف `google-services.json` موجود في `android/app/`
(نزّله من Firebase Console → Project Settings → Android apps)

---

## الخطوة ٤: اختبار

1. افتح التطبيق
2. روح Settings → اضغط **تفعيل الإشعارات**
3. وافق على الإذن
4. روح Admin Dashboard → Notifications → ابعت إشعار تجريبي

---

## ملاحظات مهمة

- الـ FCM **مجاني بالكامل** بدون حدود
- الإشعارات بتوصل حتى لو التطبيق مقفول
- الـ price change alerts بتشتغل تلقائياً لما تحدّث الداتا
- الـ service worker (`firebase-messaging-sw.js`) موجود بالفعل في المشروع
