# نشر Firebase Cloud Functions

## الخطوات (مرة واحدة بس)

### ١. تثبيت Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### ٢. حفظ الـ API Key في Firebase Secret Manager (مش في الكود!)
```bash
firebase functions:secrets:set GEMINI_API_KEY
# هيطلب منك تكتب الـ key - اكتبه وادوس Enter
```

### ٣. نشر الـ Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### ٤. تحديث الـ Firebase config في الـ client
بعد الـ deploy، الـ client هيكلم Functions تلقائياً.

---

## ليه ده أكثر أماناً؟

| قبل | بعد |
|-----|-----|
| API key في الـ JS bundle | API key في Firebase Secret Manager |
| أي حد يفتح DevTools يشوفه | مستحيل يوصله |
| Android APK → unzip → يلاقيه | مش موجود في الـ APK |

---

## الـ Functions الجديدة

- `geminiProxy` - كل طلبات المساعد الذكي
- `generateClinical` - توليد المعلومات السريرية  
- `notifyDailyFeatured` - إشعارات أدوية اليوم
