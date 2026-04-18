// Easy Drug brand mark — medical cross in rounded square,
// with subtle 8-point Islamic star geometry.
import React from 'react';
import { BRAND } from './theme';

export function EDMark({
  size = 40,
  bg = BRAND.teal700,
  fg = BRAND.white,
  accent = BRAND.teal500,
}: {
  size?: number;
  bg?: string;
  fg?: string;
  accent?: string;
}) {
  const r = size * 0.22;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x="2" y="2" width="96" height="96" rx={r} fill={bg} />
      {/* 8-point star (two overlapped squares) */}
      <g opacity="0.12">
        <rect x="22" y="22" width="56" height="56" fill={fg} />
        <rect x="22" y="22" width="56" height="56" fill={fg} transform="rotate(45 50 50)" />
      </g>
      {/* Medical cross */}
      <g fill={fg}>
        <rect x="42" y="24" width="16" height="52" rx="4" />
        <rect x="24" y="42" width="52" height="16" rx="4" />
      </g>
      {/* Accent notch */}
      <rect x="42" y="42" width="16" height="16" fill={accent} opacity="0.85" />
    </svg>
  );
}

export function EDWordmark({
  color = BRAND.ink,
  accent = BRAND.teal700,
  size = 1,
  lang = 'en',
}: {
  color?: string;
  accent?: string;
  size?: number;
  lang?: 'ar' | 'en';
}) {
  if (lang === 'ar') {
    return (
      <span
        style={{
          fontFamily: "'IBM Plex Sans Arabic', sans-serif",
          fontWeight: 700,
          fontSize: 22 * size,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          direction: 'rtl',
          color,
        }}
      >
        إيزي<span style={{ color: accent }}>درج</span>
      </span>
    );
  }
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
        fontWeight: 600,
        fontSize: 22 * size,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        color,
      }}
    >
      Easy<span style={{ color: accent }}>Drug</span>
    </span>
  );
}
