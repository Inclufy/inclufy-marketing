/**
 * useThemedStyles — creates a StyleSheet inside the component so colors
 * re-evaluate on every theme change (when themeKey bumps NavigationContainer).
 *
 * Usage:
 *   const styles = useThemedStyles(colors => StyleSheet.create({ ... }));
 */
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { darkColors } from '../context/ThemeContext';

type ColorsType = typeof darkColors;

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ColorsType) => T,
): T {
  const { colors, themeKey } = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(factory(colors)), [themeKey]);
}
