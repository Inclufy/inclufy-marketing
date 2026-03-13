import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Light Colors ──────────────────────────────────────────────────────────
export const lightColors = {
  primary:       '#7C3AED',
  primaryLight:  '#A855F7',
  primaryDark:   '#5B21B6',
  secondary:     '#DB2777',
  secondaryLight:'#EC4899',
  accent:        '#D97706',
  accentLight:   '#F59E0B',

  background:    '#F5F4FF',
  surface:       '#FFFFFF',
  surfaceElevated:'#FAFAFF',
  surfaceDark:   '#EDE9FE',
  backgroundDark:'#EDE9FE',

  text:          '#0F0A1E',
  textSecondary: '#5C5B7A',
  textTertiary:  '#9796B0',
  textOnPrimary: '#FFFFFF',
  textOnDark:    '#0F0A1E',

  border:        '#E5E2F5',
  borderLight:   '#F0EEF9',

  success: '#059669',
  warning: '#D97706',
  error:   '#DC2626',
  info:    '#2563EB',

  linkedin:  '#0077B5',
  instagram: '#E4405F',
  x:         '#000000',
  facebook:  '#1877F2',

  draft:     '#6B7280',
  approved:  '#059669',
  scheduled: '#2563EB',
  published: '#7C3AED',
  failed:    '#DC2626',
  in_review: '#D97706',
};

// ─── Dark Colors (existing luxury dark theme) ──────────────────────────────
export const darkColors = {
  primary:       '#A855F7',
  primaryLight:  '#C084FC',
  primaryDark:   '#7928CA',
  secondary:     '#EC4899',
  secondaryLight:'#F472B6',
  accent:        '#F59E0B',
  accentLight:   '#FCD34D',

  background:    '#09090F',
  surface:       '#111120',
  surfaceElevated:'#1A1A2E',
  surfaceDark:   '#050508',
  backgroundDark:'#050508',

  text:          '#F0EEFF',
  textSecondary: '#8A88A8',
  textTertiary:  '#55536E',
  textOnPrimary: '#FFFFFF',
  textOnDark:    '#F0EEFF',

  border:        '#252338',
  borderLight:   '#1A1830',

  success: '#10D9A0',
  warning: '#FBBF24',
  error:   '#F87171',
  info:    '#60A5FA',

  linkedin:  '#0A8FC7',
  instagram: '#E4405F',
  x:         '#E7E7E7',
  facebook:  '#4267D1',

  draft:     '#6B7280',
  approved:  '#10D9A0',
  scheduled: '#60A5FA',
  published: '#A855F7',
  failed:    '#F87171',
  in_review: '#FBBF24',
};

// ─── Theme Context ─────────────────────────────────────────────────────────

type ColorScheme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  scheme: ColorScheme;
  isDark: boolean;
  colors: typeof darkColors;
  setScheme: (s: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'dark',
  isDark: true,
  colors: darkColors,
  setScheme: () => {},
});

const STORAGE_KEY = '@inclufy_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [scheme, setSchemeState] = useState<ColorScheme>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setSchemeState(stored);
      }
    });
  }, []);

  const setScheme = (s: ColorScheme) => {
    setSchemeState(s);
    AsyncStorage.setItem(STORAGE_KEY, s);
  };

  const resolvedDark = scheme === 'system' ? systemScheme === 'dark' : scheme === 'dark';
  const colors = resolvedDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ scheme, isDark: resolvedDark, colors, setScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
