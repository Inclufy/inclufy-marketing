// ============================================================
// AMOS — Adaptive Theme
// Colors update when ThemeContext calls _syncThemeColors()
// key={themeKey} on NavigationContainer forces full remount →
// all inline color refs re-read the updated values.
// ============================================================

export const brandGradient = {
  light: ['#C084FC', '#F472B6', '#FCD34D'],
  deep:  ['#9333EA', '#DB2777', '#D97706'],
  dark:  ['#1E0A4E', '#4C1D95', '#7C3AED'],
};

// ─── Dark palette (default) ──────────────────────────────────────────────────
const darkPalette = {
  primary:        '#A855F7',
  primaryLight:   '#C084FC',
  primaryDark:    '#7928CA',

  secondary:      '#EC4899',
  secondaryLight: '#F472B6',

  accent:         '#F59E0B',
  accentLight:    '#FCD34D',

  background:     '#09090F',
  surface:        '#111120',
  surfaceElevated:'#1A1A2E',
  surfaceDark:    '#050508',
  backgroundDark: '#050508',

  text:           '#F0EEFF',
  textSecondary:  '#8A88A8',
  textTertiary:   '#55536E',
  textOnPrimary:  '#ffffff',
  textOnDark:     '#F0EEFF',

  border:         '#252338',
  borderLight:    '#1A1830',

  success:        '#10D9A0',
  warning:        '#FBBF24',
  error:          '#F87171',
  info:           '#60A5FA',

  linkedin:       '#0A8FC7',
  instagram:      '#E4405F',
  x:              '#E7E7E7',
  facebook:       '#4267D1',

  draft:          '#6B7280',
  approved:       '#10D9A0',
  scheduled:      '#60A5FA',
  published:      '#A855F7',
  failed:         '#F87171',
  in_review:      '#FBBF24',
};

// ─── Light palette ──────────────────────────────────────────────────────────
const lightPalette = {
  primary:        '#7C3AED',
  primaryLight:   '#A855F7',
  primaryDark:    '#5B21B6',

  secondary:      '#DB2777',
  secondaryLight: '#EC4899',

  accent:         '#D97706',
  accentLight:    '#F59E0B',

  background:     '#F7F6FF',
  surface:        '#FFFFFF',
  surfaceElevated:'#F0EEFF',
  surfaceDark:    '#EDE9FE',
  backgroundDark: '#EDE9FE',

  text:           '#0F0A1E',
  textSecondary:  '#5C5B7A',
  textTertiary:   '#9796B0',
  textOnPrimary:  '#FFFFFF',
  textOnDark:     '#0F0A1E',

  border:         '#E5E2F5',
  borderLight:    '#F0EEF9',

  success:        '#059669',
  warning:        '#D97706',
  error:          '#DC2626',
  info:           '#2563EB',

  linkedin:       '#0077B5',
  instagram:      '#E4405F',
  x:              '#000000',
  facebook:       '#1877F2',

  draft:          '#6B7280',
  approved:       '#059669',
  scheduled:      '#2563EB',
  published:      '#7C3AED',
  failed:         '#DC2626',
  in_review:      '#D97706',
};

/**
 * Mutable colors object — ThemeContext calls _syncThemeColors() whenever the
 * theme changes. Combined with key={themeKey} on NavigationContainer (full
 * remount), every inline `colors.xxx` reference re-reads the updated value.
 *
 * NOTE: StyleSheet.create() values captured at module load time will not
 * update. Use useThemedStyles() from utils/themedStyles.ts for those.
 */
export const colors: typeof darkPalette = { ...darkPalette };

/** Called by ThemeContext immediately before bumping themeKey */
export function _syncThemeColors(isDark: boolean): void {
  const src = isDark ? darkPalette : lightPalette;
  (Object.keys(src) as Array<keyof typeof src>).forEach((k) => {
    (colors as any)[k] = src[k];
  });
}

// ─── Layout tokens ─────────────────────────────────────────────────────────

export const spacing = {
  xs:  4,
  sm:  10,
  md:  18,
  lg:  28,
  xl:  40,
  xxl: 56,
};

export const borderRadius = {
  sm:   8,
  md:   16,
  lg:   20,
  xl:   28,
  full: 9999,
};

export const fontSize = {
  xs:   12,
  sm:   14,
  md:   16,
  lg:   19,
  xl:   23,
  xxl:  28,
  hero: 36,
};

export const fontWeight = {
  normal:   '400' as '400',
  medium:   '500' as '500',
  semibold: '600' as '600',
  bold:     '700' as '700',
} as const;
