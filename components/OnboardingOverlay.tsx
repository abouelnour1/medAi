import React, { useState, useRef } from 'react';

const ONBOARD_KEY = 'ps_onboarded_v1';

const T700 = '#006a60';
const T500 = '#00a896';
const T300 = '#7fd4c6';
const T50  = '#eef9f6';

function EDMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x="2" y="2" width="96" height="96" rx={size * 0.22} fill={T700}/>
      <g opacity="0.12"><rect x="22" y="22" width="56" height="56" fill="#fff"/><rect x="22" y="22" width="56" height="56" fill="#fff" transform="rotate(45 50 50)"/></g>
      <g fill="#fff"><rect x="42" y="24" width="16" height="52" rx="4"/><rect x="24" y="42" width="52" height="16" rx="4"/></g>
      <rect x="42" y="42" width="16" height="16" fill={T500} opacity="0.85"/>
    </svg>
  );
}

// Inline phone mockup SVG
function PhoneMockup({ children, bg = '#f7f9f6' }: { children: React.ReactNode; bg?: string }) {
  return (
    <div style={{
      width: 180, height: 320,
      background: '#1a1a1a',
      borderRadius: 28,
      padding: 3,
      boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)',
      flexShrink: 0,
    }}>
      <div style={{ width: '100%', height: '100%', background: bg, borderRadius: 26, overflow: 'hidden', position: 'relative' }}>
        {/* Notch */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 60, height: 20, background: '#1a1a1a', borderRadius: '0 0 12px 12px', zIndex: 10 }} />
        {/* Status bar */}
        <div style={{ height: 24, background: T700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', paddingTop: 4 }}>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 8, fontWeight: 700 }}>9:41</span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 8 }}>●●●</span>
        </div>
        {children}
      </div>
    </div>
  );
}

// Mockup content components
function MockupSearch() {
  return (
    <div style={{ padding: '8px 10px', height: '100%', background: '#f7f9f6' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <EDMark size={16} />
          <span style={{ fontSize: 9, fontWeight: 800, color: T700 }}>EasyDrug</span>
        </div>
        <div style={{ width: 18, height: 18, borderRadius: 6, background: T700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 9, fontWeight: 800 }}>A</span>
        </div>
      </div>
      {/* Search bar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '5px 10px', marginBottom: 8, border: `1.5px solid ${T300}`, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 9 }}>🔍</span>
        <span style={{ fontSize: 8, color: '#8a938f' }}>بانادول...</span>
      </div>
      {/* Results */}
      {['PANADOL 500MG', 'PANADOL EXTRA', 'PANADOL COLD'].map((name, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '6px 8px', marginBottom: 5, border: '1px solid #e6eae7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 7.5, fontWeight: 800, color: '#0e1a18' }}>{name}</div>
            <div style={{ fontSize: 6.5, color: '#8a938f' }}>PARACETAMOL</div>
          </div>
          <span style={{ fontSize: 7.5, fontWeight: 800, color: T700 }}>4.50 ر.س</span>
        </div>
      ))}
      {/* Long press hint */}
      <div style={{ background: `${T700}18`, borderRadius: 8, padding: '4px 6px', textAlign: 'center', marginTop: 4 }}>
        <span style={{ fontSize: 7, fontWeight: 700, color: T700 }}>✋ اضغط مطولاً للبدائل</span>
      </div>
    </div>
  );
}

function MockupAlternatives() {
  return (
    <div style={{ padding: '8px 10px', height: '100%', background: '#f7f9f6' }}>
      <div style={{ fontSize: 8, fontWeight: 800, color: T700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>🔄</span> البدائل — باراسيتامول
      </div>
      {['ADOL 500MG', 'CALPOL', 'TYLENOL', 'TEMPRA'].map((name, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '5px 8px', marginBottom: 4, border: '1px solid #e6eae7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 7.5, fontWeight: 800, color: '#0e1a18' }}>{name}</div>
            <div style={{ fontSize: 6.5, color: '#8a938f' }}>500MG TAB</div>
          </div>
          <span style={{ fontSize: 7, fontWeight: 800, color: '#006a60', background: '#eef9f6', padding: '2px 5px', borderRadius: 5 }}>متوفر</span>
        </div>
      ))}
    </div>
  );
}

function MockupFilters() {
  return (
    <div style={{ padding: '8px 10px', height: '100%', background: '#f7f9f6' }}>
      <div style={{ fontSize: 8, fontWeight: 800, color: '#0e1a18', marginBottom: 8 }}>⚙️ خيارات متقدمة</div>
      {[
        { label: 'الاسم العلمي', val: 'Amoxicillin', color: '#1d4ed8', bg: '#eff6ff' },
        { label: 'التأمين', val: 'NPHIES ✓', color: '#15803d', bg: '#f0fdf4' },
        { label: 'الفئة', val: 'مضادات حيوية', color: T700, bg: T50 },
      ].map((f, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '5px 8px', marginBottom: 5, border: `1px solid ${f.bg}` }}>
          <div style={{ fontSize: 7, color: '#8a938f', marginBottom: 2 }}>{f.label}</div>
          <div style={{ fontSize: 8, fontWeight: 800, color: f.color, background: f.bg, padding: '2px 6px', borderRadius: 5, display: 'inline-block' }}>{f.val}</div>
        </div>
      ))}
    </div>
  );
}

function MockupInsurance() {
  return (
    <div style={{ padding: '8px 10px', height: '100%', background: '#f7f9f6' }}>
      <div style={{ background: '#fff1f2', borderRadius: 8, padding: '5px 8px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10 }}>🛡️</span>
        <span style={{ fontSize: 8, fontWeight: 800, color: '#be123c' }}>التأمين الطبي</span>
      </div>
      {['NPHIES', 'BUPA', 'MedGulf', 'Tawuniya'].map((ins, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '5px 8px', marginBottom: 4, border: '1px solid #e6eae7', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 7.5, fontWeight: 700, color: '#0e1a18' }}>{ins}</span>
          <span style={{ fontSize: 7, color: i < 2 ? '#15803d' : '#8a938f' }}>{i < 2 ? '✓ مغطى' : '—'}</span>
        </div>
      ))}
    </div>
  );
}

function MockupDosing() {
  return (
    <div style={{ padding: '8px 10px', height: '100%', background: '#f7f9f6' }}>
      <div style={{ background: T700, borderRadius: 10, padding: '6px 8px', marginBottom: 8, textAlign: 'center' }}>
        <span style={{ fontSize: 8, fontWeight: 800, color: '#fff' }}>👶 حاسبة الجرعات</span>
      </div>
      <div style={{ background: '#fff', borderRadius: 8, padding: '5px 8px', marginBottom: 5, border: `1px solid ${T300}` }}>
        <div style={{ fontSize: 7, color: '#8a938f' }}>الدواء</div>
        <div style={{ fontSize: 8, fontWeight: 800, color: T700 }}>Paracetamol 125mg/5ml</div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: 8, padding: '5px 8px', border: `1.5px solid ${T500}` }}>
          <div style={{ fontSize: 7, color: '#8a938f' }}>الوزن</div>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#0e1a18' }}>14 kg</div>
        </div>
      </div>
      <div style={{ background: T50, borderRadius: 8, padding: '6px', display: 'flex', gap: 4 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: T700 }}>5.6</div>
          <div style={{ fontSize: 7, color: '#8a938f' }}>ml</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#0e1a18' }}>140</div>
          <div style={{ fontSize: 7, color: '#8a938f' }}>mg</div>
        </div>
      </div>
      <div style={{ fontSize: 7, color: T700, textAlign: 'center', marginTop: 4, fontWeight: 700 }}>🕐 كل 6 ساعات</div>
    </div>
  );
}

function MockupAdvanced() {
  return (
    <div style={{ padding: '8px 10px', height: '100%', background: '#f7f9f6' }}>
      <div style={{ background: '#ede9fe', borderRadius: 8, padding: '5px 8px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4, border: '1px solid #c4b5fd' }}>
        <span style={{ fontSize: 9 }}>🎯</span>
        <span style={{ fontSize: 7.5, fontWeight: 800, color: '#6d28d9' }}>متقدم · اختر التشخيص</span>
        <div style={{ marginRight: 'auto', width: 24, height: 12, borderRadius: 6, background: '#7c3aed', position: 'relative' }}>
          <div style={{ position: 'absolute', right: 2, top: 2, width: 8, height: 8, borderRadius: '50%', background: '#fff' }}/>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 8, padding: '4px 8px', marginBottom: 4, border: '1px solid #e6eae7' }}>
        <div style={{ fontSize: 7, color: '#8a938f' }}>المرض</div>
        <div style={{ fontSize: 8, fontWeight: 800, color: '#0e1a18' }}>التهاب الأذن الوسطى ▾</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {['أقل 2 سنة', '2+ سنة'].map((c, i) => (
          <div key={i} style={{ background: i === 0 ? T700 : '#fff', borderRadius: 6, padding: '4px', textAlign: 'center', border: `1px solid ${i === 0 ? T700 : '#e6eae7'}` }}>
            <span style={{ fontSize: 7.5, fontWeight: 800, color: i === 0 ? '#fff' : '#0e1a18' }}>{c}</span>
          </div>
        ))}
      </div>
      <div style={{ background: T50, borderRadius: 8, padding: '4px', marginTop: 6, textAlign: 'center', border: `1px solid ${T300}` }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: T700 }}>45 mg/kg/day</div>
        <div style={{ fontSize: 7, color: '#8a938f' }}>مقسمة كل 8 ساعات</div>
      </div>
    </div>
  );
}

function MockupQuickDose() {
  return (
    <div style={{ padding: '8px 10px', height: '100%', background: '#f7f9f6' }}>
      <div style={{ fontSize: 8, fontWeight: 800, color: '#8a938f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>👶 جرعات سريعة</div>
      {[
        { name: 'Paracetamol 125', disease: null, ml: '5.6', freq: 'كل 6 س' },
        { name: 'Amox 250 · التهاب أذن', disease: true, ml: '7.5', freq: 'كل 8 س' },
      ].map((item, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '6px 8px', marginBottom: 5, border: '1.5px solid #e6eae7' }}>
          <div style={{ fontSize: 8, fontWeight: 800, color: '#0e1a18', marginBottom: 3 }}>{item.name}</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ flex: 1, background: '#f7f9f6', borderRadius: 8, padding: '3px 6px', border: `1px solid ${T300}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 7, color: '#8a938f' }}>الوزن</span>
              <span style={{ fontSize: 8, fontWeight: 900, color: '#0e1a18' }}>14 kg</span>
            </div>
            <div style={{ background: T50, borderRadius: 8, padding: '3px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: T700 }}>{item.ml}</div>
              <div style={{ fontSize: 6, color: '#8a938f' }}>ml</div>
            </div>
          </div>
          <div style={{ fontSize: 7, color: T700, marginTop: 3, fontWeight: 700 }}>🕐 {item.freq}</div>
        </div>
      ))}
      <div style={{ textAlign: 'center', fontSize: 7, color: '#8a938f', marginTop: 4 }}>💾 احفظ من الحاسبة</div>
    </div>
  );
}

// Screens
interface Screen {
  titleAr: string; titleEn: string;
  bodyAr: string; bodyEn: string;
  hint?: { ar: string; en: string };
  bg: string; bg2: string;
  mockup: React.ReactNode;
}

const SCREENS: Screen[] = [
  {
    bg: T700, bg2: '#005550',
    titleAr: 'البحث والاستكشاف',
    titleEn: 'Search & Explore',
    bodyAr: 'ابحث عن أي دواء بالاسم التجاري أو العلمي.\nاضغط مطولاً على أي نتيجة لعرض البدائل المتاحة فوراً.',
    bodyEn: 'Search any medicine by trade or scientific name.\nLong-press any result to instantly view alternatives.',
    hint: { ar: 'جرّب: اكتب "بانادول" أو "أموكسيل"', en: 'Try: "Panadol" or "Amoxil"' },
    mockup: <MockupSearch />,
  },
  {
    bg: '#005550', bg2: '#004a45',
    titleAr: 'البدائل الدوائية',
    titleEn: 'Drug Alternatives',
    bodyAr: 'اضغط مطولاً على أي دواء لتظهر كل البدائل المتاحة في السوق من نفس المادة الفعالة.',
    bodyEn: 'Long-press any medicine to see all available alternatives with the same active ingredient.',
    hint: { ar: 'مقارنة الأسعار متاحة في صفحة البدائل', en: 'Price comparison available in alternatives view' },
    mockup: <MockupAlternatives />,
  },
  {
    bg: '#004a45', bg2: '#003d37',
    titleAr: 'خيارات متقدمة',
    titleEn: 'Advanced Filters',
    bodyAr: 'غيّر الاسم العلمي، تحقق من التغطية التأمينية، أو صفّي بالفئة الدوائية من أيقونة الإعدادات في صفحة الدواء.',
    bodyEn: 'Change scientific name, check insurance coverage, or filter by drug category from the settings icon on the medicine page.',
    hint: { ar: 'NPHIES · BUPA · MedGulf · Tawuniya', en: 'NPHIES · BUPA · MedGulf · Tawuniya' },
    mockup: <MockupFilters />,
  },
  {
    bg: '#003d37', bg2: '#002e2a',
    titleAr: 'التأمين الطبي',
    titleEn: 'Insurance Coverage',
    bodyAr: 'تبويب التأمين يعرض تغطية الأدوية لكل شركة تأمين. ابحث عن أي دواء وشوف هل هو مغطى أم لا.',
    bodyEn: 'The Insurance tab shows drug coverage for each insurer. Search any medicine to check if it\'s covered.',
    hint: { ar: 'يشمل NPHIES وكل الشركات الكبرى', en: 'Includes NPHIES and all major insurers' },
    mockup: <MockupInsurance />,
  },
  {
    bg: '#002e2a', bg2: '#001f1c',
    titleAr: 'حاسبة جرعات الأطفال',
    titleEn: 'Pediatric Dose Calculator',
    bodyAr: 'افتح "الجرعات" من القائمة السريعة. اختر الدواء والتركيز، أدخل وزن الطفل، والجرعة تظهر فوراً بالـ ml والـ mg.',
    bodyEn: 'Open "Dosing" from Quick Tools. Pick the drug & concentration, enter child\'s weight, get instant dose in ml & mg.',
    hint: { ar: 'Advanced: اختر التشخيص لجرعة مخصصة', en: 'Advanced: pick diagnosis for specific dosing' },
    mockup: <MockupDosing />,
  },
  {
    bg: '#001f1c', bg2: '#001410',
    titleAr: 'الجرعات السريعة',
    titleEn: 'Quick Doses',
    bodyAr: 'بعد الحساب، اضغط "💾 حفظ كإعداد سريع". المرة الجاية تلاقي الدواء في الصفحة الرئيسية — بس حط الوزن وخلاص.',
    bodyEn: 'After calculating, tap "💾 Save as Quick Preset". Next time find it on home — just enter the weight.',
    hint: { ar: 'يحفظ حتى 5 أدوية مع الجرعة والتكرار', en: 'Saves up to 5 drugs with dose & frequency' },
    mockup: <MockupQuickDose />,
  },
];

interface Props {
  language: 'ar' | 'en';
  onDone: () => void;
}

const OnboardingOverlay: React.FC<Props> = ({ language, onDone }) => {
  const ar = language === 'ar';
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const touchStartX = useRef<number | null>(null);

  const total = SCREENS.length;
  const s = SCREENS[step];
  const isLast = step === total - 1;

  const finish = () => {
    setExiting(true);
    setTimeout(() => { try { localStorage.setItem(ONBOARD_KEY, '1'); } catch {} onDone(); }, 400);
  };

  const goTo = (next: number) => {
    if (animating || next < 0 || next >= total) return;
    setSlideDir(next > step ? 1 : -1);
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 240);
  };

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 44) {
      const forward = ar ? dx > 0 : dx < 0;
      forward ? (isLast ? finish() : goTo(step + 1)) : goTo(step - 1);
    }
    touchStartX.current = null;
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: `linear-gradient(160deg, ${s.bg} 0%, ${s.bg2} 100%)`,
        direction: ar ? 'rtl' : 'ltr',
        display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.4s ease, background 0.5s ease',
        overflow: 'hidden',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Subtle geometric bg */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)`,
        backgroundSize: '20px 20px',
        pointerEvents: 'none',
      }} />

      {/* Skip */}
      <div style={{ display: 'flex', justifyContent: ar ? 'flex-start' : 'flex-end', padding: '16px 20px 0', position: 'relative', zIndex: 2 }}>
        <button onClick={finish} style={{
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700,
          padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
          backdropFilter: 'blur(10px)',
        }}>
          {ar ? 'تخطى' : 'Skip'}
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '8px 28px 0',
        gap: 20, position: 'relative', zIndex: 2,
        transform: animating ? `translateX(${slideDir * (ar ? -28 : 28)}px)` : 'translateX(0)',
        opacity: animating ? 0 : 1,
        transition: 'transform 0.24s cubic-bezier(0.22,1,0.36,1), opacity 0.24s ease',
      }}>
        {/* Phone mockup */}
        <div style={{ transform: 'perspective(600px) rotateY(ar ? 4deg : -4deg) rotateX(2deg)', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}>
          <PhoneMockup>{s.mockup}</PhoneMockup>
        </div>

        {/* Text */}
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <h2 style={{
            color: '#fff', fontSize: 22, fontWeight: 900,
            marginBottom: 10, lineHeight: 1.2,
            fontFamily: ar ? "'IBM Plex Sans Arabic', serif" : "'IBM Plex Sans', system-ui",
          }}>
            {ar ? s.titleAr : s.titleEn}
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 500,
            lineHeight: 1.65, marginBottom: s.hint ? 12 : 0,
            whiteSpace: 'pre-line',
            fontFamily: ar ? "'IBM Plex Sans Arabic', serif" : "'IBM Plex Sans', system-ui",
          }}>
            {ar ? s.bodyAr : s.bodyEn}
          </p>
          {s.hint && (
            <div style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12, padding: '6px 14px',
              color: T300, fontSize: 11, fontWeight: 700,
              backdropFilter: 'blur(8px)',
            }}>
              {ar ? s.hint.ar : s.hint.en}
            </div>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div style={{ padding: '16px 28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 2 }}>
        {/* Dots */}
        <div style={{ display: 'flex', gap: 6 }}>
          {SCREENS.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: i === step ? 22 : 7, height: 7, borderRadius: 4,
              border: 'none', cursor: 'pointer', padding: 0,
              background: i === step ? '#fff' : 'rgba(255,255,255,0.28)',
              transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
            }} />
          ))}
        </div>

        {/* CTA */}
        <button onClick={() => isLast ? finish() : goTo(step + 1)} style={{
          width: '100%', maxWidth: 320, padding: '15px',
          background: isLast ? '#fff' : 'rgba(255,255,255,0.13)',
          border: isLast ? 'none' : '1.5px solid rgba(255,255,255,0.22)',
          borderRadius: 16, cursor: 'pointer',
          color: isLast ? T700 : '#fff',
          fontSize: 15, fontWeight: 900,
          transition: 'all 0.2s ease',
          fontFamily: ar ? "'IBM Plex Sans Arabic', serif" : "'IBM Plex Sans', system-ui",
          boxShadow: isLast ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
        }}>
          {isLast
            ? (ar ? '🚀 ابدأ الاستخدام' : '🚀 Get Started')
            : (ar ? `التالي  ${step + 1}/${total} →` : `Next  ${step + 1}/${total} →`)}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.35 }}>
          <EDMark size={16} />
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>EasyDrug</span>
        </div>
      </div>
    </div>
  );
};

export function shouldShowOnboarding(): boolean {
  try { return !localStorage.getItem(ONBOARD_KEY); } catch { return false; }
}

export default OnboardingOverlay;
