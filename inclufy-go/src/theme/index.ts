// ============================================================
// Inclufy GO — Luxury Dark Theme
// Deep purple-black premium aesthetic
// Logo gradient: purple → pink → gold
// ============================================================

export const brandGradient = {
  light: ['#C084FC', '#F472B6', '#FCD34D'],
  deep:  ['#9333EA', '#DB2777', '#D97706'],
  dark:  ['#1E0A4E', '#4C1D95', '#7C3AED'],
};

export const colors = {
  // ─── Brand ──────────────────────────────────────────────
  primary:      '#A855F7',   // Vibrant purple (lighter for dark bg)
  primaryLight: '#C084FC',
  primaryDark:  '#7928CA',

  secondary:      '#EC4899',  // Hot pink
  secondaryLight: '#F472B6',

  accent:      '#F59E0B',    // Gold
  accentLight: '#FCD34D',

  // ─── Backgrounds (Dark) ──────────────────────────────────
  background:     '#09090F',   // Deep black with purple tint
  surface:        '#111120',   // Card/sheet surface
  surfaceElevated:'#1A1A2E',  // Modals, elevated cards
  surfaceDark:    '#050508',   // Darkest
  backgroundDark: '#050508',

  // ─── Text ────────────────────────────────────────────────
  text:          '#F0EEFF',   // Warm white with purple hint
  textSecondary: '#8A88A8',   // Muted purple-gray
  textTertiary:  '#55536E',   // Very muted
  textOnPrimary: '#ffffff',
  textOnDark:    '#F0EEFF',

  // ─── Borders ─────────────────────────────────────────────
  border:      '#252338',    // Subtle purple border
  borderLight: '#1A1830',    // Even subtler

  // ─── Semantic ────────────────────────────────────────────
  success: '#10D9A0',   // Bright teal-green for dark bg
  warning: '#FBBF24',
  error:   '#F87171',
  info:    '#60A5FA',

  // ─── Channels ────────────────────────────────────────────
  linkedin:  '#0A8FC7',
  instagram: '#E4405F',
  x:         '#E7E7E7',
  facebook:  '#4267D1',

  // ─── Status ──────────────────────────────────────────────
  draft:     '#6B7280',
  approved:  '#10D9A0',
  scheduled: '#60A5FA',
  published: '#A855F7',
  failed:    '#F87171',
  in_review: '#FBBF24',
};

export const spacing = {
  xs:  4,
  sm:  10,
  md:  18,
  lg:  28,
  xl:  40,
  xxl: 56,
};

export const borderRadius = {
  sm:  8,
  md:  16,
  lg:  20,
  xl:  28,
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
