// iOS-style modal sheet wrapper with drag handle, slide-up animation.
import React, { useEffect } from 'react';
import { iOS, Icon } from './ui/ios';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconGradient?: { from: string; to: string };
  children: React.ReactNode;
  language?: 'ar' | 'en';
}

export default function IOSModalSheet({
  open,
  onClose,
  title,
  subtitle,
  icon,
  iconGradient,
  children,
  language = 'en',
}: Props) {
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

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
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'iosSheetIn 320ms cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.18)',
          direction: dir,
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div
            style={{
              width: 36,
              height: 5,
              borderRadius: 3,
              background: iOS.gray3,
            }}
          />
        </div>

        {/* Header */}
        {(title || icon) && (
          <div
            style={{
              padding: '4px 16px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderBottom: `0.5px solid ${iOS.sepCell}`,
            }}
          >
            {icon && iconGradient && (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: `linear-gradient(135deg, ${iconGradient.from} 0%, ${iconGradient.to} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && (
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    color: iOS.label,
                    letterSpacing: -0.43,
                    textAlign: language === 'ar' ? 'right' : 'left',
                  }}
                >
                  {title}
                </div>
              )}
              {subtitle && (
                <div
                  style={{
                    fontSize: 13,
                    color: iOS.label2,
                    marginTop: 2,
                    letterSpacing: -0.08,
                    textAlign: language === 'ar' ? 'right' : 'left',
                  }}
                >
                  {subtitle}
                </div>
              )}
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
              aria-label="Close"
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 2l8 8M10 2l-8 8" stroke={iOS.label2} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            background: iOS.bg,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
