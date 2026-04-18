// RTL/LTR support helpers for iOS UI components.
// Components use these to mirror chevrons, reverse row directions, and pad correctly
// in both Arabic (RTL) and English (LTR) modes.

import React from 'react';

export type Dir = 'ltr' | 'rtl';

/**
 * Returns the correct horizontal margin/padding direction for RTL vs LTR.
 * Use for e.g. leading avatars: `marginEnd(12, dir)` puts 12px between
 * the avatar and the text, regardless of direction.
 */
export const marginEnd = (px: number, dir: Dir) =>
  dir === 'rtl' ? { marginLeft: px } : { marginRight: px };

export const marginStart = (px: number, dir: Dir) =>
  dir === 'rtl' ? { marginRight: px } : { marginLeft: px };

export const paddingStart = (px: number, dir: Dir) =>
  dir === 'rtl' ? { paddingRight: px } : { paddingLeft: px };

export const paddingEnd = (px: number, dir: Dir) =>
  dir === 'rtl' ? { paddingLeft: px } : { paddingRight: px };

/**
 * Chevron rotation: iOS chevron-right points at the next screen; in RTL
 * it should point left. Wrap in a span that flips horizontally.
 */
export const chevronFlip = (dir: Dir): React.CSSProperties =>
  dir === 'rtl' ? { transform: 'scaleX(-1)', display: 'inline-flex' } : { display: 'inline-flex' };

/**
 * Text alignment for row titles — always matches reading direction.
 */
export const textAlign = (dir: Dir): 'left' | 'right' => (dir === 'rtl' ? 'right' : 'left');

/**
 * Row separator inset — in RTL the separator should inset from the right
 * (where the leading avatar sits), not the left.
 */
export const separatorInset = (leadingInset: number, dir: Dir) =>
  dir === 'rtl'
    ? { right: leadingInset, left: 0 }
    : { left: leadingInset, right: 0 };

/**
 * Create a language-aware `t` helper: call `langPick(language, ar, en)`.
 */
export function langPick<T>(language: 'ar' | 'en' | string, ar: T, en: T): T {
  return language === 'ar' ? ar : en;
}
