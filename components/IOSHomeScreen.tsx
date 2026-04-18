// Production iOS-style Home screen for EasyDrug.
// Integrates with real data: medicines, recent searches, quick tools.
// Supports both LTR (English) and RTL (Arabic) directions.

import React from 'react';
import type { Medicine, Language } from '../types';
import {
  iOS,
  Icon,
  Row,
  Segmented,
  SearchField,
  QuickTile,
  BoxPlaceholder,
  tileGradients,
  langPick,
  Dir,
  BRAND,
  EDMark,
  EDWordmark,
} from './ui/ios';

/** Pick a stable tint color from a medicine register number. */
function tintFor(regNo: string): string {
  const tints = [iOS.blue, iOS.green, iOS.orange, iOS.indigo, iOS.teal, iOS.purple, iOS.pink];
  let hash = 0;
  for (let i = 0; i < regNo.length; i++) hash = (hash * 31 + regNo.charCodeAt(i)) | 0;
  return tints[Math.abs(hash) % tints.length];
}

/** Format a price (string or number) with SAR label in the right language. */
function formatPrice(price: string | number | undefined, lang: Language): string {
  if (!price) return '';
  const num = parseFloat(String(price));
  if (!num || isNaN(num)) return '';
  return num.toFixed(2) + (lang === 'ar' ? ' ر.س' : ' SAR');
}

/** Display name prioritizing trade name, fall back to scientific. */
function displayName(m: Medicine): string {
  const trade = (m['Trade Name'] || '').trim();
  return trade || m['Scientific Name'] || '—';
}

function displaySci(m: Medicine): string {
  let sci = m['Scientific Name'] || '';
  // Truncate long ingredients for list display
  if (sci.length > 60) sci = sci.slice(0, 57) + '…';
  const strength = m.Strength ? `${m.Strength}${m.StrengthUnit || ''}` : '';
  return [sci, strength].filter(Boolean).join(' · ');
}

export interface IOSHomeScreenProps {
  language: Language;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  textSearchMode: 'tradeName' | 'scientificName' | 'all' | 'indication';
  onSetTextSearchMode: (m: 'tradeName' | 'scientificName' | 'all' | 'indication') => void;
  recentSearches: Medicine[];
  onMedicineSelect: (m: Medicine) => void;
  onClearRecent: () => void;
  // Quick tools
  onOpenPediatricCalc: () => void;
  onOpenDrugTest: () => void;
  onOpenIndicationSearch: () => void;
  onOpenFavorites: () => void;
  onOpenOrderList: () => void;
  onOpenStockTracker: () => void;
  onOpenInsurance: () => void;
  onOpenPrescription: () => void;
  onDisableIOSDesign?: () => void;
}

export default function IOSHomeScreen(props: IOSHomeScreenProps) {
  const {
    language,
    searchTerm,
    onSearchChange,
    recentSearches,
    onMedicineSelect,
    onClearRecent,
    textSearchMode,
    onSetTextSearchMode,
  } = props;

  const dir: Dir = language === 'ar' ? 'rtl' : 'ltr';
  const t = (ar: string, en: string) => langPick(language, ar, en);
  const hasSearch = searchTerm.trim().length > 0;

  const segmentOptions = [
    t('اسم تجاري', 'Trade'),
    t('علمي', 'Generic'),
    t('الكل', 'All'),
    t('حالة', 'Indication'),
  ];
  const segmentValues: Array<'tradeName' | 'scientificName' | 'all' | 'indication'> = [
    'tradeName',
    'scientificName',
    'all',
    'indication',
  ];
  const activeSegment = Math.max(0, segmentValues.indexOf(textSearchMode));

  return (
    <div style={{ direction: dir, paddingBottom: 24 }}>
      {/* Brand lockup */}
      <div
        style={{
          padding: '8px 16px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          direction: dir,
        }}
      >
        <EDMark size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <EDWordmark size={1} lang={language === 'ar' ? 'ar' : 'en'} />
          <div
            style={{
              fontSize: 13,
              color: iOS.label2,
              marginTop: 4,
              letterSpacing: -0.08,
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {t('دليل الأدوية والتأمين', 'Saudi drug & insurance directory')}
          </div>
        </div>
      </div>

      {/* Search field */}
      <div style={{ padding: '0 16px 10px' }}>
        <SearchField
          dir={dir}
          value={searchTerm}
          placeholder={t('أدوية، مواد فعالة، حالات', 'Medicines, ingredients, indications')}
          onChange={onSearchChange}
        />
      </div>

      {/* Segmented search mode */}
      <div style={{ padding: '0 16px 14px' }}>
        <Segmented
          options={segmentOptions}
          active={activeSegment}
          onChange={(i) => onSetTextSearchMode(segmentValues[i])}
        />
      </div>

      {/* Quick tools - hidden while searching */}
      {!hasSearch && (
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <QuickTile
            dir={dir}
            from={tileGradients.blue.from}
            to={tileGradients.blue.to}
            icon={<Icon.baby color="#fff" size={22} />}
            title={t('حاسبة الأطفال', 'Pediatric Dose')}
            sub={t('حساب الجرعة بالوزن', 'Weight-based calc')}
            onClick={props.onOpenPediatricCalc}
          />
          <QuickTile
            dir={dir}
            from={tileGradients.purple.from}
            to={tileGradients.purple.to}
            icon={<Icon.flask color="#fff" size={22} />}
            title={t('تحليل الدواء', 'Drug Test')}
            sub={t('فحص المواد', 'Substance check')}
            onClick={props.onOpenDrugTest}
          />
          <QuickTile
            dir={dir}
            from={tileGradients.teal.from}
            to={tileGradients.teal.to}
            icon={<Icon.info color="#fff" size={22} />}
            title={t('بحث بالمرض', 'By Disease')}
            sub={t('ICD-10 وحالات', 'ICD-10 & indications')}
            onClick={props.onOpenIndicationSearch}
          />
          <QuickTile
            dir={dir}
            from={tileGradients.orange.from}
            to={tileGradients.orange.to}
            icon={<Icon.star color="#fff" filled size={22} />}
            title={t('المفضلة', 'Favorites')}
            sub={t('المحفوظة', 'Saved items')}
            onClick={props.onOpenFavorites}
          />
          <QuickTile
            dir={dir}
            from={tileGradients.green.from}
            to={tileGradients.green.to}
            icon={<Icon.stock color="#fff" size={22} />}
            title={t('المخزون', 'Stock')}
            sub={t('متابعة المخزون', 'Track inventory')}
            onClick={props.onOpenStockTracker}
          />
          <QuickTile
            dir={dir}
            from={tileGradients.indigo.from}
            to={tileGradients.indigo.to}
            icon={<Icon.rx color="#fff" size={22} />}
            title={t('الوصفات', 'Prescription')}
            sub={t('بناء روشتة', 'Rx builder')}
            onClick={props.onOpenPrescription}
          />
          <QuickTile
            dir={dir}
            from={tileGradients.pink.from}
            to={tileGradients.pink.to}
            icon={<Icon.shield color="#fff" size={22} />}
            title={t('التأمين', 'Insurance')}
            sub={t('قائمة CHI', 'CHI formulary')}
            onClick={props.onOpenInsurance}
          />
          <QuickTile
            dir={dir}
            from={tileGradients.red.from}
            to={tileGradients.red.to}
            icon={<Icon.doc color="#fff" size={22} />}
            title={t('الطلبات', 'Orders')}
            sub={t('قائمة طلبات', 'Order list')}
            onClick={props.onOpenOrderList}
          />
        </div>
      </div>
      )}

      {/* Recently viewed - hidden while searching */}
      {!hasSearch && recentSearches.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              padding: '8px 32px 6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
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
              {t('شوهدت مؤخراً', 'Recently Viewed')}
            </span>
            <button
              onClick={onClearRecent}
              style={{
                fontSize: 13,
                color: iOS.red,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                letterSpacing: -0.08,
              }}
            >
              {t('مسح الكل', 'Clear All')}
            </button>
          </div>

          <div
            style={{
              margin: '0 16px',
              borderRadius: 10,
              background: iOS.bg2,
              overflow: 'hidden',
            }}
          >
            {recentSearches.slice(0, 6).map((m, i, arr) => {
              const tint = tintFor(m.RegisterNumber);
              const price = formatPrice(m['Public price'], language);
              const sliced = arr.slice(0, 6);
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
                  title={displayName(m)}
                  subtitle={displaySci(m)}
                  detail={price || undefined}
                  chevron
                  onLast={i === sliced.length - 1}
                  onClick={() => onMedicineSelect(m)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state when no recent + not searching */}
      {!hasSearch && recentSearches.length === 0 && (
        <div
          style={{
            margin: '32px 16px 24px',
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
              background: `${iOS.blue}14`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Icon.search color={iOS.blue} size={24} />
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: iOS.label,
              letterSpacing: -0.43,
            }}
          >
            {t('ابحث عن دواء', 'Search for a medicine')}
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
            {t(
              'ابحث باسم تجاري أو علمي أو حالة مرضية',
              'Search by trade name, scientific name, or indication'
            )}
          </div>
        </div>
      )}
    </div>
  );
}
