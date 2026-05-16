/**
 * Rate Limiting Utilities
 * 
 * Provides rate limiting functionality using Redis/KV to prevent abuse
 * and protect API endpoints from excessive requests.
 */

/**
 * Constants
 */
const TTL_BUFFER_SECONDS = 60; // Buffer to prevent premature expiration of rate limit data

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  keyPrefix: string;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  FREEMIUM_CREATION: {
    maxRequests: 5,
    windowSeconds: 60,
    keyPrefix: 'ratelimit:freemium:',
  },
  SUBSCRIPTION_UPGRADE: {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: 'ratelimit:upgrade:',
  },
  FEATURE_ACCESS_CHECK: {
    maxRequests: 100,
    windowSeconds: 60,
    keyPrefix: 'ratelimit:feature:',
  },
  PAYMENT_CREATION: {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: 'ratelimit:payment:',
  },
} as const;

/**
 * Check rate limit using KV storage (sliding window)
 */
export async function checkRateLimit(
  kv: KVNamespace | undefined,
  userId: string,
  config: RateLimitConfig,
  failClosed: boolean = false
): Promise<RateLimitResult> {
  // If KV is not available, fail based on failClosed parameter
  if (!kv) {
    if (failClosed) {
      console.warn('[RateLimit] KV namespace not available, denying request (fail-closed mode)');
      return {
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + config.windowSeconds * 1000,
        retryAfter: config.windowSeconds,
      };
    }
    console.warn('[RateLimit] KV namespace not available, allowing request (fail-open mode)');
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: Date.now() + config.windowSeconds * 1000,
    };
  }

  const key = `${config.keyPrefix}${userId}`;
  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;

  try {
    // Get current request count
    const data = await kv.get(key, 'json') as { requests: number[]; } | null;

    // Filter requests within the current window
    const requests = data?.requests?.filter((timestamp: number) => timestamp > windowStart) || [];

    // Check if limit exceeded
    if (requests.length >= config.maxRequests) {
      const oldestRequest = Math.min(...requests);
      const resetAt = oldestRequest + config.windowSeconds * 1000;
      const retryAfter = Math.ceil((resetAt - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter,
      };
    }

    // Add current request
    requests.push(now);

    // Store updated requests with TTL
    await kv.put(
      key,
      JSON.stringify({ requests }),
      { expirationTtl: config.windowSeconds + TTL_BUFFER_SECONDS }
    );

    return {
      allowed: true,
      remaining: config.maxRequests - requests.length,
      resetAt: now + config.windowSeconds * 1000,
    };
  } catch (error) {
    console.error('[RateLimit] Error checking rate limit:', error);
    // On error, fail based on failClosed parameter
    if (failClosed) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + config.windowSeconds * 1000,
        retryAfter: config.windowSeconds,
      };
    }
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowSeconds * 1000,
    };
  }
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': String(result.remaining + (result.allowed ? 1 : 0)),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = String(result.retryAfter);
  }

  return new Response(
    JSON.stringify({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      retryAfter: result.retryAfter,
      resetAt: new Date(result.resetAt).toISOString(),
    }),
    {
      status: 429,
      headers,
    }
  );
}

/**
 * Rate limit middleware
 */
export async function withRateLimit(
  kv: KVNamespace | undefined,
  userId: string,
  config: RateLimitConfig,
  failClosed: boolean = false
): Promise<{ allowed: boolean; response?: Response }> {
  const result = await checkRateLimit(kv, userId, config, failClosed);

  if (!result.allowed) {
    return {
      allowed: false,
      response: createRateLimitResponse(result),
    };
  }

  return { allowed: true };
}

/**
 * Get rate limit status without incrementing counter
 */
export async function getRateLimitStatus(
  kv: KVNamespace | undefined,
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!kv) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowSeconds * 1000,
    };
  }

  const key = `${config.keyPrefix}${userId}`;
  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;

  try {
    const data = await kv.get(key, 'json') as { requests: number[]; } | null;
    const requests = data?.requests?.filter((timestamp: number) => timestamp > windowStart) || [];

    return {
      allowed: requests.length < config.maxRequests,
      remaining: Math.max(0, config.maxRequests - requests.length),
      resetAt: requests.length > 0
        ? Math.min(...requests) + config.windowSeconds * 1000
        : now + config.windowSeconds * 1000,
    };
  } catch (error) {
    console.error('[RateLimit] Error getting rate limit status:', error);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowSeconds * 1000,
    };
  }
}

/**
 * Reset rate limit for a user (admin function)
 */
export async function resetRateLimit(
  kv: KVNamespace | undefined,
  userId: string,
  config: RateLimitConfig
): Promise<void> {
  if (!kv) return;

  const key = `${config.keyPrefix}${userId}`;

  try {
    await kv.delete(key);
  } catch (error) {
    console.error('[RateLimit] Error resetting rate limit:', error);
  }
}
