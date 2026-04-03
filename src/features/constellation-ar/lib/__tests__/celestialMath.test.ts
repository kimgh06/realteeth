import { describe, it, expect } from 'vitest';
import { getAltAz } from '../celestialMath';

describe('getAltAz', () => {
  const SEOUL_LAT = 37.5;
  const SEOUL_LON = 127.0;
  // Use a fixed date at local midnight (UTC 15:00 previous day ≈ midnight Seoul)
  const testDate = new Date('2024-01-15T15:00:00Z');

  it('returns numbers for altitude and azimuth', () => {
    const result = getAltAz(2.530, 89.264, SEOUL_LAT, SEOUL_LON, testDate);
    expect(typeof result.alt).toBe('number');
    expect(typeof result.az).toBe('number');
  });

  it('Polaris altitude is approximately equal to observer latitude (±2°)', () => {
    // Polaris: RA=2.530h, Dec=89.264°
    // For any observer, Polaris altitude ≈ latitude
    const { alt } = getAltAz(2.530, 89.264, SEOUL_LAT, SEOUL_LON, testDate);
    expect(alt).toBeGreaterThan(SEOUL_LAT - 2);
    expect(alt).toBeLessThan(SEOUL_LAT + 2);
  });

  it('azimuth is within 0-360 range', () => {
    const { az } = getAltAz(2.530, 89.264, SEOUL_LAT, SEOUL_LON, testDate);
    expect(az).toBeGreaterThanOrEqual(0);
    expect(az).toBeLessThanOrEqual(360);
  });

  it('a star with dec near -90 can be below horizon from Seoul', () => {
    // South Pole star (dec ≈ -90) is never visible from 37.5°N
    const { alt } = getAltAz(0, -89.0, SEOUL_LAT, SEOUL_LON, testDate);
    expect(alt).toBeLessThan(0);
  });

  it('altitude is a finite number', () => {
    const result = getAltAz(18.615, 38.783, SEOUL_LAT, SEOUL_LON, testDate);
    expect(Number.isFinite(result.alt)).toBe(true);
    expect(Number.isFinite(result.az)).toBe(true);
  });
});
