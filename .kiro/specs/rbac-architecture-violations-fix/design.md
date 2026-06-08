# Design Document: RBAC & Role/Product/Feature Enforcement Migration

## Overview

This design implements the full migration described in `bugfix.md`: make the **sso-worker** the single source of truth for roles/products, make **Cloudflare Functions** the single enforcement boundary for roles, products, and features, and reduce the frontend to a UX-only consumer. It also fixes the compile-breaking defects, unifies the conflicting `UserRole` types, removes phantom roles, eliminates the competing app-DB role stores, and removes the `user_role` enum entirely.

The work is sequenced into six phases (P0–P5) that are each independently shippable and ordered so the build is green and behavior is preserved at every step. Destructive database changes are isolated to the final Contract phase (P4) and require explicit approval.

### Goals

1. **Green build first** — eliminate the confirmed TypeScript compile errors (P0).
2. **One canonical role taxonomy** — a single generated `UserRole` for the 16 SSO roles; phantom roles removed.
3. **Single enforcement boundary** — every role/product/feature gate runs inside Cloudflare Functions via reusable `auth-core` guards; the frontend never decides authorization.
4. **Single source of truth** — roles resolved only from the SSO JWT; one read-only shadow `roles` table in the app DB, synced from the sso-worker.
5. **Clean separation of taxonomies** — SSO auth roles (authorization) vs school-internal feature roles (school permissions); no shared `user_role` enum.
6. **Behavior preserved** — identical routing, authorization outcomes, and priority selection throughout.

### Non-Goals

- Replacing the recruitment/college-module permission RPCs (kept as the server-side authority per Decision #3).
- Changing the `auth-core`/`auth-client` public packages beyond adding a generic `requireFeature` guard (they stay general-purpose).
- Re-architecting the subscription/billing system (only its *enforcement point* moves into Functions).

### Mapping to Requirements

| Requirement area (bugfix.md) | Phase | Design section |
|---|---|---|
| §1 Compile-breaking bugs | P0 | [Phase P0](#phase-p0--compile-breaking-fixes) |
| §2 Conflicting/phantom types | P1 | [Canonical Role Type](#canonical-role-type), [Phase P1](#phase-p1--canonical-type--phantom-roles) |
| §3 Hardcoded arrays, §7 enforcement | P2 | [Functions Enforcement](#functions-enforcement-layer) |
| §5 Missing infra, §8 DB coupling, Decisions #1/#2 | P3 | [Data Model](#data-models), [Sync Mechanism](#sync-mechanism) |
| §4 Permission matrices, enum removal | P4 | [Phase P4](#phase-p4--contract-destructive-requires-approval) |
| §9 Product/feature gating | P5 | [Product & Feature Enforcement](#product--feature-enforcement) |
| CC-1/2/3 cross-cutting | all | [Cross-Cutting Design](#cross-cutting-design) |

## Bug Details

The codebase violates the mandated architecture (sso-worker = source of truth, Cloudflare Functions = enforcement boundary, frontend = consumer). Verified defects:

- **Compile-breaking (build is red):** `@/shared/types` does not export `User`/`UserRole`/`CreateUserData`/`UpdateUserData` (6 errors); `RecruitmentRole` imported in 5 files but never exported; `authStore.ts:12` imports itself; `InviteEmployeeModal` passes an invalid `message` field.
- **Type fragmentation:** 7 conflicting `UserRole` definitions; phantom `college_lecturer` check (`Settings.tsx:1176`, always false); phantom `recruitment_admin` in `UnifiedSignup`; `VALID_ROLES` has duplicate `learner` entries.
- **Enforcement bypass:** `requireRole`/`requireProduct` exported but used in zero handlers; ~15+ Functions hardcode admin role-array literals; `opportunities/index.ts:52` reads non-existent `user.role` (singular).
- **Competing role stores:** 11+ Functions read authorization from `users.role`/`user_roles`/`teachers.role`/`school_educators.role` instead of the JWT; a signup trigger writes `users.role` from `raw_user_meta_data`.
- **Client-side trust boundary:** `ProtectedRoute`, auth-store booleans persisted to `localStorage`, and recruitment/feature checks decide access on the client.
- **Product/feature gating:** `requireProduct` unused; feature access decided client-side (`featureGating.ts`, `useFeatureGate`, `PlanFeatureGate`, `FeatureLockOverlay`).
- **DB coupling:** the `user_role` enum types `users.role` + two college tables + a signup trigger; RLS policies reference `users.role`/`super_admin`.

Full enumeration with file/line references lives in `bugfix.md` (§1–§9, Sections 8–9, CC-1..CC-3).

## Hypothesized Root Cause

The system migrated authentication to the SSO worker (JWT with `roles[]`/`products[]`), but the application code was never fully migrated off the **pre-SSO, Supabase-Auth-era role model**. The legacy model (app-DB `users.role` enum, `user_roles`, per-table role columns, client-side gating, RLS on `auth.uid()`) was left in place alongside the new JWT model, producing:
- duplicate/parallel role sources that drift,
- authorization decided wherever was convenient (client, ad-hoc Function literals, shadow DB) instead of one boundary,
- type definitions copied per feature because no canonical generated type existed.

Root cause: **incomplete migration + absence of a single canonical role source and a single enforcement boundary.** The fix re-centralizes both.

## Expected Behavior

- Build compiles cleanly; one canonical generated `UserRole` (16 SSO roles); no phantom roles.
- Every role/product/feature decision is enforced inside Cloudflare Functions via reusable `auth-core` guards (`requireRole`/`requireProduct`/`requireFeature`), reading only the verified JWT.
- The sso-worker `roles` table is the single source of truth; the app DB holds a read-only shadow + app-owned `role_categories`/`school_internal_roles`, never used for authorization.
- The `user_role` enum and competing stores are removed; school-internal roles live in their own taxonomy.
- The frontend consumes roles/products/features for UX only; identical routing, authorization outcomes, and priority selection are preserved.

(Authoritative WHEN/THEN clauses: `bugfix.md` Expected Behavior E1–E9 + CC-1..CC-3.)

## Architecture

### Target authorization flow

```
┌────────────┐  login/refresh   ┌─────────────────────────────┐
│  Browser   │ ───────────────► │        sso-worker           │
│ (frontend) │                  │  get_jwt_claims(user, org)  │
│            │ ◄─────────────── │  → signs RS256 JWT          │
└─────┬──────┘   JWT (roles[],  │    {roles, products, ...}   │
      │           products[])   └─────────────┬───────────────┘
      │                                        │ (canonical source)
      │ API call w/ JWT                        │ event-driven push (RPC)
      ▼                                        ▼
┌────────────────────────────────────┐   ┌──────────────────────┐
│       Cloudflare Functions         │   │   App DB (Supabase)  │
│  withAuth → verify JWT via JWKS    │   │  shadow roles (RO)   │
│  requireRole / requireProduct /    │◄──│  role_categories     │
│  requireFeature  (THE gate)        │   │  school_internal_*   │
│  getServiceClient (service_role)   │   │  *_cache (existing)  │
└────────────────┬───────────────────┘   └──────────────────────┘
                 │ returns only authorized data
                 ▼
        Frontend renders (UX-only gates)
```

Key invariants:
- **Frontend** consumes `roles`/`products` from `getMe()` for display/routing only.
- **Functions** are the only server-side gate (no RLS backstop — `service_role` bypasses RLS, CC-2).
- **App DB** holds a read-only shadow `roles` + app-owned `role_categories`/`school_internal_roles`; never an authorization source.

### Layering of role concepts

| Concept | Source of truth | Where enforced | Consumed for |
|---|---|---|---|
| SSO auth roles (16) | sso-worker `roles` → JWT | Functions (`requireRole`) | authz, routing, UI |
| Products | sso-worker → JWT `products[]` | Functions (`requireProduct`) | product access |
| Feature/add-on entitlements | SSO/auth DB → `subscription_cache`/RPC | Functions (`requireFeature`) | feature access |
| School-internal roles | app DB `school_internal_roles` | Functions + `college_role_module_permissions` | school feature perms |
| Role grouping (admin/educator/…) | app DB `role_categories` | Functions (guard helpers) | category checks |

## Components and Interfaces

### Canonical Role Type

A single generated module is the only place `UserRole` is defined. All other modules re-export or import it; the 7 conflicting definitions are deleted.

```
src/shared/types/generated/roles.ts   (generated — do not edit)
```

```ts
// AUTO-GENERATED from the app-DB shadow `roles` table. Do not edit by hand.
export const SSO_ROLES = [
  'owner','admin','member','super_admin','rm_admin','rm_manager',
  'company_admin','educator','school_educator','college_educator',
  'school_admin','college_admin','university_admin','recruiter','hr','learner',
] as const;

export type UserRole = (typeof SSO_ROLES)[number];

// Generated from `role_categories`
export const ROLE_CATEGORIES = {
  admin: ['admin','company_admin','owner','school_admin','college_admin','university_admin'],
  educator: ['educator','school_educator','college_educator'],
  recruiter: ['recruiter','company_admin','hr'],
  learner: ['learner'],
  system: ['super_admin','rm_admin','rm_manager'],
} as const;
```

Re-export shims keep existing import paths working during the migration (no churn):

```ts
// src/features/auth/api/index.ts, src/entities/user/model/types.ts, etc.
export type { UserRole } from '@/shared/types/generated/roles';
```

- `src/shared/types/permissions.ts` and `useUserRole.ts` keep a SEPARATE, explicitly-named `SchoolInternalRole` type (principal, it_admin, …) — NOT named `UserRole`, removing the conflict.
- `RecruitmentRole` is exported from `src/entities/recruitment/model/types.ts`: `export type RecruitmentRole = 'company_admin' | 'recruiter' | 'viewer';`

### Type generation script

```
scripts/generate-role-types.ts   (run in CI + pre-commit; reads the app-DB shadow roles + role_categories)
```

- Reads `roles` and `role_categories` from the app DB (already synced from SSO).
- Emits `src/shared/types/generated/roles.ts`.
- A CI check fails if the generated file is stale (drift detection), satisfying property FC-7.

### Functions Enforcement Layer

`auth-core` already provides `withAuth`, `requireRole`, `requireProduct`. We add one generic guard and an app-side role-group helper.

#### `requireFeature` (new, in `auth-core` — generic)

```ts
// auth-core/src/middleware/requireFeature.ts
export function requireFeature(
  featureKey: string | string[],
  check: (ctx: ContextWithUser, keys: string[]) => Promise<boolean>,
  handler: (ctx: ContextWithUser) => Promise<Response> | Response,
) {
  const keys = Array.isArray(featureKey) ? featureKey : [featureKey];
  return async (ctx: ContextWithUser): Promise<Response> => {
    if (!(await check(ctx, keys))) return jsonError('Forbidden: feature not available', 403);
    return handler(ctx);
  };
}
```

The package stays generic: it takes a `check` callback rather than embedding SkillPassport entitlement logic (honors Decision #3 — auth packages stay general-purpose). The app supplies the concrete `check` (querying `subscription_cache`/entitlements).

#### App-side role-group guard (`functions/lib/auth.ts`)

```ts
import { requireRole } from '@rareminds-eym/auth-core';

// Resolves the role names in a category from the role_categories shadow table AT RUNTIME
// (short in-isolate cache, ~60s). Adding/removing a role to/from a category is a DB-only
// change — no regen, no redeploy (satisfies E3.2/E3.3 zero-code role changes).
async function rolesInCategory(env, category: string): Promise<string[]> {
  return categoryCache.get(category) ?? await loadAndCache(env, category);
}

// Replaces all inline ['admin','company_admin',...] literals — group resolved dynamically.
export const requireAdmin = (handler) => async (context) => {
  const adminRoles = await rolesInCategory(context.env, 'admin');
  return requireRole(adminRoles, handler)(context);
};

// App-specific feature check bound to requireFeature
export const requireFeatureAccess = (featureKey, h) =>
  requireFeature(featureKey, entitlementCheck, h);

async function entitlementCheck(ctx, keys) {
  const supabase = getServiceClient(ctx.env);
  const userId = getContextUser(ctx).id;
  // server-side check against subscription_cache/plans_cache/entitlements
  return hasAnyFeature(supabase, userId, keys);
}
```

> **Runtime resolution is deliberate.** The generated `ROLE_CATEGORIES` constant in `roles.ts` is for **compile-time type-safety and frontend UX only**. Runtime authorization MUST read `role_categories` from the shadow DB so a role's category membership can change with a DB-only edit (E3.2/E3.3). The ~60s cache only affects category-membership propagation (app-owned data), never JWT identity (CC-1 unaffected). TypeScript's role-name union still needs regeneration to *type* a brand-new role name, but runtime enforcement does not depend on it.

#### Handler conversion pattern

Before (current — violation):
```ts
export const onRequestPost = async (context) => {
  const user = getContextUser(context);
  const isAdmin = user.roles?.some(r => ['admin','company_admin','owner', ...].includes(r));
  if (!isAdmin) return apiError(403, ...);
  // ...
};
```

After (target):
```ts
export const onRequestPost = withAuth(requireAdmin(async (context) => {
  // role already enforced from the verified JWT; no inline literals
  // ...
}));
```

All ~15+ files in bugfix.md §3.4/§7.1 are converted to wrap with `requireRole`/`requireAdmin`. The `user.role` (singular) usage in `opportunities/index.ts` is removed in favor of `user.roles`.

### Frontend role/permission consumption

- `authStore` remains the single source of `roles`/`products` (already correct via `getMe()`).
- Delete/neutralize the deviant resolvers: `useUserRole` stops querying `teachers`/`school_educators` and stops inferring from the URL / defaulting to `subject_teacher`; it derives the school-internal role from a Function endpoint that itself reads the JWT + `school_internal_roles`.
- `roleLookupService` and `permissionService` become thin clients over Functions that enforce; they are advisory for UX.
- `ProtectedRoute` keeps client-side redirects for UX but is explicitly documented as non-authoritative; the backing Function enforces.
- Auth-store role booleans (`isAdminRole`, etc.) are derived from `ROLE_CATEGORIES` (single source) and used for rendering only — not persisted to `localStorage` as a trust signal.

### Product & Feature Enforcement

- **Product**: product-gated Functions wrap with `requireProduct(<productCode>)` against JWT `products[]`.
- **Feature**: feature-gated Functions wrap with `requireFeatureAccess(featureKey, handler)`; the server-side `entitlementCheck` reads the existing `subscription_cache`/`plans_cache`/entitlement data (canonical state stays SSO-side, surfaced via `sso-client.ts` RPC + `sync-shadow.ts`).
- **Frontend** `featureGating.ts`/`useFeatureGate`/`PlanFeatureGate`/`FeatureLockOverlay` remain for UX only; the authoritative gate is always the Function serving the request.

## Data Models

All schema changes are DDL in migration files; all data population is DML in seed files (per `04-database-api-standards.md`). No Supabase CLI command is run without explicit approval.

### Existing state to reconcile (verified)

The app DB **already has** a shadow `roles` table (`20260526000000_schema.sql:18350`):

```sql
-- EXISTING (keyed on name, no id column) — matches architecture §2 shadow description
public.roles ( name varchar(50) NOT NULL, description text NOT NULL,
               created_at timestamptz, updated_at timestamptz );
```

Also: code in `college-admin/faculty.ts` and `user/handlers/actions.ts` queries a `user_roles` table joining `role:role_id(id,name,slug)`, but **no `CREATE TABLE user_roles` exists in the main schema** — so `user_roles` is either created by another migration or is a phantom table whose queries error at runtime. Tasks MUST verify its physical existence before relying on or dropping it.

Per Decision #2, the existing `roles` table is **replaced** by the new optimised shadow (not created from scratch), and `user_roles` is removed in the Contract phase.

### Shadow `roles` table (replaces the existing one; read-only reference)

```sql
-- migration (DDL): replace the existing public.roles with an optimised shadow of sso-worker roles.
-- Keep it keyed on name to match role_categories FK and the existing column shape.
DROP TABLE IF EXISTS public.roles CASCADE;   -- existing shadow (name, description, ...)
CREATE TABLE public.roles (
  name        TEXT PRIMARY KEY,            -- canonical role name (matches sso-worker roles.name)
  description TEXT,
  sso_role_id UUID,                        -- optional: sso-worker roles.id for traceability
  synced_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.roles IS
  'Read-only optimised shadow of sso-worker roles. Synced via SSO_SERVICE RPC. NOT an authorization source.';
```

> Note: `DROP TABLE ... CASCADE` on the existing `roles` is destructive and belongs to the approval-gated migration; if anything currently FKs to `roles`, that dependency is handled in the Contract phase. Keying the shadow on `name` matches both the existing table and the `role_categories.role_name` FK.

### New: `role_categories` (app-owned grouping)

```sql
CREATE TABLE public.role_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name  TEXT NOT NULL REFERENCES public.roles(name) ON DELETE CASCADE,
  category   TEXT NOT NULL CHECK (category IN ('admin','educator','recruiter','learner','system')),
  priority   INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role_name, category)
);
```

### New: `school_internal_roles` (replaces `user_role` enum for school perms)

```sql
CREATE TABLE public.school_internal_roles (
  code        TEXT PRIMARY KEY,   -- 'principal','vice_principal','it_admin','class_teacher','subject_teacher',...
  label       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Changed: school-internal permission tables (re-typed off the enum)

```sql
-- Expand: add nullable FK columns alongside the enum columns
ALTER TABLE public.college_role_module_permissions
  ADD COLUMN role_code TEXT REFERENCES public.school_internal_roles(code);
ALTER TABLE public.college_role_scope_rules
  ADD COLUMN role_code TEXT REFERENCES public.school_internal_roles(code);
-- (backfill in seed/DML), then Contract: drop role_type enum columns + DROP TYPE user_role
```

### Removed (Contract phase, requires approval)

- `users.role` column
- `user_roles` table
- `role_type` (`user_role`) columns on the two college tables
- `TYPE public.user_role`
- authority usage of `teachers.role` / `school_educators.role`

### User → school-internal-role mapping (fills the gap from clause 8.5)

The kept college-permission lookup currently joins `users.role`. After `users.role` is dropped, a user's *school-internal* role is resolved by a Function:

```
resolveSchoolRole(userId, orgId):
  1. ssoRoles ← JWT.roles                      // e.g. college_admin (an SSO role)
  2. if ssoRole maps to a permission role_code → use it
  3. else look up the user's school-internal assignment
     (from teachers/school_educators record, surfaced as role_code)
  4. query college_role_module_permissions by role_code
```

A dedicated `user_school_role` assignment view/table MAY be introduced if the `teachers`/`school_educators` records are insufficient; decided in tasks.

## Sync Mechanism

Primary: **event-driven push over the `SSO_SERVICE` Service Binding RPC** (consistent with `sso-client.ts` + `sync-shadow.ts`).

```
On role change in sso-worker (membership_roles/roles mutation):
   sso-worker → (RPC) → skillpassport Function → upsert public.roles / role_categories shadow
On cache-miss / scheduled reconcile:
   skillpassport Function → (RPC) ssoService.listRoles() → upsert shadow
```

- `roles` changes ~never, so a periodic reconcile (e.g. daily) plus on-demand refresh is sufficient.
- A `syncRolesShadow()` helper mirrors `syncSubscriptionCache()` in `sync-shadow.ts`.

Conditional alternative: **PostgreSQL logical replication** (publication on sso-worker `roles` → subscription in app DB) — only if design validates `CREATE SUBSCRIPTION` is permitted on the current managed-Supabase tier. FDW is rejected for this hot table (per-read network round-trip).

## Fix Implementation

The fix is sequenced into six phases (P0–P5), each independently shippable, ordered so the build is green and behavior is preserved at every step. The reusable components above ([Canonical Role Type](#canonical-role-type), [Functions Enforcement](#functions-enforcement-layer), [Data Models](#data-models), [Sync Mechanism](#sync-mechanism)) are introduced across these phases.

### Phase P0 — Compile-breaking fixes
- Export `RecruitmentRole` from `entities/recruitment/model/types.ts`; the 5 importers compile.
- Fix `@/shared/types` barrel: re-export `User`/`UserRole`/`CreateUserData`/`UpdateUserData` (or repoint imports).
- Remove the `authStore.ts:12` self-import.
- Fix `InviteEmployeeModal` `CreateInvitationRequest.message`.
- Gate: `tsc` clean; build green. (Properties FC-1.)

### Phase P1 — Canonical type & phantom roles
- Add generated `roles.ts`; converge all `UserRole` to it via re-export shims; introduce `SchoolInternalRole`.
- Fix `college_lecturer` → `college_educator` at `Settings.tsx:1176`.
- Remove `recruitment_admin` phantom usage in `UnifiedSignup`.
- De-duplicate `VALID_ROLES`.
- Gate: build green; no `UserRole` defined outside the generated module. (FC-2, FC-3.)

### Phase P2 — Functions enforcement + JWT-only resolution
- Add `requireFeature` to `auth-core`; add `requireAdmin`/`requireFeatureAccess` to `functions/lib/auth.ts`.
- Convert all ~15+ handlers from inline role literals to `requireRole`/`requireAdmin`; remove `user.role` singular usage.
- Stop Functions reading `users.role`/`user_roles`/`teachers.role`/`school_educators.role` for authorization; read JWT instead.
- Neutralize frontend deviant resolvers (`useUserRole`, `roleLookupService`); auth-store booleans from `ROLE_CATEGORIES`.
- Gate: per-endpoint deny tests; behavior-preservation tests. (FC-9, FC-10, FC-11, PC-1..PC-5.)

### Phase P3 — App-DB role infra + type generation
- Create shadow `roles`, `role_categories`, `school_internal_roles` (Expand DDL).
- Implement `syncRolesShadow()` over the SSO RPC; seed `role_categories`/`school_internal_roles` (DML in seed files).
- Add `scripts/generate-role-types.ts` + CI drift check.
- Gate: shadow matches the canonical 16 roles; generated types stable. (FC-7, FC-8.)

### Phase P4 — Contract (destructive, REQUIRES APPROVAL)
- Re-type college tables to `role_code`; backfill; rewrite/retire RLS policies referencing `users.role`/`super_admin`/enum; change `handle_new_user` to stop writing `users.role`.
- Drop `users.role`, `user_roles`, enum columns, then `DROP TYPE user_role`.
- Stop using `teachers.role`/`school_educators.role` as authorities.
- Gate: all pre-Contract blockers cleared; full regression. Each Supabase command proposed + approved individually.

### Phase P5 — Product & feature enforcement
- Wrap product-gated Functions with `requireProduct`.
- Wrap feature-gated Functions with `requireFeatureAccess`; implement `entitlementCheck`.
- Demote frontend feature gates to UX-only.
- Gate: feature/product deny tests server-side. (FC-12, E9.*)

## Cross-Cutting Design

### CC-1: Role/permission change propagation & revocation
- Authorization derives from the JWT; changes take effect on next refresh (≤ ~15 min — `ACCESS_TOKEN_TTL = "15m"`). Documented as an accepted tradeoff.
- Immediate revocation uses the existing session path: set `sessions.revoked = true` → refresh fails → `withAuth` denies. `withAuth` already rejects non-`active` membership status.
- Functions MUST NOT introduce a role/entitlement cache with a TTL longer than the JWT, which would extend the staleness window. Short-lived in-request memoization only.

### CC-2: No DB-level backstop
- Functions use `service_role` (bypasses RLS); the Function guard is the ONLY server gate.
- Therefore every data-accessing Function MUST carry an explicit guard (`requireRole`/`requireProduct`/`requireFeature`/ownership). A missing guard = open access.
- Mitigation: a lint/test sweep asserts no exported handler lacks a guard or explicit public annotation.

### CC-3: Org-scoped semantics
- `get_jwt_claims(user, org)` resolves roles/products for the active org; the JWT has one `org_id`.
- Guards are implicitly org-scoped. Multi-org users get a new JWT on `switch-org`. Design must not assume a cross-org union; recruitment flows already switch org context.

## Error Handling

| Condition | Response | Source |
|---|---|---|
| No/invalid token | 401 `Unauthorized`/`Invalid token` | `withAuth` (auth-core) |
| Expired token, refresh ok | transparent refresh + `X-Access-Token` | `withAuth` |
| Inactive membership | 403 `Inactive membership` | `withAuth` |
| Missing role | 403 `Forbidden: insufficient role` | `requireRole` |
| Missing product | 403 `Forbidden: product access denied` | `requireProduct` |
| Missing feature | 403 `Forbidden: feature not available` | `requireFeature` |
| Shadow sync failure | log + serve last-known shadow; reconcile retries | `syncRolesShadow` |

- Guards fail closed (deny on error), except the documented shadow-sync path which serves the last-known-good shadow for reference reads (never for authz — authz uses the JWT, not the shadow).

## Testing Strategy

Per steering: 80%+ coverage, deny-path tests for every guard, behavior-preservation tests.

### Bug-condition / property tests (P0–P2)
- **Compilation**: `tsc --noEmit` is green (asserts FC-1).
- **Single type**: a test/lint asserts `UserRole` is declared only in the generated module (FC-2).
- **No phantom roles**: assert every role literal in code ∈ `SSO_ROLES` ∪ `SchoolInternalRole` ∪ recruitment roles (FC-3).
- **Guard presence**: every exported Function handler is wrapped by a guard or explicitly marked public (FC-9, CC-2).
- **JWT-only resolution**: grep/AST test that Functions do not read `users.role`/`user_roles`/`teachers.role` for authz (FC-10).

### Preservation tests (P2, P4)
- For each role in {learner, school_educator, recruiter, school_admin, college_admin, university_admin, admin, company_admin, owner}: dashboard route and admin-authorization outcome match pre-migration (PC-1, PC-2).
- `pickPrimaryRole`, `isAdminRole`, etc. return identical results for the same inputs (PC-3, PC-4).
- College-permission lookup returns the same permission set for the same user pre/post re-typing (PC-5 analog).

### Enforcement tests (P2, P5)
- Each protected endpoint: authorized role/product/feature → 200; unauthorized → 403 (server-side, not client).
- Org-scoping: a role valid in org A is denied for org B context (CC-3).

### Migration tests (P3, P4)
- Shadow `roles` equals the canonical 16 after sync.
- Backfill: every existing `role_type` row has a matching `role_code`; no NULLs before enum drop.
- RLS rewrite: policies that referenced `users.role` produce equivalent allow/deny outcomes (or are confirmed vestigial and removed).

### Tooling
- Vitest for unit/integration; run with `--run` (no watch).
- Type-gen drift check in CI.

## Correctness Properties

These map to the property specification in `bugfix.md`. The fix is correct iff all hold.

> **Traceability note.** `bugfix.md` reuses section numbers across its Current-Behavior, Expected-Behavior (`E`-prefixed), and Unchanged-Behavior blocks, and the design-format validator requires bare `N.M` references. Read the references below by property: Properties 1–9 cite the **Expected-Behavior** clause `E N.M` of the same number; Property 10 cites the **Unchanged-Behavior / preservation** clauses 3.1–3.5; Property 11 cites the **Current-Behavior DB-coupling** clauses 8.2/8.5 plus `E7.4`. The property text is authoritative where a bare number is ambiguous.

### Property 1: Compilation
`tsc --noEmit` passes; the 9+ known errors are resolved. (FC-1)
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Single canonical type
`UserRole` is declared only in `src/shared/types/generated/roles.ts`; all other modules re-export it. (FC-2)
**Validates: Requirements 2.1**

### Property 3: No phantom roles
Every role literal ∈ `SSO_ROLES` ∪ `SchoolInternalRole` ∪ `RecruitmentRole`. (FC-3)
**Validates: Requirements 2.2, 2.3, 2.4**

### Property 4: Type generation
The generator exists and CI fails on drift between the DB and the generated file. (FC-7)
**Validates: Requirements 5.1**

### Property 5: Schema present
`role_categories`, shadow `roles`, and `school_internal_roles` exist with the specified columns/FKs. (FC-8)
**Validates: Requirements 5.2, 5.3, 3.1**

### Property 6: Guarded handlers
Every role-gated Function uses `requireRole`/`requireProduct`/`requireFeature`; no inline role-array literals remain. (FC-9)
**Validates: Requirements 7.1, 7.2, 3.2**

### Property 7: JWT-only resolution
No Function resolves authorization from `users.role`/`user_roles`/`teachers.role`/`school_educators.role`/URL inference. (FC-10)
**Validates: Requirements 7.3, 7.4, 7.5, 7.8, 6.1**

### Property 8: No client trust boundary
No role boolean persisted to `localStorage` is used as a gate; enforcement happens in Functions. (FC-11)
**Validates: Requirements 7.6, 7.9**

### Property 9: Product/feature enforcement
Product-gated Functions use `requireProduct`; feature-gated Functions verify entitlement server-side; client gates are UX-only. (FC-12)
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 10: Behavior preserved
Routes, admin authorization, auth-store helpers, `pickPrimaryRole`, and validation outcomes are unchanged for the same inputs. (PC-1..PC-5)
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 11: Cross-cutting constraints
Staleness bounded by the 15-min JWT + session revocation; every data Function carries a guard since there is no DB backstop; guards are org-scoped.
**Validates: Requirements 8.2, 8.5, 7.4**

## Glossary

- **SSO auth role**: one of the 16 canonical roles in the sso-worker `roles` table, delivered in the JWT `roles[]`. The authorization identity.
- **School-internal role**: a feature-permission role within a school/college (`principal`, `it_admin`, `class_teacher`, `subject_teacher`, …). Not an SSO role; lives in `school_internal_roles`.
- **Recruitment role**: org-scoped membership role (`company_admin`, `recruiter`, `viewer`).
- **Product**: a coarse entitlement in the JWT `products[]` (e.g. `skillpassport`).
- **Feature / add-on entitlement**: fine-grained capability keyed by `feature_key`, tracked in subscription/entitlement data.
- **Shadow `roles` table**: read-only app-DB copy of the SSO roles, for local joins/type-gen/reference only; never an authz source.
- **`role_categories`**: app-owned grouping of SSO roles (admin/educator/recruiter/learner/system) with priority.
- **Guard**: an `auth-core` higher-order wrapper (`requireRole`/`requireProduct`/`requireFeature`) enforcing access inside a Function.
- **Contract phase**: the breaking, approval-gated migration step that drops legacy columns/tables/enum.
- **Enforcement boundary**: Cloudflare Functions — the only place an authorization decision is authoritative.

## Open Design Items (resolve during tasks)
1. Whether `user_school_role` needs a dedicated assignment table vs deriving from `teachers`/`school_educators` (clause 8.5).
2. Final decision on logical replication vs RPC push after validating Supabase tier capability.
3. Exact list of product codes / feature keys per gated endpoint (guard matrix) — enumerated in tasks.
4. RLS policies: rewrite vs remove (pending the vestigial-assessment in P4).

## Security Considerations
- Fail-closed guards; deny on any guard error.
- No secrets in code; service binding for SSO RPC.
- The Function guard is the sole server gate (CC-2) — guard presence is a security-critical invariant enforced by tests.
- Short-lived tokens + session revocation bound stale-permission exposure (CC-1).
- Treat the shadow `roles` table as reference only; never authorize from it.
