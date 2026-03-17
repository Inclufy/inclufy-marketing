// shadows.ts — Dark theme shadow utilities
// In dark themes, shadows use purple glow instead of dark drops

import { ViewStyle } from 'react-native';

export const subtleShadow: ViewStyle = {
  shadowColor: '#A855F7',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 3,
};

export const cardShadow: ViewStyle = {
  shadowColor: '#A855F7',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18,
  shadowRadius: 16,
  elevation: 6,
};

export const fabShadow = (color: string = '#A855F7'): ViewStyle => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.45,
  shadowRadius: 20,
  elevation: 10,
});

export const glowShadow = (color: string = '#A855F7'): ViewStyle => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.35,
  shadowRadius: 12,
  elevation: 8,
});
