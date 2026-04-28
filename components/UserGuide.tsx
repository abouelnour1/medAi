import React, { useState } from 'react';
import { Language } from '../types';

interface Props { language: Language; onBack: () => void; }

const sections = [
  {
    icon: '🔍', titleAr: 'البحث عن الدواء', titleEn: 'Drug Search',
    bodyAr: `• ابحث باسم الدواء التجاري أو العلمي أو رقم ICD-10\n• الضغط المطوّل على كارت الدواء يفتح عرضاً سريعاً\n• استخدم * للبحث المتقدم مثل: amox* للبحث عن كل ما يبدأ بـ amox\n• ميزة الـ Fuzzy Search: تجد الدواء حتى لو الإملاء غلط قليلاً\n• البحث يدعم العربية والإنجليزية`,
    bodyEn: `• Search by trade name, scientific name, or ICD-10 code\n• Long press on a medicine card for quick view\n• Use * for wildcard search e.g. amox* finds all amoxicillin variants\n• Fuzzy Search: finds results even with slight spelling errors\n• Supports both Arabic and English search`
  },
  {
    icon: '👶', titleAr: 'جرعات الأطفال', titleEn: 'Pediatric Dosing',
    bodyAr: `• من Quick Doses في الصفحة الرئيسية أو من الحاسبة الكاملة\n• أدخل الوزن بالكيلو أو العمر\n• اختر الدواء من القائمة\n• لإضافة جرعة جديدة: أرسل Excel/بيانات للمطوّر عبر WhatsApp في الإعدادات\n• الجرعات مرتبطة بالتشخيص لبعض الأدوية مثل Amoxicillin`,
    bodyEn: `• Access from Quick Doses on home or the full calculator\n• Enter weight in kg or age\n• Select drug from the list\n• To add a new dose: send Excel data via WhatsApp in Settings\n• Some drugs have indication-specific dosing e.g. Amoxicillin`
  },
  {
    icon: '🛡️', titleAr: 'التأمين الصحي', titleEn: 'Insurance',
    bodyAr: `• ابحث عن الدواء بالاسم التجاري أو العلمي\n• ابحث بالمرض (Indication) لمعرفة الأدوية المغطاة\n• فلتر بالـ Class الدوائي لتضييق النتائج\n• الكارت الأخضر = مغطى، الأحمر = غير مغطى`,
    bodyEn: `• Search by trade or scientific name\n• Search by indication to find covered drugs\n• Filter by pharmacological class to narrow results\n• Green card = covered, Red card = not covered`
  },
  {
    icon: '🦠', titleAr: 'البحث بالمرض', titleEn: 'By Disease',
    bodyAr: `• ابحث عن المرض للعثور على الأدوية المناسبة\n• النتائج مرتبة: Class → Subclass → المادة الفعالة → الأدوية المتاحة\n• العدد الأخضر = عدد الأدوية المتاحة في قاعدة البيانات`,
    bodyEn: `• Search for a disease to find appropriate medications\n• Results organized: Class → Subclass → Active Ingredient → Available drugs\n• Green number = available medicines count in database`
  },
  {
    icon: '📦', titleAr: 'المخزون والطلبات', titleEn: 'Stock & Orders',
    bodyAr: `• المخزون: أضف منشآتك وتتبع كميات الأدوية\n• الطلبات: سجّل طلبات الأدوية للموردين\n• يعمل بدون إنترنت — البيانات محفوظة محلياً`,
    bodyEn: `• Stock: Add your facilities and track medicine quantities\n• Orders: Record drug orders for suppliers\n• Works offline — data saved locally`
  },
  {
    icon: '⭐', titleAr: 'المفضلة والمقارنة', titleEn: 'Favorites & Compare',
    bodyAr: `• اضغط على النجمة لإضافة دواء للمفضلة\n• الضغط المطوّل ثم اختر دواءين للمقارنة\n• المفضلة تحتاج تسجيل دخول`,
    bodyEn: `• Tap the star icon to add a medicine to favorites\n• Long press then select two medicines to compare\n• Favorites require login`
  },
  {
    icon: '🍎', titleAr: 'البدائل الغذائية', titleEn: 'Food Alternatives',
    bodyAr: `• عند فتح كارت منتج غذائي اضغط على البدائل\n• يعرض منتجات بنفس المكونات النشطة`,
    bodyEn: `• Open a food/supplement card then tap Alternatives\n• Shows products with the same active ingredients`
  },
];

const UserGuide: React.FC<Props> = ({ language, onBack }) => {
  const ar = language === 'ar';
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-full pb-8" style={{ direction: ar ? 'rtl' : 'ltr' }}>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-black text-slate-800 dark:text-white">
          {ar ? '📖 دليل المستخدم' : '📖 User Guide'}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {ar ? 'كل ما تحتاج لمعرفته عن التطبيق' : 'Everything you need to know about the app'}
        </p>
      </div>

      <div className="px-4 space-y-2 mt-2">
        {sections.map((s, i) => (
          <div key={i} className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border overflow-hidden shadow-sm">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
            >
              <span className="text-2xl flex-shrink-0">{s.icon}</span>
              <span className="flex-1 font-black text-sm text-slate-700 dark:text-white text-start">
                {ar ? s.titleAr : s.titleEn}
              </span>
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${open === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {open === i && (
              <div className="px-4 pb-4">
                <div className="h-px bg-slate-100 dark:bg-dark-border mb-3" />
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                  {ar ? s.bodyAr : s.bodyEn}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* App version */}
        <div className="text-center py-4">
          <p className="text-[10px] text-slate-300 font-bold">EasyDrug v9 · 2025</p>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
