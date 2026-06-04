/**
 * Realtime Event Producer — Queue Helper
 *
 * Sends database mutation events to the realtime-events-queue,
 * which the realtime-worker's Queue consumer fans out to all
 * DO partitions for matching subscription delivery.
 *
 * Usage in Pages Functions:
 * ```ts
 * import { notifyRealtime } from '../../lib/realtime';
 *
 * // After a successful INSERT/UPDATE/DELETE:
 * context.waitUntil(
 *   notifyRealtime(context.env, 'messages', 'INSERT', { id: '...', ... })
 * );
 * ```
 *
 * These are "external" events (no sourcePartitionId),
 * so the Queue consumer fans out to ALL 10 DO partitions.
 */

interface RealtimeEnv {
  REALTIME_EVENTS_QUEUE: {
    send(message: unknown): Promise<void>;
  };
}

/**
 * Sends a realtime notification for a database mutation.
 *
 * @param env - Worker environment with REALTIME_EVENTS_QUEUE binding
 * @param table - The database table name (e.g., 'messages', 'notifications')
 * @param event - The mutation type ('INSERT' | 'UPDATE' | 'DELETE')
 * @param payload - The row data / change payload
 */
export async function notifyRealtime(
  env: RealtimeEnv,
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE',
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await env.REALTIME_EVENTS_QUEUE.send({
      // No sourcePartitionId → external event → fans out to ALL 10 partitions
      event: {
        table,
        type: event,
        payload,
      },
    });
  } catch (err) {
    // Best-effort: Don't let realtime failures break the primary mutation
    console.error(JSON.stringify({
      message: 'Failed to send realtime notification',
      table,
      event,
      error: String(err),
    }));
  }
}
