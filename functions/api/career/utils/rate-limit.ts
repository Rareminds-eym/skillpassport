// Rate Limiting for Career API
// SECURITY: Uses Cloudflare KV for distributed rate limiting in production
// Falls back to in-memory cache for local development

interface RateLimitData {
  count: number;
  resetAt: number;
}

// Production: Use Cloudflare KV (distributed across edge)
export async function checkRateLimit(userId: string, env?: any): Promise<boolean> {
  if (env?.CAREER_AI_RATE_LIMITER) {
    try {
      return await checkRateLimitKV(userId, env.CAREER_AI_RATE_LIMITER);
    } catch (error) {
      console.error('[Rate Limit] KV error:', error);
      // Fail open: allow request if rate limiter fails
      return true;
    }
  }

  // Development: Fallback to in-memory cache
  return checkRateLimitLocal(userId);
}

// KV-based rate limiting (distributed)
const RATE_LIMIT = 5;
const RATE_WINDOW = 60000; // 60 seconds in milliseconds

async function checkRateLimitKV(userId: string, kv: any): Promise<boolean> {
  const key = `rate_limit:${userId}`;
  const now = Date.now();

  // Get current rate limit data
  const dataStr = await kv.get(key);
  let data: RateLimitData | null = dataStr ? JSON.parse(dataStr) : null;

  // Reset if window expired
  if (!data || now > data.resetAt) {
    data = { count: 1, resetAt: now + RATE_WINDOW };
    await kv.put(key, JSON.stringify(data), { expirationTtl: 120 }); // 2 minutes TTL
    return true;
  }

  // Check if limit exceeded
  if (data.count >= RATE_LIMIT) {
    return false;
  }

  // Increment count
  data.count++;
  await kv.put(key, JSON.stringify(data), { expirationTtl: 120 });
  return true;
}

// Local development fallback (in-memory)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
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
