# P5 — Feature/Add-on Enforcement Mapping & Prerequisite (Task 24.2)

**Spec:** rbac-architecture-violations-fix · **Requirements:** 9.2, 9.3, 9.4 (E9.2, E9.3, E9.4) · **Date:** 2026-06-07
**Status:** Mapping documented · **Wrapping deferred** (see Decision below)
**Scope:** LOCAL only. No remote/prod access. No live handler modified.

---

## Summary

Task 24.2 calls for wrapping feature-gated Function handlers with
`requireFeatureAccess(featureKey, handler)` so fine-grained feature/add-on access
is enforced **server-side at the Cloudflare Function boundary** (E9.2), with the
frontend gates demoted to UX-only (E9.3) and the canonical entitlement state kept
SSO-side and surfaced via the `*_cache` shadow tables (E9.4).

Following the **task-23.1 precedent** (and the same user-approved deferral applied
in task 24.1), there is a **behavior-preservation blocker**: the entitlement shadow
caches are not yet populated by the SSO entitlement sync/backfill. Verified local DB
state (24.1, 2026-06-07): `subscription_cache` has **1 row** (a single `freemium`
user) and `user_entitlements` has **0 rows**. Wrapping any *paid* feature endpoint
with `requireFeatureAccess(...)` today would return `403` to every user for every
paid/add-on feature — a direct behavior-preservation violation.

Therefore **no live handler is wrapped in 24.2.** This document records the concrete
endpoint → featureKey mapping (Group A = feature-gated; Group B = must remain
ungated), confirms the wrapper is wire-ready, documents the empty-cache blocker and
SSO entitlement-sync prerequisite, flags a server/client freemium-baseline mismatch
that must be reconciled first, and hands off to task 24.4.

---

## Authoritative feature-key source

The frontend feature-gating config is the authoritative source of feature-key intent
(`src/shared/config/subscriptionPlans.js` → `FREEMIUM_FEATURES`, consumed by
`src/features/subscription/lib/featureGating.ts` `checkFeatureAccess`/`checkFreemiumAccess`,
the `useFeatureGate` hook, and the `PlanFeatureGate` / `FeatureLockOverlay` UI gates).
`FREEMIUM_FEATURES` partitions the feature space into freemium-baseline (`true`) vs
upgrade-locked (`false`):

| featureKey | freemium baseline | classification |
|---|---|---|
| `dashboard_access` | `true` | **B — ungated** |
| `profile_creation` | `true` | **B — ungated** |
| `marketplace_access` | `true` | **B — ungated** |
| `view_pricing` | `true` | **B — ungated** |
| `opportunities_listing_access` | `true` | **B — ungated** (VIEW opportunities) |
| `courses_listing_access` | `true` | **B — ungated** (VIEW courses) |
| `opportunities_access` | `false` | **A — feature-gated** (APPLY to opportunities) |
| `assessments` | `false` | **A — feature-gated** |
| `projects` | `false` | **A — feature-gated** |
| `storage` | `false` | **A — feature-gated** |
| `analytics` | `false` | **A — feature-gated** |
| `portfolio` | `false` | **A — feature-gated** |
| `career_paths` | `false` | **A — feature-gated** |
| `mock_interviews` | `false` | **A — feature-gated** |
| `resume_builder` | `false` | **A — feature-gated** |
| `certificates` | `false` | **A — feature-gated** |
| `course_enrollment` | `false` | **A — feature-gated** (ENROLL in courses) |
| `priority_support` | `false` | **A — feature-gated** |

> The key VIEW-vs-ACT split: *listing* (`opportunities_listing_access`,
> `courses_listing_access`) is freemium-baseline and **must stay ungated**, while the
> *action* (`opportunities_access` = apply, `course_enrollment` = enroll) is the
> gated capability. This matters for endpoint mapping below: read/list handlers are
> Group B even when the same area has a gated write/action handler in Group A.

---

## Enforcement surface (already exists — wire-ready, no new wrapper needed)

- **auth-core (generic):** `requireFeature(featureKey, check, handler)`
  - `auth-core/src/middleware/requireFeature.ts` — denies `403 "Forbidden: feature
    not available"` when `check(ctx, keys)` resolves falsey. Knows nothing about
    subscriptions/plans/add-ons (Decision #3 — auth packages stay generic).
- **functions/lib/auth.ts:** app binds the generic guard to the concrete server-side
  entitlement predicate (task 24.1):
  - `entitlementCheck(ctx, keys)` → `hasAnyFeature(getServiceClient(env), userId, keys)`
    (`functions/lib/entitlements.ts`), reading `subscription_cache` + `plans_cache`
    (plan features + freemium baseline via the self-healing
    `checkServerFeatureAccess`) and `user_entitlements` (purchased add-ons).
    Grants on ANY key; **fails closed** on missing identity / empty keys / DB error
    (CC-2 — a guard never silently opens).
  - `export const requireFeatureAccess = (featureKey, handler) =>
    requireFeature(featureKey, entitlementCheck, handler);`
- **Re-exports:** `requireFeature`, `requireProduct`, `requireRole`, `requireAdmin`,
  `requireFeatureAccess` are all exported from `functions/lib/auth.ts`.

> **Conclusion:** no change to `auth-core` or `functions/lib/auth.ts` is required.
> The wrapper is production-ready; only the data prerequisite (populated caches) is
> missing.

### Target wrapping pattern (NOT yet applied to live handlers)

`requireFeatureAccess` composes **inside `withAuth`** and **nests with** the existing
role/admin/product guards — innermost guard runs last, the wrapped business handler
runs only if every layer passes. It reads only the JWT (for identity) + the
server-side shadow (for entitlement); never a frontend-supplied flag.

```ts
// Feature-only gate (e.g. assessments endpoint)
export const onRequestPost = withAuth(
  requireFeatureAccess('assessments', async (context) => { /* ... */ })
);

// Nested with product + admin guards (outer → inner: product → admin → feature)
export const onRequestGet = withAuth(
  requireProduct('skillpassport',
    requireAdmin(
      requireFeatureAccess('analytics', async (context) => { /* ... */ })
    )
  )
);

// ANY-of feature/add-on keys (grant if user holds any one)
export const onRequestPost = withAuth(
  requireFeatureAccess(['portfolio', 'projects'], async (context) => { /* ... */ })
);
```

Existing guards stay exactly as-is; the feature check simply adds one more nested
layer. (Composition order is functionally commutative for deny — any failing layer
returns 403 — so the only constraint is that `withAuth` remains outermost so
`context.data.user` is populated before any guard reads it.)

---

## Endpoint → featureKey mapping

Derived from the `FREEMIUM_FEATURES` partition above + the Function handler inventory
under `functions/api/`. Group A handlers are candidates for
`requireFeatureAccess(<featureKey>)`; Group B handlers MUST remain ungated.

### A) Feature-gated → `requireFeatureAccess(<featureKey>)` (once prerequisite lands)

| featureKey | Candidate handler(s) | Notes |
|---|---|---|
| `assessments` | `assessment/[[path]].ts`, `analyze-assessment/[[path]].ts`, `assessment-questions.ts`, `question-generation/[[path]].ts`, `adaptive-session/[[path]].ts`, `adaptive-session/link-to-attempt.ts`, `adaptive-cache.ts`, `learners/assessments.ts` | The full assessment-taking/analysis surface. Authoring by admins/educators may be product/role-gated rather than feature-gated — confirm in 24.4. |
| `course_enrollment` | `course/[[path]].ts` (enroll path), `courses/[[path]].ts` (enroll path), `courses/performance.ts` | Enroll/progress = gated; **listing stays Group B** (`courses_listing_access`). Split by sub-path/verb, not whole handler. |
| `opportunities_access` | `opportunities/index.ts` (apply/POST path), `recruiter-pipeline/[[path]].ts` (applicant-side apply) | **Apply** = gated. **Listing/View stays Group B** (`opportunities_listing_access`). Split by verb — GET list ungated, POST apply gated. ⚠ see mismatch below. |
| `resume_builder` | `resume/save.ts` | Resume create/save/generate. |
| `certificates` | `fetch-certificate/[[path]].ts`, certificate-issuing paths in `college-admin/transcripts.ts` | Issuing/downloading earned certificates. |
| `analytics` | `analytics/{activities,dashboard,data,educator,kpis,speed}.ts`, `kpi-dashboard/[[path]].ts` | Learner-facing analytics dashboards. Org/admin analytics may be role-gated instead — confirm in 24.4. |
| `portfolio` | `college-admin/digital-portfolio.ts`, learner portfolio read/write surfaces in `learner-pages/*`, `learner-profile/actions.ts` | Portfolio build/publish. |
| `projects` | learner project surfaces (`learner-pages/[[path]].ts` project sub-paths) | No dedicated `projects/` handler dir; gating attaches to the project sub-paths. Confirm exact paths in 24.4. |
| `career_paths` | `career/[[path]].ts`, `explorer/[[path]].ts`, `role-overview/[[path]].ts` | Career-path explorer / role overview. |
| `mock_interviews` | AI interview surface — `ai-tutor/[[path]].ts` (interview mode), `recruiter-copilot.ts` (candidate practice) | ⚠ No dedicated mock-interview handler; the exact endpoint that serves mock interviews must be confirmed with the owner in 24.4. |
| `storage` | `storage/[[path]].ts`, `storage/upload-url.ts`, `storage/download-url.ts` | Premium storage quota/usage. ⚠ Storage also backs Group-B flows (profile photo, certificates) — gating must be quota/bucket-scoped, not a blanket handler wrap, or it would break baseline uploads. Confirm scope in 24.4. |
| `priority_support` | `messaging/actions.ts` (priority/support-tier path), support ticket creation | ⚠ Only the *priority* support path is gated; ordinary messaging is not. Sub-path scope, confirm in 24.4. |

> Several Group-A handlers are `[[path]]` catch-alls mixing gated and ungated
> sub-routes (e.g. `course/[[path]].ts` serves both listing and enrollment). For
> those, the guard must be applied **per sub-route/verb inside the handler**, not by
> wrapping the whole exported `onRequest*`, otherwise a Group-B baseline route would
> be 403'd. This is a wrapping-granularity requirement, not a whole-handler wrap.

### B) MUST stay ungated — do NOT wrap (freemium baseline / acquisition / system)

Wrapping any of these with a paid `requireFeatureAccess(...)` would break the
freemium baseline, onboarding, acquisition, or system automation.

| featureKey / category | Handler(s) | Why ungated |
|---|---|---|
| `dashboard_access` | dashboard read endpoints (`learner-dashboard-widgets/[[path]].ts`, `learners/dashboard.ts` read, `recent-updates/index.ts`, `alerts/index.ts`, `notifications/index.ts`) | Freemium baseline. |
| `profile_creation` | `user/[[path]].ts` profile-creation path (`withAuthAllowUnverified`), `learner-profile/actions.ts` create | Must run immediately post-signup, before any entitlement. |
| `marketplace_access` | marketplace/catalog browse endpoints | Freemium baseline. |
| `view_pricing` | `plans/*`, `subscription/[[path]].ts` read, pricing reads | Needed to *buy* a plan; gating blocks acquisition. |
| `opportunities_listing_access` | `opportunities/index.ts` **GET/list path** | Freemium baseline (VIEW). |
| `courses_listing_access` | `courses/[[path]].ts` **GET/list path**, `library/index.ts` | Freemium baseline (VIEW). |
| acquisition / billing | `payments/[[path]].ts`, `subscription/*`, `plans/*`, `receipts/*`, `promotional/*` | Required to purchase entitlements; gating them is a chicken-and-egg lockout. |
| pre-auth / onboarding | `auth/forgot-password.ts`, `auth/reset-password.ts`, `otp/[[path]].ts`, `email/*` | Pre-auth / onboarding; no entitlement exists yet. |
| system / machine | `cron/reconcile-subscriptions.ts`, payment/SSO webhooks, `log-error.ts` | No user JWT / diagnostics. |

> Admin/educator/org consoles (`college-admin/*`, `school-admin/*`,
> `university-admin/*`, `educator/*`, `teacher/*`, `class-management/*`, `exams/*`,
> `events/*`, `recruitment/*`, `organization/*`) are governed by **role/product**
> guards (tasks 11.x / 23), not by these learner feature keys. They are out of scope
> for 24.2 feature-gating unless a specific paid add-on maps to them — none in
> `FREEMIUM_FEATURES` does. Leave to role/product enforcement.

---

## Blocker 1 — empty entitlement caches (behavior-preservation)

Verified local DB state (24.1, 2026-06-07; see
`.kiro/verifications/2026-06-07_task-24.1-entitlement-check.md`):

- `subscription_cache`: **1 row** — single user on `freemium`
  (`features = [dashboard_access, profile_creation, marketplace_access, view_pricing,
  opportunities_access, courses_listing_access]`).
- `plans_cache`: 4 rows.
- `user_entitlements`: **0 rows** (no purchased add-ons).

Net effect: today `entitlementCheck` would grant only the freemium baseline to one
user and **deny every paid/add-on feature for all users**. Wrapping any Group-A
endpoint now would 403 real users → behavior-preservation violation.

### Prerequisite (must land before 24.2 wraps / before 24.4 e2e-enforces)

SSO entitlement **sync + backfill** so entitled users actually carry their plan
features / add-ons in the shadow caches:

1. Backfill `subscription_cache` for every active subscription (plan_code +
   `features[]`) from the canonical SSO/auth subscription source.
2. Backfill `user_entitlements` for every active add-on/bundle purchase
   (`feature_key`, `status ∈ {active, grace_period}`) — the app-DB shadow of SSO
   `addon_purchases`/`bundle_purchases`.
3. Keep them current via the existing write-through (`sync-shadow.ts`) + the
   reconciliation cron (`cron/reconcile-subscriptions.ts`), so new purchases populate
   immediately.

(These are SSO/data tasks, gated by the DB approval gate; not a breaking change to
this app's Functions.)

## Blocker 2 — server vs client freemium-baseline mismatch (must reconcile first)

The server-side baseline disagrees with the authoritative frontend config on
`opportunities_access`:

- Frontend (`subscriptionPlans.js` `FREEMIUM_FEATURES`): `opportunities_access: false`
  (locked) and a separate `opportunities_listing_access: true` (free view).
- Server (`functions/shared/lib/server-feature-gating.ts` `FREEMIUM_FEATURES`):
  `opportunities_access: true` and **no** `opportunities_listing_access` key.

Consequence if wrapped as-is: `requireFeatureAccess('opportunities_access')` would
**grant** apply-to-opportunity to freemium users server-side (server baseline says
true), contradicting the frontend's locked intent. Before enforcing, the server
baseline map in `server-feature-gating.ts` MUST be reconciled to match the
authoritative frontend config (add `opportunities_listing_access`, set
`opportunities_access: false`). Flagged here; reconciliation is a prerequisite for
correctly wrapping `opportunities_access` and is in scope for 24.4's verification.

---

## Decision (recorded — user-approved P5 deferral, identical to 23.1 / 24.1)

> **Defer live wrapping; implement + document the mapping + unit-test the guard
> contract only.**
>
> Rationale: the entitlement shadow caches are empty (1 freemium user, 0 add-ons),
> so wrapping now would 403 all users for paid features — a direct
> behavior-preservation violation. `requireFeatureAccess` + `entitlementCheck` are
> implemented (24.1), unit-tested, and wire-ready. Once the SSO entitlement
> sync/backfill populates `subscription_cache`/`plans_cache`/`user_entitlements`
> (and the server baseline mismatch is reconciled), the Group-A handlers can be
> wrapped per the target pattern and 24.4 can assert server-side deny.
>
> No live handler is wrapped. No new 403 behavior introduced. `requireFeatureAccess`
> remains applied to **zero** handlers, identical to before this task.

---

## Handoff to Task 24.4 (feature deny tests + UX-only demotion)

- **Guard under test:** `requireFeatureAccess` (`functions/lib/auth.ts`) → generic
  `requireFeature` (auth-core) bound to `entitlementCheck` → `hasAnyFeature`. It is
  **unit-testable in isolation today** by fabricating entitlement state (construct a
  context + seed/mince `subscription_cache`/`user_entitlements` rows, or stub the
  supabase client), exactly as task 23.2 tested `requireProduct` against fabricated
  `products[]` — this proves the deny(no entitlement → 403)/allow(entitlement → 200)
  **contract** independent of the seed/backfill state.
- **Recommended approach for 24.4:** test the guard contract against **fabricated
  entitlement state** (do NOT depend on real cache population), mirroring 23.2's
  `requireProduct` deny test. This keeps the test deterministic and unblocks it ahead
  of the SSO sync prerequisite.
- **UX-only demotion (E9.3, task 24.3):** `featureGating.ts` / `useFeatureGate` /
  `PlanFeatureGate` / `FeatureLockOverlay` must be annotated/treated as UX-only
  affordances; the authoritative gate is always the Function. 24.4 should assert the
  client gate is not the sole gate (i.e. a direct API call without the client gate is
  still denied server-side once enforcement is live).
- **Wrapping granularity reminder:** Group-A `[[path]]` catch-all handlers mix gated
  and ungated sub-routes — apply the guard per sub-route/verb, never as a blanket
  whole-handler wrap, or Group-B baseline routes will be 403'd.
- **Open confirmations for the owner (before mass-wrapping):**
  1. exact endpoint that serves `mock_interviews`;
  2. `storage` gating scope (quota/bucket-scoped, not blanket — baseline uploads must
     survive);
  3. `priority_support` sub-path;
  4. whether `assessments`/`analytics` *authoring/admin* surfaces are role/product-
     gated rather than learner-feature-gated;
  5. reconcile the server/client `opportunities_access` baseline mismatch (Blocker 2).

---

## Verification

- **Live handlers wrapped in 24.2: zero.** No file under `functions/api/**` was
  modified by this task; `functions/lib/auth.ts` is unchanged from its 24.1 state
  (`requireFeatureAccess` applied to no handler). This task is doc-only — the single
  artifact is this verification note.
- **No new 403 behavior introduced.** Enforcement remains deferred per the recorded
  decision.
- Typecheck not required (no `.ts` handler edited).
