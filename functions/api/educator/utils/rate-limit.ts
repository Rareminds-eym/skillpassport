/**
 * Rate Limiting for Educator API
 * 
 * ARCHITECTURE:
 * - Production: Cloudflare KV (distributed, fast, persistent)
 * - Local Dev: In-memory Map (fast, resets on server restart)
 * 
 * SECURITY CONSIDERATIONS:
 * - Rate limits are tied to user ID (permanent), not session tokens (temporary)
 * - This prevents bypass via logout/login
 * - Fails open on error to prevent blocking legitimate users
 * 
 * PRODUCTION SETUP:
 * 1. Create KV namespace: wrangler kv:namespace create EDUCATOR_AI_RATE_LIMITER
 * 2. Bind in Cloudflare Pages: Settings > Functions > KV namespace bindings
 * 3. Add binding name: EDUCATOR_AI_RATE_LIMITER
 * 
 * LIMITATIONS:
 * - Local dev rate limits reset on server restart (acceptable for development)
 * - KV rate limits are eventually consistent (acceptable for rate limiting)
 * - Rate limits are per-location in production (Cloudflare edge behavior)
 * 
 * @module rate-limit
 */

import { logger } from '../../shared/logger';

interface RateLimitData {
  count: number;
  resetAt: number;
}

/**
 * Rate limit configuration
 * These values apply to both production (KV) and local dev (in-memory)
 */
const RATE_LIMIT = 5;           // Maximum requests allowed
const RATE_WINDOW = 60000;      // Time window in milliseconds (60 seconds)

/**
 * In-memory cache for local development
 * Cleared on server restart - this is acceptable for dev environments
 */
const rateLimitCache = new Map<string, RateLimitData>();

/**
 * Cleanup configuration for in-memory cache
 * Prevents memory leaks by removing expired entries
 */
const CLEANUP_INTERVAL = 300000; // 5 minutes
let lastCleanup = Date.now();

/**
 * Check if a user has exceeded their rate limit
 * 
 * FLOW:
 * 1. Try KV first (production) - fast, distributed
 * 2. Fall back to in-memory (local dev) - simple, ephemeral
 * 3. Fail open on error - better to allow than block legitimate users
 * 
 * @param userId - Permanent user UUID (not session token)
 * @param env - Environment variables (contains KV binding if available)
 * @returns true if request is allowed, false if rate limited
 * 
 * @example
 * const allowed = await checkRateLimit(user.id, env);
 * if (!allowed) {
 *   return new Response('Rate limited', { status: 429 });
 * }
 */
export async function checkRateLimit(userId: string, env?: any): Promise<boolean> {
  // Production path: Use Cloudflare KV for distributed rate limiting
  if (env?.EDUCATOR_AI_RATE_LIMITER) {
    try {
      return await checkRateLimitKV(userId, env.EDUCATOR_AI_RATE_LIMITER);
    } catch (error) {
      logger.error('[Rate Limit] KV error, falling back to in-memory:', error);
      // Fall through to in-memory as backup
    }
  }

  // Development path: Use in-memory cache
  return checkRateLimitLocal(userId);
}

/**
 * KV-based rate limiting for production
 * 
 * CHARACTERISTICS:
 * - Distributed across Cloudflare edge locations
 * - Eventually consistent (acceptable for rate limiting)
 * - Automatic expiration via TTL
 * - Per-location limits (Cloudflare architecture)
 * 
 * @param userId - User UUID to rate limit
 * @param kv - Cloudflare KV namespace binding
 * @returns true if allowed, false if rate limited
 */
async function checkRateLimitKV(userId: string, kv: any): Promise<boolean> {
  const key = `rate_limit:${userId}`;
  const now = Date.now();

  // Fetch current rate limit state
  const dataStr = await kv.get(key);
  let data: RateLimitData | null = dataStr ? JSON.parse(dataStr) : null;

  // Case 1: No existing data or window expired - start fresh
  if (!data || now > data.resetAt) {
    data = { count: 1, resetAt: now + RATE_WINDOW };
    await kv.put(key, JSON.stringify(data), { expirationTtl: 120 }); // 2min TTL for cleanup
    logger.log(`[Rate Limit KV] ${userId}: 1/${RATE_LIMIT} requests used`);
    return true;
  }

  // Case 2: Limit exceeded - reject request
  if (data.count >= RATE_LIMIT) {
    const timeLeft = Math.ceil((data.resetAt - now) / 1000);
    logger.log(`[Rate Limit KV] ${userId}: BLOCKED - ${data.count}/${RATE_LIMIT} requests. Reset in ${timeLeft}s`);
    return false;
  }

  // Case 3: Within limit - increment and allow
  data.count++;
  await kv.put(key, JSON.stringify(data), { expirationTtl: 120 });
  const timeLeft = Math.ceil((data.resetAt - now) / 1000);
  logger.log(`[Rate Limit KV] ${userId}: ${data.count}/${RATE_LIMIT} requests used. Reset in ${timeLeft}s`);
  return true;
}

/**
 * In-memory rate limiting for local development
 * 
 * CHARACTERISTICS:
 * - Fast (no network calls)
 * - Ephemeral (resets on server restart)
 * - Automatic cleanup of expired entries
 * - Suitable for development only
 * 
 * TRADEOFFS:
 * - Does not persist across server restarts (acceptable for dev)
 * - Not distributed (single process only)
 * - Memory usage grows with unique users (mitigated by cleanup)
 * 
 * @param userId - User UUID to rate limit
 * @returns true if allowed, false if rate limited
 */
function checkRateLimitLocal(userId: string): boolean {
  // Periodic cleanup to prevent memory leaks
  cleanupExpiredEntries();
  
  const now = Date.now();
  const userLimit = rateLimitCache.get(userId);

  // Case 1: No existing data or window expired - start fresh
  if (!userLimit || now > userLimit.resetAt) {
    rateLimitCache.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    logger.log(`[Rate Limit Local] ${userId}: 1/${RATE_LIMIT} requests used`);
    return true;
  }

  // Case 2: Limit exceeded - reject request
  if (userLimit.count >= RATE_LIMIT) {
    const timeLeft = Math.ceil((userLimit.resetAt - now) / 1000);
    logger.log(`[Rate Limit Local] ${userId}: BLOCKED - ${userLimit.count}/${RATE_LIMIT} requests. Reset in ${timeLeft}s`);
    return false;
  }

  // Case 3: Within limit - increment and allow
  userLimit.count++;
  const timeLeft = Math.ceil((userLimit.resetAt - now) / 1000);
  logger.log(`[Rate Limit Local] ${userId}: ${userLimit.count}/${RATE_LIMIT} requests used. Reset in ${timeLeft}s`);
  return true;
}

/**
 * Clean up expired entries from in-memory cache
 * 
 * PURPOSE:
 * - Prevent memory leaks from accumulating expired entries
 * - Only runs periodically to minimize overhead
 * 
 * STRATEGY:
 * - Check timestamp to avoid running too frequently
 * - Remove entries that are past their reset time + window
 * - Runs synchronously (fast enough for periodic cleanup)
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  // Skip if we cleaned up recently
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }
  
  // Remove expired entries
  for (const [userId, limit] of rateLimitCache.entries()) {
    if (now > limit.resetAt + RATE_WINDOW) {
      rateLimitCache.delete(userId);
    }
  }
  
  lastCleanup = now;
}

/**
 * Get rate limit information for a user
 * 
 * NOTE: This only works for in-memory cache (local dev)
 * For KV (production), this would require an additional KV read
 * 
 * @param userId - User UUID
 * @returns Remaining requests and reset timestamp
 * 
 * @deprecated Not used in current implementation, kept for potential future use
 */
export function getRateLimitInfo(userId: string): { remaining: number; resetAt: number } {
  const userLimit = rateLimitCache.get(userId);
  if (!userLimit) {
    return { remaining: RATE_LIMIT, resetAt: Date.now() + RATE_WINDOW };
  }
  return {
    remaining: Math.max(0, RATE_LIMIT - userLimit.count),
    resetAt: userLimit.resetAt,
  };
}
