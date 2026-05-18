// ──────────────────────────────────────────────────────────────────────
// AmosWatermark — freemium watermark composited into every published photo.
//
// Lives INSIDE the ViewShot in PostReviewScreen so when bakeOverlayIntoImage
// captures the ref, the watermark is permanently baked into the uploaded
// image. Free-tier users always see this; Pro+ users skip rendering it
// (see canHideWatermark in src/utils/userTier.ts).
//
// Design constraints:
//   - Visible but not overpowering — ~85% opacity, no harsh contrast
//   - Always bottom-right by default (consistent across feeds)
//   - Uses the AMOS app icon + wordmark for brand recognition
//   - Small enough to not block image content (~150px wide, ~28px tall)
//
// Position options exist so a future PR can let Pro users choose corner
// for their OWN logo via the existing overlayConfig.logoPosition pattern.
// ──────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, Image, StyleSheet, type ViewStyle } from 'react-native';

export type WatermarkPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

interface Props {
  /** Corner of the parent View. Default: bottom-right. */
  position?: WatermarkPosition;
  /** Override the absolute offset (default 12px from each edge). */
  inset?: number;
  /** Hide the "· by Inclufy" tagline (smaller-screen contexts). */
  compact?: boolean;
}

export function AmosWatermark({
  position = 'bottom-right',
  inset = 12,
  compact = false,
}: Props) {
  const posStyle: ViewStyle = {
    'bottom-right': { bottom: inset, right: inset },
    'bottom-left': { bottom: inset, left: inset },
    'top-right': { top: inset, right: inset },
    'top-left': { top: inset, left: inset },
  }[position];

  return (
    <View
      style={[styles.pill, posStyle]}
      // Accessibility: screen-readers announce this so visually-impaired
      // users (and Play / App Store review accessibility audits) know the
      // image carries Inclufy attribution.
      accessible
      accessibilityRole="image"
      accessibilityLabel="Made with AMOS by Inclufy"
    >
      <View style={styles.logoDot}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.brand}>AMOS</Text>
      {!compact && <Text style={styles.tag}>· by Inclufy</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 7,
    // High zIndex to guarantee it sits above any sibling absolute layers
    // inside the ViewShot (text overlay, brand-logo overlay, etc.).
    zIndex: 999,
    elevation: 10,
    // Drop shadow so the pill stands off light backgrounds
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  logoDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#9333EA', // Inclufy purple (brandbook primary)
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 20,
    height: 20,
  },
  brand: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  tag: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 11,
    fontWeight: '500',
  },
});
