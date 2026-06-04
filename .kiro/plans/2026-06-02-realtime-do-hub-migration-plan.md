# Realtime DO Hub Migration Plan (V8 - Hibernation-Safe, Production-Ready)

**Date**: 2026-06-03
**Status**: Draft
**Author**: AI-assisted

## Problem Summary

The current `/api/realtime-stream` implementation uses **polling disguised as SSE**. Every 2 seconds the backend queries Supabase for changes across 19 tables. This causes high DB load, artificial reconnect thrashes, and in-memory state loss on worker evictions.

## Target Architecture: Partitioned Hash Ring DO Hub

> [!CAUTION]
> **Why V8 is Required (9 Flaws Found in V7)**
> 1. **CRITICAL — Presence State Lost on Hibernation**: V7 stored presence in an in-memory `Map`. Cloudflare's WebSocket Hibernation API evicts the DO from memory between messages. When it wakes, the `Map` is empty. ALL presence data silently vanishes. **V8 Fix**: Store presence in a SQLite `presence` table. Reconstruct in-memory cache from SQLite + WebSocket attachments on wake.
> 2. **CRITICAL — Missing `fetch()` on WorkerEntrypoint**: Rule 7.3.2 says "entrypoints without a named handler are not supported." V7 had no `fetch()` method. Deployment would fail. **V8 Fix**: Added required `fetch()` stub.
> 3. **CRITICAL — `userId` Never Reaches the DO**: V7 passed the original client `Request` (URL: `/api/realtime-stream`) to `stub.fetch(request)`. The DO extracted `userId` from the URL and got `null`. Every user was `'unknown'`. **V8 Fix**: Construct a new `Request` with `userId` in the query string before forwarding to the DO.
> 4. **HIGH — Presence Echo Storm**: V7 processed presence locally AND queued it. The Queue fanned out to ALL 10 partitions INCLUDING the originator. The originator processed it twice, causing duplicate broadcasts. **V8 Fix**: Added `sourcePartitionId` to Queue messages. Queue consumer skips the originating partition.
> 5. **HIGH — DurableObject Missing `<Env>` Generic**: `extends DurableObject` without `<Env>` makes `this.env` untyped. **V8 Fix**: `extends DurableObject<Env>`.
> 6. **MEDIUM — Truncated SQL Pseudocode**: The `subscribe` handler had `'INSERT OR IGNORE INTO subscriptions...'` as literal pseudocode. **V8 Fix**: Full SQL statement.
> 7. **MEDIUM — Incomplete Observability Config**: Rule 7.8 requires `logs` and `traces`. **V8 Fix**: Full observability block.
> 8. **MEDIUM — Missing Testing Plan**: Rule 7.9 requires 80% test coverage. **V8 Fix**: Added verification plan.
> 9. **LOW — Missing `wrangler types`**: Rule 7.1.3 says never hand-write Env. **V8 Fix**: Added to checklist.

### Architecture Diagram

```
                    ┌────────────────────────────────────────────────────────┐
                    │  Durable Object: RealtimeHub (10 Partitions)           │
                    │  idFromName('partition-0') to ('partition-9')          │
Client WebSocket ──►│  ┌─────────────────┐  ┌───────────┐  ┌──────────────┐  │
(Hashed by userId)  │  │ WS Hibernation  │  │ Broadcast │  │  Presence    │  │
                    │  │ API             │  │   Buffer  │  │  (SQLite!)   │  │
                    │  └────────┬────────┘  └─────┬─────┘  └──────┬───────┘  │
                    │           │                 │               │          │
                    │           ▼                 ▼               ▼          │
                    │  ┌────────────────────────────────────────────────┐    │
                    │  │             Subscription Matcher               │    │
                    │  │   SQLite (storage.sql) for Subscriptions       │    │
                    │  └────────────────────────────────────────────────┘    │
                    └─────────┬───────────────▲──────────────────────────────┘
    (Forward WS Broadcasts)   │               │ (DO RPC: stub.publishBatch)
                              ▼               │
                    ┌─────────────────────────┴──────────────────────────────┐
                    │               Cloudflare Queue                         │
                    │  (Fans out to 9 OTHER partitions, skips originator)    │
                    └─────────────────────────▲──────────────────────────────┘
                                              │ env.QUEUE.send(event)
                                              │
    Mutation Endpoints ──► notifyRealtime() helper (Fire to Queue)
```

---

## File-by-File Migration Plan

### Phase 1: Core DO + Queue + Worker

#### 1.1 Create `realtime-worker/`

**Location**: `realtime-worker/` (At the workspace root, alongside `email-worker` and `sso-worker`)

**`realtime-worker/wrangler.jsonc`**:
```jsonc
{
  "name": "realtime-worker",
  "main": "src/index.ts",
  "compatibility_date": "2026-06-03",
  "compatibility_flags": ["nodejs_compat"],
  "durable_objects": {
    "bindings": [
      { "name": "REALTIME_HUB", "class_name": "RealtimeHub" }
    ]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["RealtimeHub"] }
  ],
  "queues": {
    "producers": [
      { "queue": "realtime-events-queue", "binding": "REALTIME_EVENTS_QUEUE" }
    ],
    "consumers": [
      {
        "queue": "realtime-events-queue",
        "max_batch_size": 100,
        "max_batch_timeout": 1
      }
    ]
  },
  "observability": {
    "enabled": true,
    "logs": { "head_sampling_rate": 1 },
    "traces": { "enabled": true, "head_sampling_rate": 0.01 }
  }
}
```

**`realtime-worker/src/index.ts`**:
```typescript
import { WorkerEntrypoint } from 'cloudflare:workers';
import { RealtimeHub } from './realtime-hub';
export { RealtimeHub };

const TOTAL_PARTITIONS = 10;

function getPartitionId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = Math.imul(31, hash) + userId.charCodeAt(i) | 0;
  }
  return Math.abs(hash) % TOTAL_PARTITIONS;
}

export default class RealtimeWorker extends WorkerEntrypoint<Env> {
  // REQUIRED by Rule 7.3.2: entrypoints must have a named handler
  async fetch(): Promise<Response> {
    return new Response('Use RPC methods', { status: 404 });
  }

  // True RPC Method: invoked by Pages Service Binding
  async upgradeWebSocket(userId: string, request: Request): Promise<Response> {
    const partitionId = getPartitionId(userId);
    const id = this.env.REALTIME_HUB.idFromName(`partition-${partitionId}`);
    const stub = this.env.REALTIME_HUB.get(id);

    // FIX: Construct a new Request with userId in URL (original has no userId param)
    const doUrl = new URL('http://do/connect');
    doUrl.searchParams.set('userId', userId);
    doUrl.searchParams.set('partitionId', String(partitionId));
    return stub.fetch(new Request(doUrl.toString(), { headers: request.headers }));
  }

  // Queue Consumer: Fan-out to partitions via DO RPC, skipping source
  async queue(batch: MessageBatch<any>): Promise<void> {
    // Group events by whether they are internal (from a DO) or external (from API)
    const externalEvents: any[] = [];
    const internalBySource = new Map<number, any[]>();

    for (const msg of batch.messages) {
      const { event, sourcePartitionId } = msg.body;
      if (sourcePartitionId !== undefined) {
        // Internal event: skip the originator partition
        if (!internalBySource.has(sourcePartitionId)) internalBySource.set(sourcePartitionId, []);
        internalBySource.get(sourcePartitionId)!.push(event);
      } else {
        externalEvents.push(event);
      }
    }

    const promises: Promise<void>[] = [];

    // External events (DB mutations): fan out to ALL 10 partitions
    if (externalEvents.length > 0) {
      for (let i = 0; i < TOTAL_PARTITIONS; i++) {
        const id = this.env.REALTIME_HUB.idFromName(`partition-${i}`);
        promises.push(
          this.env.REALTIME_HUB.get(id).publishBatch(externalEvents).catch(err => {
            console.error(JSON.stringify({ message: `Partition ${i} publish failed`, error: String(err) }));
          })
        );
      }
    }

    // Internal events (WS broadcasts/presence): fan out to OTHER 9 partitions
    for (const [sourceId, events] of internalBySource) {
      for (let i = 0; i < TOTAL_PARTITIONS; i++) {
        if (i === sourceId) continue; // Skip originator!
        const id = this.env.REALTIME_HUB.idFromName(`partition-${i}`);
        promises.push(
          this.env.REALTIME_HUB.get(id).publishBatch(events).catch(err => {
            console.error(JSON.stringify({ message: `Partition ${i} internal publish failed`, error: String(err) }));
          })
        );
      }
    }

    await Promise.allSettled(promises);
  }
}
```

**`realtime-worker/src/realtime-hub.ts`**:
```typescript
import { DurableObject } from 'cloudflare:workers';

interface Attachment {
  wsId: string;
  userId: string;
  partitionId: number;
}

interface PresenceInfo {
  userId: string;
  userName: string;
  userType: string;
  status: string;
  lastSeen: string;
  conversationId?: string;
}

// FIX: Generic <Env> so this.env is typed
export class RealtimeHub extends DurableObject<Env> {
  private partitionId: number = -1; // Set on first fetch

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      // Subscriptions table
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          ws_id TEXT NOT NULL,
          table_name TEXT NOT NULL,
          event TEXT NOT NULL DEFAULT '*',
          filter TEXT,
          PRIMARY KEY (ws_id, table_name, event, filter)
        )
      `);
      // FIX: Presence in SQLite to survive hibernation
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS presence (
          channel TEXT NOT NULL,
          user_id TEXT NOT NULL,
          user_name TEXT NOT NULL DEFAULT '',
          user_type TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'online',
          last_seen TEXT NOT NULL,
          conversation_id TEXT,
          PRIMARY KEY (channel, user_id)
        )
      `);
    });
  }

  // ---- RPC Method (called by Queue Consumer via Worker) ----
  async publishBatch(events: any[]) {
    for (const event of events) {
      switch (event.type) {
        case '__INTERNAL_WS_BROADCAST':
          this.broadcastChannel(event.channel, event.eventType, event.payload, event.from);
          break;
        case '__INTERNAL_WS_PRESENCE_JOIN':
          this.sqlJoinPresence(event.channel, event.info);
          this.syncPresence(event.channel);
          break;
        case '__INTERNAL_WS_PRESENCE_LEAVE':
          this.sqlLeavePresence(event.channel, event.userId);
          this.syncPresence(event.channel);
          break;
        case '__INTERNAL_WS_PRESENCE_HEARTBEAT':
          this.sqlUpdateHeartbeat(event.channel, event.userId, event.status);
          break;
        default:
          this.broadcastToSubscribers(event); // Database change events
      }
    }
  }

  // ---- WebSocket Lifecycle ----
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Not found', { status: 404 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'unknown';
    const partitionId = parseInt(url.searchParams.get('partitionId') || '0', 10);
    this.partitionId = partitionId;
    const wsId = crypto.randomUUID();

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ wsId, userId, partitionId } satisfies Attachment);
    server.send(JSON.stringify({ type: 'connected', connId: wsId }));

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const data = JSON.parse(message as string);
    const attachment = ws.deserializeAttachment() as Attachment;
    this.partitionId = attachment.partitionId;

    switch (data.action) {
      case 'subscribe':
        // FIX: Full SQL, not pseudocode
        this.ctx.storage.sql.exec(
          `INSERT OR IGNORE INTO subscriptions (ws_id, table_name, event, filter) VALUES (?, ?, ?, ?)`,
          attachment.wsId, data.table, data.event || '*', data.filter || null
        );
        break;

      case 'send-broadcast':
        // Process locally
        this.broadcastChannel(data.channel, data.eventType, data.payload, attachment.userId);
        // FIX: Include sourcePartitionId to prevent echo storm
        this.env.REALTIME_EVENTS_QUEUE.send({
          sourcePartitionId: this.partitionId,
          event: { type: '__INTERNAL_WS_BROADCAST', channel: data.channel, eventType: data.eventType, payload: data.payload, from: attachment.userId }
        });
        break;

      case 'join-presence': {
        const info: PresenceInfo = {
          userId: attachment.userId,
          userName: data.userName || '',
          userType: data.userType || '',
          status: data.status || 'online',
          lastSeen: new Date().toISOString(),
          conversationId: data.conversationId
        };
        this.sqlJoinPresence(data.channel, info);
        this.syncPresence(data.channel);
        this.env.REALTIME_EVENTS_QUEUE.send({
          sourcePartitionId: this.partitionId,
          event: { type: '__INTERNAL_WS_PRESENCE_JOIN', channel: data.channel, info }
        });
        break;
      }

      case 'heartbeat':
        this.sqlUpdateHeartbeat(data.channel, attachment.userId, data.status);
        this.env.REALTIME_EVENTS_QUEUE.send({
          sourcePartitionId: this.partitionId,
          event: { type: '__INTERNAL_WS_PRESENCE_HEARTBEAT', channel: data.channel, userId: attachment.userId, status: data.status }
        });
        break;

      case 'leave-presence':
        this.sqlLeavePresence(data.channel, attachment.userId);
        this.syncPresence(data.channel);
        this.env.REALTIME_EVENTS_QUEUE.send({
          sourcePartitionId: this.partitionId,
          event: { type: '__INTERNAL_WS_PRESENCE_LEAVE', channel: data.channel, userId: attachment.userId }
        });
        break;
    }
  }

  async webSocketClose(ws: WebSocket) {
    const attachment = ws.deserializeAttachment() as Attachment;
    this.partitionId = attachment.partitionId;

    // Clean subscriptions
    this.ctx.storage.sql.exec(`DELETE FROM subscriptions WHERE ws_id = ?`, attachment.wsId);

    // Clean presence from ALL channels this user was in
    const channels = this.ctx.storage.sql.exec(
      `SELECT DISTINCT channel FROM presence WHERE user_id = ?`, attachment.userId
    ).toArray();

    for (const row of channels) {
      const channel = row.channel as string;
      this.sqlLeavePresence(channel, attachment.userId);
      this.syncPresence(channel);
      this.env.REALTIME_EVENTS_QUEUE.send({
        sourcePartitionId: this.partitionId,
        event: { type: '__INTERNAL_WS_PRESENCE_LEAVE', channel, userId: attachment.userId }
      });
    }
  }

  // ---- SQLite Presence (Hibernation-Safe) ----
  private sqlJoinPresence(channel: string, info: PresenceInfo) {
    this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO presence (channel, user_id, user_name, user_type, status, last_seen, conversation_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      channel, info.userId, info.userName, info.userType, info.status, info.lastSeen, info.conversationId || null
    );
  }

  private sqlLeavePresence(channel: string, userId: string) {
    this.ctx.storage.sql.exec(`DELETE FROM presence WHERE channel = ? AND user_id = ?`, channel, userId);
  }

  private sqlUpdateHeartbeat(channel: string, userId: string, status?: string) {
    this.ctx.storage.sql.exec(
      `UPDATE presence SET last_seen = ?, status = COALESCE(?, status) WHERE channel = ? AND user_id = ?`,
      new Date().toISOString(), status || null, channel, userId
    );
  }

  private syncPresence(channelName: string) {
    const staleTimeout = 120_000;
    const cutoff = new Date(Date.now() - staleTimeout).toISOString();

    // Prune stale entries
    this.ctx.storage.sql.exec(`DELETE FROM presence WHERE channel = ? AND last_seen < ?`, channelName, cutoff);

    // Read active entries
    const rows = this.ctx.storage.sql.exec(
      `SELECT user_id, user_name, user_type, status, last_seen, conversation_id FROM presence WHERE channel = ?`,
      channelName
    ).toArray();

    const users: PresenceInfo[] = rows.map(r => ({
      userId: r.user_id as string,
      userName: r.user_name as string,
      userType: r.user_type as string,
      status: r.status as string,
      lastSeen: r.last_seen as string,
      conversationId: r.conversation_id as string | undefined,
    }));

    const data = JSON.stringify({ type: 'presence_sync', channel: channelName, users, timestamp: new Date().toISOString() });
    this.sendToSubscribers(`__presence:${channelName}`, '*', null, data);
  }

  // ---- Broadcasters ----
  private broadcastChannel(channel: string, eventType: string, payload: any, from: string) {
    const data = JSON.stringify({ type: 'broadcast', channel, eventType, payload, from, timestamp: new Date().toISOString() });
    this.sendToSubscribers(`__broadcast:${channel}`, '*', null, data);
  }

  private broadcastToSubscribers(event: any) {
    const data = JSON.stringify({ type: 'change', table: event.table, event: event.type, payload: event.payload, timestamp: new Date().toISOString() });
    this.sendToSubscribers(event.table, event.type, event.payload, data);
  }

  private sendToSubscribers(targetTable: string, targetType: string, payload: any | null, jsonString: string) {
    const cursor = this.ctx.storage.sql.exec(
      `SELECT ws_id, filter FROM subscriptions WHERE table_name = ? AND (event = ? OR event = '*')`,
      targetTable, targetType
    );

    const activeSockets = this.ctx.getWebSockets();
    const wsMap = new Map(activeSockets.map(ws => [(ws.deserializeAttachment() as Attachment).wsId, ws]));

    for (const row of cursor) {
      const filter = row.filter as string | null;
      if (filter && payload) {
        const eqIdx = filter.indexOf('=');
        if (eqIdx > 0) {
          const col = filter.substring(0, eqIdx);
          const raw = filter.substring(eqIdx + 1);
          const cleanVal = raw.includes('.') ? raw.split('.')[1] : raw;
          if (col && cleanVal && payload[col] != cleanVal) continue;
        }
      }
      wsMap.get(row.ws_id as string)?.send(jsonString);
    }
  }
}
```

#### 1.2 Update Pages Config & Pages Function

**`skillpassport/wrangler.jsonc`** (Add these bindings):
```jsonc
{
  // ... existing config ...
  "queues": {
    "producers": [
      { "queue": "realtime-events-queue", "binding": "REALTIME_EVENTS_QUEUE" }
    ]
  },
  "services": [
    { "binding": "REALTIME_WORKER", "service": "realtime-worker" }
  ]
}
```

**`skillpassport/functions/api/realtime-stream/index.ts`**:
```typescript
import { verifyJWT } from '@rareminds-eym/auth-core';
import { ensureAuthInitialized } from '../../lib/auth';

export const onRequestGet = async (context: EventContext<any, any, any>) => {
  const request = context.request;

  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  // Extract JWT from Sec-WebSocket-Protocol subprotocols
  const protocols = request.headers.get('Sec-WebSocket-Protocol')?.split(',').map(p => p.trim()) || [];
  const tokenIndex = protocols.indexOf('access_token');
  if (tokenIndex === -1 || tokenIndex + 1 >= protocols.length) {
    return new Response('Unauthorized', { status: 401 });
  }
  const token = protocols[tokenIndex + 1];

  let userId = 'unknown';
  try {
    ensureAuthInitialized(context.env);
    const decoded = await verifyJWT(token);
    userId = decoded.sub;
  } catch (err) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Forward via True RPC Service Binding (Rule 7.3.2)
  const response = await context.env.REALTIME_WORKER.upgradeWebSocket(userId, request);

  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Sec-WebSocket-Protocol', 'access_token');
  return newResponse;
};
```

#### 1.3 `notifyRealtime()` (Queue Producer)

**Location**: `functions/lib/realtime.ts`

```typescript
/**
 * Fire-and-forget realtime notification via Queue.
 * No routing keys needed — the Queue Consumer fans out to all partitions.
 */
export async function notifyRealtime(
  env: any,
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  payload: Record<string, any>
): Promise<void> {
  try {
    await env.REALTIME_EVENTS_QUEUE.send({
      // No sourcePartitionId = external event = fan out to ALL 10 partitions
      event: { table, type: event, payload }
    });
  } catch (err) {
    console.error(JSON.stringify({ message: `Failed to queue realtime event`, table, error: String(err) }));
  }
}
```

---

### Phase 2: Frontend SDK Migration

#### 2.1 Rewrite to `wsRealtimeClient.ts`

```typescript
import { ssoClient } from './ssoClient';

export class WSRealtimeClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<Function>>();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  connect(): void {
    // getAccessToken() is synchronous — returns string | null
    const token = ssoClient.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(
      `${protocol}//${window.location.host}/api/realtime-stream`,
      ['access_token', token]
    );

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.dispatchEvent(data);
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
    };
  }

  subscribe(table: string, event: string = '*', filter?: string) {
    this.ws?.send(JSON.stringify({ action: 'subscribe', table, event, filter }));
  }

  sendBroadcast(channel: string, eventType: string, payload: any) {
    this.ws?.send(JSON.stringify({ action: 'send-broadcast', channel, eventType, payload }));
  }

  joinPresence(channel: string, userName: string, userType: string, conversationId?: string) {
    this.ws?.send(JSON.stringify({ action: 'join-presence', channel, userName, userType, conversationId }));
    this.startHeartbeat(channel);
  }

  leavePresence(channel: string) {
    this.ws?.send(JSON.stringify({ action: 'leave-presence', channel }));
    this.stopHeartbeat();
  }

  sendHeartbeat(channel: string, status: string = 'online') {
    this.ws?.send(JSON.stringify({ action: 'heartbeat', channel, status }));
  }

  private startHeartbeat(channel: string) {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(channel), 30_000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) { clearInterval(this.heartbeatInterval); this.heartbeatInterval = null; }
  }

  private dispatchEvent(data: any) {
    const key = data.type === 'change' ? `${data.table}:${data.event}` : `${data.type}:${data.channel}`;
    this.handlers.get(key)?.forEach(fn => fn(data));
    this.handlers.get('*')?.forEach(fn => fn(data));
  }

  on(key: string, handler: Function) {
    if (!this.handlers.has(key)) this.handlers.set(key, new Set());
    this.handlers.get(key)!.add(handler);
  }

  disconnect() {
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
  }
}
```

---

## Rollout Strategy

> [!IMPORTANT]
> **DEPLOYMENT RULE**: Absolutely NOTHING will be deployed to the production environment without the explicit, final permission of the user. All testing will occur locally or in a preview/staging environment first.

1. **Create Cloudflare Queue** (`realtime-events-queue`).
2. **Deploy `realtime-worker`** with 10 DO Partitions.
3. **Update Pages Config** to bind the Queue and Worker.
4. **Deploy Pages Function** to route WebSockets via Service Binding.
5. **Deploy Frontend SDK** using WebSocket.

---

## Verification Plan

### Build Steps
```bash
cd realtime-worker
npx wrangler types          # Rule 7.1.3: Generate Env types
npx tsc --noEmit             # TypeScript compilation
npx vitest run               # Unit tests (target 80% coverage per Rule 7.9)
```

### Test Cases
- **Unit**: `publishBatch` correctly routes internal vs external events.
- **Unit**: `sqlJoinPresence` / `sqlLeavePresence` persist to SQLite.
- **Unit**: `syncPresence` prunes stale entries (lastSeen > 2 min).
- **Unit**: `sendToSubscribers` correctly filters by subscription match.
- **Integration**: WebSocket connect → subscribe → receive change event.
- **Integration**: Presence join on Partition 3 → Queue → Partition 7 receives sync.
- **Integration**: Echo storm prevention: originator does NOT double-process.

### Manual Verification
- Run `npx wrangler dev` locally for `realtime-worker`.
- Run `npm run pages:dev` for `skillpassport`.
- Connect via browser WebSocket console and verify events flow.
