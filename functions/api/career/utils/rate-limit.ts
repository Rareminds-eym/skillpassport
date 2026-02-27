// Rate Limiting for Career API
// SECURITY: Uses Cloudflare's distributed Rate Limiting API for production
// Falls back to in-memory cache for local development

// Cloudflare Rate Limiting API (production)
export async function checkRateLimit(userId: string, env?: any): Promise<boolean> {
  // Production: Use Cloudflare Rate Limiting API (distributed across edge)
  if (env?.CAREER_AI_RATE_LIMITER) {
    try {
      const { success } = await env.CAREER_AI_RATE_LIMITER.limit({ key: userId });
      return success;
    } catch (error) {
      console.error('[Rate Limit] Cloudflare API error:', error);
      // Fail open: allow request if rate limiter fails
      return true;
    }
  }

  // Development: Fallback to in-memory cache
  return checkRateLimitLocal(userId);
}

// Local development fallback (in-memory)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // requests per minute
const RATE_WINDOW = 60000; // 1 minute
const CLEANUP_INTERVAL = 300000; // Clean up every 5 minutes
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  for (const [userId, limit] of rateLimitCache.entries()) {
    if (now > limit.resetAt + RATE_WINDOW) {
      rateLimitCache.delete(userId);
    }
  }
  lastCleanup = now;
}

function checkRateLimitLocal(userId: string): boolean {
  cleanupExpiredEntries();
  
  const now = Date.now();
  const userLimit = rateLimitCache.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitCache.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

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
