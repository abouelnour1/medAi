// iOS-style Saved / Favorites screen.
import React, { useMemo, useState } from 'react';
import type { Medicine, Language, TFunction } from '../types';
import {
  iOS,
  Icon,
  Row,
  List,
  SearchField,
  LargeTitle,
  Tile,
  BoxPlaceholder,
  tileGradients,
  langPick,
  Dir,
} from './ui/ios';

interface Props {
  language: Language;
  t: TFunction;
  favoriteIds: string[];
  allMedicines: Medicine[];
  onMedicineSelect: (m: Medicine) => void;
  onFindAlternative: (m: Medicine) => void;
  toggleFavorite: (id: string) => void;
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

export default function IOSFavoritesScreen({
  language,
  favoriteIds,
  allMedicines,
  onMedicineSelect,
}: Props) {
  const dir: Dir = language === 'ar' ? 'rtl' : 'ltr';
  const tr = (ar: string, en: string) => langPick(language, ar, en);
  const [query, setQuery] = useState('');

  const favorites = useMemo(() => {
    const medsById = new Map(allMedicines.map((m) => [m.RegisterNumber, m]));
    return favoriteIds
      .map((id) => medsById.get(id))
      .filter(Boolean) as Medicine[];
  }, [favoriteIds, allMedicines]);

  const filtered = useMemo(() => {
    if (!query.trim()) return favorites;
    const q = query.toLowerCase().trim();
    return favorites.filter(
      (m) =>
        (m['Trade Name'] || '').toLowerCase().includes(q) ||
        (m['Scientific Name'] || '').toLowerCase().includes(q)
    );
  }, [favorites, query]);

  return (
    <div style={{ direction: dir, paddingBottom: 24 }}>
      <div style={{ paddingTop: 4 }}>
        <LargeTitle
          dir={dir}
          title={tr('المحفوظة', 'Saved')}
          subtitle={`${favorites.length} ${tr('دواء', 'medicines')}`}
        />
      </div>

      <div style={{ padding: '0 16px 14px' }}>
        <SearchField
          dir={dir}
          value={query}
          onChange={setQuery}
          placeholder={tr('ابحث في المحفوظة', 'Search saved')}
        />
      </div>

      {/* Quick filter lists */}
      {!query && (
        <List header={tr('القوائم', 'Lists')} dir={dir}>
          <Row
            dir={dir}
            leading={
              <Tile from={tileGradients.orange.from} to={tileGradients.orange.to} size={29}>
                <Icon.star color="#fff" filled size={16} />
              </Tile>
            }
            title={tr('المفضلة', 'Favorites')}
            detail={String(favorites.length)}
            chevron
          />
        </List>
      )}

      {/* Saved items */}
      {filtered.length > 0 ? (
        <>
          <div
            style={{
              padding: '8px 32px 6px',
              fontSize: 13,
              color: iOS.label2,
              letterSpacing: -0.08,
              textTransform: 'uppercase',
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {tr('كل المحفوظة', 'All saved')}
          </div>
          <div
            style={{
              margin: '0 16px 24px',
              borderRadius: 10,
              background: iOS.bg2,
              overflow: 'hidden',
            }}
          >
            {filtered.slice(0, 100).map((m, i) => {
              const tint = tintFor(m.RegisterNumber);
              return (
                <Row
                  key={m.RegisterNumber}
                  dir={dir}
                  leading={
                    m.imgBox ? (
                      <img
                        src={m.imgBox}
                        alt=""
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          objectFit: 'contain',
                          background: iOS.gray6,
                          padding: 2,
                          border: '0.5px solid rgba(60,60,67,0.12)',
                        }}
                      />
                    ) : (
                      <BoxPlaceholder size={38} tint={tint} />
                    )
                  }
                  title={m['Trade Name'] || m['Scientific Name'] || '—'}
                  subtitle={m['Scientific Name']}
                  detail={formatPrice(m['Public price'], language) || undefined}
                  chevron
                  onLast={i === Math.min(filtered.length, 100) - 1}
                  onClick={() => onMedicineSelect(m)}
                />
              );
            })}
          </div>
        </>
      ) : (
        <div
          style={{
            margin: '32px 16px',
            padding: '40px 20px',
            borderRadius: 14,
            background: iOS.bg2,
            textAlign: 'center',
            border: `0.5px solid ${iOS.sepCell}`,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: `${iOS.orange}14`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Icon.star color={iOS.orange} size={24} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: iOS.label, letterSpacing: -0.43 }}>
            {query ? tr('لا توجد نتائج', 'No results') : tr('لا توجد محفوظات', 'No saved items')}
          </div>
          <div
            style={{
              fontSize: 13,
              color: iOS.label2,
              marginTop: 4,
              letterSpacing: -0.08,
              maxWidth: 280,
              margin: '4px auto 0',
              lineHeight: 1.4,
            }}
          >
            {tr('اضغط على النجمة بجانب أي دواء لحفظه', 'Tap the star next to any medicine to save it')}
          </div>
        </div>
      )}
    </div>
  );
}
