// Professional SF-Symbols-style icons — refined line weights and proportions.
// NOT Apple's SF Symbols assets.
import React from 'react';
import { iOS } from './theme';

type IconProps = { color?: string; size?: number };

export const Icon = {
  search: ({ color = iOS.label2, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="8.5" cy="8.5" r="6" stroke={color} strokeWidth="1.8" />
      <path d="M13 13L17 17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  pill: ({ color = iOS.blue, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="7.5" width="19" height="9" rx="4.5" stroke={color} strokeWidth="1.7" />
      <path d="M12 7.5v9" stroke={color} strokeWidth="1.7" />
      <rect x="4" y="9" width="7" height="6" rx="3" fill={color} opacity="0.22" />
    </svg>
  ),

  heart: ({ color = iOS.red, filled = false, size = 17 }: IconProps & { filled?: boolean } = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <path
        d="M12 21s-9-5.8-9-12.1C3 5.7 5.4 3.5 8 3.5c2.2 0 3.7 1.2 4 2.7.3-1.5 1.8-2.7 4-2.7 2.6 0 5 2.2 5 5.4C21 15.2 12 21 12 21z"
        stroke={color}
        strokeWidth={filled ? 0 : 1.8}
        strokeLinejoin="round"
      />
    </svg>
  ),

  star: ({ color = iOS.orange, filled = false, size = 17 }: IconProps & { filled?: boolean } = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <path
        d="M12 2l3 6.3 7 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l7-1L12 2z"
        stroke={color}
        strokeWidth={filled ? 0 : 1.7}
        strokeLinejoin="round"
      />
    </svg>
  ),

  gear: ({ color = iOS.label2, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="1.7" />
      <path
        d="M12 2v2.5M12 19.5V22M22 12h-2.5M4.5 12H2M19 5l-1.8 1.8M6.8 17.2L5 19M19 19l-1.8-1.8M6.8 6.8L5 5"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),

  shield: ({ color = iOS.green, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l8 3v6c0 5-3.5 9-8 10.5C7.5 20 4 16 4 11V5l8-3z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.15"
      />
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  doc: ({ color = iOS.orange, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M5 2h9l5 5v14a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M14 2v5h5" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8 13h8M8 17h5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),

  bell: ({ color = iOS.red, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M5 17h14l-2-2V10a5 5 0 00-10 0v5l-2 2z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M10 20a2 2 0 004 0" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),

  info: ({ color = iOS.blue, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.7" />
      <path d="M12 11v6M12 7.5v.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  globe: ({ color = iOS.blue, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.7" />
      <path d="M2 12h20M12 2c3 3 4.5 6.5 4.5 10S15 19 12 22c-3-3-4.5-6.5-4.5-10S9 5 12 2z" stroke={color} strokeWidth="1.7" />
    </svg>
  ),

  moon: ({ color = iOS.purple, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M20 15A8 8 0 118 3a6.5 6.5 0 0012 12z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.1"
      />
    </svg>
  ),

  sparkle: ({ color = '#fff', size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7L12 2z" />
      <path d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9z" opacity="0.7" />
    </svg>
  ),

  chevronR: ({ color = iOS.label3, size = 12 }: IconProps = {}) => (
    <svg width={size * 0.55} height={size} viewBox="0 0 8 14" fill="none">
      <path d="M1 1l6 6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  chevronL: ({ color = iOS.blue, size = 17 }: IconProps = {}) => (
    <svg width={size * 0.55} height={size} viewBox="0 0 8 14" fill="none">
      <path d="M7 1L1 7l6 6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  ellipsis: ({ color = iOS.blue, size = 17 }: IconProps = {}) => (
    <svg width={size * 1.3} height={size * 0.5} viewBox="0 0 22 6">
      <circle cx="3" cy="3" r="2" fill={color} />
      <circle cx="11" cy="3" r="2" fill={color} />
      <circle cx="19" cy="3" r="2" fill={color} />
    </svg>
  ),

  mic: ({ color = iOS.label2, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2.5" width="6" height="12" rx="3" stroke={color} strokeWidth="1.7" />
      <path d="M5 12a7 7 0 0014 0M12 19v3" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),

  xCircle: ({ color = iOS.label2, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill={color} opacity="0.5" />
      <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  plus: ({ color = iOS.blue, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4v16M4 12h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  share: ({ color = iOS.blue, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2v14M12 2l-4.5 4.5M12 2l4.5 4.5" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2v-8a2 2 0 00-2-2h-1" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),

  calc: ({ color = '#fff', size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="2" width="18" height="20" rx="2.5" stroke={color} strokeWidth="1.7" />
      <rect x="6" y="5" width="12" height="4" rx="0.8" fill={color} opacity="0.3" stroke={color} strokeWidth="1.2" />
      <circle cx="7.5" cy="13" r="1.1" fill={color} />
      <circle cx="12" cy="13" r="1.1" fill={color} />
      <circle cx="16.5" cy="13" r="1.1" fill={color} />
      <circle cx="7.5" cy="18" r="1.1" fill={color} />
      <circle cx="12" cy="18" r="1.1" fill={color} />
      <circle cx="16.5" cy="18" r="1.1" fill={color} />
    </svg>
  ),

  flask: ({ color = '#fff', size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 2h6v6l5.3 9.5a2.3 2.3 0 01-2 3.5H5.7a2.3 2.3 0 01-2-3.5L9 8V2z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M6 15h12" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="10" cy="17.5" r="1" fill={color} opacity="0.7" />
      <circle cx="14" cy="18.5" r="0.7" fill={color} opacity="0.5" />
    </svg>
  ),

  baby: ({ color = '#fff', size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="4.5" stroke={color} strokeWidth="1.7" />
      <circle cx="10.3" cy="7" r="0.5" fill={color} />
      <circle cx="13.7" cy="7" r="0.5" fill={color} />
      <path d="M10.3 8.8c.7.6 3 .6 3.7 0" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3.5 22v-3a8.5 8.5 0 0117 0v3" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),

  rx: ({ color = '#fff', size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 3h6a4 4 0 010 8H6V3zM6 11v10M6 11l5 5M14 14l6 7M20 15l-5 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  lang: ({ color = iOS.label2, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 5.5h9M7 4v1.5c0 6-4.5 10.5-4.5 10.5M4 10s3 5 7 5.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 22l5-13 5 13M14.5 17.5h5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  face: ({ color = iOS.label2, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.5 10v1.5M15.5 10v1.5M8.5 15c1.5 1.5 5.5 1.5 7 0" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),

  trash: ({ color = iOS.red, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18M9 6V3.5a1 1 0 011-1h4a1 1 0 011 1V6M5.5 6l1.3 14.3a1 1 0 001 .9h8.4a1 1 0 001-.9L18.5 6M10 11v6M14 11v6" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  flag: ({ color = iOS.red, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 2v20M5 3.5h14l-3 5 3 5H5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  barcode: ({ color = iOS.label, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 4v16M5.5 4v16M8 4v13M10.5 4v16M13 4v13M15.5 4v16M18 4v13M20.5 4v16" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),

  compare: ({ color = '#fff', size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 8h14l-3-3M20 16H6l3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  stock: ({ color = '#fff', size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 8l9-5 9 5v10l-9 5-9-5V8z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M3 8l9 5 9-5M12 13v10" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  ),
};
