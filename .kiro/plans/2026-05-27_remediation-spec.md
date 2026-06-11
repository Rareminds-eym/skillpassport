# Remediation Specification — Fix All 108 Issues (REVISED)

**Date**: 2026-05-27 (revised)  
**Status**: Spec (ready for implementation)  
**Scope**: `skillpassport/`, `sso-worker/`, `payment-worker/`, `email-worker/`  
**Prerequisite**: Analysis at `2026-05-27_skillpassport-problems-analysis.md`  
**Architecture context**: Root `.kiro/specs/sso-auth-migration/`, `.kiro/specs/sso-internal-service-auth/`, `.kiro/specs/payment-service-binding-migration/`

---

## Important Context

### Repository Architecture
This is NOT a monorepo. The workspace contains 6 independent git repos:
| Repo | Owner | Status | Branch |
|------|-------|--------|--------|
| `skillpassport/` | Rareminds-eym | Dirty (uncommitted fixes) | `fix/missmatches` |
| `sso-worker/` | gokulrajr-r | Clean | `main` |
| `payment-worker/` | Rareminds-eym | Dirty (uncommitted fixes) | `main` |
| `email-worker/` | Rareminds-eym | Dirty (uncommitted fixes) | `main` |
| `auth-client/` | gokulrajr-r | Clean | `main` |
| `auth-core/` | gokulrajr-r | Clean | `main` |

Changes must be committed per-repo. No root-level npm workspace exists.

### NTFS Filesystem Constraint
The workspace is on an NTFS partition (`/mnt/E230EB0F30EAEA0D/`). Unix `chmod` is silently ignored — all files show `rwxrwxrwx` regardless of attempts. **File permissions CANNOT be used for security.** All secrets must be managed via Cloudflare `wrangler secret`, not relying on file permissions.

---

## Phase 0 — COMPLETED (uncommitted)

These fixes were applied in a previous session but **not committed**. They exist as uncommitted changes in 3 repos.

### Commands to commit (do these first):
```bash
# skillpassport (branch: fix/missmatches)
cd skillpassport
git add functions/package.json functions/package-lock.json
git add src/entities/assessment/model/utils.ts src/entities/project/model/utils.ts
git add src/entities/course/api/queries.ts src/entities/course/api/mutations.ts
git commit -m "fix: resolve jose version mismatch, syntax errors, and self-imports in entities"

# email-worker (branch: main)
cd ../email-worker
git add src/index.ts src/routes/otp.ts src/routes/send.ts src/types.ts
git commit -m "fix: add missing await on authenticateRequest, body validation, idempotency check, config type"

# payment-worker (branch: main)
cd ../payment-worker
git add src/constants.ts src/entrypoint.ts src/routes/orders.ts src/routes/payments.ts src/utils/fetch.ts
git commit -m "fix: idempotency key from header, webhook replay protection, response body timeout"
```

**Fixed files per project:**
- `skillpassport/functions/package.json` — jose@^5.9.6 → ^6.2.3, auth-core@1.0.1 → 1.0.2
- `skillpassport/src/entities/assessment/model/utils.ts` — corrupted import fixed
- `skillpassport/src/entities/project/model/utils.ts` — backslash import fixed
- `skillpassport/src/entities/course/api/queries.ts` — self-imports removed
- `skillpassport/src/entities/course/api/mutations.ts` — self-imports removed
- `email-worker/src/index.ts` — await added to authenticateRequest (lines 124, 158)
- `email-worker/src/routes/otp.ts` — body size validation added
- `email-worker/src/routes/send.ts` — idempotency key check added
- `email-worker/src/types.ts` — EmailConfig type includes rateLimit
- `payment-worker/src/routes/orders.ts` — idempotency key from header with KV dedup
- `payment-worker/src/routes/payments.ts` — webhook replay protection (KV dedup + timestamp window)
- `payment-worker/src/utils/fetch.ts` — readJsonWithTimeout added

**Issues**: #1, #66, #67, #68, #69, #70, #83, #84, #85, #86

---

## Phase 0.5 — CRITICAL BUG: Fix 4 Escaped Template Literals (NEW)

**The previous fix INTRODUCED 4 bugs** where `\$` escapes the `$` in template literals, breaking KV key interpolation. Keys become literal strings instead of using the variable value.

### 0.5.1 `payment-worker/src/routes/orders.ts:140`

```typescript
// BUG: \${idempotencyKey} produces literal string "order:${idempotencyKey}"
//      The corresponding GET on line 91 uses proper ${idempotencyKey}
//      Result: PUT stores under wrong key, dedup NEVER finds a match
await env.RATE_LIMIT_KV.put(`order:\${idempotencyKey}`, JSON.stringify(result), { expirationTtl: 86400 });

// FIX: Remove the backslash
await env.RATE_LIMIT_KV.put(`order:${idempotencyKey}`, JSON.stringify(result), { expirationTtl: 86400 });
```

**Impact**: Every order creation request proceeds as if new — idempotency is completely defeated. Duplicate orders are created.

### 0.5.2 `email-worker/src/routes/send.ts:40`

```typescript
// BUG: GET uses literal key "idem:${idempotencyKey}"
//      PUT on line 95 uses proper ${idempotencyKey}
//      Result: GET never finds a match, duplicates are always sent
const existing = await env.RATE_LIMIT_KV.get(`idem:\${idempotencyKey}`);

// FIX
const existing = await env.RATE_LIMIT_KV.get(`idem:${idempotencyKey}`);
```

**Impact**: Idempotency check always misses. Duplicate emails are sent.

### 0.5.3 + 0.5.4 `payment-worker/src/routes/payments.ts:211, 239`

```typescript
// BUG: BOTH get and put use the SAME literal key "webhook:${eventId}"
//      Result: First event sets key, ALL subsequent events are blocked as "duplicate"
const seen = await env.RATE_LIMIT_KV.get(`webhook:\${eventId}`);
// ...
await env.RATE_LIMIT_KV.put(`webhook:\${eventId}`, '1', { expirationTtl: 86400 * 7 });

// FIX both lines
const seen = await env.RATE_LIMIT_KV.get(`webhook:${eventId}`);
await env.RATE_LIMIT_KV.put(`webhook:${eventId}`, '1', { expirationTtl: 86400 * 7 });
```

**Impact**: Payment processing breaks after the first webhook. No subsequent events are processed.

**Repo**: `payment-worker/` and `email-worker/` (both on `main`, dirty)

**Issues**: NEW (not in original 108)

---

## Phase 1 — COMPLETED (uncommitted)

Same as Phase 0 — work already done. See commit commands in Phase 0.

---

## Phase 2 — Auth Gaps (Pages Functions Route Groups)

All route groups need `withAuth` from `functions/lib/auth.ts`. Per the `sso-auth-migration` spec (`root/.kiro/specs/`), `withAuth` from `@rareminds-eym/auth-core` is the canonical auth middleware. `functions/api/shared/auth.ts` is a duplicate — consolidate after fixing.

### 2.1 `functions/api/email/[[path]].ts` — Add Auth

**File**: `skillpassport/functions/api/email/[[path]].ts`

Open email relay. Apply `withAuth` at router level.

### 2.2 `functions/api/role-overview/[[path]].ts` — Add Auth

**File**: `skillpassport/functions/api/role-overview/[[path]].ts`

No auth anywhere. Data leak — any user can read any other user's `gemini_results`.

### 2.3 `functions/api/adaptive-session/[[path]].ts` — Add Auth

**File**: `skillpassport/functions/api/adaptive-session/[[path]].ts`

No auth anywhere.

### 2.4 `functions/api/question-generation/[[path]].ts` — Add Auth + Rate Limiting

**File**: `skillpassport/functions/api/question-generation/[[path]].ts`

No auth. Expensive AI model calls with no rate limiting.

### 2.5 `functions/api/analyze-assessment/[[path]].ts` — Add Router-Level Auth

**File**: `skillpassport/functions/api/analyze-assessment/[[path]].ts`

Router has no auth. Handler calls auth internally but routing bypass is possible.

### 2.6 `functions/api/user/[[path]].ts` — Add Router-Level Auth

**File**: `skillpassport/functions/api/user/[[path]].ts`

No router-level auth. Handlers call `createSupabaseAdminClient()` directly — violates SSO auth pattern.

### 2.7 `functions/api/otp/[[path]].ts` — Add Rate Limiting

**File**: `skillpassport/functions/api/otp/[[path]].ts`

Public by design but no rate limiting. Add per-phone/per-email KV-based rate limiting.

### 2.8 `functions/api/career/[[path]].ts` — Add Router-Level Auth

**File**: `skillpassport/functions/api/career/[[path]].ts`

No router-level auth. Some handlers call auth internally, others don't.

### 2.9 `functions/api/streak/[[path]].ts` — Fix Auth + Admin Check

**File**: `skillpassport/functions/api/streak/[[path]].ts`

Uses `authenticateUser` instead of `withAuth`. `/reset-daily` has "admin only" comment but no admin check.

### 2.10 `functions/api/log-error.ts` — Add Auth, CORS, Rate Limiting

**File**: `skillpassport/functions/api/log-error.ts`

No auth, no CORS, no rate limiting.

### 2.11 `functions/api/storage/[[path]].ts` — Standardize Auth

**File**: `skillpassport/functions/api/storage/[[path]].ts`

Uses `authenticateUser` instead of `withAuth`.

### 2.12 `functions/api/embedding/[[path]].ts` — Standardize Auth

Uses `authenticateUser` inconsistently.

**Verification**: All 12 route groups return 401 without valid JWT.

**Issues**: #2, #3, #4, #5, #6, #12, #13, #14, #15, #18

---

## Phase 3 — SSO Worker Consolidation ⚠️ WAITING ON USER DECISION

### 3.1 Consolidate 16 Dead HTTP Handler Exports (Issue #27)

**Decision needed**: Remove dead HTTP handlers, keep RPC methods? Or keep both with `@deprecated` tags?

### 3.2 Remove or Fix Dead `lib/rate-limit.ts` (Issue #30)

**Decision needed**: Remove file or update limits and wire into middleware?

### 3.3 Fix JWT Test Claims (Issue #28)

**File**: `sso-worker/src/__tests__/preservation-property.test.ts:90-91`

Use `JWT_ISSUER` / `JWT_AUDIENCE` env vars instead of hardcoded URLs.

### 3.4 Update SSO Worker README (Issue #37)

Fix 7 known discrepancies (APP_URL vs ALLOWED_APP_URLS, missing env vars, route file count, email delivery binding, signup behavior).

---

## Phase 4 — Response & CORS Standardization

### 4.1 Replace Wildcard CORS

Remove `'*'` from `src/functions-lib/cors.ts:44`. Ensure all route groups use whitelist from `functions/lib/response.ts`.

### 4.2 Migrate to Standardized Response Envelope

Replace `jsonResponse()`, `Response.json()`, `new Response(JSON.stringify(...))` with `apiSuccess()`/`apiError()` from `functions/lib/response.ts`.

### 4.3 Align Duplicate Utility Files

Align `src/functions-lib/` with `functions/lib/` (keep both since they serve different bundles). Remove wildcard CORS, add `apiSuccess`/`apiError`, align whitelist.

### 4.4 Consolidate Two Auth Init Paths

**Decision needed**: Make `functions/api/shared/auth.ts` a thin wrapper around `functions/lib/auth.ts`, or remove it?

Per the `sso-auth-migration` spec, `functions/lib/auth.ts` is the canonical file using `@rareminds-eym/auth-core`. `functions/api/shared/auth.ts` is a legacy duplicate that uses a module-level singleton without `SSO_SERVICE` binding support.

**Issues**: #7, #8, #16, #91, #92, #95

---

## Phase 5 — Observability & Monitoring

### 5.1 Add `preview_id` to KV Namespaces

**Files**: `sso-worker/wrangler.toml`, `payment-worker/wrangler.toml`

### 5.2 Add Logging to payment-worker RPC Methods

**File**: `payment-worker/src/entrypoint.ts`

### 5.3 Add `X-Request-ID` to SSO Worker 500 Errors

**File**: `sso-worker/src/index.ts:262`

### 5.4 Configure Observability Sampling Rates

**File**: `payment-worker/wrangler.toml`

### 5.5 Fix Console Logging in email-worker

Replace `console.log`/`console.error` with structured `log()` in:
- `src/routes/otp.ts` (6 occurrences)
- `src/providers/MessageCentralService.ts` (9 occurrences)
- `src/middleware/otpRateLimit.ts` (2 occurrences)
- `src/index.ts:274` (1 occurrence — catch handler)

**Issues**: #32, #49, #50, #31, #58, #74

---

## Phase 6 — SSO Worker Reliability

### 6.1 Add Rate Limiting to Missing Routes

**File**: `sso-worker/src/index.ts:172-201`

Add KV-backed rate limiting for: `/auth/invite*`, `/auth/switch-org`, `/auth/change-password`, `/auth/admin-reset-password`, `/auth/delete-account`, `/api/events/webhook`

### 6.2 Fix Signup Rollback Failure

**File**: `sso-worker/src/routes/signup.ts:178-187`

Queue cleanup or log for manual review when rollback DELETE fails.

### 6.3 Fix Date Arithmetic for Month-End Billing

**File**: `sso-worker/src/index.ts:298-301`

Replace `.setMonth()` with proper `addMonths` utility handling month-end rollover.

### 6.4 Fix `recordAddonPurchase` Validation

**File**: `sso-worker/src/index.ts:615-657`

Reject non-existent addons instead of silently proceeding with `null`.

### 6.5 KV-Backed Rate Limiting

**File**: `sso-worker/src/middleware/rateLimit.ts`

Replace per-isolate in-memory `Map` with KV-backed rate limiting.

### 6.6 Fix Insecure JWT — Token Type Validation

**File**: `sso-worker/src/lib/jwt.ts:52-58`

Validate token `typ` header to prevent cross-type confusion attacks.

### 6.7 Fix "Lifetime" Billing Period Fallthrough

**File**: `sso-worker/src/index.ts:637-641`

Handle "lifetime" billing period explicitly instead of falling through to +1 month.

### 6.8 Fix CORS Expose Header

**File**: `sso-worker/src/index.ts:105`

`X-Access-Token` expose header references a header the worker never sets.

**Issues**: #29, #34, #36, #35, #33, #102, #103, #104

---

## Phase 7 — Payment Worker Reliability

### 7.1 Fix `key_id` Return Type

**File**: `payment-worker/src/entrypoint.ts:142-144`

Add `key_id: string` to `RazorpayOrder` return type.

### 7.2 KV-Backed Rate Limiting

**File**: `payment-worker/src/middleware/rateLimit.ts`

Replace per-isolate Map with KV-backed.

### 7.3 Update `@cloudflare/workers-types`

**File**: `payment-worker/package.json:29`

`^4.20231218.0` → `^4.20260520.1`

### 7.4 Fix Auth Middleware Type Cast

**File**: `payment-worker/src/middleware/auth.ts:44-49`

Add `typeof` check instead of `as string`.

### 7.5 Fix Architecture Docs

**Files**: `payment-worker/ARCHITECTURE.md:85`, `README.md:120`

Webhook paths bypass JWT auth — update docs to match code.

### 7.6 Fix Non-Error Throw Handling

All catch blocks: log `string`/`number` throws too, not just `Error` instances.

**Issues**: #47, #54, #55, #52, #53, #56

---

## Phase 8 — FSD Architecture (long-term / strategic)

### 8.1 Plan Migration of 428 Direct `supabase.from()` Calls

Per-feature migration: create API endpoints, replace with `apiGet()`/`apiPost()`, feature-flag the migration.

### 8.2 Move `migrationService.ts` Orchestration to Backend

**File**: `src/features/admin/api/migrationService.ts` (568 lines)

Move to Pages Function endpoint. Remove direct `supabase.from()` and manual Bearer token extraction.

### 8.3 FSD Naming Conventions

- `components/` → `ui/` (~35-40 directories)
- `hooks/` → `lib/` (~15 directories)
- Extract business logic from `pages/` (~50 files)
- Standardize `shared/ui` naming
- Flatten deep nesting

**Issues**: #10, #11, #97, #98, #99, #100, #101

---

## Execution Order Summary

| Phase | Description | Est. Effort | Depends On |
|-------|-------------|-------------|------------|
| **0** | Commit already-done fixes (jose, awaits, syntax, idempotency) | 10 min | Nothing |
| **0.5** | Fix 4 `\$` escaped template literal bugs | 5 min | Nothing |
| **2** | Auth gaps — add `withAuth` to 12 route groups | 4h | Phase 1 commit |
| **5** | Observability — KV preview_id, logging, sampling | 2h | Nothing |
| **6** | SSO Worker reliability — rate limits, date math, validation | 3h | User decisions |
| **7** | Payment Worker reliability — types, rate limits, docs | 2h | Nothing |
| **3** | SSO Worker consolidation | 2h | **User decisions** |
| **4** | Response/CORS standardization | 3h | Phase 2 (auth first) |
| **8** | FSD Architecture | 2-3 sprints | User buy-in |

### Per-Repo Change Tracking

| Repo | Phases Affected | Auth Pattern |
|------|-----------------|--------------|
| `skillpassport/` | 0, 2, 4, 8 | `withAuth` from `@rareminds-eym/auth-core` |
| `sso-worker/` | 0, 3, 5, 6 | `authenticate()` in `lib/auth.ts` |
| `payment-worker/` | 0, 0.5, 5, 7 | `authenticateRequest()` in `middleware/auth.ts` |
| `email-worker/` | 0, 0.5, 5 | `authenticateRequest()` in `index.ts` |

### Files Requiring User Decision Before Editing
- **SSO worker dead HTTP handlers** (Phase 3.1): Remove, deprecate, or keep?
- **SSO worker dead rate-limit.ts** (Phase 3.2): Remove or update?
- **Duplicate auth init paths** (Phase 4.4): Consolidate or remove legacy path?
- **`src/functions-lib/` alignment** (Phase 4.3): Approve the alignment approach?

### Verification Checklist (per phase)
- [ ] `tsc --noEmit` passes (check per-project; no shared build)
- [ ] Tests pass per repo (`npm test` or equivalent)
- [ ] No new `any` casts introduced
- [ ] Logging follows structured JSON pattern
- [ ] Auth middleware applied at router level, not per-handler
- [ ] CORS uses whitelist, not wildcard
- [ ] Response format uses standardized envelope
- [ ] Secrets stored in Cloudflare `wrangler secret`, not in files (NTFS can't restrict permissions)
