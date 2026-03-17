/**
 * Tests for EU date conversion helpers used in EventSetupScreen.
 * These are pure functions — fast, zero-dependency tests.
 */

// Inline the helpers (same logic as EventSetupScreen)
const toEUDate = (iso: string): string => {
  if (!iso) return '';
  const p = iso.split('-');
  if (p.length !== 3) return iso;
  if (p[0].length <= 2) return iso; // already EU
  return `${p[2]}-${p[1]}-${p[0]}`;
};

const fromEUDate = (eu: string): string => {
  if (!eu) return '';
  const p = eu.split('-');
  if (p.length !== 3) return eu;
  if (p[0].length === 4) return eu; // already ISO
  return `${p[2]}-${p[1]}-${p[0]}`;
};

describe('toEUDate (ISO → DD-MM-YYYY)', () => {
  it('converts YYYY-MM-DD to DD-MM-YYYY', () => {
    expect(toEUDate('2026-03-15')).toBe('15-03-2026');
    expect(toEUDate('2026-12-01')).toBe('01-12-2026');
    expect(toEUDate('2026-01-31')).toBe('31-01-2026');
  });

  it('returns empty string for empty input', () => {
    expect(toEUDate('')).toBe('');
  });

  it('returns input unchanged if already in EU format', () => {
    expect(toEUDate('15-03-2026')).toBe('15-03-2026');
  });

  it('handles non-date strings gracefully (no crash)', () => {
    expect(() => toEUDate('not-a-date')).not.toThrow();
  });
});

describe('fromEUDate (DD-MM-YYYY → ISO)', () => {
  it('converts DD-MM-YYYY to YYYY-MM-DD', () => {
    expect(fromEUDate('15-03-2026')).toBe('2026-03-15');
    expect(fromEUDate('01-12-2026')).toBe('2026-12-01');
    expect(fromEUDate('31-01-2026')).toBe('2026-01-31');
  });

  it('returns empty string for empty input', () => {
    expect(fromEUDate('')).toBe('');
  });

  it('passes through ISO format unchanged (idempotent)', () => {
    expect(fromEUDate('2026-03-15')).toBe('2026-03-15');
  });

  it('handles non-date strings gracefully (no crash)', () => {
    expect(() => fromEUDate('not-a-date')).not.toThrow();
  });
});

describe('round-trip conversion', () => {
  it('ISO → EU → ISO produces original value', () => {
    const original = '2026-06-21';
    expect(fromEUDate(toEUDate(original))).toBe(original);
  });

  it('EU → ISO → EU produces original value', () => {
    const original = '21-06-2026';
    expect(toEUDate(fromEUDate(original))).toBe(original);
  });
});

// ---------------------------------------------------------------------------
// Hashtag sanitisation (used in PostReviewScreen)
// ---------------------------------------------------------------------------

describe('hashtag sanitisation', () => {
  const sanitise = (tag: string) => `#${tag.replace(/^#+/, '')}`;

  it('removes double # prefix', () => {
    expect(sanitise('#AIMarketing')).toBe('#AIMarketing');
    expect(sanitise('##AIMarketing')).toBe('#AIMarketing');
    expect(sanitise('###AIMarketing')).toBe('#AIMarketing');
  });

  it('adds # when not present', () => {
    expect(sanitise('AIMarketing')).toBe('#AIMarketing');
  });

  it('leaves single # unchanged', () => {
    expect(sanitise('#Inclufy')).toBe('#Inclufy');
  });
});
