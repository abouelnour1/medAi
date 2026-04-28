import React from 'react';
import { Language } from '../types';

interface Props { language: Language; onBack: () => void; }

const PrivacyPolicy: React.FC<Props> = ({ language, onBack }) => {
  const ar = language === 'ar';
  return (
    <div className="min-h-full pb-8 px-4 pt-4" style={{ direction: ar ? 'rtl' : 'ltr' }}>
      <h1 className="text-xl font-black text-slate-800 dark:text-white mb-1">
        {ar ? '🔒 سياسة الخصوصية' : '🔒 Privacy Policy'}
      </h1>
      <p className="text-[10px] text-slate-400 mb-5">{ar ? 'آخر تحديث: 2025' : 'Last updated: 2025'}</p>

      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <section>
          <h2 className="font-black text-slate-700 dark:text-white mb-1">{ar ? 'ما المعلومات التي نجمعها' : 'What We Collect'}</h2>
          <p>{ar
            ? 'نجمع فقط: اسم المستخدم، البريد الإلكتروني، التخصص المهني. لا نجمع بيانات شخصية أخرى.'
            : 'We collect only: username, email, professional specialty. No other personal data is collected.'
          }</p>
        </section>

        <section>
          <h2 className="font-black text-slate-700 dark:text-white mb-1">{ar ? 'كيف نستخدم بياناتك' : 'How We Use Your Data'}</h2>
          <p>{ar
            ? 'بياناتك تُستخدم فقط لتسجيل الدخول وتخصيص تجربة التطبيق. لا نبيع ولا نشارك بياناتك مع أطراف ثالثة.'
            : 'Your data is used only for authentication and personalizing your app experience. We never sell or share your data with third parties.'
          }</p>
        </section>

        <section>
          <h2 className="font-black text-slate-700 dark:text-white mb-1">{ar ? 'تخزين البيانات' : 'Data Storage'}</h2>
          <p>{ar
            ? 'بيانات الحساب محفوظة على Firebase (Google). بيانات المخزون والطلبات محفوظة محلياً على جهازك فقط.'
            : 'Account data is stored on Firebase (Google). Stock and order data is stored locally on your device only.'
          }</p>
        </section>

        <section>
          <h2 className="font-black text-slate-700 dark:text-white mb-1">{ar ? 'Analytics' : 'Analytics'}</h2>
          <p>{ar
            ? 'نستخدم Firebase Analytics لقياس أداء التطبيق (عدد المستخدمين، أكثر الأدوية بحثاً). لا توجد بيانات تعريفية شخصية.'
            : 'We use Firebase Analytics to measure app performance (user count, most searched drugs). No personally identifiable data.'
          }</p>
        </section>

        <section>
          <h2 className="font-black text-slate-700 dark:text-white mb-1">{ar ? 'حذف الحساب' : 'Account Deletion'}</h2>
          <p>{ar
            ? 'يمكنك طلب حذف حسابك وبياناتك بالكامل عبر التواصل معنا على WhatsApp من الإعدادات.'
            : 'You can request full account and data deletion by contacting us via WhatsApp in Settings.'
          }</p>
        </section>

        <section>
          <h2 className="font-black text-slate-700 dark:text-white mb-1">{ar ? 'تنبيه طبي' : 'Medical Disclaimer'}</h2>
          <p className="text-amber-600 dark:text-amber-400 font-bold">{ar
            ? 'EasyDrug هو مرجع معلوماتي فقط. لا يُعدّ بديلاً عن الاستشارة الطبية أو الصيدلانية المتخصصة. دائماً راجع مصادر رسمية معتمدة.'
            : 'EasyDrug is an informational reference only. It is not a substitute for professional medical or pharmacist consultation. Always verify with official approved sources.'
          }</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
