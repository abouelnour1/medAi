# PharmaSource KSA 🏥

## المتطلبات
- Node.js v18+
- npm v9+

## خطوات التشغيل للمرة الأولى

```bash
# 1. تنصيب الحزم (مرة واحدة فقط)
npm install

# 2. تشغيل للتطوير
npm run dev

# 3. البناء للإنتاج
npm run build
```

## متغيرات البيئة
أنشئ ملف `.env.local` وأضف:
```
VITE_API_KEY=your_gemini_api_key
```

## البناء لـ Android
```bash
npm run build
npx cap sync
npx cap open android
```

## ملاحظات هامة
- Tailwind يعمل **offline** بالكامل بعد npm install
- Firebase مدعوم بـ offline cache تلقائياً
- sw.js يعمل كـ PWA cache

## هيكل المشروع
```
├── index.html          # نقطة الدخول
├── index.tsx           # React entry
├── App.tsx             # المكون الرئيسي
├── tailwind.css        # Global styles
├── tailwind.config.js  # إعدادات Tailwind (offline)
├── postcss.config.js   # PostCSS
├── vite.config.ts      # إعدادات Vite
├── firebase.ts         # Firebase config
├── components/         # المكونات
│   └── auth/           # مكونات المصادقة
├── data/               # بيانات الأدوية
└── utils/              # أدوات مساعدة
```
