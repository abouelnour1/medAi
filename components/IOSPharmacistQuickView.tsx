// iOS-style Pharmacist Quick View modal.
import React, { useEffect } from 'react';
import type { Medicine, Language, TFunction } from '../types';
import { iOS, Icon, Badge, BoxPlaceholder, tileGradients, langPick } from './ui/ios';

interface Props {
  medicine: Medicine;
  language: Language;
  t: TFunction;
  onClose: () => void;
  onOpenFull: () => void;
  isFavorite: boolean;
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
  return num.toFixed(2);
}

export default function IOSPharmacistQuickView({
  medicine,
  language,
  onClose,
  onOpenFull,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const tr = (ar: string, en: string) => langPick(language, ar, en);
  const tint = tintFor(medicine.RegisterNumber);
  const isControlled = medicine['Product Control']?.toLowerCase() === 'controlled';
  const isOTC = medicine['Legal Status']?.toLowerCase() === 'otc';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const price = formatPrice(medicine['Public price'], language);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'rgba(0, 0, 0, 0.4)',
        animation: 'iosBackdropIn 240ms ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes iosBackdropIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes iosSheetIn { 0% { transform: translateY(100%); } 100% { transform: translateY(0); } }
      `}</style>
      <div
        style={{
          background: iOS.bg,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          animation: 'iosSheetIn 320ms cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.18)',
          direction: dir,
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 36, height: 5, borderRadius: 3, background: iOS.gray3 }} />
        </div>

        {/* Title row */}
        <div
          style={{
            padding: '4px 16px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `0.5px solid ${iOS.sepCell}`,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
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
              {medicine['Trade Name'] || medicine['Scientific Name']}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              background: iOS.fill,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 2l8 8M10 2l-8 8" stroke={iOS.label2} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Hero */}
        <div
          style={{
            padding: '14px 16px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {medicine.imgBox ? (
            <img
              src={medicine.imgBox}
              alt=""
              style={{
                width: 70,
                height: 70,
                borderRadius: 12,
                objectFit: 'contain',
                background: iOS.gray6,
                padding: 4,
                border: `0.5px solid ${iOS.sepCell}`,
                flexShrink: 0,
              }}
            />
          ) : (
            <BoxPlaceholder size={70} tint={tint} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                color: iOS.label2,
                marginBottom: 2,
                letterSpacing: -0.08,
                textAlign: language === 'ar' ? 'right' : 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {medicine['Scientific Name']}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              {isOTC && <Badge color={iOS.green}>OTC</Badge>}
              {isControlled && <Badge color={iOS.red}>{tr('مخدر', 'Controlled')}</Badge>}
              {medicine.PharmaceuticalForm && <Badge color={iOS.blue}>{medicine.PharmaceuticalForm}</Badge>}
            </div>
            {price && (
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: iOS.blue,
                  letterSpacing: -0.5,
                  marginTop: 6,
                  textAlign: language === 'ar' ? 'right' : 'left',
                }}
              >
                {price} <span style={{ fontSize: 13, color: iOS.label2, fontWeight: 500 }}>{language === 'ar' ? 'ر.س' : 'SAR'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '6px 16px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <button
            onClick={onOpenFull}
            style={{
              height: 44,
              borderRadius: 10,
              background: iOS.blue,
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: -0.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <Icon.info color="#fff" size={16} />
            {tr('التفاصيل', 'Details')}
          </button>
          <button
            onClick={() => onToggleFavorite(medicine.RegisterNumber)}
            style={{
              height: 44,
              borderRadius: 10,
              background: `${iOS.orange}1F`,
              color: iOS.orange,
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: -0.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <Icon.star color={iOS.orange} filled={isFavorite} size={16} />
            {isFavorite ? tr('محفوظ', 'Saved') : tr('حفظ', 'Save')}
          </button>
          <button
            onClick={onClose}
            style={{
              height: 44,
              borderRadius: 10,
              background: iOS.fill,
              color: iOS.label,
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: -0.2,
            }}
          >
            {tr('إغلاق', 'Close')}
          </button>
        </div>

        {/* Quick info list */}
        <div
          style={{
            margin: '0 16px 8px',
            borderRadius: 10,
            background: iOS.bg2,
            overflow: 'hidden',
          }}
        >
          {medicine.Strength && (
            <div
              style={{
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 15,
                borderBottom: `0.5px solid ${iOS.sepCell}`,
              }}
            >
              <span style={{ color: iOS.label2 }}>{tr('التركيز', 'Strength')}</span>
              <span style={{ color: iOS.label, fontWeight: 500 }}>{medicine.Strength}{medicine.StrengthUnit}</span>
            </div>
          )}
          {medicine['Manufacture Name'] && (
            <div
              style={{
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 15,
                borderBottom: `0.5px solid ${iOS.sepCell}`,
              }}
            >
              <span style={{ color: iOS.label2 }}>{tr('الشركة', 'Manufacturer')}</span>
              <span style={{ color: iOS.label, fontWeight: 500, textAlign: 'end', flex: 1, marginInlineStart: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{medicine['Manufacture Name']}</span>
            </div>
          )}
          {medicine.AtcCode1 && (
            <div
              style={{
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 15,
              }}
            >
              <span style={{ color: iOS.label2 }}>ATC</span>
              <span style={{ color: iOS.label, fontWeight: 500 }}>{medicine.AtcCode1}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
