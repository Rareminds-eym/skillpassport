/**
 * Cache utility for subscription and feature access data
 * Uses Cloudflare KV for distributed caching
 */

export interface CacheConfig {
  ttl: number; // Time to live in seconds
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Cache key prefixes
 */
export const CACHE_KEYS = {
  SUBSCRIPTION: 'subscription',
  PLAN: 'plans',
  FEATURE: 'feature',
} as const;

/**
 * Cache TTL configurations (in seconds)
 */
export const CACHE_TTL = {
  SUBSCRIPTION: 300, // 5 minutes
  PLAN: 3600, // 1 hour
  FEATURE: 60, // 1 minute
} as const;

/**
 * Generate cache key for subscription data
 */
export function getSubscriptionCacheKey(userId: string): string {
  return `${CACHE_KEYS.SUBSCRIPTION}:${userId}`;
}

/**
 * Generate cache key for plan data
 */
export function getPlanCacheKey(
  businessType: string,
  entityType: string,
  roleType: string
): string {
  return `${CACHE_KEYS.PLAN}:${businessType}:${entityType}:${roleType}`;
}

/**
 * Generate cache key for feature access
 */
export function getFeatureCacheKey(userId: string, feature: string): string {
  return `${CACHE_KEYS.FEATURE}:${userId}:${feature}`;
}

/**
 * Get data from KV cache
 */
export async function getCached<T>(
  kv: KVNamespace | undefined,
  key: string
): Promise<T | null> {
  if (!kv) {
    return null;
  }

  try {
    const cached = await kv.get(key, 'json');
    if (!cached) {
      return null;
    }

    const entry = cached as CacheEntry<T>;
    
    // Check if cache entry has expired
    if (Date.now() > entry.expiresAt) {
      // Delete expired entry
      await kv.delete(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set data in KV cache
 */
export async function setCached<T>(
  kv: KVNamespace | undefined,
  key: string,
  data: T,
  ttl: number
): Promise<void> {
  if (!kv) {
    return;
  }

  try {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl * 1000,
    };

    await kv.put(key, JSON.stringify(entry), {
      expirationTtl: ttl,
    });
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
  }
}

/**
 * Delete data from KV cache
 */
export async function deleteCached(
  kv: KVNamespace | undefined,
  key: string
): Promise<void> {
  if (!kv) {
    return;
  }

  try {
    await kv.delete(key);
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
  }
}

/**
 * Delete multiple cache entries by pattern
 * Note: KV doesn't support pattern matching, so we need to track keys
 */
export async function invalidateCachePattern(
  kv: KVNamespace | undefined,
  prefix: string
): Promise<void> {
  if (!kv) {
    return;
  }

  try {
    // List all keys with the prefix
    const list = await kv.list({ prefix });
    
    // Delete all matching keys
    const deletePromises = list.keys.map((key) => kv.delete(key.name));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error(`Cache invalidation error for prefix ${prefix}:`, error);
  }
}

/**
 * Invalidate all subscription-related caches for a user
 */
export async function invalidateUserSubscriptionCache(
  kv: KVNamespace | undefined,
  userId: string
): Promise<void> {
  if (!kv) {
    return;
  }

  try {
    // Delete subscription cache
    const subscriptionKey = getSubscriptionCacheKey(userId);
    await deleteCached(kv, subscriptionKey);

    // Delete all feature access caches for this user
    await invalidateCachePattern(kv, `${CACHE_KEYS.FEATURE}:${userId}:`);
  } catch (error) {
    console.error(`Error invalidating user subscription cache:`, error);
  }
}
