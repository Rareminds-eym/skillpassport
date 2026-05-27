# Remediation Task Breakdown — REVISED

**Date**: 2026-05-27 (revised after self-verification audit)  
**Status**: Updated to reflect already-done work and new bugs found  

---

## Legend
- ✅ **DONE** — Already fixed, needs commit only
- 🔴 **NEW** — Newly discovered (not in original 108)
- ❌ **BLOCKED** — Waiting on user decision
- ⏳ **PENDING** — Not yet started

---

## Phase 0 — Commit Already-Done Fixes (3 repos)

> These fixes were applied in a previous session but are UNCOMMITTED.

### skillpassport (branch: fix/missmatches)
- [ ] `T-000` — Commit `functions/package.json` + `functions/package-lock.json` (jose@6.2.3, auth-core@1.0.2)
- [ ] `T-000` — Commit `src/entities/assessment/model/utils.ts` (syntax fix)
- [ ] `T-000` — Commit `src/entities/project/model/utils.ts` (backslash fix)
- [ ] `T-000` — Commit `src/entities/course/api/queries.ts` (self-import fix)
- [ ] `T-000` — Commit `src/entities/course/api/mutations.ts` (self-import fix)
- [ ] `T-000` — Commit `.kiro/plans/2026-05-27_skillpassport-problems-analysis.md` (analysis doc)

### email-worker (branch: main)
- [ ] `T-000` — Commit `src/index.ts` (await on authenticateRequest)
- [ ] `T-000` — Commit `src/routes/otp.ts` (body size validation)
- [ ] `T-000` — Commit `src/routes/send.ts` (idempotency key check)
- [ ] `T-000` — Commit `src/types.ts` (EmailConfig rateLimit type)

### payment-worker (branch: main)
- [ ] `T-000` — Commit `src/constants.ts` (RAZORPAY_API_TIMEOUT_MS)
- [ ] `T-000` — Commit `src/entrypoint.ts`
- [ ] `T-000` — Commit `src/routes/orders.ts` (idempotency from header)
- [ ] `T-000` — Commit `src/routes/payments.ts` (webhook replay protection)
- [ ] `T-000` — Commit `src/utils/fetch.ts` (readJsonWithTimeout)

---

## Phase 0.5 — Fix 4 Escaped Template Literal Bugs 🔴 NEW ✅ DONE

- [x] `T-100` — Fix `payment-worker/src/routes/orders.ts:140`: `\${idempotencyKey}` → `${idempotencyKey}` ✅
- [x] `T-101` — Fix `email-worker/src/routes/send.ts:40`: `\${idempotencyKey}` → `${idempotencyKey}` ✅
- [x] `T-102` — Fix `payment-worker/src/routes/payments.ts:211`: `\${eventId}` → `${eventId}` ✅
- [x] `T-103` — Fix `payment-worker/src/routes/payments.ts:239`: `\${eventId}` → `${eventId}` ✅

**Verify**: `rg '\$\{'` returns 0 results with backslash-escaped `$`. ✅ VERIFIED

---

## Phase 2 — Auth Gaps (Pages Functions)

- [ ] `T-018` — Commit Phase 0 first. Then add `withAuth` to `functions/api/email/[[path]].ts`
- [ ] `T-019` — Add `withAuth` to `functions/api/role-overview/[[path]].ts`
- [ ] `T-020` — Add `withAuth` to `functions/api/adaptive-session/[[path]].ts`
- [ ] `T-021` — Add `withAuth` + KV rate limiting to `functions/api/question-generation/[[path]].ts`
- [ ] `T-022` — Add `withAuth` to `functions/api/analyze-assessment/[[path]].ts`
- [ ] `T-023` — Add `withAuth` to `functions/api/user/[[path]].ts`; replace direct Supabase admin client calls
- [ ] `T-024` — Add KV-backed rate limiting to `functions/api/otp/[[path]].ts`
- [ ] `T-025` — Add `withAuth` to `functions/api/career/[[path]].ts`
- [ ] `T-026` — Replace `authenticateUser` with `withAuth` in `functions/api/streak/[[path]].ts`; add admin check for `/reset-daily`
- [ ] `T-027` — Add auth, CORS, rate limiting to `functions/api/log-error.ts`
- [ ] `T-028` — Replace `authenticateUser` with `withAuth` in `functions/api/storage/[[path]].ts`
- [ ] `T-029` — Standardize auth in `functions/api/embedding/` handlers

---

## Phase 3 — SSO Worker Consolidation 🟡 PARTIALLY DONE (decisions implemented)

- [x] `T-030` — Removed `export` keyword from 14 dead HTTP handlers in `subscriptions.ts` (12) and `addon-catalog.ts` (2). Kept RPC methods as canonical. ✅ USER DECISION
- [x] `T-031` — Removed `rateLimit()` function and `ROUTE_LIMITS` config, kept `checkAccountLockout`/`recordFailedLogin`/`clearFailedLogins`. ✅ USER DECISION
- [ ] `T-032` — Fix JWT test claims in `sso-worker/src/__tests__/preservation-property.test.ts:90-91`
- [ ] `T-033` — Fix 7 README discrepancies in `sso-worker/README.md`

---

## Phase 4 — Response & CORS Standardization 🟡 PARTIALLY DONE

- [ ] `T-034` — Remove wildcard `'*'` from `src/functions-lib/cors.ts:44`
- [ ] `T-035` — Ensure all route groups use whitelist CORS from `functions/lib/response.ts`
- [ ] `T-036` — Add production domain to CORS whitelist if missing
- [ ] `T-037` — Migrate all `[[path]].ts`: `jsonResponse()` → `apiSuccess()`/`apiError()`
- [ ] `T-038` — Migrate all `Response.json()` in routes → `apiSuccess()`
- [ ] `T-039` — Migrate all `new Response(JSON.stringify(...))` → `apiSuccess()`/`apiError()`
- [ ] `T-040` — [PENDING] Align `src/functions-lib/cors.ts` whitelist with `functions/lib/cors.ts`
- [ ] `T-041` — [PENDING] Add `apiSuccess`/`apiError` to `src/functions-lib/response.ts`
- [x] `T-042` — Consolidated `functions/api/shared/auth.ts` into `functions/lib/auth.ts`. Created `functions/lib/validation.ts`. Deleted legacy file. Fixed `_authInitialized` module-level singleton bug. Updated README. ✅

---

## Phase 5 — Observability & Monitoring (no decisions needed)

- [ ] `T-043` — Add `preview_id` to KV namespace in `sso-worker/wrangler.toml`
- [ ] `T-044` — Add `preview_id` to KV namespace in `payment-worker/wrangler.toml`
- [ ] `T-045` — Add structured logging to all RPC methods in `payment-worker/src/entrypoint.ts`
- [ ] `T-046` — Add `X-Request-ID` to 500 error responses in `sso-worker/src/index.ts:262`
- [ ] `T-047` — Configure explicit log/trace sampling rates in `payment-worker/wrangler.toml`
- [ ] `T-048` — Replace console.log/error with structured log() in email-worker:
  - `src/routes/otp.ts` (6 occurrences)
  - `src/providers/MessageCentralService.ts` (9 occurrences)
  - `src/middleware/otpRateLimit.ts` (2 occurrences)
  - `src/index.ts:274` (catch handler)

---

## Phase 6 — SSO Worker Reliability (no decisions needed)

- [ ] `T-049` — Add KV rate limiting: `/auth/invite*` (10/min)
- [ ] `T-050` — Add KV rate limiting: `/auth/switch-org` (30/min)
- [ ] `T-051` — Add KV rate limiting: `/auth/change-password`, `/auth/admin-reset-password` (5/min each)
- [ ] `T-052` — Add KV rate limiting: `/auth/delete-account` (3/min)
- [ ] `T-053` — Add KV rate limiting: `/api/events/webhook` (60/min)
- [ ] `T-054` — Fix signup rollback: queue cleanup or log for manual review on failure
- [ ] `T-055` — Fix month-end date arithmetic: add `addMonths` utility with rollover
- [ ] `T-056` — Validate addon exists in `recordAddonPurchase`
- [ ] `T-057` — Replace in-memory Map rate limiting with KV-backed
- [ ] `T-058` — Add token `typ` validation in JWT verify
- [ ] `T-059` — Fix "Lifetime" billing period fallthrough
- [ ] `T-060` — Fix CORS expose header for `X-Access-Token` (never set)

---

## Phase 7 — Payment Worker Reliability (no decisions needed)

- [ ] `T-061` — Add `key_id: string` to `RazorpayOrder` return type
- [ ] `T-062` — Replace in-memory Map rate limiting with KV-backed
- [ ] `T-063` — Update `@cloudflare/workers-types` `^4.20231218.0` → `^4.20260520.1`
- [ ] `T-064` — Fix auth middleware: add `typeof` check instead of `as string`
- [ ] `T-065` — Fix architecture docs (webhook bypasses JWT)
- [ ] `T-066` — Fix non-Error throw handling in catch blocks
- [ ] `T-067` — Configure observability sampling in wrangler.toml

---

## Phase 8 — FSD Architecture (long-term)

- [ ] `T-068` — Plan per-feature migration of 428 direct `supabase.from()` calls
- [ ] `T-069` — Create Pages Function for subscription migration orchestration
- [ ] `T-070` — Remove frontend orchestration from `migrationService.ts`
- [ ] `T-071` — Rename `components/` → `ui/` (~35-40 directories)
- [ ] `T-072` — Move `hooks/` into `lib/` (~15 directories)
- [ ] `T-073` — Extract business logic from `pages/` (~50 files)
- [ ] `T-074` — Standardize `shared/ui` naming (27 PascalCase files)
- [ ] `T-075` — Flatten deeply nested component trees

---

## Task Summary

| Phase | Tasks | Blocked On | Est. Time |
|-------|-------|------------|-----------|
| **0** — Commit done fixes | 15 commits across 3 repos | Nothing | 10 min |
| **0.5** — Fix `\$` bugs ✅ | 4 (T-100–T-103) | None — **DONE** | 5 min |
| **2** — Auth gaps | 12 (T-018–T-029) | Phase 0 committed | 4h |
| **3** — SSO consolidation 🟡 | 2 done (T-030, T-031) / 2 pending (T-032, T-033) | T-032, T-033 | 1h |
| **4** — Response/CORS 🟡 | 1 done (T-042) / 8 pending (T-034–T-041) | Nothing | 3h |
| **5** — Observability | 6 (T-043–T-048) | Nothing | 2h |
| **6** — SSO reliability | 12 (T-049–T-060) | Nothing | 3h |
| **7** — Payment reliability | 7 (T-061–T-067) | Nothing | 2h |
| **8** — FSD Architecture | 8 (T-068–T-075) | User buy-in | 2-3 sprints |
| **Total** | **77 tasks (7 done, 70 remaining)** | None blocking | ~15h + 2-3 sprints |
