import { Platform, ViewStyle } from 'react-native';

/**
 * Cross-platform shadow utility.
 * Uses boxShadow on web (avoids deprecation warnings) and native shadow props on iOS/Android.
 */
export function shadow(
  color: string,
  offsetX: number,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number = 2,
): ViewStyle {
  if (Platform.OS === 'web') {
    // Convert opacity + color to rgba for web boxShadow
    const hexToRgba = (hex: string, alpha: number): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    const rgba = hexToRgba(color.startsWith('#') ? color : '#000000', opacity);
    return {
      // @ts-ignore - boxShadow is valid on web
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${rgba}`,
    };
  }

  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

/** Light card shadow */
export const cardShadow = shadow('#000000', 0, 1, 0.05, 4, 2);

/** Subtle card shadow */
export const subtleShadow = shadow('#000000', 0, 1, 0.03, 3, 1);

/** FAB / elevated button shadow */
export function fabShadow(color: string = '#9333EA') {
  return shadow(color, 0, 4, 0.3, 8, 8);
}
