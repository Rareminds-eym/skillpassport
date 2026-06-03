# Realtime DO Hub Migration — V8 Task List

**Date**: 2026-06-03
**Plan Reference**: [2026-06-02-realtime-do-hub-migration-plan.md](./2026-06-02-realtime-do-hub-migration-plan.md)

> [!IMPORTANT]
> **DEPLOYMENT RULE**: Absolutely NOTHING will be deployed to production without explicit user permission. All work is local/preview only until approved.

---

## Phase 1: `realtime-worker` — Project Scaffolding & Core Backend

### 1.1 Project Setup
- [ ] Create directory `realtime-worker/` at workspace root (alongside `email-worker`, `sso-worker`)
- [ ] Create `realtime-worker/package.json` with name, scripts (`dev`, `deploy`, `types`, `test`)
- [ ] Run `npm install` for dependencies (`wrangler`, `typescript`, `vitest`, `@cloudflare/workers-types`)
- [ ] Create `realtime-worker/tsconfig.json` (targeting `esnext`, `cloudflare:workers` types)
- [ ] Create `realtime-worker/.dev.vars` for local secrets (if any needed), add to `.gitignore`

### 1.2 Wrangler Configuration
- [ ] Create `realtime-worker/wrangler.jsonc` with:
  - [ ] `name: "realtime-worker"`
  - [ ] `main: "src/index.ts"`
  - [ ] `compatibility_date: "2026-06-03"`
  - [ ] `compatibility_flags: ["nodejs_compat"]`
  - [ ] `durable_objects.bindings` → `REALTIME_HUB` class `RealtimeHub`
  - [ ] `migrations` → `{ tag: "v1", new_sqlite_classes: ["RealtimeHub"] }`
  - [ ] `queues.producers` → `realtime-events-queue` binding `REALTIME_EVENTS_QUEUE`
  - [ ] `queues.consumers` → `realtime-events-queue`, `max_batch_size: 100`, `max_batch_timeout: 1`
  - [ ] `observability` → `enabled: true`, `logs.head_sampling_rate: 1`, `traces.enabled: true`, `traces.head_sampling_rate: 0.01`
- [ ] Run `npx wrangler types` to auto-generate `Env` interface (Rule 7.1.3)
- [ ] Verify generated types include `REALTIME_HUB`, `REALTIME_EVENTS_QUEUE`

### 1.3 Worker Entrypoint (`src/index.ts`)
- [ ] Import `WorkerEntrypoint` from `cloudflare:workers`
- [ ] Import and re-export `RealtimeHub` (required for DO class discovery by Wrangler)
- [ ] Create `getPartitionId(userId: string): number` hash function (31-multiplier, mod 10)
- [ ] Create `RealtimeWorker extends WorkerEntrypoint<Env>` as default export
- [ ] Implement required `async fetch()` stub returning `404` (Rule 7.3.2 — entrypoints MUST have a named handler)
- [ ] Implement `async upgradeWebSocket(userId: string, request: Request)` RPC method:
  - [ ] Hash `userId` → `partitionId` via `getPartitionId()`
  - [ ] Get DO stub via `this.env.REALTIME_HUB.idFromName('partition-${partitionId}')`
  - [ ] Construct NEW `Request` with `userId` and `partitionId` in query string (NOT the original request URL — original URL is `/api/realtime-stream` which has no userId)
  - [ ] Forward `Upgrade` headers from original request
  - [ ] Return `stub.fetch(newRequest)`
- [ ] Implement `async queue(batch: MessageBatch<any>)` consumer:
  - [ ] Classify each message as **external** (no `sourcePartitionId`) or **internal** (has `sourcePartitionId`)
  - [ ] Fan out external events (DB mutations) to ALL 10 partitions via `stub.publishBatch()`
  - [ ] Fan out internal events (WS broadcasts/presence) to OTHER 9 partitions — skip `sourcePartitionId` to prevent echo storm
  - [ ] Use `Promise.allSettled` for fault tolerance
  - [ ] Use structured JSON `console.error` logging on failure (Rule 7.8)

### 1.4 Durable Object (`src/realtime-hub.ts`)

#### Types & Class Declaration
- [ ] Import `DurableObject` from `cloudflare:workers`
- [ ] Define `Attachment` interface: `{ wsId: string, userId: string, partitionId: number }`
- [ ] Define `PresenceInfo` interface: `{ userId, userName, userType, status, lastSeen, conversationId? }`
- [ ] Create `RealtimeHub extends DurableObject<Env>` (with `<Env>` generic so `this.env` is typed)
- [ ] Add `private partitionId: number = -1` (set on first fetch, restored from attachment on hibernation wake)

#### Constructor & SQLite Schema
- [ ] Call `super(ctx, env)`
- [ ] Use `ctx.blockConcurrencyWhile()` for one-time schema init (Rule 7.4.5)
- [ ] Create `subscriptions` table: `(ws_id TEXT, table_name TEXT, event TEXT DEFAULT '*', filter TEXT, PRIMARY KEY(ws_id, table_name, event, filter))`
- [ ] Create `presence` table: `(channel TEXT, user_id TEXT, user_name TEXT DEFAULT '', user_type TEXT DEFAULT '', status TEXT DEFAULT 'online', last_seen TEXT, conversation_id TEXT, PRIMARY KEY(channel, user_id))`
- [ ] Presence MUST be in SQLite (NOT in-memory Map) — in-memory state is destroyed on Hibernation API wake-up

#### RPC Method: `publishBatch(events: any[])`
- [ ] Route `__INTERNAL_WS_BROADCAST` → `broadcastChannel()`
- [ ] Route `__INTERNAL_WS_PRESENCE_JOIN` → `sqlJoinPresence()` + `syncPresence()`
- [ ] Route `__INTERNAL_WS_PRESENCE_LEAVE` → `sqlLeavePresence()` + `syncPresence()`
- [ ] Route `__INTERNAL_WS_PRESENCE_HEARTBEAT` → `sqlUpdateHeartbeat()`
- [ ] Route default (DB change events) → `broadcastToSubscribers()`

#### WebSocket Lifecycle: `fetch(request: Request)`
- [ ] Check `Upgrade: websocket` header → return `404` if not WebSocket
- [ ] Create `WebSocketPair`
- [ ] Extract `userId` and `partitionId` from URL query params (put there by Worker's `upgradeWebSocket`)
- [ ] Set `this.partitionId` from query param
- [ ] Generate `wsId` via `crypto.randomUUID()`
- [ ] Call `this.ctx.acceptWebSocket(server)` (enables Hibernation API)
- [ ] Serialize attachment: `{ wsId, userId, partitionId }` using `satisfies Attachment`
- [ ] Send initial `{ type: 'connected', connId: wsId }` message to client
- [ ] Return `Response(null, { status: 101, webSocket: client })`

#### WebSocket Message Handler: `webSocketMessage(ws, message)`
- [ ] Parse JSON message
- [ ] Deserialize attachment from `ws.deserializeAttachment()`
- [ ] Restore `this.partitionId` from attachment (critical — may be waking from hibernation)
- [ ] Handle `action: 'subscribe'`:
  - [ ] Full SQL: `INSERT OR IGNORE INTO subscriptions (ws_id, table_name, event, filter) VALUES (?, ?, ?, ?)`
- [ ] Handle `action: 'send-broadcast'`:
  - [ ] Process locally via `broadcastChannel()`
  - [ ] Queue with `sourcePartitionId` to prevent echo storm
- [ ] Handle `action: 'join-presence'`:
  - [ ] Build `PresenceInfo` object from message + attachment
  - [ ] `sqlJoinPresence()` + `syncPresence()` locally
  - [ ] Queue with `sourcePartitionId`
- [ ] Handle `action: 'heartbeat'`:
  - [ ] `sqlUpdateHeartbeat()` locally
  - [ ] Queue with `sourcePartitionId`
- [ ] Handle `action: 'leave-presence'`:
  - [ ] `sqlLeavePresence()` + `syncPresence()` locally
  - [ ] Queue with `sourcePartitionId`

#### WebSocket Close Handler: `webSocketClose(ws)`
- [ ] Deserialize attachment
- [ ] Restore `this.partitionId` from attachment
- [ ] Delete all subscriptions for this `ws_id` from SQLite
- [ ] Query presence table for ALL channels this `user_id` is in
- [ ] For each channel: `sqlLeavePresence()`, `syncPresence()`, queue leave event with `sourcePartitionId`

#### SQLite Presence Methods (Hibernation-Safe)
- [ ] `sqlJoinPresence(channel, info)` → `INSERT OR REPLACE INTO presence (...) VALUES (...)`
- [ ] `sqlLeavePresence(channel, userId)` → `DELETE FROM presence WHERE channel = ? AND user_id = ?`
- [ ] `sqlUpdateHeartbeat(channel, userId, status?)` → `UPDATE presence SET last_seen = ?, status = COALESCE(?, status) WHERE channel = ? AND user_id = ?`

#### Presence Sync: `syncPresence(channelName)`
- [ ] Calculate stale cutoff timestamp (120 seconds ago)
- [ ] Prune stale entries: `DELETE FROM presence WHERE channel = ? AND last_seen < ?`
- [ ] Read active entries from SQLite
- [ ] Map rows to `PresenceInfo[]`
- [ ] JSON stringify `{ type: 'presence_sync', channel, users, timestamp }`
- [ ] Send via `sendToSubscribers('__presence:${channel}', '*', null, data)`

#### Broadcasters
- [ ] `broadcastChannel(channel, eventType, payload, from)` → JSON stringify `broadcast` event → send to `__broadcast:${channel}` subscribers
- [ ] `broadcastToSubscribers(event)` → JSON stringify `change` event → send to `${table}` subscribers

#### Subscription Matcher: `sendToSubscribers(targetTable, targetType, payload, jsonString)`
- [ ] SQL query `subscriptions` for matching `table_name` and `event` (or wildcard `*`)
- [ ] Get active sockets via `this.ctx.getWebSockets()` (works across hibernation)
- [ ] Build `wsMap` by deserializing attachments on each socket
- [ ] Apply client-side `filter` matching (parse `column=value` format)
- [ ] Send `jsonString` to matched WebSockets only

---

## Phase 2: `skillpassport` — Pages Integration

### 2.1 Wrangler Config Update
- [ ] Open `skillpassport/wrangler.toml`
- [ ] Add Queue producer binding:
  ```toml
  [[queues.producers]]
  binding = "REALTIME_EVENTS_QUEUE"
  queue = "realtime-events-queue"
  ```
- [ ] Add Service Binding for realtime-worker:
  ```toml
  [[services]]
  binding = "REALTIME_WORKER"
  service = "realtime-worker"
  ```

### 2.2 Pages Function: WebSocket Upgrade Endpoint
- [ ] Rewrite `skillpassport/functions/api/realtime-stream/index.ts`:
  - [ ] Export `onRequestGet` handler
  - [ ] Check `Upgrade: websocket` header → return `426` if not WebSocket upgrade
  - [ ] Extract JWT from `Sec-WebSocket-Protocol` subprotocols (`access_token, <jwt>`)
  - [ ] Verify JWT via `@rareminds-eym/auth-core` → `verifyJWT(token)`
  - [ ] Extract `userId` from `decoded.sub`
  - [ ] Call `context.env.REALTIME_WORKER.upgradeWebSocket(userId, request)` (True RPC)
  - [ ] Return response with `Sec-WebSocket-Protocol: access_token` header
- [ ] Remove or archive `skillpassport/functions/api/realtime-stream/state.ts` (SSE polling state no longer needed)

### 2.3 Queue Producer Helper
- [ ] Create `skillpassport/functions/lib/realtime.ts`:
  - [ ] Export `notifyRealtime(env, table, event, payload)` function
  - [ ] Send to `env.REALTIME_EVENTS_QUEUE.send({ event: { table, type, payload } })`
  - [ ] No `sourcePartitionId` → external event → fans out to ALL 10 partitions
  - [ ] Structured JSON error logging on failure

### 2.4 Integrate `notifyRealtime()` into Mutation Endpoints
- [ ] Audit ALL `functions/api/**` endpoints that do INSERT/UPDATE/DELETE on key tables
- [ ] Identify priority tables: `messages`, `conversations`, `notifications`, `activities`, `assessments`, `enrollments`, etc.
- [ ] Add `await notifyRealtime(context.env, 'table_name', 'INSERT'|'UPDATE'|'DELETE', payload)` to each relevant endpoint
- [ ] Use `context.waitUntil(notifyRealtime(...))` for non-blocking fire-and-forget where appropriate

---

## Phase 3: Frontend SDK Migration (SSE → WebSocket)

### 3.1 Create New WebSocket Client
- [ ] Create `src/shared/api/wsRealtimeClient.ts`:
  - [ ] `WSRealtimeClient` class:
    - [ ] `connect()` — get token from `ssoClient.getAccessToken()`, create `WebSocket` with `['access_token', token]` subprotocol
    - [ ] `subscribe(table, event, filter)` — send `{ action: 'subscribe' }` over WS
    - [ ] `sendBroadcast(channel, eventType, payload)` — send `{ action: 'send-broadcast' }`
    - [ ] `joinPresence(channel, userName, userType, conversationId?)` — send + start 30s heartbeat interval
    - [ ] `leavePresence(channel)` — send + stop heartbeat
    - [ ] `sendHeartbeat(channel, status)` — periodic keep-alive
    - [ ] `on(key, handler)` — register event handler
    - [ ] `off(key, handler)` — unregister event handler
    - [ ] `disconnect()` — clean up WS + heartbeat
    - [ ] `dispatchEvent(data)` — internal routing by event type/table
  - [ ] Auto-reconnect logic with exponential backoff (1s, 2s, 4s, 8s, max 30s)
  - [ ] Export singleton instance `wsRealtimeClient`

### 3.2 Rewrite `realtimeService.ts` to Use WebSocket
- [ ] Rewrite `src/shared/api/realtimeService.ts` (363 lines):
  - [ ] Replace all `getSSEClient()` calls with `wsRealtimeClient` WebSocket calls
  - [ ] `createBroadcastChannel()` → use WS `subscribe('__broadcast:${channel}')` + `on()`
  - [ ] `sendBroadcast()` → use WS `sendBroadcast()` instead of `apiPost('/realtime-stream')`
  - [ ] `sendTypingIndicator()` → use WS `sendBroadcast()` with typing payload
  - [ ] `subscribeToTypingIndicators()` → use WS `on()` filtering for typing events
  - [ ] `sendNotificationBroadcast()` → use WS `sendBroadcast()`
  - [ ] `subscribeToNotificationBroadcasts()` → use WS `on()` filtering for notification events
  - [ ] `joinPresenceChannel()` → use WS `joinPresence()` (heartbeat now built into WS client)
  - [ ] `updatePresenceStatus()` → use WS `sendHeartbeat()` with new status
  - [ ] `unsubscribe()` → use WS `leavePresence()` + cleanup handlers
  - [ ] `unsubscribeAll()` → disconnect WebSocket
  - [ ] **Preserve all public method signatures and return types** (no breaking changes to 30+ consumers)

### 3.3 Update Barrel Export
- [ ] Update `src/shared/api/index.ts`:
  - [ ] Keep `export * from './realtimeService'` (same public API surface)
  - [ ] Add `export { wsRealtimeClient } from './wsRealtimeClient'` (for direct access if needed)

### 3.4 Archive Legacy SSE Client
- [ ] Rename `src/shared/api/sseRealtimeClient.ts` → `sseRealtimeClient.ts.legacy`
- [ ] Review `src/shared/api/realtimeClient.ts` — remove if it was the old client wrapper

### 3.5 Verify All Consumer Files Compile (No Breaking Changes)

> Since `realtimeService.ts` preserves its public API, consumers should need zero changes. But each file must be verified to compile cleanly.

#### Hooks (shared):
- [ ] `src/shared/lib/hooks/useRealtimePresence.ts`
- [ ] `src/shared/lib/hooks/useRealtimeProgress.ts`
- [ ] `src/shared/lib/hooks/useTypingIndicator.ts`
- [ ] `src/shared/lib/hooks/index.ts` (barrel export)

#### Feature consumers — Messaging:
- [ ] `src/features/messaging/model/useTypingIndicator.ts`
- [ ] `src/features/messaging/model/useMessageNotifications.tsx`

#### Feature consumers — Broadcast:
- [ ] `src/features/broadcast/model/useNotificationBroadcast.tsx`
- [ ] `src/features/broadcast/model/useBroadcast.ts`

#### Feature consumers — Notifications:
- [ ] `src/features/notifications/model/useNotifications.ts`
- [ ] `src/features/notifications/model/useMessageNotifications.tsx`
- [ ] `src/features/notifications/model/useAdminNotifications.ts`
- [ ] `src/features/notifications/api/learnerNotificationService.ts`

#### Feature consumers — Admin:
- [ ] `src/features/school-admin/api/schoolAdminNotificationService.ts`
- [ ] `src/features/college-admin/api/collegeAdminNotificationService.ts`
- [ ] `src/features/college-admin/ui/CollegeCurriculumBuilderUI.tsx`

#### Feature consumers — Analytics:
- [ ] `src/features/analytics/model/useRealtimeActivities.ts`
- [ ] `src/features/analytics/model/useAnalyticsKPIs.ts`
- [ ] `src/features/analytics/model/useSpeedAnalytics.ts`
- [ ] `src/features/analytics/model/index.ts`

#### Feature consumers — Educator/Placement/Courses:
- [ ] `src/features/educator/model/useTopHiringColleges.ts`
- [ ] `src/features/educator/model/useGeographicDistribution.ts`
- [ ] `src/features/educator/model/useDiversityData.ts`
- [ ] `src/features/placement/api/learnerPipelineService.ts`
- [ ] `src/features/courses/model/useCoursePerformance.ts`
- [ ] `src/features/learner-profile/model/useLearnerMessages.ts`

#### Entity consumers:
- [ ] `src/entities/user/model/useRecruitmentFunnel.ts`
- [ ] `src/entities/course/model/useCoursePerformance.ts`
- [ ] `src/entities/learner/model/useLearnerRealtimeActivities.ts`
- [ ] `src/entities/learner/model/useLearnerMessages.ts`
- [ ] `src/entities/learner/model/useLearnerMessageNotifications.tsx`

#### Page consumers:
- [ ] `src/pages/recruiter/Overview.tsx`
- [ ] `src/pages/recruiter/Messages.tsx`
- [ ] `src/pages/recruiter/Activities.tsx`
- [ ] `src/pages/educator/Messages.tsx`
- [ ] `src/pages/educator/Communication.tsx`
- [ ] `src/pages/educator/AdminCommunication.tsx`
- [ ] `src/pages/admin/collegeAdmin/LearnerCollegeAdminCommunication.tsx`
- [ ] `src/pages/admin/collegeAdmin/CurriculumBuilder.tsx`
- [ ] `src/pages/admin/schoolAdmin/LearnerCommunication.tsx`
- [ ] `src/pages/admin/schoolAdmin/EducatorCommunication.tsx`
- [ ] `src/pages/admin/universityAdmin/SyllabusApproval.tsx`

---

## Phase 4: Verification & Testing

### 4.1 Type Generation & Compilation
- [ ] `cd realtime-worker && npx wrangler types` — generate `Env` types
- [ ] `cd realtime-worker && npx tsc --noEmit` — zero TypeScript errors
- [ ] `cd skillpassport && npx tsc --noEmit` — zero TypeScript errors (frontend + functions)

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
- [ ] `cd skillpassport && npm run build` — zero build errors
- [ ] Verify no active imports of `sseRealtimeClient` remain (only in `.legacy` file)
- [ ] Verify `wrangler.toml` has `REALTIME_WORKER` service binding
- [ ] Verify `wrangler.toml` has `REALTIME_EVENTS_QUEUE` producer binding

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
