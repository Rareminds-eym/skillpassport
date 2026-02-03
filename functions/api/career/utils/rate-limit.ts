// Rate Limiting for Career API

const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

export function checkRateLimit(userId: string): boolean {
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
