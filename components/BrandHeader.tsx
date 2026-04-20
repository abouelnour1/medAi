import React from 'react';

const B = {
  teal700: '#006a60',
  teal500: '#00a896',
  teal300: '#7fd4c6',
  white:   '#ffffff',
};

export function EDMark({ size = 64 }: { size?: number }) {
  const r = size * 0.22;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x="2" y="2" width="96" height="96" rx={r} fill={B.teal700}/>
      <g opacity="0.12">
        <rect x="22" y="22" width="56" height="56" fill={B.white}/>
        <rect x="22" y="22" width="56" height="56" fill={B.white} transform="rotate(45 50 50)"/>
      </g>
      <g fill={B.white}>
        <rect x="42" y="24" width="16" height="52" rx="4"/>
        <rect x="24" y="42" width="52" height="16" rx="4"/>
      </g>
      <rect x="42" y="42" width="16" height="16" fill={B.teal500} opacity="0.85"/>
    </svg>
  );
}

interface BrandHeaderProps {
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
}

const BrandHeader: React.FC<BrandHeaderProps> = ({ subtitle, size = 'md' }) => {
  const markSize = size === 'lg' ? 80 : size === 'sm' ? 48 : 64;
  const arSize   = size === 'lg' ? 26 : size === 'sm' ? 18 : 22;
  const enSize   = size === 'lg' ? 22 : size === 'sm' ? 16 : 18;

  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <EDMark size={markSize} />
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <span style={{
            fontFamily: "'IBM Plex Sans Arabic', 'Noto Naskh Arabic', serif",
            fontWeight: 700, fontSize: arSize, color: B.teal700,
            direction: 'rtl', lineHeight: 1,
          }}>
            إيزي<span style={{ color: B.teal500 }}>درج</span>
          </span>
          <span style={{ width: 1, height: 16, background: '#c9cfcc', display: 'inline-block', verticalAlign: 'middle' }} />
          <span style={{ fontWeight: 700, fontSize: enSize, color: '#0e1a18', letterSpacing: '-0.02em', lineHeight: 1 }}>
            Easy<span style={{ color: B.teal700 }}>Drug</span>
          </span>
        </div>
        {subtitle && (
          <p className="text-[11px] font-semibold text-slate-400 mt-1.5 tracking-widest uppercase">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default BrandHeader;
