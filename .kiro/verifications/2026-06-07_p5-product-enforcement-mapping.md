# P5 — Product Enforcement Mapping & Prerequisite (Task 23.1)

**Spec:** rbac-architecture-violations-fix · **Requirement:** 9.1 · **Date:** 2026-06-07
**Status:** Mapping documented · **Wrapping deferred** (see Decision below)

---

## Summary

Task 23.1 calls for wrapping product-gated Function handlers with
`requireProduct(<productCode>)` against the JWT `products[]` claim. Investigation
found a **behavior-preservation blocker**: the JWT `products[]` claim is currently
**empty for every user**, so applying `requireProduct(...)` to any handler today
would return `403` to all authenticated users.

Per the task's explicit constraint ("behavior preservation is paramount … do NOT
over-restrict"), and an explicit user decision, **no handlers are wrapped in 23.1**.
This document records the concrete endpoint → productCode mapping, the enforcement
surface (which already exists), the prerequisite that must land first, and exactly
which handlers 23.2 should target once the prerequisite is satisfied.

---

## Enforcement surface (already exists — no new wrapper needed)

- **auth-core (generic):** `requireProduct(product: string | string[], handler)`
  - `auth-core/src/middleware/requireProduct.ts:7`
  - Denies `403 "Forbidden: product access denied"` when none of the required
    products are present in `context.data.user.products` (the verified JWT claim).
  - Exported from `auth-core/src/index.ts`.
- **functions/lib/auth.ts:** already re-exports it for app handlers
  - import: `functions/lib/auth.ts:3`
  - re-export: `functions/lib/auth.ts:164`
    (`export { getServiceClient, requireFeature, requireProduct, requireRole };`)
- **Composition:** `requireProduct` composes inside `withAuth`, exactly like the
  existing `requireAdmin` / `requireRole` / `requireFeatureAccess` guards:

  ```ts
  // Target pattern (NOT yet applied — pending prerequisite)
  export const onRequestGet = withAuth(
    requireProduct('skillpassport',
      requireAdmin(async (context) => { /* ... */ })
    )
  );
  ```

  Existing role/admin/feature guards stay; the product check simply nests with
  them (it only reads the verified JWT, never a shadow store).

> **Conclusion:** no change to `auth-core` or `functions/lib/auth.ts` is required.
> The wrapper is production-ready; only the data prerequisite is missing.

---

## Product set (authoritative)

The SSO `products` table defines exactly two product codes
(`sso-worker/supabase/seed/seed.sql:160-163`):

| `code`          | Product                            | Served by these Functions? |
|-----------------|------------------------------------|----------------------------|
| `skillpassport` | SkillPassport (this application)   | **Yes** — all app data     |
| `lte`           | Learning Transformation Engine     | No (separate enterprise app)|

Therefore the only product code applicable to this app's Functions is
**`skillpassport`**. There is no per-endpoint product differentiation inside the
app — every product-feature endpoint maps to the single `skillpassport` product.

---

## How `products[]` is populated (the blocker)

`get_jwt_claims(p_user_id, p_org_id)` derives `products[]` as
`membership_products ∩ active organization_products`
(`sso-worker/supabase/migrations/20260526000000_schema.sql:196-207`):

```sql
'products', coalesce(
  (select array_agg(distinct p.code order by p.code)
   from membership_products mp
   join products p on p.id = mp.product_id
   join organization_products op
     on op.product_id = mp.product_id
     and op.org_id = m.org_id
     and op.active = true
   where mp.membership_id = m.id),
  '{}'::text[]),
```

**Findings:**
- `membership_products` and `organization_products` are **empty** in the seed
  (`sso-worker/supabase/seed/seed.sql:283-329`).
- The signup / login / invite / refresh / switch-org flows do **not** insert any
  `membership_products` rows (verified across `sso-worker/src/routes/*`).
- The frontend gates **zero** endpoints by product — there is no
  `products.includes(...)` check anywhere in `skillpassport/src/**` except a
  read-only display in `features/debug/ui/RoleDebugger.tsx`.

**Net effect:** today every JWT carries `products: []`. Any `requireProduct(...)`
guard would deny all users. This is the prerequisite that must be resolved before
wrapping.

### Prerequisite (must land before 23.2 enforces / before wrapping)

A backfill + grant-on-provision so that users entitled to SkillPassport actually
carry `skillpassport` in `products[]`:

1. Seed/backfill `organization_products` (`org_id`, `product_id=skillpassport`,
   `active=true`) for every org that uses SkillPassport.
2. Seed/backfill `membership_products` (`membership_id`, `product_id=skillpassport`)
   for every existing membership entitled to the product.
3. Grant the `skillpassport` `membership_product` at membership-creation time
   (signup / invite / org-provisioning) in the **sso-worker** so new users get it.

(Items 1–3 are SSO/data tasks outside this app's `functions/`; they are NOT a
breaking change to this app and require their own approval per the DB approval gate.)

---

## Endpoint → productCode mapping

Because SkillPassport is a single product, the mapping is binary: a handler is
either a **product-feature endpoint** (`skillpassport`) or it is an
**acquisition/onboarding/system endpoint that MUST remain product-independent**
(otherwise users could never sign up, verify email, or purchase the product).

### A) Product-gated → `requireProduct('skillpassport')` (once prerequisite lands)

All authenticated product-feature data endpoints. Wrap **outside** any existing
role/admin/feature guard, **inside** `withAuth`. Candidate set (by area):

| Area | Representative handlers |
|------|-------------------------|
| Assessment / adaptive | `assessment/[[path]].ts`, `adaptive-session/*`, `analyze-assessment/[[path]].ts`, `assessment-questions.ts`, `question-generation/[[path]].ts` |
| Career / explorer | `career/[[path]].ts`, `explorer/[[path]].ts`, `role-overview/[[path]].ts` |
| Courses / library | `course/[[path]].ts`, `courses/[[path]].ts`, `courses/performance.ts`, `library/index.ts` |
| Learner surface | `learners/*`, `learner-activity/[[path]].ts`, `learner-dashboard-widgets/[[path]].ts`, `learner-pages/*`, `learner-profile/actions.ts`, `streak/[[path]].ts` |
| AI features | `ai-tutor/[[path]].ts`, `educator-copilot/actions.ts`, `recruiter-copilot.ts`, `university-ai/*`, `embedding/*` |
| Educator / teacher | `educator/*`, `teacher/*`, `class-management/*`, `co-curriculars/*`, `exams/*`, `events/*` |
| Admin consoles | `college-admin/*`, `school-admin/*`, `university-admin/*` |
| Recruitment | `opportunities/index.ts`, `recruiter/*`, `recruiter-pipeline/[[path]].ts`, `recruitment/*`, `placement/*` |
| Dashboards / analytics | `analytics/*`, `kpi-dashboard/[[path]].ts`, `role-overview/*`, `recent-updates/index.ts`, `alerts/index.ts`, `notifications/index.ts`, `admin-notifications/index.ts` |
| Resume / storage / messaging | `resume/save.ts`, `storage/*`, `messaging/actions.ts`, `fetch-certificate/[[path]].ts`, `co-curriculars/*` |
| Org / settings | `organization/*`, `settings/[[path]].ts`, `user/*` (profile-read/update, NOT profile-creation) |

> All of the above map to the **single** product code `skillpassport`.

### B) MUST stay product-independent — do NOT wrap (acquisition/onboarding/system)

Wrapping these with `requireProduct('skillpassport')` would create a chicken-and-egg
lockout (a user with no product could never obtain one) or break webhooks/automation:

| Handler(s) | Why not product-gated |
|------------|------------------------|
| `auth/forgot-password.ts`, `auth/reset-password.ts` | Pre-auth credential recovery |
| `otp/[[path]].ts` | Verification during onboarding |
| `email/*` (verification, password-reset) | Onboarding / transactional email |
| `user/*` **profile-creation path** (`withAuthAllowUnverified`) | Must run immediately post-signup, before any entitlement |
| `payments/[[path]].ts`, `subscription/*`, `plans/*`, `receipts/*` | Needed to **purchase** the product; gating them blocks acquisition |
| `promotional/*` | Pre-purchase marketing/offers |
| `cron/reconcile-subscriptions.ts` | System cron, no user JWT |
| Payment/SSO **webhooks** (within `payments/*`) | Machine-to-machine, no user `products[]` |
| `log-error.ts` | Diagnostics |
| Any handler marked `// @public-endpoint` | Already intentionally public |

---

## Decision (recorded)

> **Defer wrapping; document the mapping + prerequisite only.** (user-selected)
>
> Rationale: `products[]` is empty for all current users, so wrapping now would
> 403 everyone — a direct violation of the behavior-preservation constraint. The
> `requireProduct` surface already exists and is ready. Once the prerequisite
> (populate `membership_products` / `organization_products`, grant on provision)
> lands, the Section A handlers can be wrapped with `requireProduct('skillpassport')`
> and Task 23.2 can assert server-side deny (no product → 403, with product → 200).

---

## Handoff to Task 23.2 (product deny tests)

- **Guard under test:** `requireProduct` (auth-core), re-exported at
  `functions/lib/auth.ts:164`. It is unit-testable in isolation **today** (construct
  a context with/without `products`) — that test does not depend on the data
  prerequisite and proves the deny/allow contract.
- **End-to-end deny test** (handler returns 403 for a JWT without `skillpassport`,
  200 for a JWT with it) requires either (a) the data prerequisite above, or
  (b) a fabricated JWT/test fixture that sets `products` directly — recommend (b)
  for the server-side deny test so it is independent of seed/backfill state.
- **Targets:** the Section A handler set above (all → `skillpassport`).
- **Ambiguity to keep in mind:** since no endpoint is currently product-gated by the
  frontend and the app is single-product, the A/B split above (feature vs.
  acquisition/system) IS the product-gating definition for this codebase. Confirm
  the A-set scope with the owner before mass-wrapping, especially the admin consoles
  (`college-admin/*`, `school-admin/*`, `university-admin/*`) where org provisioning
  may legitimately precede a populated `products[]`.
