/**
 * CacheManager — Dual-layer caching strategy:
 *
 * Layer 1: In-memory NodeCache (L1) — ultra-fast, sub-millisecond, per-process.
 *          Best for: frequently-accessed, short-lived data (active sessions, small lookups).
 *
 * Layer 2: Redis (L2) — shared across all server instances, survives restarts.
 *          Best for: heavier data, cross-process cache invalidation, pub/sub.
 *
 * Strategy:
 *   READ  → L1 hit? return. L2 hit? populate L1, return. Miss? fetch from DB, populate both.
 *   WRITE → invalidate both layers.
 *
 * Time complexities:
 *   get: O(1) hash lookup in both NodeCache and Redis
 *   set: O(1) amortized
 *   del: O(1)
 */

import NodeCache from 'node-cache';
import Redis from 'ioredis';
import { config } from '../config';
import logger from './logger';

class CacheManager {
  private l1: NodeCache;
  private l2: Redis | null = null;
  private l2Available = false;

  constructor() {
    // L1 — 60s TTL, check for expired every 30s, up to 2000 entries
    this.l1 = new NodeCache({ stdTTL: 60, checkperiod: 30, maxKeys: 2000 });

    if (config.redis.url) {
      try {
        this.l2 = new Redis(config.redis.url, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true,
        });

        this.l2.on('ready', () => {
          this.l2Available = true;
          logger.info('Redis L2 cache connected');
        });
        this.l2.on('error', (err) => {
          this.l2Available = false;
          logger.warn('Redis L2 error — falling back to L1 only', { error: err.message });
        });

        this.l2.connect().catch(() => {
          logger.warn('Redis L2 connection failed — using L1 cache only');
        });
      } catch {
        logger.warn('Redis init failed — using L1 cache only');
      }
    }
  }

  /** Read-through: L1 → L2 */
  async get<T>(key: string): Promise<T | null> {
    // L1 lookup
    const l1Val = this.l1.get<T>(key);
    if (l1Val !== undefined) return l1Val;

    // L2 lookup
    if (this.l2Available && this.l2) {
      const raw = await this.l2.get(key).catch(() => null);
      if (raw) {
        const parsed: T = JSON.parse(raw);
        this.l1.set(key, parsed, 60); // warm L1
        return parsed;
      }
    }

    return null;
  }

  /** Write-through: set in both layers */
  async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    this.l1.set(key, value, ttlSeconds);
    if (this.l2Available && this.l2) {
      await this.l2.setex(key, ttlSeconds, JSON.stringify(value)).catch(() => null);
    }
  }

  /** Invalidate from both layers */
  async del(key: string): Promise<void> {
    this.l1.del(key);
    if (this.l2Available && this.l2) {
      await this.l2.del(key).catch(() => null);
    }
  }

  /** Invalidate all keys matching a pattern prefix */
  async invalidatePattern(prefix: string): Promise<void> {
    // L1: iterate and delete matching keys (O(n) over cache size, acceptable)
    const keys = this.l1.keys().filter((k) => k.startsWith(prefix));
    keys.forEach((k) => this.l1.del(k));

    // L2: use SCAN for safe pattern deletion (no KEYS in production)
    if (this.l2Available && this.l2) {
      const stream = this.l2.scanStream({ match: `${prefix}*`, count: 100 });
      const pipeline = this.l2.pipeline();
      stream.on('data', (matchedKeys: string[]) => {
        matchedKeys.forEach((k) => pipeline.del(k));
      });
      stream.on('end', () => pipeline.exec().catch(() => null));
    }
  }

  /** Utility: cache-aside wrapper */
  async remember<T>(
    key: string,
    ttl: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const fresh = await fetcher();
    await this.set(key, fresh, ttl);
    return fresh;
  }
}

export const cache = new CacheManager();
