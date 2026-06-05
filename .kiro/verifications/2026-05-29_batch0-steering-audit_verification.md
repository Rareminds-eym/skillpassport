# Steering File Compliance Audit — Phase 8 Batch 0

**Date**: 2026-05-29
**Scope**: T-0.6 (opportunities) + all previously migrated Batch 0 files
**Auditor**: Deep audit triggered by workspace rule check (00-core-standards.md §0.2/0.3)

---

## Violations Found & Fixed

| # | Violation | Steering Rule | File | Fix |
|---|-----------|--------------|------|-----|
| 1 | `supabase` import removed while 17 refs remained | 00-core — code quality | `opportunitiesService.ts` | Import restored |
| 2 | `supabase` import removed while 4 refs remained | 00-core — code quality | `offerManagementService.ts` | Import restored |
| 3 | `update`/`delete` not scoped by owner — cross-user data access possible | 01-security §2.3 — authz | `functions/api/opportunities/index.ts` | Added `.eq('recruiter_id', user.id)` |
| 4 | `parseInt(limit)` etc without validation — NaN crashes query | 01-security §2.1 — input validation | `functions/api/opportunities/index.ts` | Added `isNaN()` + range guards |
| 5 | Unused import (`apiGet`) | 00-core — code quality | `savedSearchesService.ts` | Removed |
| 6 | `error.message` leaked to client in 7 places — reveals DB internals | 01-security §2.7 — error handling | `functions/api/opportunities/index.ts` | Replaced all `apiError(..., error.message, ...)` with `apiDbError()` which logs details + returns safe messages |
| 7 | Fallback logic in `increment-search-usage` (RPC fails → manual update) | 00-core §0.4 + 02-cloudflare §7.10 — requires approval | `functions/api/opportunities/index.ts` | Removed per user approval |
| 8 | Legacy `_recruiterId` param kept in `createSavedSearch` | 00-core §0.4 — legacy code | `savedSearchesService.ts` + `TalentPool.tsx` | Removed per user approval (signature + caller cleaned) |

---

## Verified Clean (No Violations)

| Check | Result |
|-------|--------|
| Cross-boundary imports `src/` ↔ `functions/` | **0 violations** |
| Backend uses `withAuth` from `@rareminds-eym/auth-core` | ✅ `withAuth` on GET + POST |
| Authz scoped by owner on update/delete | ✅ `.eq('recruiter_id', user.id)` added |
| Input validation on all parseInt params | ✅ `isNaN()` + range guards |
| Error messages don't leak internals | ✅ All 7 DB error sites use `apiDbError()` |
| No fallback/legacy code without approval | ✅ Both items removed per user decision |
| Saved searches: all 6 functions migrated | ✅ Exceeded minimum tasklist requirements |
| RPC param name matched actual signature | ✅ Fixed `p_application_id` |
| No secrets hardcoded | ✅ All config via env |

---

## Pre-Existing Items (Not Introduced by Audit)

- Structured logging absent from most endpoints (aspirational per 00-core §4.1)
- No API versioning prefix (`/api/v1/`) — consistent across codebase
- ~150 pre-existing backend tsc errors in educator/dashboard, user, payments, settings, tests
- `saveSearchesService.getSavedSearches` — fallback default searches kept (same behavior)
- `apiClient` returns full response envelope `{ success, data, error, meta }` — matches steering file §5.2 error format pattern (envelope differs but codebase-consistent)

---

## Key Rules for Future Work

1. **NEVER remove `supabase` import while `supabase` refs remain** — grep the file first
2. **ALWAYS scope update/delete by `user.id` or owned resource** — service_role bypasses RLS
3. **ALWAYS validate `parseInt` with `isNaN()` + range** — don't let NaN reach DB
4. **ALWAYS use `apiDbError()` for DB errors** — never pass `error.message` to clients via `apiError()`
5. **ALWAYS ask approval for fallback logic, legacy code, backward compat** — §0.4 + §7.10
6. **0 cross-boundary imports** — `src/` ↔ `functions/` isolation is strict
7. **0 new backend tsc errors** — if you add one, fix it before committing
