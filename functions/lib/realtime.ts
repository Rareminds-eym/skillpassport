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
  REALTIME_EVENTS_QUEUE?: Queue<unknown>;
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
    if (!env.REALTIME_EVENTS_QUEUE) {
      console.warn(JSON.stringify({
        message: 'REALTIME_EVENTS_QUEUE not configured, skipping realtime notification',
        table,
        event,
      }));
      return;
    }
    await env.REALTIME_EVENTS_QUEUE.send({
      // No sourcePartitionId → external event → fans out to ALL 10 partitions
      target: 'broadcast',
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

/**
 * Sends a broadcast message to a specific channel.
 *
 * Uses the internal __INTERNAL_WS_BROADCAST event type to trigger
 * the broadcastChannel method in the RealtimeHub Durable Object.
 *
 * @param env - Worker environment with REALTIME_EVENTS_QUEUE binding
 * @param channel - The broadcast channel name (e.g., 'maintenance-config-updates')
 * @param eventType - The event type (e.g., 'update')
 * @param payload - The event payload
 * @param from - The sender identifier
 */
export async function notifyBroadcast(
  env: RealtimeEnv,
  channel: string,
  eventType: string,
  payload: Record<string, unknown>,
  from: string
): Promise<void> {
  try {
    if (!env.REALTIME_EVENTS_QUEUE) {
      console.warn(JSON.stringify({
        message: 'REALTIME_EVENTS_QUEUE not configured, skipping broadcast notification',
        channel,
        eventType,
      }));
      return;
    }
    await env.REALTIME_EVENTS_QUEUE.send({
      target: 'broadcast',
      event: {
        type: '__INTERNAL_WS_BROADCAST',
        channel,
        eventType,
        payload,
        from,
      },
    });
  } catch (err) {
    console.error(JSON.stringify({
      message: 'Failed to send broadcast notification',
      channel,
      eventType,
      error: String(err),
    }));
  }
}
