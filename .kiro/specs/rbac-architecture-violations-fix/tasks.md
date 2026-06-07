# Implementation Plan: RBAC & Role/Product/Feature Enforcement Migration

## Overview

Phased migration (P0–P5) that makes the sso-worker the single source of truth for roles/products, Cloudflare Functions the single enforcement boundary, and the frontend a UX-only consumer. Each phase keeps the build green and behavior preserved. Destructive DB steps (P4) require explicit approval and follow Expand-Migrate-Contract. No Supabase CLI command runs without approval.

## Tasks

### Phase 0: Bug-Condition Exploration (verify the defects exist)

- [x] 1. Write bug-condition exploration tests that confirm the violations
  - [x] 1.1 Add a test that runs `tsc --noEmit` and asserts the known compile errors are present (broken `@/shared/types` barrel, missing `RecruitmentRole`, `authStore` self-import) — expected to FAIL on unfixed code
  - [x] 1.2 Add an AST/grep property test asserting `UserRole` is currently defined in >1 module (fragmentation) and that `college_lecturer`/`recruitment_admin` phantom literals exist
  - [x] 1.3 Add a test asserting ≥1 Function performs an inline admin role-array check and that `requireRole`/`requireProduct` are used in zero handlers
  - [x] 1.4 Add a test asserting ≥1 Function reads `users.role`/`user_roles`/`teachers.role` for authorization
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 7.1, 7.3_

### Phase P0: Compile-Breaking Fixes

- [x] 2. Fix the `@/shared/types` barrel export
  - [x] 2.1 Re-export `User`, `UserRole`, `CreateUserData`, `UpdateUserData` from `src/shared/types/index.ts` (or repoint the imports in `validation.ts`/`utils.ts` to the correct source)
  - [x] 2.2 Run `getDiagnostics` on `validation.ts`/`utils.ts` to confirm the 6 errors are gone
  - _Requirements: 1.1_

- [x] 3. Export `RecruitmentRole` and fix recruitment compile errors
  - [x] 3.1 Add `export type RecruitmentRole = 'company_admin' | 'recruiter' | 'viewer';` to `src/entities/recruitment/model/types.ts`
  - [x] 3.2 Verify the 5 importers (`ChangeRoleModal`, `EmployeeList`, `InvitationsList`, `InviteEmployeeModal`, cast usage) compile
  - [x] 3.3 Fix `CreateInvitationRequest.message` usage in `InviteEmployeeModal.tsx` (remove or extend the type)
  - _Requirements: 1.2, 1.4_

- [x] 4. Remove the `authStore.ts` self-import
  - [x] 4.1 Delete the `import { useAuthStore } from '@/shared/model/authStore'` line at `authStore.ts:12`
  - [x] 4.2 Confirm the locally-declared `useAuthStore` resolves and the file compiles
  - _Requirements: 1.3_

- [x] 5. Gate P0 — build green
  - [x] 5.1 Run `tsc --noEmit`; confirm the Phase-0 compile-error test now passes (errors resolved)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

### Phase P1: Canonical Type & Phantom Roles

- [x] 6. Introduce the canonical generated role module (hand-authored initially, generator added in P3)
  - [x] 6.1 Create `src/shared/types/generated/roles.ts` with `SSO_ROLES` (16 roles), `UserRole`, and `ROLE_CATEGORIES`
  - [x] 6.2 Replace the 7 `UserRole` definitions with re-export shims pointing to the generated module
  - [x] 6.3 Rename the school-only union in `permissions.ts`/`useUserRole.ts` to `SchoolInternalRole` (not `UserRole`)
  - [x] 6.4 Add a lint/test asserting `UserRole` is declared only in the generated module
  - _Requirements: 2.1_

- [x] 7. Fix phantom roles and duplicates
  - [x] 7.1 Change `userRole === 'college_lecturer'` → `'college_educator'` at `src/pages/educator/Settings.tsx:1176`
  - [x] 7.2 Replace/annotate `recruitment_admin` in `UnifiedSignup.tsx` (lines 37, 322, 323, 330, 558, 670, 1400) with a valid role or a documented UI-only redirect label not used in any role check
  - [x] 7.3 De-duplicate `VALID_ROLES` in `validation.ts` (single `learner`)
  - [x] 7.4 Add the no-phantom-roles property test (every literal ∈ SSO_ROLES ∪ SchoolInternalRole ∪ RecruitmentRole)
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 8. Gate P1 — build green, single type
  - [x] 8.1 Run `tsc --noEmit` and the type/phantom property tests
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

### Phase P2: Functions Enforcement + JWT-Only Resolution

- [x] 9. Add the generic `requireFeature` guard to `auth-core`
  - [x] 9.1 Implement `auth-core/src/middleware/requireFeature.ts` with a `check` callback (no app-specific logic)
  - [x] 9.2 Export `requireFeature` from `auth-core/src/index.ts`; add unit tests (allow/deny)
  - _Requirements: 7.2, 9.2_

- [x] 10. Add app-side guards in `functions/lib/auth.ts`
  - [x] 10.1 Add `requireAdmin` (= `requireRole(ROLE_CATEGORIES.admin, …)`) sourcing the group from one shared definition
  - [x] 10.2 Add `requireFeatureAccess(featureKey, handler)` binding `requireFeature` to a server-side `entitlementCheck`
  - [x] 10.3 Re-export `requireRole`/`requireProduct`/`requireFeature`
  - _Requirements: 7.2, 9.2_

- [x] 11. Convert all Function handlers to guards (remove inline role literals)
  - [x] 11.1 Build the guard matrix: list every handler + its required role group/product/feature
  - [x] 11.2 Convert the ~15+ admin-literal handlers (`storage/upload-url`, `storage/download-url`, `settings/[[path]]`, `resume/save`, `learners/{trainings,management,by-email,dashboard,actions}`, `educator/dashboard/[[path]]`, `ai-tutor/{get-learner-type,get-generation-usage}`, `streak/[[path]]`, `recruitment/members`, `opportunities`) to `withAuth(requireAdmin(...))` / appropriate `requireRole`
  - [x] 11.3 Remove the `user.role` (singular) usage in `opportunities/index.ts`; use `user.roles`
  - [x] 11.4 Add a guard-presence test: every exported handler is wrapped by a guard or explicitly marked public
  - _Requirements: 7.1, 7.2, 3.2_

- [x] 12. Stop Functions resolving authorization from shadow stores
  - [x] 12.1 Replace `users.role`/`user_roles`/`teachers.role`/`school_educators.role` authorization reads with JWT `user.roles` across the 11+ handlers
  - [x] 12.2 For school-internal permission lookups, route through `resolveSchoolRole` (JWT role for SSO roles; school-internal mapping otherwise) — see Task 19
  - [x] 12.3 Add the JWT-only-resolution property test
  - _Requirements: 7.3, 7.4, 7.8_

- [x] 13. Make the frontend a consumer (remove client trust boundary)
  - [x] 13.1 Rewrite `useUserRole` to derive the role from the auth store / a Function endpoint; remove `teachers`/`school_educators` email lookups, URL inference, and the `subject_teacher` default
  - [x] 13.2 Make `roleLookupService` and `permissionService` thin clients over enforcing Functions (advisory/UX)
  - [x] 13.3 Derive auth-store role booleans from `ROLE_CATEGORIES`; stop persisting them to `localStorage` as a trust signal
  - [x] 13.4 Annotate `ProtectedRoute` as UX-only; ensure backing Functions enforce
  - _Requirements: 7.5, 7.6, 7.9, 6.1_

- [x] 14. Gate P2 — enforcement + preservation
  - [x] 14.1 Per-endpoint deny tests (authorized → 200, unauthorized → 403, server-side)
  - [x] 14.2 Preservation tests: routes, admin authorization, `pickPrimaryRole`, auth-store helpers unchanged for the same inputs
  - [x] 14.3 Org-scoping test (role valid in org A denied in org B context)
  - _Requirements: 7.1, 7.3, 3.1, 3.2, 3.3, 3.4, 3.5_

### Phase P3: App-DB Role Infrastructure + Type Generation

- [x] 15. Create the role infrastructure tables (Expand — DDL migration files only)
  - [x] 15.1 Verify the physical existence of the legacy `roles` (name, description, …) and `user_roles` tables; confirm what currently FKs to `roles`
  - [x] 15.2 Migration: replace the existing `roles` shadow with the optimised, name-keyed shadow synced from sso-worker (drop/replace handled with dependency check)
  - [x] 15.3 Migration: `role_categories` table (FK → `roles.name`, category CHECK, priority)
  - [x] 15.4 Migration: `school_internal_roles` lookup table
  - [x] 15.5 Propose each Supabase command and wait for approval before running
  - _Requirements: 5.2, 5.3, 3.1_

- [x] 16. Implement the shadow sync (event-driven push over Service Binding RPC)
  - [x] 16.1 Add `syncRolesShadow()` in `functions/lib/sync-shadow.ts` mirroring `syncSubscriptionCache()`, pulling roles via the `SSO_SERVICE` RPC
  - [x] 16.2 Wire on-demand refresh (cache-miss) + a scheduled reconcile
  - [x] 16.3 (Conditional) Validate whether cross-project logical replication is permitted on the Supabase tier; if so, document it as the alternative — otherwise keep RPC push
  - _Requirements: 5.2_

- [x] 17. Seed reference data (DML in seed files only)
  - [x] 17.1 Seed `role_categories` for the 16 SSO roles
  - [x] 17.2 Seed `school_internal_roles` (principal, vice_principal, it_admin, class_teacher, subject_teacher, etc.)
  - [x] 17.3 Verify the shadow `roles` table equals the canonical 16 after sync
  - _Requirements: 5.2, 5.3_

- [x] 18. Add the type generation script + CI drift check
  - [x] 18.1 Implement `scripts/generate-role-types.ts` reading `roles` + `role_categories`, emitting `src/shared/types/generated/roles.ts`
  - [x] 18.2 Add a CI step + pre-commit hook that regenerates and fails on drift
  - _Requirements: 5.1_

- [x] 19. Resolve the user → school-internal-role mapping
  - [x] 19.1 Decide (and implement) whether to derive from `teachers`/`school_educators` records or add a `user_school_role` assignment table/view
  - [x] 19.2 Implement `resolveSchoolRole(userId, orgId)` used by the college-permission lookup
  - _Requirements: 8.5_

### Phase P4: Contract (Destructive — REQUIRES APPROVAL)

- [x] 20. Re-type the school-internal permission tables off the enum (Expand+backfill)
  - [x] 20.1 Migration: add nullable `role_code` FK columns on `college_role_module_permissions` and `college_role_scope_rules` → `school_internal_roles`
  - [x] 20.2 Seed: backfill `role_code` from the old `role_type` enum values; assert no NULLs
  - [x] 20.3 Update `settings/[[path]].ts` and `user/handlers/actions.ts` `get-permissions` to query by `role_code` via `resolveSchoolRole`
  - _Requirements: 8.1, 8.5_

- [x] 21. Reconcile role assignment + RLS before drops
  - [x] 21.1 Change the `handle_new_user` signup trigger to stop writing an authoritative `users.role` (assignment owned by sso-worker `membership_roles`)
  - [x] 21.2 Assess whether the `users.role`/`auth.jwt()` RLS policies are vestigial under SSO + `service_role`; rewrite or remove (`license_assignments`, `license_pools`, `class_swap_requests`, `user_categories`, others)
  - [x] 21.3 Add tests confirming equivalent allow/deny outcomes (or confirmed-vestigial removal)
  - _Requirements: 8.2, 8.2a, 8.3_

- [x] 22. Drop legacy stores (BREAKING — propose each command, get approval)
  - [x] 22.1 Migration: drop `users.role` column and the `user_roles` table (only after confirming it exists and nothing reads it for authz)
  - [x] 22.2 Migration: drop the old `role_type` enum columns; then `DROP TYPE public.user_role`
  - [x] 22.3 Remove authority usage of `teachers.role`/`school_educators.role`
  - [x] 22.4 Full regression suite green
  - _Requirements: 7.4_

### Phase P5: Product & Feature Enforcement (in Cloudflare Functions)

- [x] 23. Enforce product access in Functions
  - [x] 23.1 Identify product-gated endpoints; wrap with `requireProduct(<productCode>)` against JWT `products[]`
  - [x] 23.2 Add product deny tests (server-side)
  - _Requirements: 9.1_

- [x] 24. Enforce feature/add-on entitlements in Functions
  - [x] 24.1 Implement `entitlementCheck` reading `subscription_cache`/`plans_cache`/entitlements (canonical state SSO-side)
  - [x] 24.2 Wrap feature-gated endpoints with `requireFeatureAccess(featureKey, handler)`
  - [x] 24.3 Demote `featureGating.ts`/`useFeatureGate`/`PlanFeatureGate`/`FeatureLockOverlay` to UX-only
  - [x] 24.4 Add feature deny tests (server-side); confirm client gates are not the sole gate
  - _Requirements: 9.2, 9.3, 9.4_

- [x] 25. Final verification
  - [x] 25.1 Run all correctness-property tests (Properties 1–11) and the full regression
  - [x] 25.2 Confirm no exported Function handler lacks a guard (CC-2 invariant)
  - [x] 25.3 Confirm the bug-condition exploration tests from Task 1 now fail to reproduce the bug (bug fixed)
  - _Requirements: 1.1, 2.1, 7.1, 7.3, 9.1, 9.2_

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "description": "Bug-condition exploration (confirm defects)" },
    { "wave": 2, "tasks": ["2", "3", "4"], "description": "P0 compile-breaking fixes (parallel)" },
    { "wave": 3, "tasks": ["5"], "description": "P0 gate — build green" },
    { "wave": 4, "tasks": ["6"], "description": "P1 canonical generated role module" },
    { "wave": 5, "tasks": ["7"], "description": "P1 phantom roles + duplicates" },
    { "wave": 6, "tasks": ["8"], "description": "P1 gate" },
    { "wave": 7, "tasks": ["9", "15"], "description": "P2 requireFeature guard + P3 DB infra (independent, parallel)" },
    { "wave": 8, "tasks": ["10", "16", "17"], "description": "App guards + shadow sync + seed reference data" },
    { "wave": 9, "tasks": ["11", "18", "19"], "description": "Convert handlers + type-gen + school-role mapping" },
    { "wave": 10, "tasks": ["12"], "description": "Stop shadow-store authz resolution in Functions" },
    { "wave": 11, "tasks": ["13"], "description": "Frontend becomes consumer" },
    { "wave": 12, "tasks": ["14"], "description": "P2 gate — enforcement + preservation" },
    { "wave": 13, "tasks": ["20"], "description": "P4 re-type college tables + backfill" },
    { "wave": 14, "tasks": ["21"], "description": "P4 reconcile assignment + RLS (pre-drop)" },
    { "wave": 15, "tasks": ["22"], "description": "P4 drop legacy stores (REQUIRES APPROVAL)" },
    { "wave": 16, "tasks": ["23", "24"], "description": "P5 product + feature enforcement (parallel)" },
    { "wave": 17, "tasks": ["25"], "description": "Final verification" }
  ]
}
```

## Notes

- **Approval gates**: every Supabase command (tasks 15.4, 20, 22) must be proposed and explicitly approved before execution; the Contract drops in task 22 are breaking.
- **Parallelism**: wave 7 starts Functions guards (9) and DB infra (15) in parallel after the P1 gate. P5 product (23) and feature (24) enforcement are independent of each other.
- **Green-at-every-step**: tasks 5, 8, 14 are gates; do not proceed past a gate with a red build or failing preservation tests.
- **Auth packages stay generic**: only `requireFeature` (callback-based) is added to `auth-core`; app-specific entitlement logic lives in `functions/lib/auth.ts`.
- **No DB backstop (CC-2)**: a handler without a guard equals open access — task 11.4 enforces guard-presence as a test invariant.
- **Behavior preservation** is validated in task 14.2 and re-checked in task 25.

