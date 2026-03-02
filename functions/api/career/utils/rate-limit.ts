// Rate Limiting for Career API
// SECURITY: In-memory cache with automatic cleanup to prevent memory leaks

const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60000; // 1 minute
const CLEANUP_INTERVAL = 300000; // Clean up every 5 minutes

// Periodic cleanup to prevent memory leaks
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

export function checkRateLimit(userId: string): boolean {
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
