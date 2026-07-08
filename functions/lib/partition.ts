/**
 * Partition utility for Durable Object routing.
 * Copied from realtime-worker/src/utils.ts for direct DO access from Pages Functions.
 */

/**
 * Deterministic hash of a userId to a partition index.
 * Reads TOTAL_PARTITIONS from env.REALTIME_PARTITIONS when available.
 * Defaults to 10 if not configured.
 */
export function getPartitionId(userId: string, totalPartitions?: number): number {
  const count = totalPartitions ?? 10;
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (Math.imul(31, hash) + userId.charCodeAt(i)) | 0;
  }
  return (hash >>> 0) % count;
}
