import React, { useState } from 'react';

interface Props {
  onClose: () => void;
  onSubscribe: (plan: 'monthly' | 'yearly') => Promise<void>;
  language?: 'ar' | 'en';
  featureName?: string;
}

const MONTHLY_PRICE = '14.99';
const YEARLY_PRICE = '99.99';
const YEARLY_MONTHLY_EQUIV = '8.33';
const CURRENCY = 'SAR';

const PaywallModal: React.FC<Props> = ({ onClose, onSubscribe, language = 'ar', featureName }) => {
  const ar = language === 'ar';
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await onSubscribe(selected);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const features = ar ? [
    { icon: '📋', text: 'إنشاء وصفات طبية وحفظها' },
    { icon: '🚫', text: 'بدون إعلانات' },
    { icon: '🔓', text: 'وصول كامل لجميع الميزات' },
    { icon: '⚡', text: 'تحديثات أولوية' },
  ] : [
    { icon: '📋', text: 'Create & save prescriptions' },
    { icon: '🚫', text: 'No ads' },
    { icon: '🔓', text: 'Full access to all features' },
    { icon: '⚡', text: 'Priority updates' },
  ];

  return (
    <div className="fixed inset-0 z-[400] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-dark-card rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-teal-500 via-cyan-500 to-indigo-500 px-6 pt-6 pb-8 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 active:scale-90">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-3">⭐</div>
          <h2 className="text-xl font-black text-white mb-1">
            {ar ? 'EasyDrug Premium' : 'EasyDrug Premium'}
          </h2>
          {featureName && (
            <p className="text-white/80 text-[12px] font-bold">
              {ar ? `للوصول لـ "${featureName}" فعّل Premium` : `Unlock "${featureName}" with Premium`}
            </p>
          )}
        </div>

        <div className="overflow-y-auto px-5 pt-5 pb-6 space-y-4">
          {/* Features */}
          <div className="grid grid-cols-2 gap-2">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                <span className="text-base">{f.icon}</span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Plan selector */}
          <div className="space-y-2">
            {/* Yearly */}
            <button
              onClick={() => setSelected('yearly')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                selected === 'yearly'
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-dark-card'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected === 'yearly' ? 'border-teal-500' : 'border-slate-300'}`}>
                  {selected === 'yearly' && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-black text-slate-700 dark:text-white">
                    {ar ? 'سنوي' : 'Yearly'}
                    <span className="mr-2 text-[10px] font-black bg-teal-500 text-white px-2 py-0.5 rounded-full">
                      {ar ? 'وفّر 44%' : 'Save 44%'}
                    </span>
                  </p>
                  <p className="text-[10px] font-bold text-slate-400">
                    {ar ? `${YEARLY_MONTHLY_EQUIV} ${CURRENCY}/شهر` : `${YEARLY_MONTHLY_EQUIV} ${CURRENCY}/mo`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[16px] font-black text-teal-600">{YEARLY_PRICE}</p>
                <p className="text-[10px] font-bold text-slate-400">{CURRENCY}/{ar ? 'سنة' : 'yr'}</p>
              </div>
            </button>

            {/* Monthly */}
            <button
              onClick={() => setSelected('monthly')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                selected === 'monthly'
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-dark-card'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected === 'monthly' ? 'border-teal-500' : 'border-slate-300'}`}>
                  {selected === 'monthly' && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                </div>
                <p className="text-[13px] font-black text-slate-700 dark:text-white">{ar ? 'شهري' : 'Monthly'}</p>
              </div>
              <div className="text-right">
                <p className="text-[16px] font-black text-slate-700 dark:text-white">{MONTHLY_PRICE}</p>
                <p className="text-[10px] font-bold text-slate-400">{CURRENCY}/{ar ? 'شهر' : 'mo'}</p>
              </div>
            </button>
          </div>

          {/* CTA */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-black text-[15px] rounded-2xl shadow-lg shadow-teal-200 dark:shadow-teal-900/30 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {loading
              ? (ar ? 'جاري المعالجة...' : 'Processing...')
              : (ar ? `اشترك الآن — ${selected === 'yearly' ? YEARLY_PRICE : MONTHLY_PRICE} ${CURRENCY}` : `Subscribe — ${selected === 'yearly' ? YEARLY_PRICE : MONTHLY_PRICE} ${CURRENCY}`)}
          </button>

          {/* Restore */}
          <button onClick={onClose} className="w-full text-[11px] font-bold text-slate-400 text-center py-1 active:opacity-70">
            {ar ? 'استعادة الاشتراك السابق' : 'Restore purchase'}
          </button>

          <p className="text-[9px] text-slate-300 dark:text-slate-600 text-center leading-relaxed">
            {ar
              ? 'يتجدد تلقائياً. يمكن الإلغاء في أي وقت من إعدادات Google Play.'
              : 'Auto-renews. Cancel anytime via Google Play settings.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
