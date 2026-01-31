/**
 * Hash utilities for deterministic analysis
 */

/**
 * Generate a deterministic hash from assessment data
 * Used for consistency tracking in AI responses
 */
export function generateAnswersHash(data: any): number {
  return JSON.stringify(data).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
}
