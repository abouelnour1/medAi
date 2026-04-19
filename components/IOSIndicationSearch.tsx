// iOS-style Indication Search (By Disease).
// Disease → Active ingredients → Medicines flow.
import React, { useMemo, useState } from 'react';
import type { Medicine, Language, TFunction } from '../types';
import {
  iOS,
  Icon,
  Row,
  List,
  SearchField,
  LargeTitle,
  NavBar,
  BoxPlaceholder,
  Badge,
  Tile,
  tileGradients,
  langPick,
  Dir,
} from './ui/ios';

interface Props {
  indications: Record<string, { icd10Code: string; drugs: { s: string; a?: string; c?: string; m?: string; n?: string }[] }>;
  medicines: Medicine[];
  language: Language;
  t: TFunction;
  onMedicineSelect: (m: Medicine) => void;
  onMedicineLongPress: (m: Medicine) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
  initialQuery?: string;
  hideHeader?: boolean;
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

function trunc(s: string, max = 60): string {
  return s.length > max ? s.slice(0, max - 3) + '…' : s;
}

export default function IOSIndicationSearch({
  indications,
  medicines,
  language,
  onMedicineSelect,
  onBack,
  initialQuery,
  hideHeader,
}: Props) {
  const dir: Dir = language === 'ar' ? 'rtl' : 'ltr';
  const tr = (ar: string, en: string) => langPick(language, ar, en);

  const [query, setQuery] = useState(initialQuery || '');
  const [selectedIndication, setSelectedIndication] = useState<string | null>(null);
  const [selectedSciName, setSelectedSciName] = useState<string | null>(null);

  // Sync external query changes
  React.useEffect(() => {
    if (initialQuery !== undefined) setQuery(initialQuery);
  }, [initialQuery]);

  const matchedIndications = useMemo(() => {
    if (!query.trim()) return []; // empty until user types
    const q = query.toLowerCase();
    return Object.entries(indications)
      .filter(
        ([name, data]) =>
          name.toLowerCase().includes(q) || (data.icd10Code || '').toLowerCase().includes(q)
      )
      .slice(0, 80)
      .map(([name, data]) => ({ name, icd10Code: data.icd10Code, drugCount: (data.drugs || []).length }));
  }, [query, indications]);

  const activeIngredients = useMemo(() => {
    if (!selectedIndication) return [];
    const data = indications[selectedIndication];
    if (!data) return [];
    const map = new Map<string, { medCount: number; atcCode: string }>();
    (data.drugs || []).forEach((d) => {
      const sci = (d.s || '').trim();
      if (!sci) return;
      const medCount = medicines.filter(
        (m) => (m['Scientific Name'] || '').toLowerCase().includes(sci.toLowerCase())
      ).length;
      if (!map.has(sci)) map.set(sci, { medCount, atcCode: d.a || '' });
    });
    return Array.from(map.entries()).map(([sci, data]) => ({ sci, ...data }));
  }, [selectedIndication, indications, medicines]);

  const matchingMeds = useMemo(() => {
    if (!selectedSciName) return [];
    return medicines
      .filter((m) => (m['Scientific Name'] || '').toLowerCase().includes(selectedSciName.toLowerCase()))
      .slice(0, 100);
  }, [selectedSciName, medicines]);

  // === Level 3: Medicines list (Scientific ingredient → Trade names) ===
  if (selectedSciName) {
    return (
      <div style={{ direction: dir, paddingBottom: 24 }}>
        <NavBar
          leading={
            <button
              onClick={() => setSelectedSciName(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined, display: 'inline-flex' }}>
                <Icon.chevronL color={iOS.blue} size={19} />
              </div>
              <span style={{ fontSize: 17, color: iOS.blue, letterSpacing: -0.43 }}>
                {tr('المواد', 'Ingredients')}
              </span>
            </button>
          }
          title={trunc(selectedSciName, 24)}
        />

        <div style={{ padding: '12px 32px 6px' }}>
          <span style={{ fontSize: 13, color: iOS.label2, letterSpacing: -0.08, textTransform: 'uppercase' }}>
            {matchingMeds.length} {tr('دواء', 'medicines')}
          </span>
        </div>

        <div style={{ margin: '0 16px 24px', borderRadius: 10, background: iOS.bg2, overflow: 'hidden' }}>
          {matchingMeds.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: iOS.label2 }}>
              {tr('لا توجد نتائج', 'No results')}
            </div>
          ) : (
            matchingMeds.map((m, i) => {
              const tint = tintFor(m.RegisterNumber);
              const price = formatPrice(m['Public price'], language);
              return (
                <div
                  key={m.RegisterNumber}
                  onClick={() => onMedicineSelect(m)}
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
                      {m.Strength}{m.StrengthUnit} · {m.PharmaceuticalForm}
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
                  {i < matchingMeds.length - 1 && (
                    <div style={{ position: 'absolute', bottom: 0, insetInlineStart: 74, insetInlineEnd: 0, height: 0.5, background: iOS.sepCell }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // === Level 2: Active ingredients for the selected indication ===
  if (selectedIndication) {
    return (
      <div style={{ direction: dir, paddingBottom: 24 }}>
        <NavBar
          leading={
            <button
              onClick={() => setSelectedIndication(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined, display: 'inline-flex' }}>
                <Icon.chevronL color={iOS.blue} size={19} />
              </div>
              <span style={{ fontSize: 17, color: iOS.blue, letterSpacing: -0.43 }}>
                {tr('الأمراض', 'Diseases')}
              </span>
            </button>
          }
          title={trunc(selectedIndication, 24)}
        />

        <div style={{ padding: '12px 32px 6px' }}>
          <span style={{ fontSize: 13, color: iOS.label2, letterSpacing: -0.08, textTransform: 'uppercase' }}>
            {tr('المواد الفعالة', 'Active ingredients')} ({activeIngredients.length})
          </span>
        </div>

        <div style={{ margin: '0 16px 24px', borderRadius: 10, background: iOS.bg2, overflow: 'hidden' }}>
          {activeIngredients.map((ing, i) => (
            <Row
              key={ing.sci}
              dir={dir}
              leading={
                <Tile from={tileGradients.teal.from} to={tileGradients.teal.to} size={29}>
                  <Icon.flask color="#fff" size={16} />
                </Tile>
              }
              title={trunc(ing.sci, 40)}
              subtitle={ing.atcCode || undefined}
              detail={`${ing.medCount}`}
              chevron
              onLast={i === activeIngredients.length - 1}
              onClick={() => setSelectedSciName(ing.sci)}
            />
          ))}
        </div>
      </div>
    );
  }

  // === Level 1: Diseases list ===
  return (
    <div style={{ direction: dir, paddingBottom: 24 }}>
      {!hideHeader && (
        <>
          <div style={{ paddingTop: 4 }}>
            <LargeTitle
              dir={dir}
              title={tr('بحث بالمرض', 'By Disease')}
              subtitle={tr('ابحث بـ ICD-10 أو اسم الحالة', 'Search by ICD-10 or condition name')}
            />
          </div>

          <div style={{ padding: '0 16px 14px' }}>
            <SearchField
              dir={dir}
              value={query}
              onChange={setQuery}
              placeholder={tr('اكتب اسم مرض أو كود ICD-10', 'Disease name or ICD-10 code')}
            />
          </div>
        </>
      )}

      <div style={{ padding: '0 32px 6px' }}>
        <span style={{ fontSize: 13, color: iOS.label2, letterSpacing: -0.08, textTransform: 'uppercase' }}>
          {matchedIndications.length} {tr('حالة', 'conditions')}
        </span>
      </div>

      {matchedIndications.length === 0 ? (
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
          <div style={{ fontSize: 17, fontWeight: 600, color: iOS.label, letterSpacing: -0.43 }}>
            {tr('لا توجد نتائج', 'No matches')}
          </div>
        </div>
      ) : (
        <div style={{ margin: '0 16px 24px', borderRadius: 10, background: iOS.bg2, overflow: 'hidden' }}>
          {matchedIndications.map((ind, i) => (
            <Row
              key={ind.name}
              dir={dir}
              title={trunc(ind.name, 50)}
              subtitle={ind.icd10Code ? `ICD-10: ${trunc(ind.icd10Code, 40)}` : undefined}
              trailing={
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: iOS.blue,
                    background: `${iOS.blue}1F`,
                    padding: '3px 8px',
                    borderRadius: 6,
                    marginInlineEnd: 6,
                  }}
                >
                  {ind.drugCount} {tr('دواء', 'drugs')}
                </span>
              }
              chevron
              onLast={i === matchedIndications.length - 1}
              onClick={() => setSelectedIndication(ind.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
