/**
 * Rate limiting middleware
 */

import type { Env, RateLimitInfo } from '../types';
import { RateLimitError } from '../types';
import { RATE_LIMITS } from '../constants';

export async function checkRateLimit(env: Env): Promise<void> {
  const now = Date.now();
  const minuteKey = `rate:minute:${Math.floor(now / 60000)}`;
  
  const currentMinute = await env.RATE_LIMIT_KV.get(minuteKey);
  const count = currentMinute ? parseInt(currentMinute) : 0;
  
  if (count >= 60) {
    const resetAt = Math.ceil(now / 60000) * 60000;
    const retryAfter = Math.ceil((resetAt - now) / 1000);
    throw new RateLimitError('Rate limit exceeded. Try again later.', retryAfter);
  }
  
  await env.RATE_LIMIT_KV.put(minuteKey, (count + 1).toString(), {
    expirationTtl: 120,
  });
}

export async function getRateLimitInfo(env: Env): Promise<RateLimitInfo> {
  const now = Date.now();
  const minuteKey = `rate:minute:${Math.floor(now / 60000)}`;
  
  const currentMinute = await env.RATE_LIMIT_KV.get(minuteKey);
  const count = currentMinute ? parseInt(currentMinute) : 0;
  
  const resetAt = new Date(Math.ceil(now / 60000) * 60000);
  
  return {
    allowed: count < 60,
    remaining: Math.max(0, 60 - count),
    limit: 60,
    resetAt,
    retryAfter: count >= 60 ? Math.ceil((resetAt.getTime() - now) / 1000) : undefined,
  };
}
