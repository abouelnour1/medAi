import React, { useState } from 'react';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const B = {
  teal700: '#006a60',
  teal500: '#00a896',
  teal300: '#7fd4c6',
  teal100: '#cdeee7',
  teal50:  '#eef9f6',
  gold500: '#e0a84a',
  gold100: '#faecd0',
  ink:     '#0e1a18',
  ink60:   '#55605c',
  ink20:   '#c9cfcc',
  ink10:   '#e6eae7',
  paper:   '#f7f9f6',
  white:   '#ffffff',
};

// ── EDMark (الشعار) ───────────────────────────────────────────────────────────
function EDMark({ size = 56 }: { size?: number }) {
  const r = size * 0.22;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x="2" y="2" width="96" height="96" rx={r} fill={B.teal700}/>
      <g opacity="0.12">
        <rect x="22" y="22" width="56" height="56" fill={B.white}/>
        <rect x="22" y="22" width="56" height="56" fill={B.white} transform="rotate(45 50 50)"/>
      </g>
      <g fill={B.white}>
        <rect x="42" y="24" width="16" height="52" rx="4"/>
        <rect x="24" y="42" width="52" height="16" rx="4"/>
      </g>
      <rect x="42" y="42" width="16" height="16" fill={B.teal500} opacity="0.85"/>
    </svg>
  );
}

interface Props {
  onClose: () => void;
  onSubscribe: (plan: 'monthly' | 'yearly') => Promise<void>;
  onRestore?: () => void;
  language?: 'ar' | 'en';
  currentPlan?: 'monthly' | 'yearly' | null;
  expiresAt?: string | null;
  daysLeft?: number | null;
}

const MONTHLY_PRICE = '14.99';
const YEARLY_PRICE  = '99.99';
const YEARLY_MO_EQ  = '8.33';
const CUR           = 'ر.س';

const PlansPage: React.FC<Props> = ({
  onClose, onSubscribe, onRestore,
  language = 'ar',
  currentPlan, expiresAt, daysLeft,
}) => {
  const ar = language === 'ar';
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading]   = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try { await onSubscribe(selected); } catch {}
    setLoading(false);
  };

  const features = [
    { icon: '📋', ar: 'وصفات طبية كاملة',         en: 'Full prescription management' },
    { icon: '🚫', ar: 'بدون إعلانات',               en: 'Ad-free experience' },
    { icon: '🔓', ar: 'وصول لجميع الميزات',         en: 'All features unlocked' },
    { icon: '⚡', ar: 'تحديثات وميزات جديدة أولاً', en: 'Early access to new features' },
    { icon: '💊', ar: 'قاعدة بيانات الأدوية الكاملة',en: 'Full medicines database' },
    { icon: '🧮', ar: 'حاسبة جرعات الأطفال',        en: 'Pediatric dose calculator' },
  ];

  return (
    <div
      className="fixed inset-0 z-[400] overflow-y-auto"
      style={{ background: B.paper, direction: ar ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <div style={{ background: B.teal700 }} className="relative px-5 pt-12 pb-10 text-center">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)', color: B.white }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <EDMark size={52} />
          <div style={{ textAlign: ar ? 'right' : 'left' }}>
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: "'IBM Plex Sans Arabic', serif", fontWeight: 700, fontSize: 22, color: B.white, direction: 'rtl' }}>
                إيزي<span style={{ color: B.teal300 }}>درج</span>
              </span>
              <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.3)', display: 'inline-block', verticalAlign: 'middle' }} />
              <span style={{ fontWeight: 600, fontSize: 18, color: B.white, letterSpacing: '-0.02em' }}>
                Easy<span style={{ color: B.teal300 }}>Drug</span>
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 600, marginTop: 2 }}>
              {ar ? 'المرجع الدوائي للصيدلاني السعودي' : 'Pharmaceutical reference for KSA pharmacists'}
            </p>
          </div>
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
          style={{ background: B.gold500, color: B.ink }}
        >
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{ fontWeight: 800, fontSize: 12 }}>Premium</span>
        </div>

        <h1 style={{ color: B.white, fontSize: 22, fontWeight: 900, marginBottom: 6, lineHeight: 1.2 }}>
          {ar ? 'ارقَ تجربتك كصيدلاني' : 'Elevate your pharmacy experience'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500 }}>
          {ar ? 'وصول كامل، بدون إعلانات، وصفات طبية' : 'Full access · No ads · Prescriptions'}
        </p>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">

        {/* Active subscription badge */}
        {currentPlan && daysLeft !== null && daysLeft !== undefined && daysLeft > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: B.teal50, border: `1.5px solid ${B.teal100}` }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <p style={{ fontWeight: 800, fontSize: 13, color: B.teal700 }}>
                {ar ? `مشترك — ${currentPlan === 'yearly' ? 'سنوي' : 'شهري'}` : `Active — ${currentPlan}`}
              </p>
              <p style={{ fontSize: 11, color: B.ink60 }}>
                {ar ? `ينتهي بعد ${daysLeft} يوم` : `Expires in ${daysLeft} days`}
              </p>
            </div>
          </div>
        )}

        {/* Features grid */}
        <div>
          <p style={{ fontWeight: 800, fontSize: 11, color: B.ink60, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            {ar ? 'ما تحصل عليه' : 'What you get'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 p-3 rounded-2xl" style={{ background: B.white, border: `1.5px solid ${B.ink10}` }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{f.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: B.ink, lineHeight: 1.3 }}>{ar ? f.ar : f.en}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div>
          <p style={{ fontWeight: 800, fontSize: 11, color: B.ink60, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            {ar ? 'اختر خطتك' : 'Choose your plan'}
          </p>
          <div className="space-y-3">

            {/* Yearly */}
            <button
              onClick={() => setSelected('yearly')}
              className="w-full text-right"
              style={{
                background: selected === 'yearly' ? B.teal50 : B.white,
                border: `2px solid ${selected === 'yearly' ? B.teal500 : B.ink10}`,
                borderRadius: 16, padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${selected === 'yearly' ? B.teal500 : B.ink20}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {selected === 'yearly' && <div style={{ width: 10, height: 10, borderRadius: '50%', background: B.teal500 }} />}
                </div>
                <div style={{ textAlign: ar ? 'right' : 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: B.ink }}>{ar ? 'سنوي' : 'Yearly'}</span>
                    <span style={{ background: B.teal500, color: B.white, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
                      {ar ? 'وفّر 44%' : 'Save 44%'}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: B.ink60, marginTop: 2 }}>
                    {ar ? `${YEARLY_MO_EQ} ${CUR}/شهر` : `${YEARLY_MO_EQ} SAR/mo`}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: ar ? 'left' : 'right' }}>
                <p style={{ fontWeight: 900, fontSize: 18, color: B.teal700, lineHeight: 1 }}>{YEARLY_PRICE}</p>
                <p style={{ fontSize: 10, color: B.ink60, marginTop: 2 }}>{ar ? `${CUR}/سنة` : 'SAR/yr'}</p>
              </div>
            </button>

            {/* Monthly */}
            <button
              onClick={() => setSelected('monthly')}
              className="w-full text-right"
              style={{
                background: selected === 'monthly' ? B.teal50 : B.white,
                border: `2px solid ${selected === 'monthly' ? B.teal500 : B.ink10}`,
                borderRadius: 16, padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${selected === 'monthly' ? B.teal500 : B.ink20}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {selected === 'monthly' && <div style={{ width: 10, height: 10, borderRadius: '50%', background: B.teal500 }} />}
                </div>
                <p style={{ fontWeight: 800, fontSize: 14, color: B.ink }}>{ar ? 'شهري' : 'Monthly'}</p>
              </div>
              <div style={{ textAlign: ar ? 'left' : 'right' }}>
                <p style={{ fontWeight: 900, fontSize: 18, color: B.ink, lineHeight: 1 }}>{MONTHLY_PRICE}</p>
                <p style={{ fontSize: 10, color: B.ink60, marginTop: 2 }}>{ar ? `${CUR}/شهر` : 'SAR/mo'}</p>
              </div>
            </button>
          </div>
        </div>

        {/* Free plan comparison */}
        <div style={{ background: B.white, border: `1.5px solid ${B.ink10}`, borderRadius: 16, padding: '14px 16px' }}>
          <p style={{ fontWeight: 800, fontSize: 12, color: B.ink60, marginBottom: 10 }}>
            {ar ? 'المجاني مقابل Premium' : 'Free vs Premium'}
          </p>
          <div className="space-y-2">
            {[
              { f: ar ? 'بحث الأدوية'         : 'Medicine search',      free: true,  premium: true  },
              { f: ar ? 'حاسبة الجرعات'       : 'Dose calculator',      free: true,  premium: true  },
              { f: ar ? 'التأمين والأسعار'     : 'Insurance & prices',   free: true,  premium: true  },
              { f: ar ? 'الإعلانات'            : 'Ads',                  free: true,  premium: false },
              { f: ar ? 'الوصفات الطبية'       : 'Prescriptions',        free: false, premium: true  },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: i < 4 ? `1px solid ${B.ink10}` : 'none' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: B.ink }}>{row.f}</span>
                <div style={{ display: 'flex', gap: 24 }}>
                  <span style={{ fontSize: 14 }}>{row.free ? '✅' : '❌'}</span>
                  <span style={{ fontSize: 14 }}>{row.premium ? '✅' : '🚫'}</span>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, paddingTop: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: B.ink60 }}>{ar ? 'مجاني' : 'Free'}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: B.teal700 }}>Premium</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            width: '100%', padding: '16px',
            background: `linear-gradient(135deg, ${B.teal700}, ${B.teal500})`,
            color: B.white, fontWeight: 900, fontSize: 15,
            borderRadius: 16, border: 'none',
            boxShadow: `0 8px 24px ${B.teal300}80`,
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.15s', cursor: 'pointer',
          }}
        >
          {loading
            ? (ar ? 'جاري المعالجة...' : 'Processing...')
            : (ar
              ? `اشترك الآن — ${selected === 'yearly' ? YEARLY_PRICE : MONTHLY_PRICE} ${CUR}`
              : `Subscribe — ${selected === 'yearly' ? YEARLY_PRICE : MONTHLY_PRICE} SAR`)}
        </button>

        {onRestore && (
          <button
            onClick={onRestore}
            style={{ width: '100%', textAlign: 'center', fontSize: 12, fontWeight: 700, color: B.ink60, padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {ar ? 'استعادة الاشتراك السابق' : 'Restore purchase'}
          </button>
        )}

        <p style={{ textAlign: 'center', fontSize: 10, color: B.ink20, lineHeight: 1.5, paddingBottom: 32 }}>
          {ar
            ? 'يتجدد تلقائياً · يمكن الإلغاء في أي وقت من إعدادات Google Play · الأسعار بالريال السعودي'
            : 'Auto-renews · Cancel anytime via Google Play · Prices in SAR'}
        </p>
      </div>
    </div>
  );
};

export default PlansPage;
