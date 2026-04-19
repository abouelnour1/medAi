// IOSResultsList — iOS-style list of medicine results (MedRow).
import React, { useState, useMemo } from 'react';
import type { Medicine, Language } from '../types';
import { iOS, Icon, BoxPlaceholder } from './ui/ios';

const priceTint = [iOS.blue, iOS.green, iOS.orange, iOS.purple, iOS.pink, iOS.teal, iOS.indigo, iOS.red];
const tintForId = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return priceTint[Math.abs(h) % priceTint.length];
};

type SortMode = 'relevance' | 'alpha' | 'priceAsc' | 'priceDesc' | 'strengthAsc';

interface Props {
  medicines: Medicine[];
  language: Language;
  onSelect: (m: Medicine) => void;
  onLongPress?: (m: Medicine) => void;
  favorites: string[];
  onToggleFavorite?: (id: string) => void;
  onImageZoom?: (imgs: string[], idx: number, title: string, flags: boolean[]) => void;
}

export default function IOSResultsList({
  medicines,
  language,
  onSelect,
  onLongPress,
  favorites,
  onImageZoom,
}: Props) {
  const isAr = language === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const [sortMode, setSortMode] = useState<SortMode>('relevance');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sorted = useMemo(() => {
    const arr = [...medicines];
    switch (sortMode) {
      case 'alpha':
        arr.sort((a, b) => (a['Trade Name'] || '').localeCompare(b['Trade Name'] || ''));
        break;
      case 'priceAsc':
        arr.sort((a, b) => (parseFloat(a['Public price']) || 0) - (parseFloat(b['Public price']) || 0));
        break;
      case 'priceDesc':
        arr.sort((a, b) => (parseFloat(b['Public price']) || 0) - (parseFloat(a['Public price']) || 0));
        break;
      case 'strengthAsc':
        arr.sort((a, b) => (parseFloat(a.Strength) || 0) - (parseFloat(b.Strength) || 0));
        break;
    }
    return arr;
  }, [medicines, sortMode]);

  if (medicines.length === 0) {
    return (
      <div style={{ direction: dir, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 15, color: iOS.label2, letterSpacing: -0.23 }}>
          {isAr ? 'لا توجد نتائج' : 'No results'}
        </div>
      </div>
    );
  }

  const sortLabel: Record<SortMode, string> = {
    relevance: isAr ? 'الصلة' : 'Relevance',
    alpha: isAr ? 'أبجدي' : 'A-Z',
    priceAsc: isAr ? 'سعر ↑' : 'Price ↑',
    priceDesc: isAr ? 'سعر ↓' : 'Price ↓',
    strengthAsc: isAr ? 'تركيز' : 'Strength',
  };

  return (
    <div style={{ direction: dir }}>
      {/* Results count + sort */}
      <div
        style={{
          padding: '4px 16px 6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: iOS.label2,
            textTransform: 'uppercase',
            letterSpacing: -0.08,
          }}
        >
          {medicines.length} {isAr ? 'نتيجة' : 'results'}
        </span>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSortMenu((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 14,
              background: iOS.fill,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: iOS.blue,
              fontWeight: 500,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M6 12h12M10 18h4" stroke={iOS.blue} strokeWidth="2" strokeLinecap="round" />
            </svg>
            {sortLabel[sortMode]}
          </button>
          {showSortMenu && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 20 }}
                onClick={() => setShowSortMenu(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  [isAr ? 'left' : 'right']: 0,
                  zIndex: 21,
                  background: iOS.bg2,
                  borderRadius: 10,
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  minWidth: 150,
                  border: `0.5px solid ${iOS.sepCell}`,
                }}
              >
                {(['relevance', 'alpha', 'priceAsc', 'priceDesc', 'strengthAsc'] as SortMode[]).map((mode, i, arr) => (
                  <button
                    key={mode}
                    onClick={() => { setSortMode(mode); setShowSortMenu(false); }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: mode === sortMode ? iOS.blue : iOS.label,
                      fontWeight: mode === sortMode ? 600 : 400,
                      textAlign: isAr ? 'right' : 'left',
                      borderBottom: i < arr.length - 1 ? `0.5px solid ${iOS.sepCell}` : 'none',
                    }}
                  >
                    {sortLabel[mode]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div
        style={{
          margin: '0 16px 24px',
          background: iOS.bg2,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {sorted.map((m, i) => (
          <MedRow
            key={m.RegisterNumber}
            medicine={m}
            last={i === sorted.length - 1}
            isFavorite={favorites.includes(m.RegisterNumber)}
            onClick={() => onSelect(m)}
            onLongPress={onLongPress ? () => onLongPress(m) : undefined}
            language={language}
            onImageZoom={onImageZoom}
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
  onImageZoom,
}: {
  medicine: Medicine;
  last: boolean;
  onClick: () => void;
  onLongPress?: () => void;
  isFavorite: boolean;
  language: Language;
  onImageZoom?: (imgs: string[], idx: number, title: string, flags: boolean[]) => void;
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
          onClick={(e) => {
            if (onImageZoom) {
              e.stopPropagation();
              const imgs = [m.imgBox, m.imgIndex1, m.imgIndex2].filter(Boolean) as string[];
              onImageZoom(imgs, 0, m['Trade Name'] || '', [!!m.imgBox, !!m.imgIndex1, !!m.imgIndex2]);
            }
          }}
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
            cursor: onImageZoom ? 'zoom-in' : 'pointer',
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
        {(m.PharmaceuticalForm || m['Manufacture Name'] || m.PackageSize) && (
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
            {m.PharmaceuticalForm && (
              <span>
                {m.PharmaceuticalForm}
                {m.PackageSize ? ` · ${m.PackageSize}` : ''}
              </span>
            )}
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
