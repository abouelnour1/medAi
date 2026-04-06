# إصلاح مشكلة Google Login في الأندرويد
## المشكلة
لما بتضغط "تسجيل الدخول بجوجل" في الأندرويد، بيفتح متصفح جوجل بدل ما يكمل جوا التطبيق.

## السبب
Google OAuth محتاج `intent-filter` صح في `AndroidManifest.xml` عشان يعرف يرجع للتطبيق بعد تسجيل الدخول.

---

## الإصلاح — خطوتين بس

### الخطوة 1: بعد `npx cap add android` افتح الملف:
```
android/app/src/main/AndroidManifest.xml
```

### الخطوة 2: ابحث عن `<activity` الرئيسية وأضف الـ `intent-filter` ده جوا الـ `<activity>`:

```xml
<activity
    android:name="com.getcapacitor.BridgeActivity"
    android:exported="true"
    android:launchMode="singleTask"
    android:theme="@style/AppTheme.NoActionBarLaunch"
    android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode">

    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>

    <!-- ✅ أضف هذا الـ intent-filter عشان Google OAuth يرجع للتطبيق -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="com.easydrug.ksa" />
    </intent-filter>

</activity>
```

---

## الخطوة 3: في Firebase Console
1. افتح **Firebase Console** → مشروعك → **Authentication** → **Sign-in method** → **Google**
2. تأكد إن **SHA-1** و **SHA-256** للتطبيق مضافين في **Project Settings** → **Your apps** → Android app
3. حمّل `google-services.json` من جديد بعد إضافة الـ SHA

### كيف تجيب الـ SHA:
```bash
cd android
./gradlew signingReport
```
خذ قيمة `SHA1` و `SHA-256` من **debug** أو **release** حسب البيلد وأضفهم في Firebase.

---

## الخطوة 4: في Google Cloud Console
1. افتح [console.cloud.google.com](https://console.cloud.google.com)
2. اختار مشروعك → **APIs & Services** → **Credentials**
3. افتح الـ **Android OAuth Client** وتأكد إن:
   - **Package name**: `com.easydrug.ksa`
   - **SHA-1**: نفس اللي طلعه `signingReport`

---

## بعد كل التعديلات:
```bash
npx cap sync android
npx cap open android
# ثم Build → Run في Android Studio
```
