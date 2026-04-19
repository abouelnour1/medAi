// IOSMedicineDetail — iOS-style medicine detail screen.
// Focuses on presentation; delegates actions (favorite, share, alternatives) to parent.
import React from 'react';
import type { Medicine, Language, TFunction } from '../types';
import {
  iOS,
  Icon,
  Tile,
  Row,
  List,
  Badge,
  StatBox,
  ActionBtn,
  BoxPlaceholder,
  NavBar,
  tileGradients,
} from './ui/ios';

interface Props {
  medicine: Medicine;
  language: Language;
  t: TFunction;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
  onFindAlternative: (m: Medicine) => void;
  onShare: (m: Medicine) => void;
  onOpenDoseCalc: () => void;
  onImageZoom?: (imgs: string[], idx: number, title: string, flags: boolean[]) => void;
  onEdit?: (m: Medicine) => void;
  isAdmin?: boolean;
  onOpenClinical?: () => void;   // Claude clinical
  onAskGemini?: (m: Medicine) => void;
}

export default function IOSMedicineDetail({
  medicine: m,
  language,
  isFavorite,
  onToggleFavorite,
  onBack,
  onFindAlternative,
  onShare,
  onOpenDoseCalc,
  onImageZoom,
  onEdit,
  isAdmin,
  onOpenClinical,
  onAskGemini,
}: Props) {
  const isAr = language === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  const price = parseFloat(m['Public price'] || '0');
  const hasPrice = price > 0;
  const isRx = (m['Legal Status'] || '').toLowerCase().includes('prescription');
  const isControlled = (m['Product Control'] || '').toLowerCase().includes('controlled');

  const images = [m.imgBox, m.imgIndex1, m.imgIndex2].filter(Boolean) as string[];
  const flags = [!!m.imgBox, !!m.imgIndex1, !!m.imgIndex2];

  const tint = (() => {
    const id = m.RegisterNumber || '';
    const colors = [iOS.blue, iOS.green, iOS.orange, iOS.purple, iOS.pink, iOS.teal, iOS.indigo, iOS.red];
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
    return colors[Math.abs(h) % colors.length];
  })();

  return (
    <div style={{ direction: dir, background: iOS.bg, minHeight: '100%', paddingBottom: 40 }}>
      <NavBar
        leading={
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transform: isAr ? 'scaleX(-1)' : undefined,
            }}
          >
            <Icon.chevronL color={iOS.blue} size={19} />
            <span
              style={{
                fontSize: 17,
                color: iOS.blue,
                letterSpacing: -0.43,
                transform: isAr ? 'scaleX(-1)' : undefined,
              }}
            >
              {isAr ? 'رجوع' : 'Back'}
            </span>
          </button>
        }
        title={m['Trade Name'] || ''}
        trailing={
          <button
            onClick={() => onToggleFavorite(m.RegisterNumber)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            aria-label="Favorite"
          >
            <Icon.heart color={iOS.red} filled={isFavorite} size={22} />
          </button>
        }
      />

      {/* Hero card */}
      <div style={{ padding: '14px 16px 6px' }}>
        <div
          style={{
            background: iOS.bg2,
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 0.5px 0 rgba(0,0,0,0.04)',
          }}
        >
          {m.imgBox ? (
            <div
              onClick={() => onImageZoom && images.length > 0 && onImageZoom(images, 0, m['Trade Name'], flags)}
              style={{
                width: 76,
                height: 76,
                borderRadius: 10,
                background: '#fff',
                border: '0.5px solid rgba(60,60,67,0.12)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                padding: 4,
                cursor: 'pointer',
              }}
            >
              <img
                src={m.imgBox}
                alt=""
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                loading="lazy"
              />
            </div>
          ) : (
            <BoxPlaceholder size={76} tint={tint} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: iOS.label,
                letterSpacing: 0.35,
                lineHeight: 1.15,
                wordBreak: 'break-word',
              }}
            >
              {m['Trade Name']}
            </div>
            {m['Scientific Name'] && (
              <div
                style={{
                  fontSize: 14,
                  color: iOS.label2,
                  marginTop: 4,
                  letterSpacing: -0.23,
                  wordBreak: 'break-word',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.3,
                }}
              >
                {m['Scientific Name']}
                {m.Strength ? ` ${m.Strength}${m.StrengthUnit || ''}` : ''}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {isRx && <Badge color={iOS.green}>{isAr ? 'وصفة' : 'Rx'}</Badge>}
              {isControlled && <Badge color={iOS.red}>{isAr ? 'مراقب' : 'Controlled'}</Badge>}
              {m.PharmaceuticalForm && <Badge color={iOS.blue}>{m.PharmaceuticalForm}</Badge>}
              {m['Product type'] && m['Product type'] !== 'Human' && (
                <Badge color={iOS.orange}>{m['Product type']}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stat strip - price highlighted */}
      {hasPrice && (
        <div style={{ padding: '12px 16px 8px', display: 'flex', gap: 10 }}>
          <div
            style={{
              flex: 1.3,
              background: `linear-gradient(135deg, ${iOS.blue} 0%, ${iOS.teal} 100%)`,
              borderRadius: 12,
              padding: '10px 14px',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(0,106,96,0.25)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.85 }}>
              {isAr ? 'السعر' : 'Price'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginTop: 2 }}>
              {price.toFixed(2)} <span style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>{isAr ? 'ر.س' : 'SAR'}</span>
            </div>
          </div>
          {m.PackageSize && (
            <StatBox
              label={isAr ? 'العبوة' : 'Pack'}
              value={`${m.PackageSize} × ${m.PharmaceuticalForm ? m.PharmaceuticalForm.split(' ').slice(0,2).join(' ') : ''}`}
            />
          )}
          {m.AtcCode1 && <StatBox label="ATC" value={m.AtcCode1} />}
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '4px 16px 8px' }}>
        {/* Row 1: Alternatives (full width, filled) */}
        <div style={{ marginBottom: 8 }}>
          <ActionBtn
            tint={iOS.blue}
            filled
            icon={<Icon.pill color="#fff" size={16} />}
            label={isAr ? 'البدائل والأدوية المشابهة' : 'Alternatives'}
            onClick={() => onFindAlternative(m)}
          />
        </div>
        {/* Row 2: Share + Clinical + Gemini */}
        <div style={{ display: 'grid', gridTemplateColumns: [true, onOpenClinical, onAskGemini].filter(Boolean).length === 3 ? '1fr 1fr 1fr' : [true, onOpenClinical || onAskGemini].filter(Boolean).length === 2 ? '1fr 1fr' : '1fr', gap: 8 }}>
          <ActionBtn
            tint={iOS.blue}
            icon={<Icon.share color={iOS.blue} size={15} />}
            label={isAr ? 'مشاركة' : 'Share'}
            onClick={() => onShare(m)}
          />
          {onOpenClinical && (
            <ActionBtn
              tint={iOS.green}
              icon={<Icon.shield color={iOS.green} size={15} />}
              label={isAr ? 'بيانات سريرية' : 'Clinical'}
              onClick={onOpenClinical}
            />
          )}
          {onAskGemini && (
            <ActionBtn
              tint="#1a73e8"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 3l2.5 5.5L20 12l-5.5 2.5L12 20l-2.5-5.5L4 12l5.5-2.5L12 5z" fill="#1a73e8"/>
                </svg>
              }
              label={isAr ? 'جيمناي' : 'Gemini'}
              onClick={() => onAskGemini(m)}
            />
          )}
        </div>
        {/* Row 3: Edit (admin only) */}
        {isAdmin && onEdit && (
          <div style={{ marginTop: 8 }}>
            <ActionBtn
              tint={iOS.orange}
              icon={<Icon.doc color={iOS.orange} size={15} />}
              label={isAr ? 'تعديل البيانات' : 'Edit'}
              onClick={() => onEdit(m)}
            />
          </div>
        )}
      </div>
      {/* Composition */}
      <List header={isAr ? 'التركيب' : 'Composition'}>
        {m['Scientific Name'] && (() => {
          // Multi-ingredient: split on comma
          const sciNames = String(m['Scientific Name']).split(',').map(s => s.trim()).filter(Boolean);
          const strengths = String(m.Strength || '').split(',').map(s => s.trim());
          const unit = m.StrengthUnit || '';
          if (sciNames.length > 1) {
            return sciNames.map((sci, i) => (
              <Row
                key={i}
                title={sci}
                detail={strengths[i] ? `${strengths[i]}${unit}` : undefined}
                onLast={i === sciNames.length - 1 && !m.PharmaceuticalForm && !m.AdministrationRoute}
              />
            ));
          }
          return (
            <Row
              title={sciNames[0]}
              detail={m.Strength ? `${m.Strength}${unit}` : undefined}
            />
          );
        })()}
        {m.PharmaceuticalForm && (
          <Row title={isAr ? 'الشكل الصيدلاني' : 'Pharmaceutical form'} detail={m.PharmaceuticalForm} />
        )}
        {m.AdministrationRoute && (
          <Row title={isAr ? 'طريقة الإعطاء' : 'Administration route'} detail={m.AdministrationRoute} onLast />
        )}
      </List>

      {/* Regulatory */}
      {(m['Legal Status'] || m.RegisterNumber || m.AtcCode1 || m['Last Update']) && (
        <List header={isAr ? 'التنظيم' : 'Regulatory'}>
          {m['Legal Status'] && (
            <Row title={isAr ? 'الحالة القانونية' : 'Legal status'} detail={m['Legal Status']} />
          )}
          {m.RegisterNumber && (
            <Row title={isAr ? 'رقم التسجيل' : 'Registration no.'} detail={m.RegisterNumber} />
          )}
          {m.AtcCode1 && <Row title={isAr ? 'كود ATC' : 'ATC code'} detail={m.AtcCode1} />}
          {m['Last Update'] && (
            <Row title={isAr ? 'آخر تحديث' : 'Last update'} detail={m['Last Update']} />
          )}
        </List>
      )}

      {/* Manufacturer & Agent */}
      {(m['Manufacture Name'] || m['Marketing Company'] || m['Main Agent']) && (
        <List header={isAr ? 'الشركة المصنعة والوكيل' : 'Manufacturer & Agent'}>
          {m['Manufacture Name'] && (
            <Row
              leading={
                <Tile from={tileGradients.orange.from} to={tileGradients.orange.to} size={29}>
                  <Icon.flag color="#fff" size={16} />
                </Tile>
              }
              title={m['Manufacture Name']}
              subtitle={m['Manufacture Country']}
            />
          )}
          {m['Marketing Company'] && (
            <Row
              leading={
                <Tile from={tileGradients.green.from} to={tileGradients.green.to} size={29}>
                  <Icon.shield color="#fff" size={16} />
                </Tile>
              }
              title={m['Marketing Company']}
              subtitle={
                isAr
                  ? `الشركة المسوّقة${m['Marketing Country'] ? ' · ' + m['Marketing Country'] : ''}`
                  : `Marketing company${m['Marketing Country'] ? ' · ' + m['Marketing Country'] : ''}`
              }
            />
          )}
          {m['Main Agent'] && m['Main Agent'] !== m['Marketing Company'] && (
            <Row
              leading={
                <Tile from={tileGradients.blue.from} to={tileGradients.blue.to} size={29}>
                  <Icon.globe color="#fff" size={16} />
                </Tile>
              }
              title={m['Main Agent']}
              subtitle={isAr ? 'الوكيل المحلي' : 'Local agent'}
            />
          )}
        </List>
      )}

      {/* Storage & packaging */}
      {(m['Storage conditions'] || m.PackageSize || m.PackageTypes) && (
        <List header={isAr ? 'التخزين والعبوة' : 'Storage & packaging'}>
          {m['Storage conditions'] && (
            <Row title={isAr ? 'ظروف التخزين' : 'Storage'} detail={m['Storage conditions']} />
          )}
          {m.PackageTypes && (
            <Row title={isAr ? 'نوع العبوة' : 'Package type'} detail={m.PackageTypes} />
          )}
          {m.PackageSize && (
            <Row title={isAr ? 'حجم العبوة' : 'Pack size'} detail={m.PackageSize} />
          )}
          {m.shelfLife && (
            <Row title={isAr ? 'مدة الصلاحية' : 'Shelf life'} detail={`${m.shelfLife} ${isAr ? 'شهر' : 'months'}`} />
          )}
        </List>
      )}

      {/* Clinical tools */}
      <List header={isAr ? 'أدوات سريرية' : 'Clinical tools'}>
        <Row
          leading={
            <Tile from={tileGradients.pink.from} to={tileGradients.pink.to} size={29}>
              <Icon.baby color="#fff" size={16} />
            </Tile>
          }
          title={isAr ? 'حاسبة جرعة الأطفال' : 'Pediatric dose calculator'}
          chevron
          onClick={onOpenDoseCalc}
        />
      </List>
    </div>
  );
}
