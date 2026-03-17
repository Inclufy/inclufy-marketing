import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { getContinent } from '../utils/continentLookup';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RegionData {
  city: string;
  province: string;
  country: string;
  countryCode: string;
  continent: string;
}

interface UseLocationResult {
  region: RegionData | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  refresh: () => Promise<void>;
}

const EMPTY_REGION: RegionData = {
  city: '',
  province: '',
  country: '',
  countryCode: '',
  continent: '',
};

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * One-shot GPS location hook with reverse geocoding.
 * Detects: city, province, country (+ code), continent.
 * Call `refresh()` to re-detect.
 */
export function useLocation(autoDetect = true): UseLocationResult {
  const [region, setRegion] = useState<RegionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const detect = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setError('Permission denied');
        setLoading(false);
        return;
      }
      setPermissionDenied(false);

      // Get current position (one-shot, not tracking)
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (address) {
        const countryCode = address.isoCountryCode || '';
        const data: RegionData = {
          city: address.city || address.subregion || '',
          province: address.region || '',
          country: address.country || '',
          countryCode,
          continent: getContinent(countryCode),
        };
        setRegion(data);
      } else {
        setError('Could not determine location');
      }
    } catch (err: any) {
      setError(err.message || 'Location error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoDetect) {
      detect();
    }
  }, [autoDetect]);

  return { region, loading, error, permissionDenied, refresh: detect };
}

/**
 * Format region data into a readable string.
 * Examples: "Antwerpen, België" or "Antwerpen, Antwerpen, België, Europe"
 */
export function formatRegion(
  region: RegionData | null,
  level: 'short' | 'full' = 'short',
): string {
  if (!region) return '';

  if (level === 'full') {
    return [region.city, region.province, region.country, region.continent]
      .filter(Boolean)
      .join(', ');
  }

  // Short: city + country
  return [region.city, region.country].filter(Boolean).join(', ');
}
