/**
 * Partition utility for Durable Object routing.
 * Copied from realtime-worker/src/utils.ts for direct DO access from Pages Functions.
 */

/** Total number of DO partitions in the hash ring */
export const TOTAL_PARTITIONS = 10;

/**
 * Deterministic hash of a userId to a partition index (0–9).
 * Uses the Java-style 31-multiplier string hash for even distribution.
 */
export function getPartitionId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (Math.imul(31, hash) + userId.charCodeAt(i)) | 0;
  }
  return (hash >>> 0) % TOTAL_PARTITIONS;
}
