// iOS system theme for EasyDrug — layered with brand identity.
// Keeps iOS spacing/typography/motion, applies EasyDrug brand colors.

// Brand palette (Easy Drug — Arabic heritage modern)
export const BRAND = {
  teal900: '#003d37',
  teal700: '#006a60',   // primary
  teal500: '#00a896',
  teal300: '#7fd4c6',
  teal100: '#cdeee7',
  teal50:  '#eef9f6',

  gold700: '#b8842a',
  gold500: '#e0a84a',
  gold100: '#faecd0',

  ink:       '#0e1a18',
  ink80:     '#2a3532',
  ink60:     '#55605c',
  ink40:     '#8a938f',
  ink20:     '#c9cfcc',
  ink10:     '#e6eae7',
  paper:     '#f7f9f6',
  paperWarm: '#f4f0e6',
  white:     '#ffffff',

  success: '#2e8856',
  warning: '#c98b2c',
  danger:  '#b33a2e',
  info:    '#2d6da3',
};

export const iOS = {
  // System groups - using brand paper for warmth
  bg:        BRAND.paper,           // was #F2F2F7
  bg2:       BRAND.white,
  bg3:       BRAND.paper,

  label:     BRAND.ink,             // was #000000
  label2:    'rgba(14, 26, 24, 0.6)',
  label3:    'rgba(14, 26, 24, 0.3)',

  sep:       'rgba(14, 26, 24, 0.29)',
  sepCell:   'rgba(14, 26, 24, 0.12)',
  fill:      'rgba(14, 26, 24, 0.08)',

  // System palette — keep iOS colors for actions/system but primary = brand teal
  blue:      BRAND.teal700,         // primary brand teal (replaces #007AFF)
  green:     BRAND.success,
  red:       BRAND.danger,
  orange:    BRAND.warning,
  yellow:    BRAND.gold500,
  purple:    '#AF52DE',
  pink:      '#FF2D55',
  teal:      BRAND.teal500,
  indigo:    '#5856D6',

  gray:      BRAND.ink60,
  gray2:     BRAND.ink40,
  gray3:     BRAND.ink20,
  gray4:     BRAND.ink20,
  gray5:     BRAND.ink10,
  gray6:     BRAND.paper,
};

// Gradient pairs for Tile icons — tuned to brand palette
export const tileGradients = {
  blue:   { from: BRAND.teal500, to: BRAND.teal700 },       // primary teal
  green:  { from: '#5ecf9a', to: BRAND.success },
  red:    { from: '#d46659', to: BRAND.danger },
  orange: { from: '#e6b458', to: BRAND.warning },
  yellow: { from: BRAND.gold500, to: BRAND.gold700 },       // brand gold
  purple: { from: '#C27BE6', to: '#AF52DE' },
  pink:   { from: '#FF6B8B', to: '#FF2D55' },
  teal:   { from: BRAND.teal300, to: BRAND.teal500 },
  indigo: { from: '#7A79E0', to: '#5856D6' },
  gray:   { from: BRAND.ink40, to: BRAND.ink60 },
};

// Brand typography — IBM Plex preferred (bilingual)
export const FONT_AR = "'IBM Plex Sans Arabic', 'Noto Naskh Arabic', -apple-system, sans-serif";
export const FONT_EN = "'IBM Plex Sans', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

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
