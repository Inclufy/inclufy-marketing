// ============================================================
// Inclufy Brand Colors
// Based on official Inclufy logo gradient: purple → pink → gold
// ============================================================

// Logo gradient stops
export const brandGradient = {
  // Light variant (for dark backgrounds)
  light: ['#C084FC', '#F472B6', '#FCD34D'],
  // Deep variant (for light backgrounds)
  deep: ['#9333EA', '#DB2777', '#D97706'],
};

export const colors = {
  // Brand primary — deep purple from the Inclufy palette
  primary: '#9333EA',
  primaryLight: '#C084FC',
  primaryDark: '#7928CA',

  // Brand accent — pink/magenta from the gradient
  secondary: '#DB2777',
  secondaryLight: '#F472B6',

  // Brand accent warm — gold/amber from the gradient
  accent: '#D97706',
  accentLight: '#FCD34D',

  // Backgrounds
  background: '#f9fafb',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  surfaceDark: '#1a1a2e',
  backgroundDark: '#0a0a0f',

  // Text
  text: '#18181b',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textOnPrimary: '#ffffff',
  textOnDark: '#fafafa',

  // Borders
  border: '#e5e7eb',
  borderLight: '#f3f4f6',

  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Channel colors
  linkedin: '#0077b5',
  instagram: '#e4405f',
  x: '#000000',
  facebook: '#1877f2',

  // Status colors
  draft: '#6b7280',
  approved: '#10b981',
  scheduled: '#3b82f6',
  published: '#9333EA',
  failed: '#ef4444',
  in_review: '#f59e0b',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  hero: 32,
};

export const fontWeight = {
  normal: '400' as '400',
  medium: '500' as '500',
  semibold: '600' as '600',
  bold: '700' as '700',
} as const;
