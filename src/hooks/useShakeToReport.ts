/**
 * useShakeToReport — detects a shake gesture via the accelerometer and fires
 * a callback. Mirrors the AMOS web "Probleem melden" flow on the Copilot
 * page (commit 9e1afc1) but triggered hands-free on mobile.
 *
 * Algorithm: 100 ms accelerometer sample, fires when ≥2 spikes >1.8 g
 * arrive within a 700 ms window. 2 s cooldown afterwards to prevent bursts.
 */
import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

interface UseShakeToReportOptions {
  enabled?: boolean;
  threshold?: number;
  windowMs?: number;
  minSpikes?: number;
  cooldownMs?: number;
  sampleIntervalMs?: number;
  onShake: () => void;
}

export function useShakeToReport({
  enabled = true,
  threshold = 1.8,
  windowMs = 700,
  minSpikes = 2,
  cooldownMs = 2000,
  sampleIntervalMs = 100,
  onShake,
}: UseShakeToReportOptions): void {
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  useEffect(() => {
    if (!enabled) return;

    let spikeTimes: number[] = [];
    let lastFireAt = 0;

    Accelerometer.setUpdateInterval(sampleIntervalMs);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude < threshold) return;

      const now = Date.now();
      if (now - lastFireAt < cooldownMs) return;

      spikeTimes.push(now);
      spikeTimes = spikeTimes.filter((t) => now - t <= windowMs);

      if (spikeTimes.length >= minSpikes) {
        lastFireAt = now;
        spikeTimes = [];
        try {
          onShakeRef.current();
        } catch {
          // never crash from a sensor handler
        }
      }
    });

    return () => {
      sub.remove();
    };
  }, [enabled, threshold, windowMs, minSpikes, cooldownMs, sampleIntervalMs]);
}
