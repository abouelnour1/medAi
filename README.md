# EasyDrug — iOS Redesign (Phase 1)

## اللي اتعمل في الـ session ده

### ✅ ملفات جديدة (انسخها لمشروعك)

1. **`components/ui/ios/theme.ts`** — ألوان iOS + typography + gradient presets
2. **`components/ui/ios/icons.tsx`** — 25+ SF-style SVG icons كـ React components
3. **`components/ui/ios/index.tsx`** — الـ primitives الأساسية:
   - `List`, `Row`, `Tile`
   - `Switch`, `Segmented`
   - `SearchField`, `NavBar`, `LargeTitle`
   - `Badge`, `StatBox`, `ActionBtn`
   - `QuickTile`, `BoxPlaceholder`
   - `IOSTabBar`
4. **`components/IOSPreviewScreen.tsx`** — شاشة معاينة تفاعلية كاملة (Home → Results → Detail, Insurance, Saved, Settings)

### ✅ تعديلات على `App.tsx`

- إضافة `import` للـ `IOSPreviewScreen` كـ lazy component
- إضافة state: `showIOSPreview`
- إضافة condition في بداية `renderContent` لعرض الشاشة
- إضافة **بانر أزرق جميل** فوق Quick Tools في الـ home (بس لما ما يكونش في بحث نشط) اسمه "✨ التصميم الجديد"

---

## طريقة التشغيل

1. انسخ الملفات الجديدة من المجلد لمشروعك
2. استبدل `App.tsx` القديم بالجديد
3. شغّل:
   ```bash
   npm run build
   npx cap sync android
   ```
4. افتح التطبيق → لما تدخل تاب Search بدون بحث هتلاقي بانر أزرق فوق Quick Tools
5. اضغط عليه → هتفتح شاشة المعاينة iOS style
6. جرّب كل الـ tabs (Search / Insurance / Saved / Settings)
7. في Settings اضغط "Exit Preview" للرجوع

---

## ملاحظات مهمة

### التصميم الحالي في المعاينة
- **LTR** (إنجليزي زي الموكاب)
- **Light mode** ثابت
- **Data ثابتة (mock)** — مش متوصلة بالداتا الحقيقية لسه
- البحث في الـ home لما تكتب حاجة بتنقل لشاشة Results mock

### التصميم الحالي مش متأثر
الشاشة القديمة لسه شغالة عادي — ده مجرد preview منفصل عشان تشوف الشكل الجديد قبل ما نبدأ الـ migration.

### الـ iOS primitives جاهزة للاستخدام
كل المكونات في `components/ui/ios/` جاهزة، ممكن تستخدمها في أي شاشة بالشكل ده:
```tsx
import { List, Row, Tile, Icon, tileGradients, iOS } from './ui/ios';

<List header="Section title">
  <Row
    leading={
      <Tile from={tileGradients.blue.from} to={tileGradients.blue.to}>
        <Icon.pill color="#fff" size={16} />
      </Tile>
    }
    title="Row title"
    subtitle="Subtitle"
    chevron
    onClick={() => {}}
  />
</List>
```

---

## الخطوات القادمة (الـ sessions الجاية)

### Phase 2 — تحويل الشاشة الرئيسية بالداتا الحقيقية
- تبديل `Home` → `IOSHomeScreen` يستخدم الداتا الفعلية
- ربط Quick Tools بالـ actions الحقيقية (Pediatric Calc, Drug Test, etc.)
- ربط Recent searches و Featured today بالداتا الحقيقية

### Phase 3 — تحويل الشاشات الباقية
- Search Results → MedRow بدل MedicineCard
- MedicineDetail → التصميم الجديد (أكبر شاشة في المشروع)
- Insurance, Saved, Settings

### Phase 4 — تنظيف
- حذف `BottomNavBar` القديم (تم استبداله بالـ `IOSTabBar`)
- تحديث `index.html` لـ `dir="ltr"` (لو قررت تثبت الإنجليزي)
- حذف RTL overrides من Tailwind إلخ
- حذف `IOSPreviewScreen` أو تحويله لـ default Home
