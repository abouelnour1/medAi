// IOSResultsList — iOS-style list of medicine results (MedRow).
import React from 'react';
import type { Medicine, Language } from '../types';
import { iOS, Icon, BoxPlaceholder } from './ui/ios';

const priceTint = [iOS.blue, iOS.green, iOS.orange, iOS.purple, iOS.pink, iOS.teal, iOS.indigo, iOS.red];
const tintForId = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return priceTint[Math.abs(h) % priceTint.length];
};

interface Props {
  medicines: Medicine[];
  language: Language;
  onSelect: (m: Medicine) => void;
  onLongPress?: (m: Medicine) => void;
  favorites: string[];
  onToggleFavorite?: (id: string) => void;
}

export default function IOSResultsList({
  medicines,
  language,
  onSelect,
  onLongPress,
  favorites,
}: Props) {
  const isAr = language === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  if (medicines.length === 0) {
    return (
      <div style={{ direction: dir, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 15, color: iOS.label2, letterSpacing: -0.23 }}>
          {isAr ? 'لا توجد نتائج' : 'No results'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ direction: dir }}>
      {/* Results count header */}
      <div
        style={{
          padding: '14px 32px 6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: iOS.label2,
            textTransform: 'uppercase',
            letterSpacing: -0.08,
          }}
        >
          {medicines.length} {isAr ? 'نتيجة' : medicines.length === 1 ? 'Result' : 'Results'}
        </span>
      </div>

      <div
        style={{
          margin: '0 16px 24px',
          background: iOS.bg2,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {medicines.map((m, i) => (
          <MedRow
            key={m.RegisterNumber}
            medicine={m}
            last={i === medicines.length - 1}
            isFavorite={favorites.includes(m.RegisterNumber)}
            onClick={() => onSelect(m)}
            onLongPress={onLongPress ? () => onLongPress(m) : undefined}
            language={language}
          />
        ))}
      </div>
    </div>
  );
}

function MedRow({
  medicine: m,
  last,
  onClick,
  onLongPress,
  isFavorite,
  language,
}: {
  medicine: Medicine;
  last: boolean;
  onClick: () => void;
  onLongPress?: () => void;
  isFavorite: boolean;
  language: Language;
}) {
  const isAr = language === 'ar';
  const tint = tintForId(m.RegisterNumber);
  const price = parseFloat(m['Public price'] || '0');
  const hasPrice = price > 0;

  // Long-press detection
  const pressTimer = React.useRef<any>(null);
  const didLongPress = React.useRef(false);

  const start = () => {
    didLongPress.current = false;
    if (onLongPress) {
      pressTimer.current = setTimeout(() => {
        didLongPress.current = true;
        onLongPress();
      }, 500);
    }
  };
  const cancel = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };
  const end = () => {
    cancel();
    if (!didLongPress.current) onClick();
  };

  return (
    <div
      onPointerDown={start}
      onPointerUp={end}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        position: 'relative',
        background: iOS.bg2,
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'rgba(0,0,0,0.05)',
      }}
    >
      {m.imgBox ? (
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 10,
            background: '#fff',
            border: '0.5px solid rgba(60,60,67,0.12)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: 2,
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
        <BoxPlaceholder size={52} tint={tint} />
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
          }}
        >
          {m['Trade Name'] || m.RegisterNumber}
          {isFavorite && (
            <span style={{ marginInlineStart: 6, display: 'inline-flex', verticalAlign: 'middle' }}>
              <Icon.heart color={iOS.red} filled size={12} />
            </span>
          )}
        </div>
        {m['Scientific Name'] && (
          <div
            style={{
              fontSize: 13,
              color: iOS.label2,
              letterSpacing: -0.08,
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {m['Scientific Name']}
            {m.Strength ? ` ${m.Strength}${m.StrengthUnit || ''}` : ''}
          </div>
        )}
        {(m.PharmaceuticalForm || m['Manufacture Name']) && (
          <div
            style={{
              fontSize: 12,
              color: iOS.label3,
              marginTop: 2,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {m.PharmaceuticalForm && <span>{m.PharmaceuticalForm}</span>}
            {m.PharmaceuticalForm && m['Manufacture Name'] && (
              <span style={{ width: 2, height: 2, borderRadius: '50%', background: iOS.label3, flexShrink: 0 }} />
            )}
            {m['Manufacture Name'] && (
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {m['Manufacture Name']}
              </span>
            )}
          </div>
        )}
      </div>

      {hasPrice && (
        <div
          style={{
            textAlign: isAr ? 'left' : 'right',
            marginInlineStart: 8,
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 600, color: iOS.label, letterSpacing: -0.43 }}>
            {price.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: iOS.label2, marginTop: 1 }}>
            {isAr ? 'ر.س' : 'SAR'}
          </div>
        </div>
      )}
      <div style={{ marginInlineStart: 8, transform: isAr ? 'scaleX(-1)' : undefined }}>
        <Icon.chevronR />
      </div>
      {!last && (
        <div
          style={{
            position: 'absolute',
            insetInlineStart: 80,
            insetInlineEnd: 0,
            bottom: 0,
            height: 0.5,
            background: iOS.sepCell,
          }}
        />
      )}
    </div>
  );
}
