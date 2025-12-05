# خطوات إعداد الأندرويد (مهم جداً)

لجعل تطبيق الأندرويد يعمل مع Firebase بشكل صحيح، يجب عليك تعديل ملفات النظام يدوياً بعد تحويل التطبيق (بعد تشغيل `npx cap add android`).

## 1. وضع ملف google-services.json
تأكد من أنك قمت بتحميل ملف `google-services.json` من لوحة تحكم Firebase ووضعه داخل المسار التالي في مشروعك:
`android/app/google-services.json`

## 2. تعديل ملف Android Build الرئيسي
افتح الملف: `android/build.gradle`
ابحث عن قسم `dependencies` وأضف السطر الخاص بخدمات جوجل:

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.0.0' // قد يختلف الإصدار
        // >>> أضف هذا السطر <<<
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

## 3. تعديل ملف App Build
افتح الملف: `android/app/build.gradle`

أضف السطور التالية في الأماكن المحددة:

```gradle
plugins {
    id 'com.android.application'
    // >>> أضف هذا السطر <<<
    id 'com.google.gms.google-services'
}

android {
    // ... إعدادات الأندرويد ...
}

dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    // ... مكتبات أخرى ...

    // >>> أضف مكتبات الفايربيز الأساسية <<<
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-analytics'
    implementation 'com.google.firebase:firebase-auth'
    implementation 'com.google.firebase:firebase-firestore'
}
```

## 4. الخطوة الأخيرة
بعد حفظ التعديلات، قم بتشغيل الأمر التالي في التيرمينال لتحديث المشروع:
`npx cap sync`
