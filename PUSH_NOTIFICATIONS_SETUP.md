# إعداد Push Notifications على Android

## المشكلة الحالية
الكود جاهز بس في ٣ خطوات لازم تعملها:

---

## ١. google-services.json (مطلوب أولاً)
1. افتح: https://console.firebase.google.com/project/medainew-fa6a2/settings/general
2. نزّل إلى Android → Add app لو مش موجود
3. نزّل `google-services.json`
4. احطه في: `android/app/google-services.json`
5. بعدين: `npx cap sync android`

---

## ٢. Cloud Function (لإرسال للكل)
```bash
npm install -g firebase-tools
firebase login
cd functions
npm install
cd ..
firebase deploy --only functions
```

الـ Function بتشتغل تلقائياً لما تتغير أدوية اليوم في Firestore.

---

## ٣. Android Notification Channel
في `android/app/src/main/res/values/strings.xml` أضف:
```xml
<string name="default_notification_channel_id">daily_featured</string>
```

---

## التحقق إن كل شيء شغال
1. بناء APK: `npm run build && npx cap sync android`
2. فتح Android Studio → Run
3. في الـ app: اضغط على تفعيل الإشعارات
4. غيّر أدوية اليوم من الأدمن
5. لازم توصل إشعار خلال ثواني
