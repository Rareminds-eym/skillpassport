/**
 * Token Usage Tracker
 * 
 * Tracks which tokens have been used to prevent replay attacks.
 * Uses in-memory storage for simplicity (for production, use KV or Durable Objects).
 */

interface TokenUsage {
  usedAt: number;
  userId: string;
  fileKey: string;
}

// In-memory store (for production, use Cloudflare KV)
const usedTokens = new Map<string, TokenUsage>();

/**
 * Mark a token as used
 */
export function markTokenAsUsed(tokenHash: string, userId: string, fileKey: string): void {
  usedTokens.set(tokenHash, {
    usedAt: Date.now(),
    userId,
    fileKey,
  });
}

/**
 * Check if a token has been used
 */
export function isTokenUsed(tokenHash: string): boolean {
  return usedTokens.has(tokenHash);
}

/**
 * Clean up expired token records (call periodically)
 * Removes tokens older than 10 minutes
 */
export function cleanupExpiredTokens(): void {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;
  
  for (const [hash, usage] of usedTokens.entries()) {
    if (now - usage.usedAt > tenMinutes) {
      usedTokens.delete(hash);
    }
  }
}

/**
 * Generate a hash of the token for tracking
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
