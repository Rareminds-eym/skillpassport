import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { addBroadcast, drainBroadcasts, getPresenceVersion, joinPresence, leavePresence, updatePresenceHeartbeat, getPresenceSnapshot } from './state';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

const POLL_INTERVAL_MS = 2000;
const MAX_CONNECTION_MS = 25000;
const warnedTables = new Set<string>();

interface SubscriptionConfig {
  table?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  schema?: string;
  type?: 'table' | 'broadcast' | 'presence';
  channel?: string;
}

function parseSubscriptions(searchParams: URLSearchParams): SubscriptionConfig[] {
  const subscriptions: SubscriptionConfig[] = [];
  const subs = searchParams.getAll('sub');

  for (const sub of subs) {
    try {
      const config = JSON.parse(sub) as SubscriptionConfig;
      if (config.type === 'broadcast' && config.channel) {
        subscriptions.push({ type: 'broadcast', channel: config.channel });
      } else if (config.type === 'presence' && config.channel) {
        subscriptions.push({ type: 'presence', channel: config.channel });
      } else if (config.table) {
        subscriptions.push({
          type: 'table',
          table: config.table,
          event: config.event || '*',
          filter: config.filter,
          schema: config.schema || 'public',
        });
      }
    } catch {}
  }

  return subscriptions;
}

async function queryChanges(
  supabase: ReturnType<typeof getServiceClient>,
  config: SubscriptionConfig,
  lastCheck: Date
): Promise<any[]> {
  if (config.type !== 'table' || !config.table) return [];

  const { table, filter, schema, event } = config;

  // DELETE events are undetectable via polling — return empty immediately
  if (event === 'DELETE') return [];

  let query = supabase
    .from(table)
    .select('*')
    .gt('updated_at', lastCheck.toISOString())
    .order('updated_at', { ascending: true })
    .limit(50);
  if (schema && schema !== 'public') {
    query = query.schema(schema);
  }

  if (filter) {
    // Parse Supabase filter format: "column=operator.value" (e.g. "learner_id=eq.abc123")
    const eqIndex = filter.indexOf('=');
    if (eqIndex > 0) {
      const column = filter.substring(0, eqIndex);
      const raw = filter.substring(eqIndex + 1);
      const dotIndex = raw.indexOf('.');
      const cleanValue = dotIndex >= 0 ? raw.substring(dotIndex + 1) : raw;
      query = query.eq(column, cleanValue);
    }
  }

  const { data, error } = await query;
  if (error) {
    const msg = error?.message ?? String(error);
    if (msg.includes('column') && msg.includes('does not exist')) {
      if (!warnedTables.has(table)) {
        warnedTables.add(table);
        console.warn(`[realtime-stream] Table "${table}" has no updated_at — realtime polling cannot detect changes on it`);
        console.warn(`[realtime-stream]   Consider adding an updated_at column to enable change detection`);
      }
    }
    return [];
  }

  const rows = data || [];

  // Filter by event type using created_at heuristic
  // INSERT: created_at >= lastCheck (new row was created in this window)
  // UPDATE: created_at < lastCheck (row existed before, modified now)
  if (event === 'INSERT') {
    return rows.filter(row => {
      const ca = new Date(row.created_at).getTime();
      return ca >= lastCheck.getTime();
    });
  }

  if (event === 'UPDATE') {
    return rows.filter(row => {
      const ca = new Date(row.created_at).getTime();
      return ca < lastCheck.getTime();
    });
  }

  // event === '*' — return all rows (DB already filtered by updated_at > lastCheck)
  return rows;
}

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const url = new URL(context.request.url);
  const subscriptions = parseSubscriptions(url.searchParams);

  if (subscriptions.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No valid subscriptions provided' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = getServiceClient(context.env as any);
  const encoder = new TextEncoder();
  let lastPresenceVersion = getPresenceVersion();

  let streamClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const startTime = Date.now();
      let lastCheck = new Date();

      const enqueue = (data: Uint8Array): boolean => {
        if (streamClosed) return false;
        try {
          controller.enqueue(data);
          return true;
        } catch {
          streamClosed = true;
          return false;
        }
      };

      enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', subscriptions: subscriptions.map(s => s.type) })}\n\n`));

      // Send initial presence state for all presence subscriptions
      for (const config of subscriptions) {
        if (config.type === 'presence' && config.channel) {
          const users = getPresenceSnapshot(config.channel);
          enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'presence_sync', channel: config.channel, users, timestamp: new Date().toISOString() })}\n\n`));
        }
      }

      while (!streamClosed && Date.now() - startTime < MAX_CONNECTION_MS) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

        for (const config of subscriptions) {
          if (streamClosed) break;

          if (config.type === 'table') {
            try {
              const changes = await queryChanges(supabase, config, lastCheck);
              if (changes.length > 0) {
                for (const record of changes) {
                  if (!enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'change', table: config.table, event: config.event, payload: record, timestamp: new Date().toISOString() })}\n\n`))) break;
                }
              }
            } catch (err) {
              console.error(`Polling error for ${config.table}:`, err);
            }
          } else if (config.type === 'broadcast' && config.channel) {
            const events = drainBroadcasts(config.channel);
            if (events.length > 0) {
              for (const evt of events) {
                if (!enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'broadcast', channel: config.channel, payload: evt.payload, eventType: evt.eventType, from: evt.from, timestamp: evt.timestamp })}\n\n`))) break;
              }
            }
          } else if (config.type === 'presence' && config.channel) {
            const currentVersion = getPresenceVersion();
            if (currentVersion !== lastPresenceVersion) {
              lastPresenceVersion = currentVersion;
              const users = getPresenceSnapshot(config.channel);
              enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'presence_sync', channel: config.channel, users, timestamp: new Date().toISOString() })}\n\n`));
            }
          }
        }

        lastCheck = new Date();
        enqueue(encoder.encode(`: heartbeat\n\n`));
      }

      if (!streamClosed) {
        enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'reconnect' })}\n\n`));
        controller.close();
      }
    },
    cancel() {
      streamClosed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const body: any = await context.request.json().catch(() => ({}));
  const { action } = body;

  if (!action) {
    return new Response(JSON.stringify({ error: 'Missing action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  switch (action) {
    case 'send-broadcast': {
      const { channel, eventType, payload } = body;
      if (!channel || !eventType) {
        return new Response(JSON.stringify({ error: 'Missing channel or eventType' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      addBroadcast({ channel, eventType, payload: payload || {}, from: user.id });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    case 'join-presence': {
      const { channel: presenceChannel, userId, userName, userType, status, conversationId } = body;
      if (!presenceChannel || !userId) {
        return new Response(JSON.stringify({ error: 'Missing channel or userId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      joinPresence(presenceChannel, { userId, userName: userName || '', userType: userType || '', status: status || 'online', lastSeen: new Date().toISOString(), conversationId });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    case 'heartbeat': {
      const { channel: hbChannel, userId: hbUserId, status: hbStatus } = body;
      if (!hbChannel || !hbUserId) {
        return new Response(JSON.stringify({ error: 'Missing channel or userId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      updatePresenceHeartbeat(hbChannel, hbUserId, hbStatus || 'online');
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    case 'leave-presence': {
      const { channel: leaveChannel, userId: leaveUserId } = body;
      if (!leaveChannel || !leaveUserId) {
        return new Response(JSON.stringify({ error: 'Missing channel or userId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      leavePresence(leaveChannel, leaveUserId);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    default:
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
});
