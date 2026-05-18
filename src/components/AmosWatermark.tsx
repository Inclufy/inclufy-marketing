// ──────────────────────────────────────────────────────────────────────
// AmosWatermark — freemium watermark composited into every published photo.
//
// V3 — minimal, bullet-proof. Renders a single View with Text. No
// require() of images. No StyleSheet.create. No array style merging.
// No accessibility props. pointerEvents="none" so it never intercepts
// touches.
//
// Iterations history:
//   V1 (812b6ba): Image (require icon.png) + StyleSheet + accessibility
//                 → crashed PostReview render on iOS Hermes (TypeError
//                 "undefined is not a function").
//   V2 (53ff8a5): Inline styles + text-only — failed visually somehow,
//                 Sami reported "issue met het watermerk".
//   V3 (this):    Strip every potentially-fragile pattern. Compute
//                 position via plain ternary on string prefix/suffix
//                 instead of object lookup. Use solid color + opacity
//                 instead of rgba string. Use simple borderRadius.
// ──────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text } from 'react-native';

export type WatermarkPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

interface Props {
  position?: WatermarkPosition;
}

export function AmosWatermark({ position = 'bottom-right' }: Props) {
  const isBottom = position === 'bottom-right' || position === 'bottom-left';
  const isRight  = position === 'bottom-right' || position === 'top-right';

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: isBottom ? 12 : undefined,
        top:    isBottom ? undefined : 12,
        right:  isRight  ? 12 : undefined,
        left:   isRight  ? undefined : 12,
        backgroundColor: '#000000',
        opacity: 0.85,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
      }}
    >
      <Text
        style={{
          color: '#ffffff',
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.4,
        }}
      >
        AMOS · by Inclufy
      </Text>
    </View>
  );
}
