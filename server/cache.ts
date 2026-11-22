// ============================================================
// server/cache.ts
// In-Memory SHA-256 LRU Response Cache (100 Entries, 10-min TTL)
// Entries older than CACHE_TTL_MS are evicted on access and prune.
// ============================================================

import { createHash } from 'crypto';

export interface CacheEntry {
  data: unknown;
  cachedAt: number;
}

export const insightCache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 100;

/** Cache entry TTL: 10 minutes in milliseconds */
export const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Creates a deterministic 16-character SHA-256 hex digest for an input payload.
 */
export function hashPayload(obj: unknown): string {
  return createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
}

/**
 * Returns whether a cache entry is still within the TTL window.
 */
export function isCacheEntryFresh(entry: CacheEntry): boolean {
  return Date.now() - entry.cachedAt < CACHE_TTL_MS;
}

/**
 * Evicts stale (TTL-expired) entries first, then oldest entry when
 * cache capacity exceeds maximum limit.
 */
export function pruneCache(): void {
  // First pass: remove all TTL-expired entries
  for (const [key, entry] of insightCache.entries()) {
    if (!isCacheEntryFresh(entry)) {
      insightCache.delete(key);
    }
  }
  // Second pass: evict oldest if still over capacity
  if (insightCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = insightCache.keys().next().value;
    if (firstKey !== undefined) insightCache.delete(firstKey);
  }
}
