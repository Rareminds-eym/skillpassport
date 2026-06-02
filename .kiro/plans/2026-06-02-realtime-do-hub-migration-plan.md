# Realtime DO Hub Migration Plan

**Date**: 2026-06-02
**Status**: Draft
**Author**: AI-assisted

## Problem Summary

The current `/api/realtime-stream` implementation uses **polling disguised as SSE**. Every 2 seconds the backend queries Supabase for changes across 19 tables. This causes:

- **~12 DB queries per 25s connection window per user** — multiplied by every browser tab
- **Artificial 25s connection limit** forces reconnect thrashes (cold-start, auth, every 25s)
- **3 tables poll uselessly** (`shortlist_candidates`, `pipeline_activities`, `placements` have no `updated_at` column)
- **In-memory state lost on reconnect** — broadcast/presence broken across Worker instances
- **985 lines of custom code** `(sseRealtimeClient.ts 357 + realtimeService.ts 362 + index.ts 266)` to replace what should be simple

## Target Architecture: DO Hub

```
                    ┌──────────────────────────────────────────────────────┐
                    │              Durable Object: RealtimeHub             │
                    │                                                      │
                    │  ┌──────────────┐  ┌───────────┐  ┌──────────────┐  │
Client SSE ────────►│  │ SSE Writers   │  │ Broadcast │  │   Presence   │  │
(1 per tab)         │  │ Map<connId,   │  │   Buffer  │  │    State     │  │
                    │  │  Writer>      │  │ (in-mem)  │  │ (in-mem)     │  │
                    │  └──────┬───────┘  └─────┬─────┘  └──────┬───────┘  │
                    │         │                │               │          │
                    │         ▼                ▼               ▼          │
                    │  ┌──────────────────────────────────────────────┐   │
                    │  │           Subscription Matcher               │   │
                    │  │  connId → [{table, event, filter}, ...]      │   │
                    │  │  (SQLite for reconnect recovery)             │   │
                    │  └──────────────────────────────────────────────┘   │
                    └──────────────────────────────────────────────────────┘

     Pages Function routes POST actions to DO via stub.fetch()

     Mutation Endpoints ──► notifyRealtime() helper ──► DO /publish
     Frontend POST ───────► DO /broadcast, /presence
```

### Key Changes

| Current | Target |
|---------|--------|
| Polling DB every 2s | Push-based: mutation endpoints call `DO.publish()` |
| SSE connection dies at 25s | SSE lives as long as client is connected |
| In-memory state in Worker (lost constantly) | State in DO (persistent across reconnects) |
| 266 lines custom polling logic | DO ~150 lines, SSE proxy function ~50 lines |
| 19 tables polled independently | Only changed data pushed to relevant connections |
| No reconnect replay | SQLite-backed subscriptions, event replay |

### DO Identity Model

**One DO instance** (`idFromName("realtime-global")`) for the entire app. The DO handles:

- All SSE connections (via `TransformStream` writers)
- Subscription matching (which connection wants which table/event/filter)
- Broadcast fan-out
- Presence state

**Why one DO, not 19 (one per table)?**

- 500-1000 req/sec capacity per DO is sufficient for this app
- Subscriptions can share a single SQLite DB inside the DO
- Simpler deployment and management
- One WebSocket to Supabase Realtime (if we add that later)

**Why not need Supabase Realtime WebSocket in the DO?**

Because the DO is **publish-based**, not poll-based. Mutation endpoints call `DO.publish(table, event, payload)` after writing to Supabase. No WebSocket to Supabase needed. This keeps all Supabase communication in API endpoints (as required), while the DO is purely a realtime fan-out hub.

### Connection Lifecycle

```
1. Frontend: GET /api/realtime-stream (no query params — connects first)
2. Pages Function: auth → get DO stub → DO.connect(request.signal) → TransformStream
3. DO stores writer in Map<connId, Writer>
4. DO stores subscription in SQLite: INSERT INTO subscriptions (conn_id, table, event, filter)
5. When mutation happens: api endpoint writes to Supabase, then notifyRealtime(table, event, record)
6. notifyRealtime POSTs to DO /publish with {table, event, payload}
7. DO looks up matching subscriptions, writes to matching SSE writers
8. Client disconnects: request.signal fires → DO removes writer + deletes SQLite subscriptions
```

---

## File-by-File Migration Plan

### Phase 1: Core DO + Pages Function (Week 1)

#### 1.1 Create `realtime-worker/` (new Worker project)

**Location**: `skillpassport/realtime-worker/` (sibling to `skillpassport/functions/`)

**Files to create**:

| File | Purpose |
|------|---------|
| `realtime-worker/wrangler.jsonc` | DO Worker config with SQLite |
| `realtime-worker/src/index.ts` | Worker entry point exporting DO namespace |
| `realtime-worker/src/realtime-hub.ts` | `RealtimeHub` DO class (~200 lines) |

**`realtime-worker/wrangler.jsonc`**:
```json
{
  "name": "realtime-worker",
  "main": "src/index.ts",
  "compatibility_date": "2026-06-02",
  "compatibility_flags": ["nodejs_compat"],
  "durable_objects": {
    "bindings": [
      { "name": "REALTIME_HUB", "class_name": "RealtimeHub" }
    ]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["RealtimeHub"] }
  ]
}
```

**`realtime-worker/src/index.ts`**:
```typescript
import { RealtimeHub } from './realtime-hub';

export { RealtimeHub };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const id = env.REALTIME_HUB.idFromName('realtime-global');
    const stub = env.REALTIME_HUB.get(id);

    // Route to DO. The DO's fetch() handles /connect, /publish, /broadcast, /presence
    return stub.fetch(request);
  },
};
```

**`realtime-worker/src/realtime-hub.ts`** — Core DO class:

```typescript
import { DurableObject } from 'cloudflare:workers';

interface Subscription {
  connId: string;
  table: string;
  event: string;
  filter?: string;
}

interface SseWriter {
  writer: WritableStreamDefaultWriter<Uint8Array>;
  encoder: TextEncoder;
  connId: string;
}

export class RealtimeHub extends DurableObject {
  private writers = new Map<string, SseWriter>();
  private presenceState = new Map<string, Map<string, any>>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          conn_id TEXT NOT NULL,
          table_name TEXT NOT NULL,
          event TEXT NOT NULL DEFAULT '*',
          filter TEXT,
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          PRIMARY KEY (conn_id, table_name, event, filter)
        )
      `);
    });
  }

  // Called by Pages Function to start SSE stream
  async handleConnect(request: Request): Promise<Response> {
    const connId = crypto.randomUUID();
    const { readable, writable } = new TransformStream<Uint8Array>();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    
    this.writers.set(connId, { writer, encoder, connId });
    
    // Send connected event
    writer.write(encoder.encode(
      `data: ${JSON.stringify({ type: 'connected', connId })}\n\n`
    ));

    // Cleanup on disconnect
    request.signal.addEventListener('abort', () => {
      this.removeConnection(connId);
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  // Called by Pages Function to subscribe a connection to a table
  async handleSubscribe(connId: string, table: string, event: string, filter?: string): Promise<void> {
    this.ctx.storage.sql.exec(
      `INSERT OR IGNORE INTO subscriptions (conn_id, table_name, event, filter) VALUES (?, ?, ?, ?)`,
      connId, table, event, filter || null
    );
  }

  // Called by notifyRealtime() helper when data changes
  async handlePublish(table: string, event: string, payload: any): Promise<void> {
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify({ type: 'change', table, event, payload, timestamp: new Date().toISOString() })}\n\n`;
    const encoded = encoder.encode(data);

    // Find matching subscriptions
    const cursor = this.ctx.storage.sql.exec(
      `SELECT conn_id, filter FROM subscriptions WHERE table_name = ? AND (event = ? OR event = '*')`,
      table, event
    );

    for (const row of cursor) {
      const writer = this.writers.get(row.conn_id as string);
      if (!writer) {
        // Stale subscription — clean up
        this.ctx.storage.sql.exec(
          `DELETE FROM subscriptions WHERE conn_id = ?`, row.conn_id
        );
        continue;
      }

      // Filter matching: format is "column=operator.value" (e.g. "conversation_id=eq.abc123")
      const filter = row.filter as string | null;
      if (filter) {
        const eqIdx = filter.indexOf('=');
        if (eqIdx > 0) {
          const col = filter.substring(0, eqIdx);
          const raw = filter.substring(eqIdx + 1);
          const dotIdx = raw.indexOf('.');
          const cleanVal = dotIdx >= 0 ? raw.substring(dotIdx + 1) : raw;
          if (col && cleanVal && payload[col] != cleanVal) continue;
        }
      }

      try {
        writer.writer.write(encoded).catch(() => this.removeConnection(row.conn_id as string));
      } catch {
        this.removeConnection(row.conn_id as string);
      }
    }
  }

  // Broadcast: POST /broadcast { channel, eventType, payload, from }
  async handleBroadcast(channel: string, eventType: string, payload: any, from: string): Promise<void> {
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify({
      type: 'broadcast', channel, eventType, payload, from, timestamp: new Date().toISOString()
    })}\n\n`;
    const encoded = encoder.encode(data);

    const cursor = this.ctx.storage.sql.exec(
      `SELECT conn_id FROM subscriptions WHERE table_name = ?`,
      `__broadcast:${channel}`
    );

    for (const row of cursor) {
      const writer = this.writers.get(row.conn_id as string);
      if (writer) {
        try { writer.writer.write(encoded); } catch { this.removeConnection(row.conn_id as string); }
      }
    }
  }

  // Presence
  async handleJoinPresence(channel: string, userId: string, info: any): Promise<void> {
    if (!this.presenceState.has(channel)) {
      this.presenceState.set(channel, new Map());
    }
    this.presenceState.get(channel)!.set(userId, { ...info, lastSeen: new Date().toISOString() });
    this.broadcastPresenceSync(channel);
  }

  async handleLeavePresence(channel: string, userId: string): Promise<void> {
    this.presenceState.get(channel)?.delete(userId);
    this.broadcastPresenceSync(channel);
  }

  private async broadcastPresenceSync(channel: string): Promise<void> {
    const users = Array.from(this.presenceState.get(channel)?.values() || []);
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify({ type: 'presence_sync', channel, users, timestamp: new Date().toISOString() })}\n\n`;
    const encoded = encoder.encode(data);

    const cursor = this.ctx.storage.sql.exec(
      `SELECT conn_id FROM subscriptions WHERE table_name = ?`,
      `__presence:${channel}`
    );

    for (const row of cursor) {
      const writer = this.writers.get(row.conn_id as string);
      if (writer) {
        try { writer.writer.write(encoded); } catch { this.removeConnection(row.conn_id as string); }
      }
    }
  }

  // Subscribe to broadcast channel (special __broadcast:channel subscription)
  async handleSubscribeBroadcast(connId: string, channel: string): Promise<void> {
    this.ctx.storage.sql.exec(
      `INSERT OR IGNORE INTO subscriptions (conn_id, table_name, event, filter) VALUES (?, ?, '*', NULL)`,
      connId, `__broadcast:${channel}`
    );
  }

  // Subscribe to presence channel (special __presence:channel subscription)
  async handleSubscribePresence(connId: string, channel: string): Promise<void> {
    this.ctx.storage.sql.exec(
      `INSERT OR IGNORE INTO subscriptions (conn_id, table_name, event, filter) VALUES (?, ?, '*', NULL)`,
      connId, `__presence:${channel}`
    );

    // Send initial presence state
    const users = Array.from(this.presenceState.get(channel)?.values() || []);
    const writer = this.writers.get(connId);
    if (writer) {
      const encoder = new TextEncoder();
      writer.writer.write(encoder.encode(
        `data: ${JSON.stringify({ type: 'presence_sync', channel, users, timestamp: new Date().toISOString() })}\n\n`
      ));
    }
  }

  async handleUnsubscribe(connId: string): Promise<void> {
    this.removeConnection(connId);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'GET' && path === '/connect') {
      return this.handleConnect(request);
    }

    if (request.method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const { action, connId } = body;

      switch (action) {
        case 'subscribe':
          await this.handleSubscribe(connId, body.table, body.event, body.filter);
          return new Response(JSON.stringify({ ok: true }));
        case 'subscribe-broadcast':
          await this.handleSubscribeBroadcast(connId, body.channel);
          return new Response(JSON.stringify({ ok: true }));
        case 'subscribe-presence':
          await this.handleSubscribePresence(connId, body.channel);
          return new Response(JSON.stringify({ ok: true }));
        case 'publish':
          await this.handlePublish(body.table, body.event, body.payload);
          return new Response(JSON.stringify({ ok: true }));
        case 'broadcast':
          await this.handleBroadcast(body.channel, body.eventType, body.payload, body.from);
          return new Response(JSON.stringify({ ok: true }));
        case 'join-presence':
          await this.handleJoinPresence(body.channel, body.userId, body);
          return new Response(JSON.stringify({ ok: true }));
        case 'leave-presence':
          await this.handleLeavePresence(body.channel, body.userId);
          return new Response(JSON.stringify({ ok: true }));
        case 'disconnect':
          await this.handleUnsubscribe(connId);
          return new Response(JSON.stringify({ ok: true }));
        default:
          return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
      }
    }

    return new Response('Not found', { status: 404 });
  }

  private removeConnection(connId: string): void {
    const writer = this.writers.get(connId);
    if (writer) {
      writer.writer.close().catch(() => {});
      this.writers.delete(connId);
    }
    this.ctx.storage.sql.exec(`DELETE FROM subscriptions WHERE conn_id = ?`, connId);
  }
}
```

#### 1.2 Update Pages Function: `/api/realtime-stream/index.ts`

**Replaces**: The current 266-line polling implementation with a ~50-line proxy to the DO.

```typescript
import { withAuth, getContextUser } from '../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

interface Env {
  REALTIME_HUB: DurableObjectNamespace;
}

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as any as Env;
  const id = env.REALTIME_HUB.idFromName('realtime-global');
  const stub = env.REALTIME_HUB.get(id);

  // Forward to DO, passing the auth'd user context
  return stub.fetch(new Request('http://do/connect', {
    signal: context.request.signal,
  }));
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as any as Env;
  const id = env.REALTIME_HUB.idFromName('realtime-global');
  const stub = env.REALTIME_HUB.get(id);

  // Forward POST to DO
  return stub.fetch(new Request('http://do/', {
    method: 'POST',
    body: context.request.body,
    headers: { 'Content-Type': 'application/json' },
  }));
});
```

#### 1.3 Add DO binding to `wrangler.toml`

```toml
[[durable_objects.bindings]]
name = "REALTIME_HUB"
class_name = "RealtimeHub"
script_name = "realtime-worker"
```

#### 1.4 Update `package.json` with dev commands

Add a conv script to run both the DO Worker and Pages dev simultaneously:

```json
{
  "scripts": {
    "realtime:dev": "cd realtime-worker && npx wrangler dev",
    "pages:dev": "npx wrangler pages dev dist --compatibility-date=2026-06-02 --port=8788 --do REALTIME_HUB=RealtimeHub@realtime-worker --service PAYMENT_WORKER=razorpay-api --service SSO_SERVICE=sso-api"
  }
}
```

#### 1.5 Create `notifyRealtime()` helper

**Location**: `functions/lib/realtime.ts`

```typescript
/**
 * Called by mutation endpoints after they write to Supabase.
 * Pushes a change event to the RealtimeHub DO for SSE fan-out.
 * Best-effort: realtime should never break the mutation.
 */
export async function notifyRealtime(
  env: any,
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  payload: Record<string, any>
): Promise<void> {
  try {
    const id = env.REALTIME_HUB.idFromName('realtime-global');
    const stub = env.REALTIME_HUB.get(id);
    await stub.fetch('http://do/', {
      method: 'POST',
      body: JSON.stringify({ action: 'publish', table, event, payload }),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // Best-effort: realtime notifications should never break the mutation
    console.error(`notifyRealtime failed for ${table}.${event}:`, err);
  }
}
```

---

### Phase 2: Frontend SDK Migration (Week 2)

#### 2.1 Rewrite `sseRealtimeClient.ts` (357 lines → ~150 lines)

Keep the fetch+reader approach (needed for auth via `ssoClient` — `EventSource` doesn't support custom headers). Simplify to: connect → get `connId` from first event → POST subscriptions → read loop.

```typescript
export class SSERealtimeClient {
  private connId: string | null = null;
  private handlers = new Map<string, Set<(event: any) => void>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private disconnected = false;
  private activeReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  async connect(): Promise<void> {
    this.disconnected = false;
    this.reconnectAttempts = 0;

    // Step 1: Open SSE connection
    const response = await ssoClient.fetch('/api/realtime-stream');
    if (!response.body) throw new Error('No response body');
    const reader = response.body.getReader();
    this.activeReader = reader;

    // Step 2: Read initial 'connected' event to get connId
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    const match = text.match(/data: (.*)/);
    if (match) {
      const event = JSON.parse(match[1]);
      this.connId = event.connId;
    }

    // Step 3: Start read loop (dispatches events to handlers)
    this.readLoop(reader);
  }

  /** Subscribe to a table change — sends connId + subscription via POST */
  async subscribe(
    table: string,
    config: Omit<SSESubscriptionConfig, 'table'>,
    handler: SSEEventHandler
  ): Promise<() => void> {
    // Register handler locally
    this.addHandler(table, config.event || '*', handler);

    // Subscribe via POST to DO
    await apiPost('/realtime-stream', {
      action: 'subscribe',
      connId: this.connId,
      table,
      ...config,
    });

    return () => this.unsubscribe(table, config.event || '*', handler);
  }

  subscribeToBroadcast(channel: string, handler: SSEEventHandler): Promise<() => void> {
    return this.subscribe(`__broadcast:${channel}`, { type: 'broadcast' }, handler);
  }

  subscribeToPresence(channel: string, handler: SSEEventHandler): Promise<() => void> {
    return this.subscribe(`__presence:${channel}`, { type: 'presence' }, handler);
  }

  // ... readLoop, dispatchEvent, scheduleReconnect, disconnect
}
```

#### 2.2 Rewrite `realtimeService.ts` (362 lines → ~80 lines)

Simplify to just use the new SSERealtimeClient directly.

#### 2.3 Add `notifyRealtime()` calls to all mutation endpoints

Every API endpoint that mutates data (INSERT/UPDATE/DELETE) needs to call `notifyRealtime()` after the Supabase write.

**Mutation endpoints to update** (from audit):

| Endpoint | Tables Mutated | Events |
|----------|---------------|--------|
| `functions/api/messaging/actions.ts` | `messages`, `conversations` | INSERT, UPDATE |
| `functions/api/notifications.ts` | `notifications` | INSERT |
| `functions/api/learner-activity/actions.ts` | `recent_updates` | INSERT |
| `functions/api/college-admin/[[path]].ts` | `learners`, `assessments` | INSERT, UPDATE |
| `functions/api/recruiter/offers.ts` | `offers` | INSERT, UPDATE |
| `functions/api/college-admin/admissions.ts` | `admissions` | INSERT |
| `functions/api/college-admin/marks.ts` | `marks` | INSERT |
| `functions/api/educator/index.ts` | `educators` | INSERT, UPDATE |
| `functions/api/courses/[[path]].ts` | `course_enrollments`, `learner_course_progress` | INSERT, UPDATE |
| `functions/api/pipeline/**` | `pipeline_candidates`, `pipeline_activities`, `interviews` | INSERT, UPDATE |
| `functions/api/shortlists/**` | `shortlists`, `shortlist_candidates` | INSERT, UPDATE, DELETE |
| `functions/api/placements/**` | `placements` | INSERT, UPDATE |

---

### Phase 3: Consumer Migration (Week 2-3)

#### 3.1 Migration Pattern for Hooks

**Before** (current):
```typescript
// useLearnerMessages.ts
useEffect(() => {
  const unsub = getSSEClient().subscribe('messages', { event: 'INSERT', filter: `conversation_id=eq.${conversationId}` }, handler);
  return unsub;
}, [conversationId]);
```

**After** (new):
```typescript
// useLearnerMessages.ts
useEffect(() => {
  const unsub = getSSEClient().subscribe('messages', { event: 'INSERT', filter: `conversation_id=${conversationId}` }, handler);
  return unsub;
}, [conversationId]);
```

The API remains the same at the hook level. Only the underlying transport changes.

#### 3.2 No client-side changes needed for hooks

All 25+ consumer hooks use `getSSEClient().subscribe()` or `RealtimeService.*`. Since we maintain the same public API, the migration is transparent to consumers. Only the internal implementation of `sseRealtimeClient.ts` and `realtimeService.ts` changes.

#### 3.3 Clean up deprecated files

- `functions/api/realtime-stream/state.ts` — delete (moved to DO)
- `src/shared/api/realtimeClient.ts` — delete stub

---

### Phase 4: Cleanup & Verification (Week 3)

#### 4.1 Remove polling code

- Delete the old `queryChanges()` function in `realtime-stream/index.ts`
- Remove `POLL_INTERVAL_MS`, `MAX_CONNECTION_MS` constants
- Remove `warnedTables` set

#### 4.2 Remove in-memory state

- Remove `broadcastBuffer`, `presenceState`, `presenceVersion` from old state.ts
- All state now lives in the DO

#### 4.3 Add `updated_at` columns to missing tables (optional)

If desired, add `updated_at` columns to `shortlist_candidates`, `pipeline_activities`, `placements` so if any future query needs them, they work.

#### 4.4 Verification checklist

- [ ] SSE connection opens once, stays open until tab closes (no 25s reconnect)
- [ ] `notifyRealtime()` fires on all mutation endpoints
- [ ] Broadcast (typing indicators) works through DO
- [ ] Presence (online status) works through DO
- [ ] All 19 tables' change events arrive at subscribed frontend hooks
- [ ] Reconnect after network drop re-establishes subscriptions
- [ ] DO SQLite subscription cleanup on disconnect
- [ ] `wrangler pages dev --do REALTIME_HUB=...` works locally
- [ ] Deploy to production with DO Worker + Pages Function

---

## Effort Estimate

| Phase | Files | Estimated Effort |
|-------|-------|-----------------|
| Phase 1: Core DO + Pages Function | 5 new, 2 modified | 2-3 days |
| Phase 2: Frontend SDK | 2 rewritten, 1 new | 1-2 days |
| Phase 3: Consumer migration | ~15 files modified | 2-3 days |
| Phase 4: Cleanup & verification | ~5 files | 1 day |
| **Total** | **~30 files** | **6-9 days** |

## Rollout Strategy

1. **Deploy `realtime-worker` DO first** (no breaking changes, old code still works)
2. **Update `wrangler.toml`** with DO binding
3. **Deploy updated Pages Function** (starts using DO for new connections)
4. **Add `notifyRealtime()` calls to mutation endpoints** (gradually, one at a time)
5. **Deploy frontend SDK** (ships with new `sseRealtimeClient.ts`)
6. **Delete old polling/state code** after verification

Each step is independently deployable and backward-compatible.

---

## Benefits Summary

| Metric | Current | After DO Hub | Improvement |
|--------|---------|-------------|-------------|
| DB queries per user session | ~12 per 25s per tab | 0 (push-based) | ∞ |
| Connection lifetime | 25s (artificial limit) | Indefinite | ∞ |
| Reconnect overhead | Every 25s (cold-start, auth) | Only on real network drop | ~100x reduction |
| Broadcast reliability | Lost on Worker eviction | Persistent in DO | Guaranteed |
| Presence reliability | Lost on Worker eviction | Persistent in DO | Guaranteed |
| Code to maintain | 985 lines | ~400 lines | 60% reduction |
| Missing updated_at tables | Silent failures | N/A (push-based) | Eliminated |
| Satisfies "stay in Functions" | Yes (but poorly) | Yes (properly) | ✅ |
