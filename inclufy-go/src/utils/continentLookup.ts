/**
 * Maps ISO 3166-1 alpha-2 country codes to their continent.
 * Covers all major countries; returns 'Unknown' for unmapped codes.
 */

const CONTINENT_MAP: Record<string, string> = {
  // ─── Europe ─────────────────────────────────────────────────
  AL: 'Europe', AD: 'Europe', AT: 'Europe', BY: 'Europe', BE: 'Europe',
  BA: 'Europe', BG: 'Europe', HR: 'Europe', CY: 'Europe', CZ: 'Europe',
  DK: 'Europe', EE: 'Europe', FI: 'Europe', FR: 'Europe', DE: 'Europe',
  GR: 'Europe', HU: 'Europe', IS: 'Europe', IE: 'Europe', IT: 'Europe',
  XK: 'Europe', LV: 'Europe', LI: 'Europe', LT: 'Europe', LU: 'Europe',
  MT: 'Europe', MD: 'Europe', MC: 'Europe', ME: 'Europe', NL: 'Europe',
  MK: 'Europe', NO: 'Europe', PL: 'Europe', PT: 'Europe', RO: 'Europe',
  RU: 'Europe', SM: 'Europe', RS: 'Europe', SK: 'Europe', SI: 'Europe',
  ES: 'Europe', SE: 'Europe', CH: 'Europe', UA: 'Europe', GB: 'Europe',
  VA: 'Europe',

  // ─── North America ─────────────────────────────────────────
  US: 'North America', CA: 'North America', MX: 'North America',
  GT: 'North America', BZ: 'North America', HN: 'North America',
  SV: 'North America', NI: 'North America', CR: 'North America',
  PA: 'North America', CU: 'North America', JM: 'North America',
  HT: 'North America', DO: 'North America', TT: 'North America',
  BB: 'North America', BS: 'North America',

  // ─── South America ─────────────────────────────────────────
  BR: 'South America', AR: 'South America', CO: 'South America',
  CL: 'South America', PE: 'South America', VE: 'South America',
  EC: 'South America', BO: 'South America', PY: 'South America',
  UY: 'South America', GY: 'South America', SR: 'South America',

  // ─── Asia ──────────────────────────────────────────────────
  CN: 'Asia', JP: 'Asia', KR: 'Asia', IN: 'Asia', ID: 'Asia',
  TH: 'Asia', VN: 'Asia', PH: 'Asia', MY: 'Asia', SG: 'Asia',
  TW: 'Asia', HK: 'Asia', BD: 'Asia', PK: 'Asia', LK: 'Asia',
  NP: 'Asia', MM: 'Asia', KH: 'Asia', LA: 'Asia', MN: 'Asia',
  KZ: 'Asia', UZ: 'Asia', TM: 'Asia', KG: 'Asia', TJ: 'Asia',
  AF: 'Asia', IR: 'Asia', IQ: 'Asia', SA: 'Asia', AE: 'Asia',
  QA: 'Asia', KW: 'Asia', BH: 'Asia', OM: 'Asia', YE: 'Asia',
  JO: 'Asia', LB: 'Asia', SY: 'Asia', IL: 'Asia', PS: 'Asia',
  TR: 'Asia', GE: 'Asia', AM: 'Asia', AZ: 'Asia',

  // ─── Africa ────────────────────────────────────────────────
  NG: 'Africa', ZA: 'Africa', EG: 'Africa', KE: 'Africa', ET: 'Africa',
  GH: 'Africa', TZ: 'Africa', UG: 'Africa', DZ: 'Africa', MA: 'Africa',
  TN: 'Africa', LY: 'Africa', SD: 'Africa', CM: 'Africa', CI: 'Africa',
  SN: 'Africa', ML: 'Africa', BF: 'Africa', NE: 'Africa', TD: 'Africa',
  MG: 'Africa', MZ: 'Africa', ZM: 'Africa', ZW: 'Africa', BW: 'Africa',
  NA: 'Africa', AO: 'Africa', CD: 'Africa', CG: 'Africa', GA: 'Africa',
  RW: 'Africa', BI: 'Africa', MW: 'Africa', LS: 'Africa', SZ: 'Africa',
  MU: 'Africa', SC: 'Africa',

  // ─── Oceania ───────────────────────────────────────────────
  AU: 'Oceania', NZ: 'Oceania', FJ: 'Oceania', PG: 'Oceania',
  WS: 'Oceania', TO: 'Oceania', VU: 'Oceania', SB: 'Oceania',
};

/**
 * Get continent name from ISO country code (e.g. 'BE' → 'Europe')
 */
export function getContinent(countryCode: string): string {
  if (!countryCode) return '';
  return CONTINENT_MAP[countryCode.toUpperCase()] || '';
}

/**
 * All continent names for display purposes
 */
export const CONTINENTS = [
  'Europe',
  'North America',
  'South America',
  'Asia',
  'Africa',
  'Oceania',
] as const;

export default CONTINENT_MAP;
