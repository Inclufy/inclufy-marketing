// ============================================================
// AMOS — Adaptive Theme
// Colors update when ThemeContext calls _syncThemeColors()
// key={themeKey} on NavigationContainer forces full remount →
// all inline color refs re-read the updated values.
// ============================================================

// AMOS brand gradient: pink → orange (matches the logo)
export const brandGradient = {
  light: ['#F06A9D', '#F7941D', '#FBAB45'],   // light pink → orange
  deep:  ['#E8317A', '#F7941D', '#D97706'],    // AMOS signature gradient
  dark:  ['#1B2756', '#C01D60', '#E8317A'],    // navy → pink
};

// ─── Dark palette — AMOS Navy + Pink/Orange ───────────────────────────────
const darkPalette = {
  primary:        '#E8317A',  // AMOS hot pink
  primaryLight:   '#F06A9D',
  primaryDark:    '#C01D60',

  secondary:      '#F7941D',  // AMOS orange
  secondaryLight: '#FBA94E',

  accent:         '#F59E0B',
  accentLight:    '#FCD34D',

  background:     '#0D1428',  // deep AMOS navy
  surface:        '#1B2756',  // AMOS navy
  surfaceElevated:'#243166',
  surfaceDark:    '#090E1C',
  backgroundDark: '#090E1C',

  text:           '#F4F0FF',
  textSecondary:  '#8890B8',
  textTertiary:   '#4E5880',
  textOnPrimary:  '#ffffff',
  textOnDark:     '#F4F0FF',

  border:         '#2A3566',
  borderLight:    '#1E2A55',

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
  published:      '#E8317A',  // AMOS pink
  failed:         '#F87171',
  in_review:      '#F7941D',  // AMOS orange
};

// ─── Light palette — AMOS White + Pink/Orange ────────────────────────────
const lightPalette = {
  primary:        '#E8317A',  // AMOS hot pink
  primaryLight:   '#F06A9D',
  primaryDark:    '#C01D60',

  secondary:      '#F7941D',  // AMOS orange
  secondaryLight: '#FBA94E',

  accent:         '#F7941D',
  accentLight:    '#FBA94E',

  background:     '#FFF8FA',  // warm white
  surface:        '#FFFFFF',
  surfaceElevated:'#FFF0F5',
  surfaceDark:    '#FFE4EE',
  backgroundDark: '#FFE4EE',

  text:           '#0F0A1E',
  textSecondary:  '#5C5070',
  textTertiary:   '#9B8FA8',
  textOnPrimary:  '#FFFFFF',
  textOnDark:     '#0F0A1E',

  border:         '#F0D8E4',
  borderLight:    '#FAF0F4',

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
  published:      '#E8317A',  // AMOS pink
  failed:         '#DC2626',
  in_review:      '#F7941D',  // AMOS orange
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
