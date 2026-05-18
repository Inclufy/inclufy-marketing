// ──────────────────────────────────────────────────────────────────────
// AmosWatermark — freemium watermark composited into every published photo.
//
// Lives INSIDE the ViewShot in PostReviewScreen so when bakeOverlayIntoImage
// captures the ref, the watermark is permanently baked into the uploaded
// image. Free-tier users always see this; Pro+ users skip rendering it
// (see canHideWatermark in src/utils/userTier.ts).
//
// Rewrite history: original version (commits 812b6ba/3089e41) used
// require() of icon.png + accessibility props + array-style merging. That
// combination crashed on iOS build 294 with "TypeError: undefined is not
// a function" during PostReviewScreen render — root cause was never
// fully pinpointed without source-maps. This minimal text-only version
// avoids require() / accessibilityRole / array styles entirely.
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
  inset?: number;
  compact?: boolean;
}

export function AmosWatermark({
  position = 'bottom-right',
  inset = 12,
  compact = false,
}: Props) {
  // Inline position computation — avoids the dict-lookup pattern from the
  // crashed version.
  const positionStyle =
    position === 'bottom-right' ? { bottom: inset, right: inset } :
    position === 'bottom-left'  ? { bottom: inset, left: inset } :
    position === 'top-right'    ? { top: inset, right: inset } :
                                  { top: inset, left: inset };

  return (
    <View
      style={{
        position: 'absolute',
        ...positionStyle,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        paddingHorizontal: 11,
        paddingVertical: 6,
        borderRadius: 999,
        zIndex: 999,
        elevation: 10,
      }}
    >
      <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>
        AMOS{compact ? '' : ' · by Inclufy'}
      </Text>
    </View>
  );
}
