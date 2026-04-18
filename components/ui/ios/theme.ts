// iOS system theme for EasyDrug redesign.
// All values match Apple HIG — system colors, typography, spacing.

export const iOS = {
  // System light
  bg:        '#F2F2F7',   // systemGroupedBackground
  bg2:       '#FFFFFF',   // secondarySystemGroupedBackground (cells)
  bg3:       '#F2F2F7',   // tertiarySystemGroupedBackground

  label:     '#000000',
  label2:    'rgba(60,60,67,0.6)',
  label3:    'rgba(60,60,67,0.3)',

  sep:       'rgba(60,60,67,0.29)',
  sepCell:   'rgba(60,60,67,0.12)',
  fill:      'rgba(120,120,128,0.12)', // searchfield

  // System palette
  blue:      '#007AFF',
  green:     '#34C759',
  red:       '#FF3B30',
  orange:    '#FF9500',
  yellow:    '#FFCC00',
  purple:    '#AF52DE',
  pink:      '#FF2D55',
  teal:      '#30B0C7',
  indigo:    '#5856D6',

  gray:      '#8E8E93',
  gray2:     '#AEAEB2',
  gray3:     '#C7C7CC',
  gray4:     '#D1D1D6',
  gray5:     '#E5E5EA',
  gray6:     '#F2F2F7',
};

// Gradient pairs used for Tile icons (from → to)
export const tileGradients = {
  blue:   { from: '#6DA8FF', to: '#007AFF' },
  green:  { from: '#6BCB77', to: '#34C759' },
  red:    { from: '#FF7A7A', to: '#FF3B30' },
  orange: { from: '#FFB84D', to: '#FF9500' },
  yellow: { from: '#FFC547', to: '#FFCC00' },
  purple: { from: '#C27BE6', to: '#AF52DE' },
  pink:   { from: '#FF6B8B', to: '#FF2D55' },
  teal:   { from: '#5BC4D6', to: '#30B0C7' },
  indigo: { from: '#7A79E0', to: '#5856D6' },
  gray:   { from: '#8E8E9F', to: '#5D5D6E' },
};

// iOS typography presets
export const iOSType = {
  largeTitle: { fontSize: 34, fontWeight: 700, letterSpacing: 0.37, lineHeight: '41px' },
  title1:     { fontSize: 28, fontWeight: 700, letterSpacing: 0.36 },
  title2:     { fontSize: 22, fontWeight: 700, letterSpacing: 0.35 },
  title3:     { fontSize: 20, fontWeight: 600, letterSpacing: 0.38 },
  headline:   { fontSize: 17, fontWeight: 600, letterSpacing: -0.43 },
  body:       { fontSize: 17, fontWeight: 400, letterSpacing: -0.43 },
  callout:    { fontSize: 16, fontWeight: 400, letterSpacing: -0.32 },
  subheadline:{ fontSize: 15, fontWeight: 400, letterSpacing: -0.23 },
  footnote:   { fontSize: 13, fontWeight: 400, letterSpacing: -0.08 },
  caption1:   { fontSize: 12, fontWeight: 400, letterSpacing: 0 },
  caption2:   { fontSize: 11, fontWeight: 400, letterSpacing: 0.06 },
} as const;
