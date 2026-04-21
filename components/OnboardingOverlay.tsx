import React, { useState, useEffect, useRef } from 'react';

const ONBOARD_KEY = 'ps_onboarded_v1';

// ── Brand ────────────────────────────────────────────────────────────────────
const T700 = '#006a60';
const T500 = '#00a896';
const T300 = '#7fd4c6';
const T50  = '#eef9f6';

function EDMark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x="2" y="2" width="96" height="96" rx={size * 0.22} fill={T700}/>
      <g opacity="0.12">
        <rect x="22" y="22" width="56" height="56" fill="#fff"/>
        <rect x="22" y="22" width="56" height="56" fill="#fff" transform="rotate(45 50 50)"/>
      </g>
      <g fill="#fff">
        <rect x="42" y="24" width="16" height="52" rx="4"/>
        <rect x="24" y="42" width="52" height="16" rx="4"/>
      </g>
      <rect x="42" y="42" width="16" height="16" fill={T500} opacity="0.85"/>
    </svg>
  );
}

// ── Screens data ─────────────────────────────────────────────────────────────
interface Screen {
  icon: React.ReactNode;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  hint?: { ar: string; en: string };
  bg: string;
  accent: string;
}

const SCREENS: Screen[] = [
  {
    bg: T700,
    accent: T300,
    icon: (
      <svg viewBox="0 0 64 64" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 64, height: 64 }}>
        <circle cx="28" cy="28" r="18" opacity="0.9"/>
        <line x1="41" y1="41" x2="56" y2="56"/>
        <line x1="28" y1="20" x2="28" y2="36"/>
        <line x1="20" y1="28" x2="36" y2="28"/>
      </svg>
    ),
    titleAr: 'ابحث واكتشف',
    titleEn: 'Search & Discover',
    bodyAr: 'ابحث عن أي دواء بالاسم التجاري أو العلمي.\nاضغط طويل على أي نتيجة لتعرض البدائل المتاحة فوراً.',
    bodyEn: 'Search any medicine by trade or scientific name.\nLong-press any result to instantly view alternatives.',
    hint: { ar: 'جرّب: اكتب "بانادول" أو "أموكسيل"', en: 'Try: type "Panadol" or "Amoxil"' },
  },
  {
    bg: '#005a52',
    accent: '#a8e6df',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 64, height: 64 }}>
        <rect x="8" y="10" width="48" height="44" rx="8" opacity="0.9"/>
        <line x1="32" y1="20" x2="32" y2="44"/>
        <line x1="20" y1="32" x2="44" y2="32"/>
        <circle cx="32" cy="32" r="8" fill="white" opacity="0.15"/>
      </svg>
    ),
    titleAr: 'حاسبة الجرعات',
    titleEn: 'Dose Calculator',
    bodyAr: 'افتح "Dosing" من القائمة السريعة.\nاختر الدواء والتركيز، أدخل وزن الطفل، والجرعة تطلع لحظياً بالـ ml والـ mg.',
    bodyEn: 'Tap "Dosing" from Quick Tools.\nSelect drug & concentration, enter child\'s weight, get instant dose in ml & mg.',
    hint: { ar: 'يدعم جرعات الأطفال من الولادة حتى ١٢ سنة', en: 'Supports pediatric doses from birth to 12 years' },
  },
  {
    bg: '#004a43',
    accent: '#e0a84a',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 64, height: 64 }}>
        <rect x="10" y="14" width="44" height="36" rx="8" opacity="0.9"/>
        <line x1="22" y1="26" x2="42" y2="26"/>
        <line x1="22" y1="34" x2="34" y2="34"/>
        <circle cx="50" cy="50" r="12" fill="#e0a84a" stroke="#e0a84a"/>
        <line x1="50" y1="44" x2="50" y2="50"/>
        <line x1="47" y1="50" x2="53" y2="50"/>
      </svg>
    ),
    titleAr: 'جرعات سريعة',
    titleEn: 'Quick Doses',
    bodyAr: 'بعد ما تحسب جرعة، اضغط "💾 حفظ كإعداد سريع".\nالمرة الجاية تلاقيه في الصفحة الرئيسية — بس حط الوزن.',
    bodyEn: 'After calculating a dose, tap "💾 Save as Quick Preset".\nNext time find it on the home screen — just enter the weight.',
    hint: { ar: 'يحفظ لحد ٥ أدوية مع الجرعة والتكرار', en: 'Saves up to 5 drugs with dose & frequency' },
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  language: 'ar' | 'en';
  onDone: () => void;
}

const OnboardingOverlay: React.FC<Props> = ({ language, onDone }) => {
  const ar = language === 'ar';
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left');
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const total = SCREENS.length;
  const s = SCREENS[step];
  const isLast = step === total - 1;

  const finish = () => {
    setExiting(true);
    setTimeout(() => {
      try { localStorage.setItem(ONBOARD_KEY, '1'); } catch {}
      onDone();
    }, 380);
  };

  const goTo = (next: number) => {
    if (animating || next < 0 || next >= total) return;
    setSlideDir(next > step ? 'left' : 'right');
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 220);
  };

  // Swipe
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (ar ? dx > 0 : dx < 0) isLast ? finish() : goTo(step + 1);
      else goTo(step - 1);
    }
    touchStartX.current = null;
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: s.bg,
        transition: 'background 0.4s ease, opacity 0.38s ease',
        opacity: exiting ? 0 : 1,
        direction: ar ? 'rtl' : 'ltr',
        display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Skip button */}
      <div style={{ display: 'flex', justifyContent: ar ? 'flex-start' : 'flex-end', padding: '18px 20px 0' }}>
        <button
          onClick={finish}
          style={{
            background: 'rgba(255,255,255,0.12)', border: 'none',
            color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700,
            padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          {ar ? 'تخطى' : 'Skip'}
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 32px',
          transform: animating ? `translateX(${slideDir === 'left' ? (ar ? '30px' : '-30px') : (ar ? '-30px' : '30px')})` : 'translateX(0)',
          opacity: animating ? 0 : 1,
          transition: 'transform 0.22s ease, opacity 0.22s ease',
        }}
      >
        {/* Icon circle */}
        <div style={{
          width: 120, height: 120, borderRadius: 36,
          background: 'rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 36,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 24px 48px rgba(0,0,0,0.2)`,
        }}>
          {s.icon}
        </div>

        {/* Title */}
        <h2 style={{
          color: '#ffffff', fontSize: 26, fontWeight: 900,
          textAlign: 'center', marginBottom: 16, lineHeight: 1.2,
          fontFamily: ar ? "'IBM Plex Sans Arabic', serif" : "'IBM Plex Sans', system-ui",
        }}>
          {ar ? s.titleAr : s.titleEn}
        </h2>

        {/* Body */}
        <p style={{
          color: 'rgba(255,255,255,0.78)', fontSize: 15, fontWeight: 500,
          textAlign: 'center', lineHeight: 1.7, marginBottom: 24,
          whiteSpace: 'pre-line', maxWidth: 320,
          fontFamily: ar ? "'IBM Plex Sans Arabic', serif" : "'IBM Plex Sans', system-ui",
        }}>
          {ar ? s.bodyAr : s.bodyEn}
        </p>

        {/* Hint chip */}
        {s.hint && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 14, padding: '8px 16px',
            color: s.accent, fontSize: 12, fontWeight: 700,
            textAlign: 'center', backdropFilter: 'blur(8px)',
          }}>
            {ar ? s.hint.ar : s.hint.en}
          </div>
        )}
      </div>

      {/* Bottom: dots + CTA */}
      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          {SCREENS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === step ? 24 : 8, height: 8,
                borderRadius: 4, border: 'none', cursor: 'pointer',
                background: i === step ? '#ffffff' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.25s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={() => isLast ? finish() : goTo(step + 1)}
          style={{
            width: '100%', maxWidth: 320, padding: '16px',
            background: isLast ? '#ffffff' : 'rgba(255,255,255,0.15)',
            border: isLast ? 'none' : '1.5px solid rgba(255,255,255,0.25)',
            borderRadius: 18, cursor: 'pointer',
            color: isLast ? T700 : '#ffffff',
            fontSize: 15, fontWeight: 900,
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
            fontFamily: ar ? "'IBM Plex Sans Arabic', serif" : "'IBM Plex Sans', system-ui",
          }}
        >
          {isLast
            ? (ar ? '🚀 ابدأ الاستخدام' : '🚀 Get Started')
            : (ar ? 'التالي ←' : 'Next →')}
        </button>

        {/* Logo at bottom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.4, marginTop: 4 }}>
          <EDMark size={20} />
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>EasyDrug</span>
        </div>
      </div>
    </div>
  );
};

// ── شوف لو المستخدم اتعمله onboard قبل كده ──
export function shouldShowOnboarding(): boolean {
  try { return !localStorage.getItem(ONBOARD_KEY); } catch { return false; }
}

export default OnboardingOverlay;
