import NodeCache from 'node-cache';
import { config } from '../config/env.js';

const cache = new NodeCache({
  stdTTL: config.CACHE_TTL_SECONDS,
  checkperiod: 60,
  useClones: false,
});

export function cacheGet<T>(key: string): { value: T; stale: boolean } | null {
  const value = cache.get<T>(key);
  if (value === undefined) return null;

  const ttl = cache.getTtl(key);
  const now = Date.now();
  const stale = ttl !== undefined && ttl < now + (config.STALE_TTL_SECONDS * 1000 - config.CACHE_TTL_SECONDS * 1000);

  return { value, stale };
}

export function cacheSet<T>(key: string, value: T, ttlSeconds?: number): void {
  cache.set(key, value, ttlSeconds ?? config.CACHE_TTL_SECONDS);
}

export function cacheDel(key: string): void {
  cache.del(key);
}

export function cacheKey(...parts: string[]): string {
  return parts.join(':').toLowerCase().replace(/[^a-z0-9:_-]/g, '_');
}
