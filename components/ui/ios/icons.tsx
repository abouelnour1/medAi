// Original SF-Symbols-style glyphs — minimal line/fill drawings.
// NOT Apple's SF Symbols assets.
import React from 'react';
import { iOS } from './theme';

type IconProps = { color?: string; size?: number };

export const Icon = {
  search: ({ color = iOS.label2, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 17 17" fill="none">
      <circle cx="7.5" cy="7.5" r="5.25" stroke={color} strokeWidth="1.6" />
      <path d="M11.5 11.5L15 15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),

  pill: ({ color = iOS.blue, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="1.5" y="6.5" width="17" height="7" rx="3.5" stroke={color} strokeWidth="1.5" />
      <path d="M10 6.5v7" stroke={color} strokeWidth="1.5" />
      <rect x="3" y="7.8" width="5" height="4.4" rx="2.2" fill={color} opacity="0.25" />
    </svg>
  ),

  heart: ({ color = iOS.red, filled = false, size = 17 }: IconProps & { filled?: boolean } = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 18" fill={filled ? color : 'none'}>
      <path
        d="M10 16.5S1.5 11 1.5 5.8C1.5 3.2 3.6 1.5 5.8 1.5c1.9 0 3.3 1 4.2 2.4 .9-1.4 2.3-2.4 4.2-2.4 2.2 0 4.3 1.7 4.3 4.3 0 5.2-8.5 10.7-8.5 10.7z"
        stroke={color}
        strokeWidth={filled ? 0 : 1.6}
        strokeLinejoin="round"
      />
    </svg>
  ),

  star: ({ color = iOS.orange, filled = false, size = 17 }: IconProps & { filled?: boolean } = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={filled ? color : 'none'}>
      <path
        d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9 4.7 17.6l1-5.8L1.5 7.7l5.9-.9L10 1.5z"
        stroke={color}
        strokeWidth={filled ? 0 : 1.5}
        strokeLinejoin="round"
      />
    </svg>
  ),

  gear: ({ color = iOS.label2, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3" stroke={color} strokeWidth="1.5" />
      <path
        d="M10 1.5v2.5M10 16v2.5M18.5 10H16M4 10H1.5M16 4l-1.8 1.8M5.8 14.2L4 16M16 16l-1.8-1.8M5.8 5.8L4 4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),

  shield: ({ color = iOS.green, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M10 1.5l7 2.5v5.5c0 4.3-3 7.7-7 9-4-1.3-7-4.7-7-9V4L10 1.5z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.15"
      />
    </svg>
  ),

  doc: ({ color = iOS.orange, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M4.5 2h8L17 6.5v11.5a.5.5 0 01-.5.5h-12a.5.5 0 01-.5-.5v-16a.5.5 0 01.5-.5z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12.5 2v4.5H17" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),

  bell: ({ color = iOS.red, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M4 15h12l-1.5-2V9a4.5 4.5 0 00-9 0v4L4 15z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 17.2a2 2 0 004 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  info: ({ color = iOS.blue, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1.5" />
      <path d="M10 9v5M10 6v0.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),

  globe: ({ color = iOS.blue, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1.5" />
      <path
        d="M1.5 10h17M10 1.5c2.5 2.5 3.8 5.5 3.8 8.5S12.5 17.5 10 18.5c-2.5-1-3.8-5.5-3.8-8.5S7.5 4 10 1.5z"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  ),

  moon: ({ color = iOS.purple, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M16 12.5A7 7 0 117.5 4a5.5 5.5 0 008.5 8.5z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),

  sparkle: ({ color = '#fff', size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={color}>
      <path d="M10 1l1.8 5.2L17 8l-5.2 1.8L10 15l-1.8-5.2L3 8l5.2-1.8L10 1zM15 13l.9 1.8L17.8 16l-1.9.9L15 18.7 14.1 16.8 12.2 16l1.9-.9z" />
    </svg>
  ),

  chevronR: ({ color = iOS.label3, size = 12 }: IconProps = {}) => (
    <svg width={size * 0.65} height={size} viewBox="0 0 8 13" fill="none">
      <path d="M1 1l6 5.5L1 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  chevronL: ({ color = iOS.blue, size = 17 }: IconProps = {}) => (
    <svg width={size * 0.6} height={size} viewBox="0 0 12 20" fill="none">
      <path d="M10 1L2 10l8 9" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="7" y="2" width="6" height="10" rx="3" stroke={color} strokeWidth="1.6" />
      <path d="M4 10a6 6 0 0012 0M10 16v2.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),

  xCircle: ({ color = iOS.label2, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill={color} opacity="0.5" />
      <path d="M7 7l6 6M13 7l-6 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),

  plus: ({ color = iOS.blue, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 3v14M3 10h14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  share: ({ color = iOS.blue, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M10 1.5v12M10 1.5l-4 4M10 1.5l4 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 9H3a1 1 0 00-1 1v8a1 1 0 001 1h14a1 1 0 001-1v-8a1 1 0 00-1-1h-1"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),

  calc: ({ color = '#fff', size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="1.5" width="15" height="17" rx="2.5" stroke={color} strokeWidth="1.5" />
      <rect x="5" y="4" width="10" height="3" rx="0.5" fill={color} />
      <circle cx="6" cy="11" r="0.9" fill={color} />
      <circle cx="10" cy="11" r="0.9" fill={color} />
      <circle cx="14" cy="11" r="0.9" fill={color} />
      <circle cx="6" cy="15" r="0.9" fill={color} />
      <circle cx="10" cy="15" r="0.9" fill={color} />
      <circle cx="14" cy="15" r="0.9" fill={color} />
    </svg>
  ),

  flask: ({ color = '#fff', size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M8 1.5h4v5.5l4.5 8a2 2 0 01-1.7 3H5.2a2 2 0 01-1.7-3L8 7V1.5z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M5.5 13h9" stroke={color} strokeWidth="1.5" />
    </svg>
  ),

  baby: ({ color = '#fff', size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="6" r="4" stroke={color} strokeWidth="1.5" />
      <path
        d="M8.5 6h0.01M11.5 6h0.01M8.5 7.5c0.5 0.5 2.5 0.5 3 0"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M3 19v-3a7 7 0 0114 0v3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  rx: ({ color = '#fff', size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M5 2h5a3.5 3.5 0 010 7H5v-7zM5 9v9M5 9l4 4M12 12l5 6M17 13l-4 5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  lang: ({ color = iOS.label2, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M2 4.5h8M6 3v1.5c0 5-4 9-4 9M3.5 9c0 0 2.5 4 6 4.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10 18l4-11 4 11M12 14h4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  face: ({ color = iOS.label2, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M2 6V4a2 2 0 012-2h2M14 2h2a2 2 0 012 2v2M18 14v2a2 2 0 01-2 2h-2M6 18H4a2 2 0 01-2-2v-2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M7 9v1M13 9v1M7 13c1 1 5 1 6 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  trash: ({ color = iOS.red, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M3 5h14M8 5V3a1 1 0 011-1h2a1 1 0 011 1v2M5 5l1 12a1 1 0 001 1h6a1 1 0 001-1l1-12"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  flag: ({ color = iOS.red, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M4 2v16M4 3h11l-2 4 2 4H4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  // Extra icons specific to EasyDrug
  barcode: ({ color = iOS.label, size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M2 3v14M4 3v14M6 3v11M8 3v14M10 3v11M12 3v14M14 3v11M16 3v14M18 3v14"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),

  compare: ({ color = '#fff', size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M3 6h9l-2-2M17 14H8l2 2"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  stock: ({ color = '#fff', size = 17 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M3 7l7-4 7 4v9l-7 4-7-4V7z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M3 7l7 4 7-4M10 11v9" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
};
