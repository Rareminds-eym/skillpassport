# Realtime DO Hub Migration — V8 Task List

**Date**: 2026-06-03
**Plan Reference**: [2026-06-02-realtime-do-hub-migration-plan.md](./2026-06-02-realtime-do-hub-migration-plan.md)

> [!IMPORTANT]
> **DEPLOYMENT RULE**: Absolutely NOTHING will be deployed to production without explicit user permission. All work is local/preview only until approved.

---

## Phase 1: `realtime-worker` — Project Scaffolding & Core Backend ✅

### 1.1 Project Setup
- [x] Create directory `realtime-worker/` at workspace root (alongside `email-worker`, `sso-worker`)
- [x] Create `realtime-worker/package.json` with name, scripts (`dev`, `deploy`, `types`, `test`)
- [x] Run `npm install` for dependencies (`wrangler`, `typescript`, `vitest`, `@types/node`)
- [x] Create `realtime-worker/tsconfig.json` (targeting `ES2022`, wrangler-generated runtime types)
- [x] Create `realtime-worker/.gitignore`

### 1.2 Wrangler Configuration
- [x] Create `realtime-worker/wrangler.jsonc` with:
  - [x] `name: "realtime-worker"`
  - [x] `main: "src/index.ts"`
  - [x] `compatibility_date: "2026-06-03"`
  - [x] `compatibility_flags: ["nodejs_compat"]`
  - [x] `durable_objects.bindings` → `REALTIME_HUB` class `RealtimeHub`
  - [x] `migrations` → `{ tag: "v1", new_sqlite_classes: ["RealtimeHub"] }`
  - [x] `queues.producers` → `realtime-events-queue` binding `REALTIME_EVENTS_QUEUE`
  - [x] `queues.consumers` → `realtime-events-queue`, `max_batch_size: 100`, `max_batch_timeout: 1`
  - [x] `observability` → `enabled: true`, `logs.head_sampling_rate: 1`, `traces.enabled: true`, `traces.head_sampling_rate: 0.01`
- [x] Run `npx wrangler types` to auto-generate `Env` interface (Rule 7.1.3)
- [x] Verify generated types include `REALTIME_HUB`, `REALTIME_EVENTS_QUEUE`

### 1.3 Worker Entrypoint (`src/index.ts`)
- [x] Import `WorkerEntrypoint` from `cloudflare:workers`
- [x] Import and re-export `RealtimeHub` (required for DO class discovery by Wrangler)
- [x] Create `getPartitionId(userId: string): number` hash function (31-multiplier, mod 10)
- [x] Create `RealtimeWorker extends WorkerEntrypoint<Env>` as default export
- [x] Implement required `async fetch()` stub returning `404` (Rule 7.3.2)
- [x] Implement `async getWebSocketFetcher(userId: string)` RPC capability-passing method:
  - [x] Hash `userId` → `partitionId` via `getPartitionId()`
  - [x] Get DO stub via `this.env.REALTIME_HUB.idFromName('partition-${partitionId}')`
  - [x] Return `{ fetcher: stub, partitionId }` over the RPC boundary
- [x] Implement `async queue(batch: MessageBatch<any>)` consumer:
  - [x] Classify each message as **external** (no `sourcePartitionId`) or **internal** (has `sourcePartitionId`)
  - [x] Fan out external events to ALL 10 partitions via `stub.publishBatch()`
  - [x] Fan out internal events to OTHER 9 partitions — skip `sourcePartitionId`
  - [x] Use `Promise.allSettled` for fault tolerance
  - [x] Use structured JSON `console.error` logging on failure (Rule 7.8)

### 1.4 Durable Object (`src/realtime-hub.ts`)

#### Types & Class Declaration
- [x] Import `DurableObject` from `cloudflare:workers`
- [x] Define `WsAttachment` interface: `{ wsId: string, userId: string, partitionId: number }`
- [x] Define `PresenceInfo` interface: `{ userId, userName, userType, status, lastSeen, conversationId? }`
- [x] Create `RealtimeHub extends DurableObject<Env>` (with `<Env>` generic)
- [x] Add `private partitionId: number = -1`

#### Constructor & SQLite Schema
- [x] Call `super(ctx, env)`
- [x] Use `ctx.blockConcurrencyWhile()` for one-time schema init (Rule 7.4.5)
- [x] Create `subscriptions` table with proper PRIMARY KEY
- [x] Create `presence` table with proper PRIMARY KEY
- [x] Presence is in SQLite (NOT in-memory Map) — hibernation-safe

#### RPC Method: `publishBatch(events: any[])`
- [x] Route `__INTERNAL_WS_BROADCAST` → `broadcastChannel()`
- [x] Route `__INTERNAL_WS_PRESENCE_JOIN` → `sqlJoinPresence()` + `syncPresence()`
- [x] Route `__INTERNAL_WS_PRESENCE_LEAVE` → `sqlLeavePresence()` + `syncPresence()`
- [x] Route `__INTERNAL_WS_PRESENCE_HEARTBEAT` → `sqlUpdateHeartbeat()`
- [x] Route default (DB change events) → `broadcastToSubscribers()`

#### WebSocket Lifecycle: `fetch(request: Request)`
- [x] Check `Upgrade: websocket` header → return `404` if not WebSocket
- [x] Create `WebSocketPair`
- [x] Extract `userId` and `partitionId` from URL query params
- [x] Set `this.partitionId` from query param
- [x] Generate `wsId` via `crypto.randomUUID()`
- [x] Call `this.ctx.acceptWebSocket(server)` (Hibernation API)
- [x] Serialize attachment: `{ wsId, userId, partitionId }`
- [x] Send initial `{ type: 'connected', connId: wsId }` message
- [x] Return `Response(null, { status: 101, webSocket: client })`

#### WebSocket Message Handler: `webSocketMessage(ws, message)`
- [x] Parse JSON message
- [x] Deserialize attachment from `ws.deserializeAttachment()`
- [x] Restore `this.partitionId` from attachment (hibernation-safe)
- [x] Handle `action: 'subscribe'` with full SQL INSERT OR IGNORE
- [x] Handle `action: 'send-broadcast'` with local + queue with sourcePartitionId
- [x] Handle `action: 'join-presence'` with SQLite + sync + queue
- [x] Handle `action: 'heartbeat'` with SQLite + queue
- [x] Handle `action: 'leave-presence'` with SQLite + sync + queue

#### WebSocket Close Handler: `webSocketClose(ws)`
- [x] Deserialize attachment + restore partitionId
- [x] Delete all subscriptions for `ws_id` from SQLite
- [x] Query + clean up presence for ALL channels this user was in
- [x] Queue leave events with sourcePartitionId for each channel

#### SQLite Presence Methods (Hibernation-Safe)
- [x] `sqlJoinPresence(channel, info)` → INSERT OR REPLACE
- [x] `sqlLeavePresence(channel, userId)` → DELETE
- [x] `sqlUpdateHeartbeat(channel, userId, status?)` → UPDATE with COALESCE

#### Presence Sync: `syncPresence(channelName)`
- [x] Calculate stale cutoff (120 seconds)
- [x] Prune stale entries from SQLite
- [x] Read active entries, map to PresenceInfo[]
- [x] Send via `sendToSubscribers('__presence:${channel}', ...)`

#### Broadcasters
- [x] `broadcastChannel()` → send to `__broadcast:${channel}` subscribers
- [x] `broadcastToSubscribers()` → send to `${table}` subscribers

#### Subscription Matcher: `sendToSubscribers()`
- [x] SQL query for matching subscriptions
- [x] Build wsMap from `ctx.getWebSockets()` + attachment deserialization
- [x] Apply `column=value` filter matching
- [x] Send jsonString to matched WebSockets

### 1.5 Type Check
- [x] `npx wrangler types` — generated `Env` with `REALTIME_HUB` + `REALTIME_EVENTS_QUEUE`
- [x] `npx tsc --noEmit` — **zero TypeScript errors**

---

## Phase 2: `skillpassport` — Pages Integration ✅

### 2.1 Wrangler Config Update
- [x] Added `REALTIME_WORKER` service binding to `wrangler.toml`
- [x] Added `REALTIME_EVENTS_QUEUE` queue producer binding to `wrangler.toml`

### 2.2 Pages Function: WebSocket Upgrade Endpoint
- [x] Rewritten `functions/api/realtime-stream/index.ts`:
  - [x] Export `onRequestGet` handler
  - [x] Check `Upgrade: websocket` header → return `426` if not WebSocket
  - [x] Extract JWT from `Sec-WebSocket-Protocol` subprotocols
  - [x] Verify JWT via `@rareminds-eym/auth-core` → `verifyJWT(token)`
  - [x] Extract `userId` from `decoded.sub`
  - [x] Call `context.env.REALTIME_WORKER.upgradeWebSocket(userId, request)` (True RPC)
  - [x] Return response with `Sec-WebSocket-Protocol: access_token` header
- [ ] Archive `functions/api/realtime-stream/state.ts` (SSE polling state — no longer needed)

### 2.3 Queue Producer Helper
- [x] Created `functions/lib/realtime.ts`:
  - [x] Export `notifyRealtime(env, table, event, payload)` function
  - [x] Send to `env.REALTIME_EVENTS_QUEUE.send(...)` with no sourcePartitionId
  - [x] Structured JSON error logging on failure

### 2.4 Integrate `notifyRealtime()` into Mutation Endpoints
- [ ] Audit ALL `functions/api/**` endpoints that do INSERT/UPDATE/DELETE on key tables
- [ ] Add `context.waitUntil(notifyRealtime(...))` calls where needed
- [ ] Priority tables: `messages`, `conversations`, `notifications`, `activities`

---

## Phase 3: Frontend SDK Migration (SSE → WebSocket) ✅

### 3.1 Create New WebSocket Client
- [x] Created `src/shared/api/wsRealtimeClient.ts`:
  - [x] `WSRealtimeClient` class with `connect()`, `subscribe()`, `sendBroadcast()`, `joinPresence()`, `leavePresence()`, `sendHeartbeat()`, `disconnect()`
  - [x] Auto-reconnect with exponential backoff + jitter (1s → 30s max)
  - [x] Re-subscribe after reconnect (tracked subscriptions)
  - [x] Exported backward-compatible `getSSEClient` alias
  - [x] Exported `destroySSEClient` alias

### 3.2 Rewrite `realtimeService.ts` to Use WebSocket
- [x] Rewritten `src/shared/api/realtimeService.ts`:
  - [x] All methods now use `getWSClient()` instead of `getSSEClient()`
  - [x] All public method signatures and return types preserved identically
  - [x] Zero breaking changes to 30+ consumers

### 3.3 Update Barrel Export
- [x] `src/shared/api/index.ts` — `export * from './realtimeService'` preserved

### 3.4 Archive Legacy SSE Client
- [x] Renamed `sseRealtimeClient.ts` → `sseRealtimeClient.ts.legacy`
- [x] Updated `realtimeClient.ts` deprecation notice to point to new WS client

### 3.5 Migrate Consumer Imports (29 files)
- [x] Replaced `from '@/shared/api/sseRealtimeClient'` → `from '@/shared/api/wsRealtimeClient'` in 26 `.ts/.tsx` files
- [x] Replaced same import in 3 `.js/.jsx` files (`Dashboard.jsx`, 2 learner-profile JS services)
- [x] Zero SSE imports remaining in active code

### 3.6 Build Verification
- [x] `npx tsc --noEmit` — **zero TypeScript errors**
- [x] `npm run build` — **✓ built in 53.16s, 1920 modules, zero errors**

---

## Phase 4: Verification & Testing

### 4.1 Type Generation & Compilation
- [x] `cd realtime-worker && npx wrangler types` — Env generated
- [x] `cd realtime-worker && npx tsc --noEmit` — zero errors
- [x] `cd skillpassport && npx tsc --noEmit` — zero errors

### 4.2 Unit Tests (`realtime-worker`)
- [ ] Create `realtime-worker/src/__tests__/index.test.ts`:
  - [ ] Test `getPartitionId()` returns consistent values for same input
  - [ ] Test `getPartitionId()` returns values in range 0–9
  - [ ] Test `getPartitionId()` distributes evenly for sample user IDs
  - [ ] Test queue consumer classifies external vs internal events correctly
  - [ ] Test queue consumer skips `sourcePartitionId` for internal events
  - [ ] Test queue consumer fans out external events to ALL 10 partitions
- [ ] Create `realtime-worker/src/__tests__/realtime-hub.test.ts`:
  - [ ] Test `sqlJoinPresence()` persists row to SQLite
  - [ ] Test `sqlLeavePresence()` removes row from SQLite
  - [ ] Test `sqlUpdateHeartbeat()` updates `last_seen` and optionally `status`
  - [ ] Test `syncPresence()` prunes entries with `last_seen` older than 120 seconds
  - [ ] Test `sendToSubscribers()` matches by `table_name` + `event`
  - [ ] Test `sendToSubscribers()` matches wildcard `*` event subscribers
  - [ ] Test `sendToSubscribers()` applies `column=value` filter correctly
  - [ ] Test subscription cleanup: `webSocketClose` removes all subscriptions for that `ws_id`
  - [ ] Test presence cleanup: `webSocketClose` removes presence and notifies other partitions
- [ ] Run `npx vitest run --coverage` — target ≥80% coverage (Rule 7.9)

### 4.3 Integration Tests (Local Dev)
- [ ] Start `realtime-worker` with `npx wrangler dev`
- [ ] Start `skillpassport` with `npm run pages:dev`
- [ ] **Connection**: Open browser WebSocket to `/api/realtime-stream` → receive `{ type: 'connected' }`
- [ ] **Auth rejection**: Connect with invalid/expired JWT → receive `401`
- [ ] **Subscribe + Change**: Subscribe to `messages` table → trigger `notifyRealtime()` → verify `change` event received
- [ ] **Broadcast**: Client A sends broadcast → Client B (different partition) receives it
- [ ] **Presence join**: Client A joins presence channel → Client B gets `presence_sync` with Client A listed
- [ ] **Presence leave**: Client A disconnects → Client B gets updated `presence_sync` without Client A
- [ ] **Heartbeat**: Send heartbeats → verify `last_seen` updates in DO SQLite
- [ ] **Stale pruning**: Stop heartbeats → after 120s → user is pruned from `presence_sync`
- [ ] **Echo storm prevention**: Verify originating partition does NOT process its own internal event twice
- [ ] **Reconnect**: Kill WebSocket → verify frontend client reconnects and re-subscribes automatically
- [ ] **Filter matching**: Subscribe with `filter=conversationId=abc` → only matching events delivered

### 4.4 Build Validation
- [x] `cd skillpassport && npm run build` — **zero build errors** ✅
- [x] Verify no active imports of `sseRealtimeClient` remain — **confirmed zero** ✅
- [x] Verify `wrangler.toml` has `REALTIME_WORKER` service binding — **confirmed** ✅
- [x] Verify `wrangler.toml` has `REALTIME_EVENTS_QUEUE` producer binding — **confirmed** ✅

### 4.5 Production Deployment (⚠️ REQUIRES EXPLICIT USER PERMISSION)

> [!CAUTION]
> **STOP HERE.** Do NOT execute any deployment step without the user's explicit approval.

- [ ] **User approval received**: ____________________
- [ ] Create Cloudflare Queue `realtime-events-queue` via dashboard or CLI
- [ ] Deploy `realtime-worker` via `npx wrangler deploy`
- [ ] Set any required secrets via `npx wrangler secret put`
- [ ] Deploy `skillpassport` Pages with updated wrangler config
- [ ] Verify production WebSocket connects successfully
- [ ] Verify production events flow end-to-end (subscribe → mutate → receive)
- [ ] Monitor Cloudflare dashboard for error rates, latency, and DO metrics
- [ ] Confirm no regressions in existing features (messaging, presence, notifications)

---

## Documentation (Required by Rule 1.2)

- [ ] Create `realtime-worker/README.md` — purpose, architecture, setup, API reference
- [ ] Create architecture document in `.kiro/architecture/REALTIME_WORKER_ARCHITECTURE.md`
