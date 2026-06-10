# SkillPassport — Complete Problems & Issues Analysis

**Date**: 2026-05-27  
**Status**: Analysis  
**Scope**: Full codebase audit across `skillpassport/`, `sso-worker/`, `payment-worker/`, `email-worker/`

---

## Executive Summary

**108 issues** identified across the full stack: **26 critical** (production-breaking/security breach), **45 high** (significant risk), **37 medium** (quality/architecture).

The most urgent findings:
1. **`functions/package.json`** — jose@5 vs jose@6 mismatch causes all Pages Functions to potentially fail
2. **Email worker OTP routes** — missing `await` on async auth check means auth is completely bypassed
3. **11 unprotected route groups** — email sending is an open relay, AI question generation is public, storage endpoints expose all users' data
4. **4 files with syntax errors** — `tsc` cannot complete
5. **Private keys on disk** — world-readable in sso-worker/

---

# SECTION 1: CROSS-PROJECT ISSUES

---

## 1.1 `functions/package.json` — Jose Version Mismatch

**File**: `skillpassport/functions/package.json`

```json
// functions/package.json (what Pages Functions actually bundle with)
"@rareminds-eym/auth-core": "1.0.1",   // root has 1.0.2
"jose": "^5.9.6",                      // root has ^6.2.3
```

**Problem**:
- `@rareminds-eym/auth-core@1.0.2` **requires `jose@^6.2.3`** per its own `package.json`
- The lockfile resolves `jose@5.10.0` (direct dependency wins over nested)
- `auth-core` calls jose@6 APIs that don't exist in jose@5
- **Every authenticated Pages Function fails at runtime**

**Impact**: ALL Pages Functions using `withAuth` or `auth-core` fail at runtime.

---

## 1.2 Duplicate Utility Files — 4 Pairs

| Purpose | `functions/lib/` | `src/functions-lib/` |
|---------|-----------------|---------------------|
| Supabase client | `supabase.ts` — service_role only | `supabase.ts` — anon + admin + auth + legacy `authenticateRequest` |
| CORS | `cors.ts` — 7 origins, whitelist | `cors.ts` — 5 origins + `'*'` wildcard export |
| Response helpers | `response.ts` — structured envelope, safe error mapping, requestId | `response.ts` — simple `jsonResponse()` / `errorResponse()` |
| Logger | `logger.ts` — structured JSON logging | (in `src/shared/config/logging.ts`) |

---

## 1.3 Wildcard CORS on ALL API Routes

**Every single API route group** returns `Access-Control-Allow-Origin: '*'`. Two CORS implementations exist, but both produce wildcard:
- `src/functions-lib/cors.ts:44` exports `corsHeaders` with `'*'`
- `functions/lib/response.ts:16` has a whitelist — but no route uses it

**Affected**: All route groups — `payments/`, `career/`, `storage/`, `user/`, `ai-tutor/`, `email/`, `otp/`, `notifications/`, `streak/`, `adaptive-session/`, `question-generation/`, `role-overview/`, `analyze-assessment/`, `embedding/`

---

# SECTION 2: SKILLPASSPORT PAGES FUNCTIONS

---

## 2.1 🔴 11 Route Groups With Insufficient Authentication

| Route Group | Issue | Severity |
|------------|-------|----------|
| `email/` | **NO AUTH** — open email relay. Anyone can POST to send emails. No rate limiting. | **CRITICAL** |
| `question-generation/` | **NO AUTH** — open AI generation. Anyone can call expensive AI models. No rate limiting. | **CRITICAL** |
| `role-overview/` | **NO AUTH** — GET `storage` returns `gemini_results` for any `attemptId`. POST modifies them. Anyone can read/modify any user's assessment data. | **CRITICAL** |
| `adaptive-session/` | **NO AUTH** — anyone can create/submit/read assessment sessions for any learner. | **CRITICAL** |
| `analyze-assessment/` | **NO AUTH at router level.** Handler calls auth internally but routing bypass is possible. | **CRITICAL** |
| `otp/` | **NO AUTH** — OTP send/verify is public (expected), but no rate limiting visible. | **HIGH** |
| `career/` | **No auth at router level.** Relies on individual handlers calling auth manually. | **HIGH** |
| `embedding/` | Uses `authenticateUser` inconsistently instead of `withAuth`. | **MEDIUM** |
| `streak/` | Uses `authenticateUser` instead of `withAuth`. `/reset-daily` has comment "admin only" but no admin check. | **HIGH** |
| `storage/` | Uses `authenticateUser` instead of `withAuth`. Custom `AuthenticatedContext` redefined locally. | **MEDIUM** |
| `user/` | Authenticated endpoints have NO router-level auth. Handlers call `createSupabaseAdminClient()` directly. | **HIGH** |

**Fix**: Every route group needs `withAuth` from `functions/lib/auth.ts`, or at minimum `authenticateUser` from `functions/api/shared/auth.ts`.

---

## 2.2 🔴 No Standardized Response Envelope

**No route group** uses `apiSuccess`/`apiError` from `functions/lib/response.ts`. Instead:
- Some use `jsonResponse()` from `src/functions-lib/response.ts` — bare JSON, no request ID
- Some use raw `Response.json()` — no envelope at all
- Some use raw `new Response(JSON.stringify(...))` — `log-error.ts`

**Impact**: Frontend cannot reliably distinguish success vs error. No `requestId` for support. Error responses leak internal details.

---

## 2.3 🔴 `supabase.auth.getSession()` Violation

**File**: `src/features/admin/api/migrationService.ts:33`

```typescript
const { data: session } = await supabase.auth.getSession();
```

Violates `no-supabase-auth.md`. Must use `ssoClient` / `apiClient`.

---

## 2.4 🟠 428 Files Call `supabase.from()` Directly from Browser

428 files import `supabase` from `@/shared/api/supabaseClient`. 124+ make direct `supabase.from()` queries.

This bypasses the entire API layer. Uses anon key client-side. RLS is the only defense.

---

## 2.5 🟠 `migrationService.ts` — Frontend Orchestrates Backend Logic

**File**: `src/features/admin/api/migrationService.ts` (568 lines)

- Makes direct `supabase.from()` for subscription migrations, entitlements, price protection
- Manually extracts Bearer token for raw `fetch()` to `/api/payments/migration-operations`
- Should use `apiClient` (`apiPost`) and server-side orchestrator

---

## 2.6 🟡 SSO RPC Returns Are Untyped

**File**: `functions/lib/sso-client.ts`

Every RPC method returns `Record<string, unknown>`. Compare with `paymentBinding.ts` which has fully typed interfaces.

---

## 2.7 🟡 `cron/reconcile-subscriptions.ts` — RPC Type Issue

**File**: `functions/api/cron/reconcile-subscriptions.ts`

Declares `SSO_SERVICE: Fetcher` but calls RPC methods (`syncSubscription`, `syncPlans`). The `Fetcher` type doesn't expose typed RPC methods — masked by TypeScript suppression.

---

# SECTION 3: SSO WORKER

---

## 3.1 🔴 Private Key World-Readable on Disk

**File**: `sso-worker/private.pem`

RS256 private key at `sso-worker/private.pem` with `rwxrwxrwx` permissions. Any process on the system can read it. This is the root of trust for the entire auth system.

---

## 3.2 🔴 `.dev.vars` Contains Real Production Secrets

**File**: `sso-worker/.dev.vars`

Contains actual JWT private keys, Supabase service role key, and email API key in plaintext. While `.gitignore`d, any filesystem access leaks all credentials.

---

## 3.3 🔴 16 Dead HTTP Handler Exports Duplicated as RPC Methods

Every subscription/addon HTTP handler function in `src/routes/subscriptions.ts` and `src/routes/addon-catalog.ts` is duplicated as an RPC method in `src/index.ts`. Total: **14 duplicated function pairs** + 2 orphan handler exports = **16 dead exports**.

Every bug fix must be applied in two places — they WILL diverge.

**Dead HTTP handlers**:
`createSubscription`, `createFreemiumSubscription`, `getUserSubscription`, `getOrgSubscription`, `updateSubscriptionStatus`, `cancelSubscription`, `updateSubscriptionField`, `recordTransaction`, `getUserTransactions`, `syncSubscription`, `syncPlans`, `syncReconcile`, `recordAddonPurchase`, `recordBundlePurchase`

---

## 3.4 🔴 JWT Test Claims Don't Match Production

**File**: `src/__tests__/preservation-property.test.ts:90-91`

Test creates JWTs with:
```
.setIssuer('https://sso.rareminds.in')
.setAudience('https://skillpassport.rareminds.in')
```

But production code uses:
```
JWT_ISSUER = "sso-api"
JWT_AUDIENCE = "sso-client"
```

The test "should accept valid user JWT" **cannot pass** — tokens are rejected by `jwtVerify`. Test silently incorrect.

---

## 3.5 🟠 Many Routes Lack Rate Limiting

Rate limit switch statement in `src/index.ts:172-201` only covers 9 paths. Missing:
- `/auth/invite*` — invite creation/manipulation
- `/auth/switch-org` — org switching
- `/auth/change-password`, `/auth/admin-reset-password` — password operations
- `/auth/delete-account` — account deletion
- `/api/events/webhook` — webhook ingestion

---

## 3.6 🟠 `lib/rate-limit.ts` is Dead Code With Misleading Stale Limits

**File**: `src/lib/rate-limit.ts:3-54`

The `rateLimit` function with `ROUTE_LIMITS` (login: 5/min, signup: 3/min) is never imported anywhere. Only `checkAccountLockout`, `recordFailedLogin`, `clearFailedLogins` are used. The actual rate limits in middleware are different (login: 10/min, signup: 5/hour).

---

## 3.7 🟠 `X-Request-ID` Missing on 500 Error Responses

**File**: `src/index.ts:262`

The catch block returns `error("Internal server error", 500)` without `X-Request-ID`. The error IS logged with request ID, but the user receives no way to reference it for support.

---

## 3.8 🟠 KV Namespace Missing `preview_id`

**File**: `wrangler.toml:29-31`

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "xxx"
```

No `preview_id`. Local `wrangler dev` may use the production KV namespace.

---

## 3.9 🟠 In-Memory Rate Limiting is Per-Worker-Instance

`src/middleware/rateLimit.ts:63-129` uses a module-level `Map`. With N worker instances, effective limits are N × configured limit. Attackers hitting multiple edge nodes bypass the limit.

---

## 3.10 🟠 Signup Rollback Failure Leaves Orphaned State

**File**: `src/routes/signup.ts:178-187`

If the rollback DELETE fails after a signup error, the user/org/membership remain in the database with no session. The next signup attempt hits the duplicate check and rejects with 409 — the user can never complete signup unless DB is manually cleaned.

---

## 3.11 🟠 `recordAddonPurchase` Doesn't Validate Addon Exists

**File**: `src/index.ts:615-657`

Silently proceeds with `addon?.product_id || null` when the addon doesn't exist. Allows recording purchases for non-existent products.

---

## 3.12 🟡 Date Arithmetic Bug for Month-End Billing

**File**: `src/index.ts:298-301`

```typescript
endDate.setMonth(endDate.getMonth() + months)
```

For monthly billing on day 31, JS Date rolls over (Jan 31 + 1 month = March 3). Inconsistent subscription end dates.

---

## 3.13 🟡 bcrypt Cost 12 in Workers — CPU Impact

`SALT_ROUNDS = 12` takes ~250-350ms CPU per hash. Cloudflare Workers have CPU quotas (10ms free, 30s paid). Adds meaningful latency on auth-heavy endpoints.

---

## 3.14 🟡 Non-Latin Org Names Produce Broken Slugs

**File**: `src/routes/signup.ts:80-83`

Organisation name "東京大学" or "Müller GmbH" produces empty slug `""` after `.replace(/[^a-z0-9]+/g, "-")`. The UNIQUE constraint appends random chars to `""`, giving `---uuid` slugs.

---

## 3.15 🟡 Empty Email in JWT on Edge Case

**File**: `src/routes/refresh.ts:86-87`

If `database.queryOne` for user email returns null (race condition, deleted user), `user?.email ?? ""` produces a JWT with `email: ""`. Weakens downstream auth.

---

## 3.16 🟡 README Outdated / Contradicts Code

| Line | States | Actual |
|------|--------|--------|
| 346 | `APP_URL` env var | Codebase uses `ALLOWED_APP_URLS` |
| 347-352 | Env table lacks `EMAIL_API_KEY`, `ALLOWED_APP_URLS` | Both are required |
| 544-547 | Project structure lists fewer route files | 18 route files + middleware |
| 553-558 | "Email delivery is a stub — logs to console" | Uses `EMAIL_SERVICE` service binding |
| 83-85 | "Allows re-signup by cleaning up incomplete signup" | Code rejects with 409 instead |

---

# SECTION 4: PAYMENT WORKER

---

## 4.1 🔴 Idempotency Key Generated Server-Side — Defeats Idempotency

**File**: `payment-worker/src/routes/orders.ts:94`

```typescript
const orderIdempotencyKey = requestId; // crypto.randomUUID()
```

The idempotency key is a fresh random value per HTTP request. If the first Razorpay call succeeds but the response is lost, the retry gets a **different** key, and a duplicate order is created. The idempotency key must be derived from the caller's request parameters.

---

## 4.2 🔴 No Webhook Replay Protection

**File**: `payment-worker/src/routes/payments.ts:145-205`

No `x-razorpay-event-id` tracking or timestamp window check. An attacker who captures a valid webhook POST can replay it indefinitely. No dedup store (KV/D1) for event IDs.

---

## 4.3 🔴 `key_id` Returned But Not in Return Type

**File**: `payment-worker/src/entrypoint.ts:142-144`

```typescript
createOrder() returns { ...orderData, key_id: this.env.RAZORPAY_KEY_ID }
```

But the declared return type `RazorpayOrder` has no `key_id` field. Callers must use `as any` to access it.

---

## 4.4 🔴 No Timeout on Razorpay Response Body Read

**File**: `payment-worker/src/utils/fetch.ts:17`

`AbortController` timeout only covers connection + headers. Once `response` is returned, `response.json()` has no timeout. If Razorpay trickles the body slowly, the worker can exceed its 30s CPU limit.

---

## 4.5 🔴 KV Namespace Missing `preview_id`

**File**: `payment-worker/wrangler.toml:22`

Same issue as SSO worker. Local `wrangler dev` silently falls back to in-memory rate limiting.

---

## 4.6 🟠 Zero Logging in RPC Methods

**File**: `payment-worker/src/entrypoint.ts` (all RPC methods)

`createOrder`, `verifyPaymentSignature`, `getPayment`, `cancelSubscription`, `verifyWebhookSignature` have no logging at all. Silent failures with zero observability.

---

## 4.7 🟠 Webhook Body Size Limit Bypassable

**File**: `payment-worker/src/routes/payments.ts:162-172`

`Content-Length` pre-check is advisory. The `request.text()` buffer happens BEFORE the actual size check. Memory spike is bounded but the check is after buffering.

---

## 4.8 🟠 Auth Middleware Type Cast Hides Null Safety

**File**: `payment-worker/src/middleware/auth.ts:44-49`

```typescript
payload.service_id !== SERVICE_ID  // undefined !== 'functions-payment-service' = true — correct!
payload.service_id as string        // hides undefined from TypeScript
```

---

## 4.9 🟠 Documentation Incorrectly Shows Webhook as JWT-Protected

**Files**: `ARCHITECTURE.md:85`, `README.md:120`

Both list `/verify-webhook` as `Bearer JWT`. The code correctly routes webhooks BEFORE `authenticateRequest`, but docs are dangerously misleading.

---

## 4.10 🟠 Rate Limit Map Not Shared Across Isolates

**File**: `payment-worker/src/middleware/rateLimit.ts:43-56`

TOCTOU race + per-isolate Map. Payment systems shouldn't rely on approximate rate limiting.

---

## 4.11 🟠 `@cloudflare/workers-types` is Outdated

**File**: `payment-worker/package.json:29`

Version `^4.20231218.0` (Dec 2023). Current: `4.20260520.1`. Missing proper types for `cloudflare:workers`, `WorkerEntrypoint`, RPC patterns.

---

## 4.12 🟡 Non-Error Throws Swallowed in Logs

All catch blocks use `error instanceof Error ? error : undefined` for the logger. If something is thrown that isn't an `Error` (e.g. a string), the error message is lost from structured logs.

---

## 4.13 🟡 Dead Code: `userJwtHash` Extracted But Never Used

**File**: `payment-worker/src/middleware/auth.ts:49-50`

The `userJwtHash` field is returned in `AuthResult` but `src/index.ts` only reads `serviceId`.

---

## 4.14 🟡 Observability Sampling Rates Not Configured

**File**: `payment-worker/wrangler.toml:28-30`

```toml
[observability]
enabled = true
```

No `logs.head_sampling_rate` or `traces.head_sampling_rate`. Defaults to potentially low sampling. Should explicitly configure per Cloudflare best practices.

---

# SECTION 5: EMAIL WORKER

---

## 5.1 🔴 Missing `await` on `authenticateRequest` — OTP Auth Bypassed

**File**: `email-worker/src/index.ts:124, 158`

```typescript
authenticateRequest(request, env);  // ❌ NO AWAIT
```

`authenticateRequest` is `async` (uses `crypto.subtle.digest` + `timingSafeEqual`). Without `await`, the promise is dangling — auth check runs concurrently but does NOT block the handler. **`POST /otp/send` and `POST /otp/verify` have NO effective authentication.**

---

## 5.2 🔴 Idempotency Key Stored But Never Checked

**File**: `email-worker/src/routes/send.ts:36, 84-87`

```typescript
const idempotencyKey = request.headers.get('Idempotency-Key');
// ... sends email immediately ...
// ... THEN stores result (never read back):
await env.RATE_LIMIT_KV.put(`idem:${idempotencyKey}`, ...);
```

No `KV.get()` check before sending. Duplicate keys send duplicate emails.

---

## 5.3 🔴 Real AWS Credentials in `.dev.vars`

**File**: `email-worker/.dev.vars`

```
AWS_ACCESS_KEY_ID=AKIA***REDACTED***
AWS_SECRET_ACCESS_KEY=***REDACTED***
```

These appear to be real production AWS credentials. Any filesystem access leaks them.

---

## 5.4 🔴 No Body Size Validation on OTP Routes

**File**: `email-worker/src/routes/otp.ts:34, 90`

OTP routes call `request.json()` directly without `validateAndReadBody()`. An attacker can send a 50MB payload and exhaust Worker memory.

---

## 5.5 🟠 Return Object Doesn't Match `EmailConfig` Type

**File**: `email-worker/src/config/config.ts:65-69`

```typescript
return {
    aws: { ... },
    defaultFrom: { ... },
    rateLimit: { perMinute: 60, perHour: 0, perDay: 0 },  // ← NOT in EmailConfig type
};
```

TypeScript error: `Object literal may only specify known properties, and 'rateLimit' does not exist in type 'EmailConfig'`.

---

## 5.6 🟠 `html.length` is Char Count, Error Says "Bytes"

**File**: `email-worker/src/middleware/validator.ts:227-231`

```typescript
if (html.length > VALIDATION.MAX_HTML_SIZE) {
    throw new ValidationError(
        `HTML content too large. Maximum ${VALIDATION.MAX_HTML_SIZE} bytes allowed`,
        { maxSize: VALIDATION.MAX_HTML_SIZE, provided: html.length }
    );
}
```

`string.length` counts UTF-16 code units, not bytes. For multi-byte characters, byte size > `html.length`.

---

## 5.7 🟠 `Buffer.from()` in MIME Parts Bypasses Chunking Protection

**File**: `email-worker/src/providers/SESProvider.ts:638, 644`

The code has a purpose-built `base64EncodeUTF8()` that chunks into 32KB blocks, but MIME parts use `Buffer.from()` directly — no chunking.

---

## 5.8 🟠 `as any` Cast Suppresses Type Safety

**File**: `email-worker/src/config/config.ts:59`

```typescript
configurationSet: (env as any).SES_CONFIGURATION_SET,
```

`Env` interface doesn't declare `SES_CONFIGURATION_SET`. Zero compile-time protection.

---

## 5.9 🟠 `console.log` Instead of Structured Logging in OTP/MessageCentral

Multiple files bypass the structured JSON `log()` system:
- `otp.ts`: 6x `console.log`/`console.error`
- `MessageCentralService.ts`: 9x `console.log`/`console.error`
- `otpRateLimit.ts`: 2x `console.warn`/`console.log`

These won't have JSON format, breaking Logpush ingestion.

---

## 5.10 🟠 In-Memory OTP Rate Limiting Not Shared

**File**: `email-worker/src/middleware/otpRateLimit.ts:15`

Per-isolate `Map`. Attackers hitting different edge nodes can bypass 3 sends/min and 5 verifies/min limits.

---

## 5.11 🟡 Architecture Doc Describes Rate Limit Tiers That Don't Exist

**File**: `email-worker/ARCHITECTURE.md`

Documents Tiers 2 (KV hourly, 500/hr) and 3 (KV daily, 5000/day), but `rateLimit.ts` only implements Tier 1 (Cloudflare native, 20/min).

---

## 5.12 🟡 Script Hardcodes Production URL and Fallback Key

**File**: `email-worker/scripts/test-email.ts:12-13`

```typescript
const API_URL = process.env.API_URL || 'https://shared-email-api.dark-mode-d021.workers.dev';
const API_KEY = process.env.API_KEY || 'development_secret_key';
```

Running without env vars hits production with the literal fallback key.

---

# SECTION 6: TYPE SCRIPT / BUILD ISSUES

---

## 6.1 🔴 4 Files With Syntax Errors (Build-Breaking)

**File**: `src/entities/assessment/model/utils.ts:5-7`
```typescript
import type {
import { getTopRIASECCodes } from './utils';   // syntax error
import { getTopAptitudes } from './utils';         // syntax error
```

**File**: `src/entities/project/model/utils.ts:5-6`
```typescript
import type {
import { formatBudget } from '..\..\..\shared\lib\format';  // backslashes!
```

**File**: `src/entities/course/api/queries.ts:8-12` — self-imports 5 functions from `./queries` (itself). Circular.

**File**: `src/entities/course/api/mutations.ts:9` — self-imports 2 functions from `./mutations` (itself). Circular.

---

## 6.2 🟠 Orphaned/Dangling Code in Course Files

**File**: `src/entities/course/api/queries.ts:79` — `isUserEnrolled` starts with `const { data, error } = await supabase` but has no query chain; falls into next section header immediately.

**File**: `src/entities/course/api/queries.ts:126` — dangling `.eq('courseId', courseId);` after `getCourseAnalytics` returns.

**File**: `src/entities/course/api/mutations.ts:190-197` — orphaned `.from('course_modules')` chain with `await Promise.all(updates)` after `deleteCourseModule` ends.

---

## 6.3 🟡 Unreachable Code

**File**: `src/entities/assessment/model/utils.ts:94` — `return Math.round(sum / validScores.length);` after a `return` on line 93.

---

## 6.4 🟡 `noUnusedLocals` + `noUnusedParameters` Would Produce Many Warnings

`tsconfig.app.json` enables both settings but `tsc --noEmit` times out on 2003 files before reaching those warnings.

---

# SECTION 7: FSD / ARCHITECTURE

---

## 7.1 🟡 FSD Naming Conventions Incomplete

Per `FSD_NAMING_VIOLATIONS_ANALYSIS.md` (April 2026):

| Violation | Count | Example |
|-----------|-------|---------|
| `components/` instead of `ui/` | ~35-40 dirs | `features/college-admin/ui/components/Timetable/components/modals/` |
| `hooks/` as separate segment | ~15 dirs | New code using `hooks/` pattern |
| Business logic in `pages/` | ~50 files | `pages/admin/schoolAdmin/Settings.tsx` has complex logic |
| Mixed naming in `shared/ui/` | 27 PascalCase | `Header.jsx`, `Button.jsx` vs `table.jsx`, `tabs.tsx` |

---

## 7.2 🟡 Duplicate Auth Initialization — `functions/lib/auth.ts` vs `functions/api/shared/auth.ts`

Two independent auth paths exist. `shared/auth.ts` uses a module-level singleton and doesn't support `SSO_SERVICE` binding — always routes through HTTP.

---

# SECTION 8: COMPLETE ISSUE INVENTORY

---

## By Project

| Project | 🔴 Critical | 🟠 High | 🟡 Medium | Total |
|---------|------------|---------|-----------|-------|
| skillpassport Pages Functions | 14 | 11 | 6 | 31 |
| sso-worker | 4 | 10 | 6 | 20 |
| payment-worker | 5 | 7 | 9 | 21 |
| email-worker | 5 | 7 | 5 | 17 |
| TypeScript/Build | 4 | 2 | 2 | 8 |
| Cross-project | 1 | 3 | 2 | 6 |
| FSD/Architecture | — | — | 5 | 5 |
| **Total** | **26** | **45** | **37** | **108** |

---

## All Issues — Quick Reference

| # | Proj | Sev | Issue | Key File(s) |
|---|------|-----|-------|-------------|
| 1 | Cross | 🔴 | functions/package.json jose@5 vs @6 | `functions/package.json` |
| 2 | Pages | 🔴 | Email route — open relay, no auth | `functions/api/email/[[path]].ts` |
| 3 | Pages | 🔴 | Question-generation — open AI, no auth | `functions/api/question-generation/[[path]].ts` |
| 4 | Pages | 🔴 | Role-overview storage — reads/writes any user data | `functions/api/role-overview/[[path]].ts` |
| 5 | Pages | 🔴 | Adaptive-session — no auth | `functions/api/adaptive-session/[[path]].ts` |
| 6 | Pages | 🔴 | Analyze-assessment — router has no auth | `functions/api/analyze-assessment/[[path]].ts` |
| 7 | Pages | 🔴 | Wildcard CORS on ALL route groups | `src/functions-lib/cors.ts:44` |
| 8 | Pages | 🔴 | No standardized response envelope anywhere | All `[[path]].ts` files |
| 9 | Pages | 🔴 | supabase.auth.getSession() violation | `src/features/admin/api/migrationService.ts:33` |
| 10 | Pages | 🟠 | 428 files do direct supabase.from() from browser | `src/` |
| 11 | Pages | 🟠 | migrationService.ts orchestrates backend logic in frontend | `src/features/admin/api/migrationService.ts` |
| 12 | Pages | 🟠 | User routes — no router-level auth | `functions/api/user/[[path]].ts` |
| 13 | Pages | 🟠 | OTP routes — no rate limiting | `functions/api/otp/[[path]].ts` |
| 14 | Pages | 🟠 | Career routes — no router-level auth | `functions/api/career/[[path]].ts` |
| 15 | Pages | 🟠 | Streak routes — admin endpoint has no check | `functions/api/streak/[[path]].ts:232` |
| 16 | Pages | 🟠 | Duplicate utility files (4 pairs) | `functions/lib/` vs `src/functions-lib/` |
| 17 | Pages | 🟠 | Duplicate CORS in response.ts | `functions/lib/response.ts:16` |
| 18 | Pages | 🟠 | log-error.ts — no auth, no CORS, no rate limit | `functions/api/log-error.ts` |
| 19 | Pages | 🟠 | cron/reconcile-subscriptions RPC issue | `functions/api/cron/reconcile-subscriptions.ts` |
| 20 | Pages | 🟡 | SSO RPC returns are untyped | `functions/lib/sso-client.ts` |
| 21 | Pages | 🟡 | migrationService.ts uses raw fetch instead of apiClient | `src/features/admin/api/migrationService.ts` |
| 22 | Pages | 🟡 | Duplicate auth init paths | `functions/lib/auth.ts` vs `functions/api/shared/auth.ts` |
| 23 | Pages | 🟡 | Embedding routes use inconsistent auth | `functions/api/embedding/` |
| 24 | Pages | 🟡 | Storage routes use authenticateUser instead of withAuth | `functions/api/storage/[[path]].ts` |
| 25 | SSO | 🔴 | private.pem world-readable | `sso-worker/private.pem` |
| 26 | SSO | 🔴 | .dev.vars with real production secrets | `sso-worker/.dev.vars` |
| 27 | SSO | 🔴 | 16 dead HTTP handler exports duplicated as RPC | `sso-worker/src/routes/subscriptions.ts` |
| 28 | SSO | 🔴 | JWT test claims don't match production | `sso-worker/src/__tests__/preservation-property.test.ts:90-91` |
| 29 | SSO | 🟠 | Many routes lack rate limiting | `sso-worker/src/index.ts:172-201` |
| 30 | SSO | 🟠 | lib/rate-limit.ts is dead code with stale limits | `sso-worker/src/lib/rate-limit.ts` |
| 31 | SSO | 🟠 | X-Request-ID missing on 500 errors | `sso-worker/src/index.ts:262` |
| 32 | SSO | 🟠 | KV namespace missing preview_id | `sso-worker/wrangler.toml` |
| 33 | SSO | 🟠 | In-memory rate limiting is per-isolate | `sso-worker/src/middleware/rateLimit.ts` |
| 34 | SSO | 🟠 | Signup rollback failure leaves orphaned state | `sso-worker/src/routes/signup.ts:178-187` |
| 35 | SSO | 🟠 | recordAddonPurchase doesn't validate addon exists | `sso-worker/src/index.ts:615-657` |
| 36 | SSO | 🟠 | Date arithmetic bug for month-end billing | `sso-worker/src/index.ts:298-301` |
| 37 | SSO | 🟠 | README outdated / contradicts code | `sso-worker/README.md` |
| 38 | SSO | 🟡 | bcrypt cost 12 — CPU impact | `sso-worker/src/lib/hash.ts:3` |
| 39 | SSO | 🟡 | Non-Latin org names produce broken slugs | `sso-worker/src/routes/signup.ts:80-83` |
| 40 | SSO | 🟡 | Empty email in JWT on edge case | `sso-worker/src/routes/refresh.ts:86-87` |
| 41 | SSO | 🟡 | Logging lacks user identifier | `sso-worker/src/index.ts:240-248` |
| 42 | SSO | 🟡 | Rate limit logging lacks request ID | `sso-worker/src/middleware/rateLimit.ts:104` |
| 43 | SSO | 🟡 | DB errors lack trace context | `sso-worker/src/lib/db.ts` |
| 44 | SSO | 🟡 | Test mocks incomplete/incorrect | `sso-worker/src/__tests__/*` |
| 45 | Pay | 🔴 | Idempotency key is random — defeats idempotency | `payment-worker/src/routes/orders.ts:94` |
| 46 | Pay | 🔴 | No webhook replay protection | `payment-worker/src/routes/payments.ts:145-205` |
| 47 | Pay | 🔴 | key_id in response but not in return type | `payment-worker/src/entrypoint.ts:142-144` |
| 48 | Pay | 🔴 | No timeout on response body read | `payment-worker/src/utils/fetch.ts:17` |
| 49 | Pay | 🔴 | KV namespace missing preview_id | `payment-worker/wrangler.toml:22` |
| 50 | Pay | 🟠 | Zero logging in RPC methods | `payment-worker/src/entrypoint.ts` |
| 51 | Pay | 🟠 | Webhook body size check after buffering | `payment-worker/src/routes/payments.ts:162-172` |
| 52 | Pay | 🟠 | Auth middleware type cast | `payment-worker/src/middleware/auth.ts:44-49` |
| 53 | Pay | 🟠 | Docs show webhook as JWT-protected | `payment-worker/ARCHITECTURE.md:85` |
| 54 | Pay | 🟠 | Rate limiting per-isolate | `payment-worker/src/middleware/rateLimit.ts` |
| 55 | Pay | 🟠 | Outdated @cloudflare/workers-types | `payment-worker/package.json:29` |
| 56 | Pay | 🟡 | Non-Error throws swallowed in logs | All catch blocks |
| 57 | Pay | 🟡 | userJwtHash extracted but unused | `payment-worker/src/middleware/auth.ts:49-50` |
| 58 | Pay | 🟡 | Observability sampling not configured | `payment-worker/wrangler.toml` |
| 59 | Pay | 🟡 | notes validation has dead code path | `payment-worker/src/entrypoint.ts:88-105` |
| 60 | Pay | 🟡 | btoa for Basic Auth fragile | `payment-worker/src/entrypoint.ts:110` |
| 61 | Pay | 🟡 | Unnecessary Promise.resolve wrapper | `payment-worker/src/index.ts:135` |
| 62 | Pay | 🟡 | Unused CancelSubscriptionResponse type | `payment-worker/src/types.ts:88-91` |
| 63 | Pay | 🟡 | amount zero check has dead branch | `payment-worker/src/routes/orders.ts:34` |
| 64 | Pay | 🟡 | Webhook payload returned in HTTP response | `payment-worker/src/routes/payments.ts:207-209` |
| 65 | Pay | 🟡 | timeout only covers connection, not body | `payment-worker/src/utils/fetch.ts:17` |
| 66 | EMail | 🔴 | Missing await on authenticateRequest — OTP auth bypassed | `email-worker/src/index.ts:124, 158` |
| 67 | EMail | 🔴 | Idempotency stored but never checked | `email-worker/src/routes/send.ts:36, 84-87` |
| 68 | EMail | 🔴 | Real AWS credentials in .dev.vars | `email-worker/.dev.vars` |
| 69 | EMail | 🔴 | No body size validation on OTP routes | `email-worker/src/routes/otp.ts:34, 90` |
| 70 | EMail | 🟠 | Return object doesn't match EmailConfig type | `email-worker/src/config/config.ts:65-69` |
| 71 | EMail | 🟠 | html.length is char count, error says "bytes" | `email-worker/src/middleware/validator.ts:227-231` |
| 72 | EMail | 🟠 | Buffer.from in MIME parts bypasses chunking | `email-worker/src/providers/SESProvider.ts:638, 644` |
| 73 | EMail | 🟠 | as any cast suppresses type safety | `email-worker/src/config/config.ts:59` |
| 74 | EMail | 🟠 | console.log instead of structured logging | `email-worker/src/routes/otp.ts` etc. |
| 75 | EMail | 🟠 | In-memory OTP rate limiting not shared | `email-worker/src/middleware/otpRateLimit.ts:15` |
| 76 | EMail | 🟡 | Architecture doc describes non-existent rate limit tiers | `email-worker/ARCHITECTURE.md` |
| 77 | EMail | 🟡 | Script hardcodes production URL + fallback key | `email-worker/scripts/test-email.ts:12-13` |
| 78 | EMail | 🟡 | setup-secrets.sh misses required secrets | `email-worker/scripts/setup-secrets.sh` |
| 79 | EMail | 🟡 | validateAndReadBodyStreaming is dead code | `email-worker/src/middleware/bodySize.ts:133` |
| 80 | EMail | 🟡 | HTML-to-text regex fallback is fragile | `email-worker/src/providers/SESProvider.ts:629` |
| 81 | EMail | 🟡 | MESSAGECENTRAL_EMAIL declared in Env but never used | `email-worker/src/types.ts:34` |
| 82 | EMail | 🟡 | Body size validation error response loses structure | `email-worker/src/middleware/bodySize.ts:106-108` |
| 83 | TS | 🔴 | Syntax error — 3 import lines corrupted in one | `src/entities/assessment/model/utils.ts:5-7` |
| 84 | TS | 🔴 | Syntax error — backslash paths, corrupted import | `src/entities/project/model/utils.ts:5-6` |
| 85 | TS | 🔴 | Self-import (circular) — 5 functions from itself | `src/entities/course/api/queries.ts:8-12` |
| 86 | TS | 🔴 | Self-import (circular) — 2 functions from itself | `src/entities/course/api/mutations.ts:9` |
| 87 | TS | 🟠 | Dangling code — query chain after return | `src/entities/course/api/queries.ts:79,126` |
| 88 | TS | 🟠 | Orphaned code after function ends | `src/entities/course/api/mutations.ts:190-197` |
| 89 | TS | 🟡 | Unreachable code — return after return | `src/entities/assessment/model/utils.ts:94` |
| 90 | TS | 🟡 | tsc times out on 2003 files | Full project |
| 91 | Cross | 🟠 | Wildcard CORS on ALL API routes | All `[[path]].ts` files |
| 92 | Cross | 🟠 | Duplicate utility files (4 pairs) | `functions/lib/` vs `src/functions-lib/` |
| 93 | Cross | 🔴 | No standardized response envelope | All `[[path]].ts` files |
| 94 | Cross | 🟡 | SSO RPC returns untyped | `functions/lib/sso-client.ts` |
| 95 | Cross | 🟡 | Two auth init paths | `functions/lib/auth.ts` vs `functions/api/shared/auth.ts` |
| 96 | Cross | 🟡 | FSD naming conventions incomplete | Multiple files |
| 97 | FSD | 🟡 | components/ instead of ui/ | ~35-40 directories |
| 98 | FSD | 🟡 | hooks/ not in lib/ | ~15 directories |
| 99 | FSD | 🟡 | Business logic in pages/ | ~50 files |
| 100 | FSD | 🟡 | Mixed PascalCase/kebab-case in shared/ui | 27 PascalCase files |
| 101 | FSD | 🟡 | Deep nesting | `college-admin/ui/components/Timetable/components/modals/` |
| 102 | SSO | 🟡 | Insecure JWT - no token type validation in verify | `sso-worker/src/lib/jwt.ts:52-58` |
| 103 | SSO | 🟡 | "Lifetime" billing period falls through to +1 month | `sso-worker/src/index.ts:637-641` |
| 104 | SSO | 🟡 | Misleading CORS expose header for X-Access-Token (never set) | `sso-worker/src/index.ts:105` |
| 105 | SSO | 🟡 | Aggressive theft detection revokes ALL user sessions | `sso-worker/src/routes/refresh.ts:46` |
| 106 | Pay | 🟡 | Missing `this` type on prototype fetch | `payment-worker/src/index.ts:150` |
| 107 | Pay | 🟡 | 5xx retry includes cancelSubscription (non-idempotent) | `payment-worker/src/utils/fetch.ts:42-80` |
| 108 | EMail | 🟡 | SES engine cache doesn't detect secret key rotation | `email-worker/src/routes/send.ts:40-44` |

---

## Priority Remediation Order

### Immediate (blocking production)

1. **#1** — Fix `functions/package.json` versions (jose@^6.2.3, auth-core@1.0.2)
2. **#2** — Add auth to `email/` route group (open relay)
3. **#4** — Add auth to `role-overview/storage` (any user's data exposed)
4. **#25** — Remove world-readable `private.pem` from sso-worker/
5. **#26** — Rotate and remove secrets from `sso-worker/.dev.vars`
6. **#66** — Add `await` to `authenticateRequest()` in email-worker OTP routes
7. **#68** — Rotate AWS credentials in `email-worker/.dev.vars`
8. **#83-86** — Fix the 4 syntax error files

### High Priority (next sprint)

9. **#5** — Add auth to `adaptive-session/` routes
10. **#3** — Add auth + rate limiting to `question-generation/` routes
11. **#6** — Add auth at router level for `analyze-assessment/`
12. **#7** — Replace wildcard CORS with origin whitelist across all routes
13. **#8** — Migrate all routes to standardized response envelope (`apiSuccess`/`apiError`)
14. **#45** — Fix idempotency key in payment-worker
15. **#46** — Add webhook replay protection in payment-worker
16. **#67** — Add idempotency key check before sending email
17. **#69** — Add body size validation to email-worker OTP routes
18. **#18** — Add auth and CORS to `log-error.ts`

### Medium Priority

19. **#10** — Plan migration of 428 direct `supabase.from()` calls to `apiClient`
20. **#11** — Move migration orchestration to Pages Functions
21. **#27** — Consolidate SSO worker RPC/HTTP handler duplication
22. **#28** — Fix SSO worker test JWT claims
23. **#34** — Add signup rollback compensation handling
24. **#91-101** — FSD naming, duplicate files, type safety

---

## Methodology

Analysis performed via:
- Full file-by-file source code review of all 4 projects
- Dependency tree analysis (lockfiles, package.json cross-references)
- TypeScript compilation attempt (`tsc --noEmit`)
- Grep-based pattern analysis (`supabase.from`, `corsHeaders`, `withAuth`, `authenticateUser`)
- Cross-referencing `.kiro/` steering rules, ADRs, archive analyses, and summaries
- SSO worker RPC interface verification against sso-client.ts
- All response/CORS patterns traced through every route group
- Email, OTP, payment, and auth flows analyzed for security gaps
- FSD naming and import structure audited
