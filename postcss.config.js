
export default {
  plugins: {
    // تم إيقاف المكونات الإضافية هنا لحل مشكلة 'Cannot find module tailwindcss' أثناء البناء (Build)
    // الاعتماد كلياً على Tailwind CDN في ملف index.html لمعالجة الكلاسات في المتصفح مباشرة
  },
}
