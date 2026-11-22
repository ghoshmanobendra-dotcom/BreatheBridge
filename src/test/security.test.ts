// ============================================================
// src/test/security.test.ts
// Security & Cache Infrastructure Tests
// Covers SHA-256 cache key hashing, TTL eviction, pruneCache,
// input sanitization, and validator boundary conditions.
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { hashPayload, pruneCache, insightCache, isCacheEntryFresh, CACHE_TTL_MS } from '../../server/cache';
import { sanitizeText, validateZone, validatePersona } from '../../server/validators';
import { DEFAULT_ZONES, DEFAULT_PERSONAS } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Cache Infrastructure
// ---------------------------------------------------------------------------
describe('hashPayload — SHA-256 cache key generation', () => {
  it('produces a 16-character hex string', () => {
    const key = hashPayload({ id: 'test', value: 42 });
    expect(key).toHaveLength(16);
    expect(key).toMatch(/^[0-9a-f]+$/);
  });

  it('is deterministic for identical inputs', () => {
    const a = hashPayload({ zoneId: 'Z1', aqi: 150 });
    const b = hashPayload({ zoneId: 'Z1', aqi: 150 });
    expect(a).toBe(b);
  });

  it('produces different keys for different inputs', () => {
    const a = hashPayload({ zoneId: 'Z1', aqi: 150 });
    const b = hashPayload({ zoneId: 'Z2', aqi: 150 });
    expect(a).not.toBe(b);
  });

  it('handles primitive, null, and nested object inputs', () => {
    expect(() => hashPayload(null)).not.toThrow();
    expect(() => hashPayload(42)).not.toThrow();
    expect(() => hashPayload({ a: { b: { c: 'deep' } } })).not.toThrow();
  });
});

describe('isCacheEntryFresh — TTL check', () => {
  it('returns true for a freshly created entry', () => {
    const entry = { data: 'test', cachedAt: Date.now() };
    expect(isCacheEntryFresh(entry)).toBe(true);
  });

  it('returns false for an entry older than CACHE_TTL_MS', () => {
    const expiredEntry = { data: 'stale', cachedAt: Date.now() - CACHE_TTL_MS - 1 };
    expect(isCacheEntryFresh(expiredEntry)).toBe(false);
  });

  it('returns true for an entry exactly at TTL boundary minus 1ms', () => {
    const borderEntry = { data: 'borderline', cachedAt: Date.now() - CACHE_TTL_MS + 100 };
    expect(isCacheEntryFresh(borderEntry)).toBe(true);
  });

  it('CACHE_TTL_MS is exactly 10 minutes (600000ms)', () => {
    expect(CACHE_TTL_MS).toBe(600_000);
  });
});

describe('pruneCache — LRU eviction with TTL', () => {
  beforeEach(() => {
    insightCache.clear();
  });

  it('removes TTL-expired entries during pruning', () => {
    const expiredEntry = { data: 'old', cachedAt: Date.now() - CACHE_TTL_MS - 1000 };
    insightCache.set('expired-key', expiredEntry);
    insightCache.set('fresh-key', { data: 'new', cachedAt: Date.now() });

    pruneCache();

    expect(insightCache.has('expired-key')).toBe(false);
    expect(insightCache.has('fresh-key')).toBe(true);
  });

  it('evicts oldest entry when size reaches 100 with all-fresh entries', () => {
    for (let i = 0; i < 100; i++) {
      insightCache.set(`key-${i}`, { data: i, cachedAt: Date.now() });
    }
    expect(insightCache.size).toBe(100);

    pruneCache();

    // With all fresh, should evict 'key-0' (oldest)
    expect(insightCache.has('key-0')).toBe(false);
    expect(insightCache.has('key-99')).toBe(true);
  });

  it('does not remove fresh entries when cache is under capacity', () => {
    insightCache.set('fresh-a', { data: 'a', cachedAt: Date.now() });
    insightCache.set('fresh-b', { data: 'b', cachedAt: Date.now() });
    pruneCache();
    expect(insightCache.has('fresh-a')).toBe(true);
    expect(insightCache.has('fresh-b')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Input Sanitization
// ---------------------------------------------------------------------------
describe('sanitizeText — Input Sanitization', () => {
  it('strips control characters (ASCII 0–31)', () => {
    const input = 'hello\x00world\x1Ftest';
    expect(sanitizeText(input)).toBe('helloworldtest');
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeText('  hello world  ')).toBe('hello world');
  });

  it('truncates to maxLen characters after trimming', () => {
    const longInput = 'a'.repeat(2500);
    expect(sanitizeText(longInput)).toHaveLength(2000);
    expect(sanitizeText(longInput, 10)).toHaveLength(10);
  });

  it('returns empty string for non-string inputs', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
    expect(sanitizeText(42)).toBe('');
    expect(sanitizeText({})).toBe('');
    expect(sanitizeText([])).toBe('');
  });

  it('returns empty string for empty string input', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('preserves valid unicode characters (multilingual text)', () => {
    const hindi = 'वायु गुणवत्ता';
    const arabic = 'جودة الهواء';
    expect(sanitizeText(hindi)).toBe(hindi);
    expect(sanitizeText(arabic)).toBe(arabic);
  });
});

// ---------------------------------------------------------------------------
// Validator: validateZone
// ---------------------------------------------------------------------------
describe('validateZone — Boundary Conditions', () => {
  const validZone = DEFAULT_ZONES[0];

  it('accepts a valid zone telemetry object', () => {
    expect(validateZone(validZone)).toBe(true);
  });

  it('rejects null and non-object inputs', () => {
    expect(validateZone(null)).toBe(false);
    expect(validateZone(undefined)).toBe(false);
    expect(validateZone('string')).toBe(false);
    expect(validateZone(42)).toBe(false);
  });

  it('rejects empty or oversized zoneId', () => {
    expect(validateZone({ ...validZone, zoneId: '' })).toBe(false);
    expect(validateZone({ ...validZone, zoneId: 'a'.repeat(51) })).toBe(false);
    expect(validateZone({ ...validZone, zoneId: 'a'.repeat(50) })).toBe(true);
  });

  it('rejects AQI below 0 or above 2000', () => {
    expect(validateZone({ ...validZone, aqi: -1 })).toBe(false);
    expect(validateZone({ ...validZone, aqi: 2001 })).toBe(false);
    expect(validateZone({ ...validZone, aqi: 0 })).toBe(true);
    expect(validateZone({ ...validZone, aqi: 2000 })).toBe(true);
  });

  it('rejects non-finite temperature and wind values', () => {
    expect(validateZone({ ...validZone, temperatureC: NaN })).toBe(false);
    expect(validateZone({ ...validZone, windSpeedKmh: Infinity })).toBe(false);
    expect(validateZone({ ...validZone, temperatureC: -51 })).toBe(false);
    expect(validateZone({ ...validZone, temperatureC: 61 })).toBe(false);
  });

  it('rejects negative or out-of-range PM2.5 and PM10 values', () => {
    expect(validateZone({ ...validZone, pm25: -1 })).toBe(false);
    expect(validateZone({ ...validZone, pm10: 2001 })).toBe(false);
    expect(validateZone({ ...validZone, no2: -1 })).toBe(false);
    expect(validateZone({ ...validZone, no2: 1001 })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Validator: validatePersona
// ---------------------------------------------------------------------------
describe('validatePersona — Boundary Conditions', () => {
  const validPersona = DEFAULT_PERSONAS[0];

  it('accepts a valid persona profile', () => {
    expect(validatePersona(validPersona)).toBe(true);
  });

  it('rejects null, undefined, and non-object inputs', () => {
    expect(validatePersona(null)).toBe(false);
    expect(validatePersona(undefined)).toBe(false);
    expect(validatePersona('string')).toBe(false);
  });

  it('rejects empty or oversized persona id or name', () => {
    expect(validatePersona({ ...validPersona, id: '' })).toBe(false);
    expect(validatePersona({ ...validPersona, id: 'a'.repeat(51) })).toBe(false);
    expect(validatePersona({ ...validPersona, name: '' })).toBe(false);
    expect(validatePersona({ ...validPersona, name: 'a'.repeat(101) })).toBe(false);
  });

  it('rejects invalid or out-of-range preferred hours', () => {
    expect(validatePersona({ ...validPersona, preferredStartHour: -1 })).toBe(false);
    expect(validatePersona({ ...validPersona, preferredStartHour: 24 })).toBe(false);
    expect(validatePersona({ ...validPersona, preferredEndHour: 25 })).toBe(false);
    expect(validatePersona({ ...validPersona, preferredStartHour: NaN })).toBe(false);
  });

  it('rejects empty subCategory field', () => {
    expect(validatePersona({ ...validPersona, subCategory: '' })).toBe(false);
  });

  it('rejects invalid sensitivityLevel values', () => {
    expect(validatePersona({ ...validPersona, sensitivityLevel: 'very-high' })).toBe(false);
    expect(validatePersona({ ...validPersona, sensitivityLevel: '' })).toBe(false);
    expect(validatePersona({ ...validPersona, sensitivityLevel: 'HIGH' })).toBe(false);
  });

  it('accepts valid sensitivityLevel values: high, moderate, low', () => {
    expect(validatePersona({ ...validPersona, sensitivityLevel: 'high' })).toBe(true);
    expect(validatePersona({ ...validPersona, sensitivityLevel: 'moderate' })).toBe(true);
    expect(validatePersona({ ...validPersona, sensitivityLevel: 'low' })).toBe(true);
  });
});
