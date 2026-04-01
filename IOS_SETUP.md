# iOS Setup Guide - Easy Drug

## المتطلبات
- Mac (مش ممكن تعمل iOS build على Windows)
- Xcode 15+ (من App Store)
- Apple Developer Account ($99/year)

## الخطوات

### ١. تثبيت الـ packages
```bash
npm install
npx cap add ios
```

### ٢. Build + Sync
```bash
npm run ios:build
```

### ٣. فتح Xcode
```bash
npx cap open ios
```

### ٤. في Xcode
- اختار Team (Apple Developer Account)
- غير Bundle ID لو محتاج: `com.easydrug.ksa`
- Signing & Capabilities → Automatic Signing

### ٥. إضافة Push Notifications في Xcode
Signing & Capabilities → + → Push Notifications

### ٦. GoogleService-Info.plist
- نزّله من Firebase Console
- حطه في: `ios/App/App/GoogleService-Info.plist`

### ٧. Run على Device أو Simulator
- اختار الـ device من القائمة العلوية
- ⌘ + R

---

## Safe Area على iPhone
الكود جاهز - `contentInset: 'automatic'` في capacitor.config.ts
بيتعامل مع الـ Dynamic Island والـ notch تلقائياً.

## الفرق بين Android و iOS في التطبيق
| الميزة | Android | iOS |
|--------|---------|-----|
| Safe Area | `env(safe-area-inset-top)` | Handled by Capacitor |
| Status Bar | `#0f766e` | Light style |
| Keyboard | resize none | resize ionic |
| Push | FCM | APNs + FCM |

