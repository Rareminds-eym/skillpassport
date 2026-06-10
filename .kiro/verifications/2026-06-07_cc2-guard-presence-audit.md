# CC-2 Guard-Presence Audit — Task 25.2

**Spec:** rbac-architecture-violations-fix
**Task:** 25.2 — Confirm no exported Function handler lacks a guard (CC-2 invariant)
**Requirements:** 1.1, 2.1, 7.1, 7.3
**Date:** 2026-06-07
**Scope:** LOCAL only (no remote/Supabase/network access)

---

## CC-2 invariant (restated)

Cloudflare Pages Functions access the database with the `service_role` client, which
**bypasses Postgres RLS**. The Function guard is therefore the **only** server-side
authorization gate — a handler shipped without a guard equals open access (no DB
backstop). CC-2 requires that **every exported handler** under `functions/` is one of:

- **(a) GUARDED** — wrapped by `withAuth` / `withAuthAllowUnverified` (role/feature
  guards `requireAdmin` / `requireRole` / `requireProduct` / `requireFeatureAccess`
  compose inside the wrapper), or
- **(b) INTENTIONALLY PUBLIC** — a pre-auth / onboarding / system / webhook / cron /
  proxy endpoint, explicitly marked `// @public-endpoint: <justification>` and listed
  in the documented public allowlist, or
- **(c) DELEGATING ROUTER / PARENT-GUARDED SUB-HANDLER** — a `[[path]]` dispatcher whose
  data routes delegate to a `withAuth`-guarded module, or a sub-handler dispatched by a
  `withAuth`-guarded parent router (allowlisted **and** structurally re-verified).

A handler matching none of these is a **CC-2 violation (gap)**.

---

## Method

1. Enumerated every exported Pages handler (`onRequest`, `onRequestGet/Post/Put/Patch/Delete/Options/Head`)
   under `functions/**` via source scan (direct `export const/function` + `export { … } from` re-exports).
2. Ran the regression invariant test `src/__tests__/rbac/guardPresence.property.test.ts`
   (file-level classification: guarded / public / router-parent / VIOLATION).
3. Ran an **independent** per-export cross-check to catch the heuristic's blind spot
   (a file that contains `withAuth` somewhere but leaves an individual exported handler
   unwrapped). Reconciled every non-`withAuth`, non-dispatcher, non-OPTIONS export against
   the public and router/parent allowlists.
4. Manually reviewed the edge handlers not directly `= withAuth(...)` (routers, `log-error`,
   `_middleware`) and the global middleware to confirm no authenticated data path is open.

---

## Inventory (authoritative)

| Category | Count |
|---|---|
| **Total exported handler files** | **171** |
| Guarded (`withAuth` / `withAuthAllowUnverified`) | 136 |
| Intentionally public (annotated + allowlisted) | 11 |
| Delegating router / parent-guarded sub-handler (verified) | 24 |
| **CC-2 gaps (unguarded authenticated endpoints)** | **0** |

Independent cross-check: **0** handler files unaccounted-for (not public, not router/parent,
and no `withAuth` in file). Matches the test exactly.

Excluded (correctly) from the handler set:
- `functions/_middleware.ts` — global **CORS** middleware; chains via `context.next()` to the
  real (guarded) handler, performs no data access. Infrastructure, not a route endpoint.
- `functions/lib/auth.ts` — the `onRequest` occurrences are JSDoc usage **examples** in
  comments, not real exports. `lib/` holds shared helpers, not routes.

---

## Intentionally-public endpoints (11) + justification

| Handler | Justification |
|---|---|
| `auth/[[path]].ts` | Proxies `/auth/*` to the SSO worker (`SSO_SERVICE`); auth is the SSO worker's responsibility. |
| `api/auth/forgot-password.ts` | Pre-auth password-reset request; user not yet authenticated. |
| `api/auth/reset-password.ts` | Pre-auth reset completion; the reset token is the gate, not a session. |
| `api/otp/[[path]].ts` | Pre-auth OTP send/verify/resend used during signup/login. |
| `api/email/verification.ts` | Sends verification email; called server-side by the SSO worker. *(FLAG: add internal shared-secret header)* |
| `api/email/password-reset.ts` | Sends password-reset email; called server-side by the SSO worker. *(FLAG: add internal shared-secret header)* |
| `api/payments/handlers/create-registration-order.ts` | Pre-registration payment flow (no user exists yet); writes `pre_registrations`. |
| `api/payments/handlers/update-registration-payment-status.ts` | Post-payment status update for `pre_registrations` (no user yet). *(FLAG: add payment signature verification)* |
| `api/cron/reconcile-subscriptions.ts` | Internal cron from the SSO worker scheduled handler; gated by `X-Cron-Secret`. *(FLAG: fail-open if `CRON_SECRET` is unset)* |
| `api/realtime-stream/index.ts` | Proxies the WebSocket upgrade to `REALTIME_WORKER`; the socket is authenticated in the realtime worker. |
| `api/fetch-certificate/[[path]].ts` | CORS-bypass fetch of public certificate pages, restricted by an SSRF domain allow-list. *(FLAG: consider requiring `withAuth`)* |

The `FLAG:` notes are pre-existing hardening observations recorded in the guard-matrix; they
are **not** CC-2 gaps (each endpoint is intentionally public). They are out of scope for 25.2
and left unchanged (behavior-preserving).

---

## Gaps found and remediation

**None.** No exported handler lacked a guard. No code changes were required.
No `@public-endpoint` markers were added or removed (the documented public set is exact and
matches source). No router/parent allowlist entry is stale (all structurally re-verified).

### Reviewed nuance (not a gap) — mixed-mode signup router

`api/user/[[path]].ts` is a `withAuth`-guarded router (classified GUARDED) that additionally
serves a small set of **pre-auth onboarding** sub-routes without a session:
`/schools`, `/colleges`, `/universities`, `/companies` (public institution reference lists for
signup dropdowns), `/check-{school,college,university,company}-code`, `/check-email`
(availability), and `/reset-password`. All **data-mutating / user-scoped** routes
(`/signup` via `withAuthAllowUnverified`, `/create-*`, `/update-*`, `/profile-extended`,
`/list`, `/stats`, `/update`, `/delete`, `/change-role`, `/role-history`, `/actions`) route
through `withAuth`. The unauthenticated sub-routes are pre-auth onboarding utilities (same
class as `otp` / `auth` public endpoints) and reference data — **not** authenticated endpoints
left open. Behavior left unchanged. Similar intentional public sub-routes verified in
`api/storage/[[path]].ts` (`/course-certificate` shareable credential, `/media-proxy`
token-authed) and health-check (`/health`) routes across routers — none expose authenticated
data without a gate.

---

## Regression protection

`src/__tests__/rbac/guardPresence.property.test.ts` (5 tests) asserts the CC-2 invariant over
the **full current inventory** (171 handler files) and is re-run by tasks 14 and 25.2:
- core invariant: no handler classifies as VIOLATION;
- public markers in source exactly equal the documented public allowlist (no silent opening);
- every router/parent allowlist entry exists **and** is structurally verified to route through
  a guard (no stale allowlist);
- property: every handler file (≥200 runs) classifies as guarded | public | router-or-parent.

No extension was required — the test already covers the complete handler set. It passes green.

### Test result

```
=== Guard-presence sweep (CC-2) ===
functions/ handler files: 171
  guarded (withAuth): 136
  public (annotated): 11
  router/parent-guarded: 24
  VIOLATIONS: 0
=== end sweep ===

✓ src/__tests__/rbac/guardPresence.property.test.ts (5 tests) — 5 passed
```

---

## Verdict

**CC-2: PASS.** Every exported Cloudflare Function handler is guarded, intentionally public
(annotated + allowlisted), or a structurally-verified delegating router / parent-guarded
sub-handler. Zero unguarded authenticated endpoints. The invariant is regression-protected by
`guardPresence.property.test.ts`.
