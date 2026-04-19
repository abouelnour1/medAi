// iOS-style Alternatives screen — direct, different strength, therapeutic.
import React from 'react';
import type { Medicine, Language, TFunction } from '../types';
import {
  iOS,
  Icon,
  Row,
  NavBar,
  BoxPlaceholder,
  Badge,
  langPick,
  Dir,
} from './ui/ios';

interface Props {
  sourceMedicine: Medicine;
  alternatives: { direct: Medicine[]; diffStrength?: Medicine[]; therapeutic: Medicine[] };
  language: Language;
  t: TFunction;
  onSelect: (m: Medicine) => void;
  onLongPress?: (m: Medicine) => void;
  onBack: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

function tintFor(regNo: string): string {
  const tints = [iOS.blue, iOS.green, iOS.orange, iOS.indigo, iOS.teal, iOS.purple, iOS.pink];
  let hash = 0;
  for (let i = 0; i < regNo.length; i++) hash = (hash * 31 + regNo.charCodeAt(i)) | 0;
  return tints[Math.abs(hash) % tints.length];
}

function formatPrice(price: string | undefined, lang: Language): string {
  if (!price) return '';
  const num = parseFloat(String(price));
  if (!num || isNaN(num)) return '';
  return num.toFixed(2) + (lang === 'ar' ? ' ر.س' : ' SAR');
}

function truncateSci(s: string): string {
  if (s.length > 55) return s.slice(0, 52) + '…';
  return s;
}

export default function IOSAlternativesScreen({
  sourceMedicine,
  alternatives,
  language,
  onSelect,
  onLongPress,
  onBack,
}: Props) {
  const dir: Dir = language === 'ar' ? 'rtl' : 'ltr';
  const tr = (ar: string, en: string) => langPick(language, ar, en);

  const renderRow = (m: Medicine, last: boolean) => {
    const tint = tintFor(m.RegisterNumber);
    const price = formatPrice(m['Public price'], language);
    const strength = m.Strength ? `${m.Strength}${m.StrengthUnit || ''}` : '';
    return (
      <div
        key={m.RegisterNumber}
        onClick={() => onSelect(m)}
        onContextMenu={(e) => {
          if (onLongPress) {
            e.preventDefault();
            onLongPress(m);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          position: 'relative',
          background: iOS.bg2,
          cursor: 'pointer',
          direction: dir,
        }}
      >
        {m.imgBox ? (
          <img
            src={m.imgBox}
            alt=""
            style={{
              width: 46,
              height: 46,
              borderRadius: 10,
              objectFit: 'contain',
              background: iOS.gray6,
              padding: 3,
              border: `0.5px solid ${iOS.sepCell}`,
              flexShrink: 0,
            }}
          />
        ) : (
          <BoxPlaceholder size={46} tint={tint} />
        )}
        <div style={{ flex: 1, marginInlineStart: 12, minWidth: 0 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: iOS.label,
              letterSpacing: -0.43,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {m['Trade Name'] || m['Scientific Name']}
          </div>
          <div
            style={{
              fontSize: 13,
              color: iOS.label2,
              letterSpacing: -0.08,
              marginTop: 1,
              textAlign: language === 'ar' ? 'right' : 'left',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {truncateSci(m['Scientific Name'] || '')}
          </div>
          <div
            style={{
              fontSize: 12,
              color: iOS.label3,
              marginTop: 2,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {strength && <span>{strength}</span>}
            {m.PharmaceuticalForm && <><span style={{ width: 2, height: 2, borderRadius: '50%', background: iOS.label3 }} /><span>{m.PharmaceuticalForm}</span></>}
          </div>
        </div>
        {price && (
          <div style={{ textAlign: language === 'ar' ? 'left' : 'right', marginInlineStart: 8, flexShrink: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: iOS.label, letterSpacing: -0.43 }}>
              {price.split(' ')[0]}
            </div>
            <div style={{ fontSize: 11, color: iOS.label2, marginTop: 1 }}>{language === 'ar' ? 'ر.س' : 'SAR'}</div>
          </div>
        )}
        <div style={{ marginInlineStart: 8, transform: dir === 'rtl' ? 'scaleX(-1)' : undefined, display: 'inline-flex' }}>
          <Icon.chevronR />
        </div>
        {!last && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              insetInlineStart: 74,
              insetInlineEnd: 0,
              height: 0.5,
              background: iOS.sepCell,
            }}
          />
        )}
      </div>
    );
  };

  const [sortMode, setSortMode] = React.useState<'default' | 'priceAsc' | 'priceDesc' | 'alpha'>('default');

  const sortMeds = (meds: Medicine[]) => {
    const arr = [...meds];
    if (sortMode === 'priceAsc') arr.sort((a, b) => (parseFloat(a['Public price']) || 0) - (parseFloat(b['Public price']) || 0));
    else if (sortMode === 'priceDesc') arr.sort((a, b) => (parseFloat(b['Public price']) || 0) - (parseFloat(a['Public price']) || 0));
    else if (sortMode === 'alpha') arr.sort((a, b) => (a['Trade Name'] || '').localeCompare(b['Trade Name'] || ''));
    return arr;
  };

  const section = (title: string, badge: string, badgeColor: string, meds: Medicine[], empty: string) => (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          padding: '8px 32px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          direction: dir,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: iOS.label2,
            letterSpacing: -0.08,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>
        <Badge color={badgeColor}>{badge}</Badge>
      </div>
      {meds.length > 0 ? (
        <div style={{ margin: '0 16px', borderRadius: 10, background: iOS.bg2, overflow: 'hidden' }}>
          {meds.map((m, i) => renderRow(m, i === meds.length - 1))}
        </div>
      ) : (
        <div
          style={{
            margin: '0 16px',
            padding: '20px 16px',
            borderRadius: 10,
            background: iOS.bg2,
            textAlign: 'center',
            fontSize: 13,
            color: iOS.label2,
            letterSpacing: -0.08,
          }}
        >
          {empty}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ direction: dir, paddingBottom: 24 }}>
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
            }}
          >
            <div style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined, display: 'inline-flex' }}>
              <Icon.chevronL color={iOS.blue} size={19} />
            </div>
            <span style={{ fontSize: 17, color: iOS.blue, letterSpacing: -0.43 }}>
              {tr('رجوع', 'Back')}
            </span>
          </button>
        }
        title={tr('البدائل', 'Alternatives')}
      />

      {/* Source header */}
      <div style={{ padding: '14px 16px 6px' }}>
        <div
          style={{
            background: iOS.bg2,
            borderRadius: 14,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            direction: dir,
          }}
        >
          {sourceMedicine.imgBox ? (
            <img
              src={sourceMedicine.imgBox}
              alt=""
              style={{
                width: 52,
                height: 52,
                borderRadius: 10,
                objectFit: 'contain',
                background: iOS.gray6,
                padding: 3,
                flexShrink: 0,
              }}
            />
          ) : (
            <BoxPlaceholder size={52} tint={iOS.blue} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                color: iOS.label2,
                letterSpacing: -0.08,
                textTransform: 'uppercase',
                textAlign: language === 'ar' ? 'right' : 'left',
              }}
            >
              {tr('بدائل لـ', 'Alternatives for')}
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: iOS.label,
                letterSpacing: -0.43,
                marginTop: 2,
                textAlign: language === 'ar' ? 'right' : 'left',
              }}
            >
              {sourceMedicine['Trade Name']}
            </div>
            <div
              style={{
                fontSize: 13,
                color: iOS.label2,
                marginTop: 2,
                letterSpacing: -0.08,
                textAlign: language === 'ar' ? 'right' : 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {truncateSci(sourceMedicine['Scientific Name'] || '')}
            </div>
          </div>
        </div>
      </div>

      {/* Sort bar */}
      <div style={{ padding: '6px 16px 0', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        {(['default','priceAsc','priceDesc','alpha'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            style={{
              padding: '4px 10px',
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: sortMode === mode ? 600 : 400,
              background: sortMode === mode ? iOS.blue : iOS.fill,
              color: sortMode === mode ? '#fff' : iOS.label2,
            }}
          >
            {mode === 'default' ? (language === 'ar' ? 'افتراضي' : 'Default')
              : mode === 'priceAsc' ? (language === 'ar' ? 'سعر ↑' : 'Price ↑')
              : mode === 'priceDesc' ? (language === 'ar' ? 'سعر ↓' : 'Price ↓')
              : (language === 'ar' ? 'أبجدي' : 'A-Z')}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div style={{ marginTop: 10 }}>
        {section(
          tr('بدائل مباشرة', 'Direct alternatives'),
          String(alternatives.direct.length),
          iOS.green,
          sortMeds(alternatives.direct),
          tr('لا توجد بدائل مباشرة', 'No direct alternatives')
        )}

        {alternatives.diffStrength && alternatives.diffStrength.length > 0 &&
          section(
            tr('نفس المادة بتركيز مختلف', 'Same ingredient, different strength'),
            String(alternatives.diffStrength.length),
            iOS.orange,
            sortMeds(alternatives.diffStrength),
            tr('لا توجد', 'None')
          )}

        {section(
          tr('بدائل علاجية', 'Therapeutic alternatives'),
          String(alternatives.therapeutic.length),
          iOS.blue,
          sortMeds(alternatives.therapeutic),
          tr('لا توجد بدائل علاجية', 'No therapeutic alternatives')
        )}
      </div>
    </div>
  );
}
