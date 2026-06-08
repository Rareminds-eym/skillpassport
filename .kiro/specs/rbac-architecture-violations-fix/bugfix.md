# Bugfix Requirements Document

## Introduction

The SkillPassport codebase currently violates the established RBAC (Role-Based Access Control) architecture defined in `.kiro/architecture/RBAC_AND_ROLE_MANAGEMENT_ARCHITECTURE.md`. The architecture mandates a **database-driven RBAC system** where roles are consumed from the SSO auth database at runtime, enabling zero-downtime role changes. However, the codebase has multiple critical violations.

> **Verification note**: All findings below were verified against the ACTUAL current code (file reads + compiler diagnostics) as of this investigation, NOT the historical `2026-06-06_comprehensive-role-audit_report.md`. Where the historical report and current code diverge, current code wins. Several counts in the historical report (e.g. "14 ADMIN_ROLES in 12 files", "6 copies of getManagePath") no longer match the current code and have been corrected here.

> **Scope (decided)**: This is a **full architecture migration**, executed in phases P0–P4 (see Resolved Architectural Decisions). The canonical authorization source is the **sso-worker** JWT; **Cloudflare Functions** are the single enforcement boundary via `auth-core`; the app DB hosts a new read-only shadow `roles` table + `role_categories` for reference and type generation only.

**Confirmed compilation-breaking bugs** (verified via `getDiagnostics`):
1. **Broken `@/shared/types` barrel** — `validation.ts` and `utils.ts` import `User`, `UserRole`, `CreateUserData`, `UpdateUserData` from `@/shared/types`, but `src/shared/types/index.ts` exports none of them (6 compile errors)
2. **`RecruitmentRole` not exported** — imported in 5 `org-recruitment` UI files but never exported from `src/entities/recruitment/model/types.ts`
3. **`authStore.ts` self-import** — line 12 imports `useAuthStore` from `@/shared/model/authStore` (the file itself), conflicting with the local declaration

**Architecture / consistency violations:**
4. **7 conflicting `UserRole` type definitions** with no canonical source
5. **Phantom role check** — `college_lecturer` compared as a `user_role` at `Settings.tsx:1176` (always false / dead code)
6. **Hardcoded role arrays** across frontend routes, validation, login/signup, and backend functions
7. **Three hardcoded permission matrices** that should be DB-driven per the architecture
8. **Privilege-by-URL anti-pattern** in `useUserRole` (infers `school_admin` from the URL path; defaults to `subject_teacher`)
9. **Missing DB infrastructure** — no `role_categories` table, no `school_role_permissions` table, no type-generation script
10. **DB `user_role` enum diverges sharply** from the roles actually used in code

**Single-source-of-truth / enforcement-boundary violations (roles MUST flow through sso-worker + Cloudflare Functions):**

The verified correct architecture is: the **sso-worker** is the canonical source — it resolves a user's roles via the `get_jwt_claims(p_user_id, p_org_id)` RPC (joining `membership_roles` → `roles`) and signs them into an RS256 JWT as `roles[]` + `products[]`. **Cloudflare Functions** are the enforcement boundary — `functions/lib/auth.ts` wraps `@rareminds-eym/auth-core` (`withAuth` verifies the JWT via the `SSO_SERVICE` RPC binding to `sso-api`; `requireRole`/`requireProduct` gate by the JWT roles). The frontend should only *consume* roles for display/routing, never *decide* authorization or *resolve* identity roles itself.

The canonical role set (sso-worker `roles` seed) is exactly **16 roles**: `owner, admin, member, super_admin, rm_admin, rm_manager, company_admin, educator, school_educator, college_educator, school_admin, college_admin, university_admin, recruiter, hr, learner`.

Against that architecture, the following are violated:
11. **`requireRole`/`requireProduct` are never used** — they are exported by `auth-core` and re-exported by `functions/lib/auth.ts`, but **zero handlers apply them**; every function re-implements an ad-hoc hardcoded admin-role array check instead
12. **Shadow role store bypasses the SSO JWT** — 11+ functions read authorization/identity roles from the app DB (`users.role` column and the `user_roles` table) rather than from the verified JWT `roles[]`, creating a dual/competing role model
13. **A third role-resolution path on the frontend** — `useUserRole` resolves a user's role by calling `/user/actions` to query `teachers`/`school_educators` tables by email (and falling back to URL/`subject_teacher`), completely bypassing the SSO JWT roles
14. **Frontend is treated as a security boundary** — `authStore` role-helper booleans are computed client-side and persisted to `localStorage`, and recruitment permission checks run client-side (`useHasPermission`, `checkPermission`, `isCurrentUserAdmin`) — none of which can be a trust boundary

**Impact**:
- **Build is currently broken** — at least 9 confirmed type errors across 3 files
- **Authorization is not enforced through one boundary** — admin gating is duplicated as hardcoded arrays in functions instead of `requireRole`, and a shadow `users.role`/`user_roles` store competes with the SSO JWT
- **Privilege escalation risk** — frontend-computed role booleans persisted to `localStorage` and role inferred from URL path are trivially manipulable; only the Functions layer (JWT-verified) can be trusted
- **Zero-downtime role changes impossible** — adding/removing roles requires code deployment
- **Type safety broken** — 7 conflicting type definitions; code valid in one module is invalid in another
- **Silent bugs** — `college_lecturer` role check never evaluates true

**Bug Condition Summary**:  
The bug exists when: (1) roles are hardcoded in source code rather than consumed from the SSO JWT, (2) any authorization decision is made outside Cloudflare Functions / `auth-core` (frontend or shadow DB store), (3) multiple conflicting type definitions exist, (4) phantom roles appear in code but not in the canonical SSO role set, (5) imports reference symbols that are never exported (broken compilation).

---

## Bug Analysis

### Current Behavior (Defect)

#### Section 1: Compilation-Breaking Bugs (verified via compiler diagnostics)

**1.1** WHEN `src/entities/user/model/validation.ts` and `src/entities/user/model/utils.ts` import `User`, `UserRole`, `CreateUserData`, `UpdateUserData` from `@/shared/types` THEN the system fails to compile because `src/shared/types/index.ts` exports none of these symbols (6 confirmed errors: `Module '"@/shared/types"' has no exported member 'User'/'UserRole'/'CreateUserData'/'UpdateUserData'`)

**1.2** WHEN any of the 5 `org-recruitment` UI files (`ChangeRoleModal.tsx`, `EmployeeList.tsx`, `InvitationsList.tsx`, `InviteEmployeeModal.tsx`, and a cast usage) import `type { RecruitmentRole }` from `@/entities/recruitment/model/types` THEN the system fails to compile because `RecruitmentRole` is never exported from that module (the module uses inline `'company_admin' | 'recruiter' | 'viewer'` unions instead) — confirmed error: `Module '"@/entities/recruitment/model/types"' has no exported member 'RecruitmentRole'`

**1.3** WHEN `src/shared/model/authStore.ts:12` executes `import { useAuthStore } from '@/shared/model/authStore'` THEN the file imports itself, conflicting with its own local `useAuthStore` declaration

**1.4** WHEN `src/features/org-recruitment/ui/InviteEmployeeModal.tsx:35` passes a `message` property in a `CreateInvitationRequest` object THEN the system fails to compile because `message` is not a known property of `CreateInvitationRequest`

#### Section 2: Conflicting and Phantom Type Definitions

**2.1** WHEN developers reference a `UserRole` type THEN the system has 7 conflicting definitions with no canonical source: `features/auth/api/index.ts:10` (8 roles), `entities/user/model/types.ts:10` (15 roles incl. `principal`/`vice_principal`/`it_admin`/`class_teacher`/`subject_teacher`), `shared/types/permissions.ts:3` (9 school roles, NONE in the DB enum), `shared/types/messaging.ts:9` (7 roles), `entities/user/model/useUserRole.ts:7` (5 school roles), `pages/admin/schoolAdmin/Settings.tsx:39` (9 roles, local), `features/auth/ui/UnifiedSignup.tsx:37` (8 roles incl. phantom `recruitment_admin`)

**2.2** WHEN code checks `userRole === 'college_lecturer'` at `src/pages/educator/Settings.tsx:1176` THEN the comparison is always false because `college_lecturer` is not a value in any `UserRole` type nor the DB `user_role` enum (it is only valid as the `college_lecturers` table name and as a messaging `recipient.type` label, e.g. `ConversationModal.tsx:114`)

**2.3** WHEN the DB `user_role` enum (`supabase/migrations/20260526000000_schema.sql:367`) is compared to the roles used in code THEN they diverge sharply: the enum contains `super_admin, rm_admin, rm_manager, school_student, college_student` (the last two marked DEPRECATED) which the frontend types omit, while code uses `admin, educator, hr, owner, member, viewer, principal, vice_principal, it_admin, class_teacher, subject_teacher, recruitment_admin, accountant, librarian, parent, career_counselor, college_lecturer` which are NOT in the enum

#### Section 3: Hardcoded Role Arrays (Architecture Violation)

**3.1** WHEN route guards need role lists THEN the system uses hardcoded arrays instead of querying the database: `LEARNER_ROLES = ['learner']` (`learnerRoutes.jsx:17`), `EDUCATOR_ROLES = ['educator','school_educator','college_educator']` (`educatorRoutes.jsx:6`), `RECRUITER_ROLES = ['recruiter','company_admin']` (`recruiterRoutes.jsx:7`), `COLLEGE_ADMIN_ROLES`/`SCHOOL_ADMIN_ROLES`/`UNIVERSITY_ADMIN_ROLES` (`adminRoutes.jsx:8-10`)

**3.2** WHEN `src/entities/user/model/validation.ts:14` defines `VALID_ROLES` THEN the array contains duplicate `'learner'` entries appearing **4 times** (positions 1, 7, 8, 12) and is a hardcoded list rather than sourced from the database

**3.3** WHEN frontend auth flows need role lists THEN the system uses hardcoded arrays: `ALL_ROLES` (`UnifiedLogin.tsx:22`), `allRoles` incl. phantom `recruitment_admin` (`UnifiedSignup.tsx:322`), `ADMIN_ROLES = ['school_admin','college_admin','university_admin']` (`LoginAdmin.tsx:14`), `validRoles = ['school_admin','principal','it_admin','class_teacher','subject_teacher']` (`TeacherBulkImport.tsx:81`), and `adminDesignations = ['principal','dean','hod','admin','director']` (AdmissionNoteModal, two copies)

**3.4** WHEN backend Cloudflare Functions authorize admin operations THEN the system uses hardcoded `ADMIN_ROLES` declared independently in **3 files** (not the 12 claimed by the historical report): `functions/api/educator/dashboard/[[path]].ts:40` (array), `functions/api/learners/data/[[path]].ts:6` (identical array), and `functions/api/ai-tutor/handlers/get-generation-usage.ts:18` (a `Set` with the same members, different ordering/type) — all containing `['admin','company_admin','owner','college_admin','university_admin','school_admin']`

#### Section 4: Hardcoded Permission Matrices (should be DB-driven)

**4.1** WHEN school-internal learner-management permissions are needed THEN they are hardcoded in `src/shared/types/permissions.ts:25-118` (`LEARNER_MANAGEMENT_PERMISSIONS`) as a matrix over 9 phantom roles, instead of a `school_role_permissions` table

**4.2** WHEN school educator feature permissions are needed THEN they are hardcoded in `src/entities/user/model/useUserRole.ts:22-54` (`ROLE_PERMISSIONS`) instead of being DB-driven

**4.3** WHEN recruitment role permissions are needed THEN they are hardcoded in `src/entities/recruitment/model/types.ts:175-225` (`ROLE_PERMISSIONS` + `DATABASE_TO_FRONTEND_PERMISSIONS`), with a comment admitting they must be manually kept in sync with the `recruitment_role_mapping` migration (no generation)

#### Section 5: Missing Database Infrastructure

**5.1** WHEN the architecture specifies a `role_categories` table THEN the table DOES NOT EXIST (0 matches across `supabase/`, `functions/`, `src/`)

**5.2** WHEN the architecture specifies a `school_role_permissions` table THEN the table DOES NOT EXIST (0 matches); permissions live in the hardcoded matrices of Section 4

**5.3** WHEN the architecture specifies auto-generated TypeScript role types THEN no generation script exists; the 7 hand-written `UserRole` types are maintained manually

#### Section 6: Role Resolution Anti-Patterns & Inconsistencies

**6.1** WHEN `src/entities/user/model/useUserRole.ts` resolves a user's role THEN it infers `school_admin` from the URL path (lines ~113-118, 130-133) and defaults to `subject_teacher` (lines 57, 121) — a privilege-by-URL anti-pattern rather than verifying against authenticated claims

**6.2** WHEN the `UserRole` type in `features/auth/api/index.ts:10` is compared to the roles the auth store actually handles THEN it is missing `admin`, `company_admin`, `owner`, `hr`, `member` that `authStore.ts` recognizes at runtime

**6.3** WHEN `pickPrimaryRole` (`authStore.ts`) selects a primary role THEN its priority list includes `owner`, `hr`, `member` which have no dashboard routes, no manage routes, and no route guards (they fall through to the default route). NOTE: `isAdminRole`, `isRecruiterRole`, and `pickPrimaryRole` DO currently include `company_admin` — contrary to the historical report's "missing" claim; this has already been fixed

**6.4** WHEN `recruitment_admin` is used THEN it remains an active phantom role in `src/features/auth/ui/UnifiedSignup.tsx` (lines 37, 322, 323, 330, 558, 670, 1400) as a selectable signup role, despite not existing in the SSO roles table

#### Section 7: Roles Not Flowing Through sso-worker + Cloudflare Functions (Enforcement-Boundary Violations)

**7.1** WHEN a Cloudflare Function needs to authorize an admin-only operation THEN it re-implements a hardcoded role-array check instead of using `requireRole` from `auth-core` — confirmed in **15+ files**: `functions/api/storage/upload-url.ts:34`, `storage/download-url.ts:34`, `settings/[[path]].ts:127`, `resume/save.ts:38`, `learners/trainings.ts:21,115`, `learners/management.ts:13`, `learners/by-email.ts:31`, `learners/dashboard.ts:24`, `learners/actions.ts:13`, `educator/dashboard/[[path]].ts:40`, `ai-tutor/handlers/get-learner-type.ts:66`, `ai-tutor/handlers/get-generation-usage.ts:18`, `streak/[[path]].ts:230` (`roles.includes('admin')`), `recruitment/members/index.ts:194` (`['owner','company_admin'].includes(invitee_role)`), `opportunities/index.ts:52` (all check variants of `['admin','company_admin','owner','school_admin','college_admin','university_admin']`)

**7.1a** WHEN `functions/api/opportunities/index.ts:52` checks `['recruiter','company_admin'].includes(user.role)` THEN the first clause is dead code because the `auth-core` `AuthUser` shape has NO `role` (singular) field — only `roles[]`; the check only works via the `|| user.roles.includes(...)` fallback. This indicates handlers written against an inconsistent user shape

**7.2** WHEN `auth-core` exposes `requireRole` and `requireProduct` and `functions/lib/auth.ts` re-exports them THEN NO handler in `functions/` actually applies them — the single intended authorization primitive is dead code, so authz is duplicated ad-hoc per handler

**7.3** WHEN a Function needs to know a user's role/identity THEN 11+ handlers read it from the app-DB shadow store (`users.role` column or the `user_roles` table) instead of the verified JWT `user.roles[]` — confirmed in `functions/api/school-admin/actions.ts:90`, `functions/api/school-admin/curriculum.ts:41`, `functions/api/user/handlers/actions.ts:71,79,191,199`, `functions/api/user/handlers/authenticated.ts:65`, `functions/api/user/handlers/management.ts:99`, `functions/api/organization/handler.ts:177`, `functions/api/learner-profile/actions.ts:864`, `functions/api/college-admin/[[path]].ts:290`, `functions/api/college-admin/school-admin.ts:406`, `functions/api/college-admin/actions.ts:326`, `functions/api/college-admin/faculty.ts:384-407` (the last reads AND writes `user_roles`)

**7.4** WHEN the system has a canonical role set in the sso-worker (16 roles in `roles` table, resolved by `get_jwt_claims` which `array_agg`s `r.name` from `membership_roles → roles`) THEN the app DB simultaneously maintains MULTIPLE competing role stores: the `users.role` column (`user_role` enum), the `user_roles` join table, the `teachers.role` column (`principal`/`it_admin`/`class_teacher`/`subject_teacher`/`school_admin`, aggregated in `educator-copilot/actions.ts:123-127`), and the `school_educators.role` column — at least 5 parallel role sources that can drift from the SSO JWT

**7.8** WHEN a Function reads role from a client-supplied stored user THEN `functions/api/school-admin/actions.ts:113` does `JSON.parse(storedUser)` and trusts `parsed.role === 'school_admin'` — deriving authorization from client-controllable data rather than the verified JWT

**7.9** WHEN the frontend enforces route access THEN `src/app/components/ProtectedRoute.jsx` decides `hasAccess` purely client-side using `useUserRole()` (the broken email/URL-based resolver) and a local `getRoleCategory` map; for routes whose backing Functions do not independently enforce `requireRole`, this client check is the only gate

**7.10** WHEN the frontend resolves a user's role/permissions THEN there are ADDITIONAL resolution paths beyond `authStore`/`useUserRole`: `src/entities/user/api/roleLookupService.ts` (`getUserRole` → `/user/actions` `lookup-user-roles`, which reads `users.role`/`teachers`/`school_educators`) and `src/entities/user/api/permissionService.ts`. These all ultimately derive from the shadow stores rather than the SSO JWT and must be reconciled to the canonical source

**7.11** WHEN product/feature access is gated THEN `requireProduct` (exported by `auth-core`, re-exported by `functions/lib/auth.ts`) is — like `requireRole` — applied in ZERO handlers, even though the JWT carries `products[]` and `authStore` correctly stores `me.products`. Product-level access is therefore not enforced at the Functions boundary (now IN SCOPE — see Section 9)

> **Refinement (positive):** `authStore.ts:158` DOES correctly source `roles`/`products` from the SSO JWT via `getMe()` (confirmed). The frontend's role *source* is correct; the violations are the local *decisions* (helpers, client-side gating) and the deviant `useUserRole`/`roleLookupService` resolution paths.

#### Section 9: Product & Feature-Entitlement Gating (now in scope)

**9.1** WHEN coarse product access (e.g. access to the `skillpassport` product) should be enforced THEN no Function uses `requireProduct` against the JWT `products[]`; product entitlement is not checked at the request boundary

**9.2** WHEN fine-grained feature/add-on access is decided THEN it is computed CLIENT-SIDE as the effective gate: `src/features/subscription/lib/featureGating.ts` (`hasFeatureAccess`, `getFeatureAccessLevel`), the `useFeatureGate` hook (with an in-memory `accessCache`), and the UI gates `PlanFeatureGate.tsx` / `FeatureLockOverlay.tsx` — a client can bypass these to reach the underlying Function/data

**9.3** WHEN a server-side entitlement check does exist (`entitlementService.hasFeatureAccess(userId, featureKey)` → backend) THEN it is invoked from the client for UX, but protected feature endpoints do not consistently re-enforce entitlement server-side before returning gated data/operations

**9.4** WHEN subscription/entitlement data is needed THEN the app already maintains app-DB shadow caches (`subscription_cache`, `plans_cache`, `users_shadow`) synced from the SSO/auth DB via `functions/lib/sync-shadow.ts`, and subscription data flows from the sso-worker via Service Binding RPC (`functions/lib/sso-client.ts`) — the canonical subscription source is the SSO/auth side, consistent with the roles single-source-of-truth model

#### Section 8: Database-Level Coupling (discovered — affects the migration plan)

**8.1** WHEN the `user_role` enum is removed (Decision: remove completely) THEN every dependent column must be re-typed first: `users.role` is dropped; `college_role_module_permissions.role_type` and `college_role_scope_rules.role_type` (`supabase/migrations/20260526000000_schema.sql:13521,13534`, both `NOT NULL`) must be migrated to a FK referencing a new app-owned `school_internal_roles` lookup table (or `TEXT`+`CHECK` fallback); the signup trigger must stop casting to the enum — only then can `DROP TYPE user_role` succeed

**8.2** WHEN RLS policies gate tables in the skillpassport DB THEN several read `users.role` directly and reference `super_admin` — e.g. `license_assignments`, `license_pools`, `class_swap_requests` (`u.role = ANY(ARRAY['school_admin','college_admin','university_admin','super_admin']::user_role[])`) and `user_categories` (`auth.jwt() ->> 'role' = 'admin'`). Dropping `users.role` (Decision #2 Contract phase) breaks all of these and they must be rewritten first

**8.2a** WHEN these RLS policies evaluate `auth.uid()` / `auth.jwt()` THEN they assume a Supabase-Auth session, but the app authenticates via the SSO worker and Functions use the `service_role` client (which bypasses RLS) — so these policies are likely already vestigial/ineffective and need an explicit keep-vs-drop assessment, not just a rewrite

**8.3** WHEN a user signs up THEN a DB trigger (`supabase/migrations/20260526000000_schema.sql:~5994`) derives a role from `raw_user_meta_data->>'user_role'` (validated against a hardcoded enum subset, defaulting to `learner`) and writes it to `users.role` — a role-ASSIGNMENT path that competes with the sso-worker `membership_roles` assignment and must be reconciled so assignment is owned by the SSO worker

**8.4** WHEN the app needs SSO role data locally THEN a postgres_fdw foreign server `sso_worker_server` and a `sso_foreign` schema ALREADY EXIST, exposing `sso_foreign.{users,organizations,memberships,roles,membership_roles}` (`20260526000013_org_recruitment_dashboard_option3.sql`), and the recruitment system already joins `sso_foreign.roles` → `membership_roles`. This FDW is acceptable for the low-frequency, org-scoped recruitment queries, but is the WRONG mechanism for the hot `roles` reference table (per-read network round-trip). The new shadow `roles` table (Decisions #1/#2) SHALL instead be kept current via **event-driven push over the existing `SSO_SERVICE` Service Binding RPC** (consistent with `sso-client.ts`/`sync-shadow.ts`), with **PostgreSQL logical replication** as a conditional alternative only if validated feasible on the current managed-Supabase tier

**8.5** WHEN the KEPT college/school-internal permission system resolves a user's permissions THEN `functions/api/user/handlers/actions.ts` `get-permissions` reads `users.role` and joins it to `college_role_module_permissions.role_type` (`.eq('role_type', userData.role)`), and `settings/[[path]].ts` reads/writes `college_role_module_permissions`/`college_role_scope_rules` by `role_type`. Because Decision #2 drops `users.role`, the migration MUST provide a replacement way to determine a user's permission role: use the JWT role for roles that ARE SSO roles (e.g. `college_admin`), and a new `user → school_internal_role` mapping for roles that are NOT SSO roles (`principal`, `it_admin`, etc.). This user→school-internal-role mapping does not exist yet and must be designed (e.g. derived from the `teachers`/`school_educators` records or a dedicated assignment table)

**8.6** WHEN the app DB is inspected THEN a shadow `roles` table ALREADY EXISTS (`20260526000000_schema.sql:18350`: `name varchar(50)`, `description text`, `created_at`, `updated_at` — keyed on `name`, no `id`), matching the architecture §2 "shadow roles" description. Additionally, `college-admin/faculty.ts` and `user/handlers/actions.ts` query a `user_roles` table (`role:role_id(id,name,slug)`) for which NO `CREATE TABLE` exists in the main schema — so `user_roles` is either created by another migration or is a phantom table whose queries error at runtime. The migration (Decision #2) SHALL **replace** the existing `roles` table with the new optimised shadow (not create a duplicate) and SHALL verify `user_roles`' physical existence before relying on or dropping it

**7.5** WHEN `useUserRole` (frontend) resolves a user's role THEN it calls `/user/actions` (`get-teacher-role-by-email`, `get-educator-role-by-email`) which query the `teachers` and `school_educators` tables by email — a THIRD role-resolution path that bypasses the SSO JWT roles entirely, then falls back to inferring `school_admin` from the URL path and finally defaulting to `subject_teacher`

**7.6** WHEN the frontend gates UI or decides access THEN it computes authorization client-side and treats it as authoritative: `authStore` role-helper booleans persisted to `localStorage`, `validation.ts` `isAdminRole`/`isRecruiterRole`, and recruitment checks `useHasPermission` (`useOrgContext.ts:118`), `checkPermission`/`isCurrentUserAdmin` (`orgContextService.ts`) using the client-side `ROLE_PERMISSIONS` matrix — none of which is a trustworthy enforcement boundary

**7.7** WHEN recruitment permissions are enforced server-side THEN `functions/lib/permissions.ts` resolves them via app-DB RPCs (`get_user_org_context`, `has_recruitment_permission`, `is_org_member`, `get_user_recruitment_roles`) with a separate `PERMISSIONS` constant set — a parallel authorization model that is not unified with `auth-core` role/product checks

---

### Expected Behavior (Correct)

#### Section 1: Compilation Correctness

**E1.1** WHEN `validation.ts` and `utils.ts` import `User`, `UserRole`, `CreateUserData`, `UpdateUserData` from `@/shared/types` THEN the system SHALL either export those symbols from `src/shared/types/index.ts` or update the imports to the correct source module, so the code compiles

**E1.2** WHEN any file imports `RecruitmentRole` from `@/entities/recruitment/model/types` THEN the system SHALL successfully compile because the type is exported as `export type RecruitmentRole = 'company_admin' | 'recruiter' | 'viewer';`

**E1.3** WHEN `authStore.ts` references `useAuthStore` THEN the system SHALL use the locally-declared store rather than importing itself (the self-import on line 12 SHALL be removed)

**E1.4** WHEN `InviteEmployeeModal.tsx` creates an invitation THEN the system SHALL pass only properties defined on `CreateInvitationRequest` (the invalid `message` property SHALL be removed or the type SHALL be extended)

#### Section 2: Canonical Type & Phantom Role Fixes

**E2.1** WHEN developers reference a `UserRole` type THEN the system SHALL have ONE canonical type definition (covering all canonical SSO roles) that the other modules re-export or import, eliminating the 7 conflicting definitions

**E2.2** WHEN code needs to check for the college educator notice at `Settings.tsx:1176` THEN the system SHALL use the valid role `college_educator` (not `college_lecturer`) or remove the check

**E2.3** WHEN validation uses `VALID_ROLES` THEN the system SHALL have no duplicate entries (`'learner'` SHALL appear once, down from 4 times)

**E2.4** WHEN `recruitment_admin` is referenced in `UnifiedSignup.tsx` THEN the system SHALL replace it with a valid SSO role (or document it explicitly as a UI-only redirect label not used in any role check)

#### Section 3: Database-Driven Role Categories

**E3.1** WHEN the codebase needs to determine which roles belong to a category (learner, educator, recruiter, admin) THEN the system SHALL query the `role_categories` table (or a cached projection of it) at runtime instead of using hardcoded arrays

**E3.2** WHEN backend Functions authorize admin operations THEN the system SHALL resolve admin roles from `role_categories` (category = 'admin') via a shared helper instead of the 3 independently-declared `ADMIN_ROLES` literals

**E3.3** WHEN a new role is added THEN the system SHALL require ONLY database inserts (`roles` + `role_categories`) with ZERO code changes or deployments; removing a role SHALL require only a DB delete/soft-delete

#### Section 4: DB-Driven Permission Matrices

**E4.1** WHEN school-internal permissions are needed THEN the system SHALL source them from a `school_role_permissions` table instead of the hardcoded `LEARNER_MANAGEMENT_PERMISSIONS` and `useUserRole.ROLE_PERMISSIONS` matrices

**E4.2** WHEN recruitment permissions are needed THEN the system SHALL derive `ROLE_PERMISSIONS`/`DATABASE_TO_FRONTEND_PERMISSIONS` from the `recruitment_role_mapping` table rather than a manually-synced hardcoded object

#### Section 5: Type Generation & Schema

**E5.1** WHEN role types are needed THEN the system SHALL auto-generate the canonical `UserRole` type from the roles table via a generation script, regenerated when roles change

**E5.2** WHEN the system categorizes roles THEN a `role_categories` table SHALL exist **in the app DB** with columns `id`, `role_name` (FK to the app-DB shadow `roles` table), `category`, `priority`, `created_at`, `updated_at`, consumed by Functions and the type generator

**E5.3** WHEN school role permissions are stored THEN a `school_role_permissions` table SHALL exist, replacing the hardcoded matrices

#### Section 6: Secure Role Resolution

**E6.1** WHEN `useUserRole` resolves a role THEN it SHALL derive the role from authenticated claims/store rather than inferring `school_admin` from the URL path, and SHALL NOT silently default to `subject_teacher`

#### Section 7: Roles Enforced Through sso-worker + Cloudflare Functions

**E7.1** WHEN a Cloudflare Function authorizes a role-gated operation THEN it SHALL wrap the handler with `requireRole([...])` from `auth-core` (operating on the verified JWT `user.roles`) instead of an inline hardcoded role-array check

**E7.2** WHEN role-group membership is needed (e.g. "is admin") THEN the role list SHALL come from a single shared definition consumed by `requireRole` (ideally sourced from the SSO role data), NOT copied as a literal into each handler

**E7.3** WHEN a Function needs a user's role/identity THEN it SHALL read it from the verified JWT (`context.data.user.roles`, via `getContextUser`), NOT from the app-DB `users.role` column or `user_roles` table

**E7.4** WHEN the system stores roles THEN the **sso-worker `roles` table (resolved into the JWT via `get_jwt_claims`) SHALL be the single source of truth** for authorization. The competing app-DB authorities — `users.role` column, `user_roles` table, and `teachers.role`/`school_educators.role` used as role authorities — SHALL be removed (Contract phase, requires approval) and replaced by ONE new optimised shadow `roles` table in the app DB, kept in sync with the SSO `roles` table **via event-driven push over the `SSO_SERVICE` Service Binding RPC** (logical replication only if validated on the Supabase tier; FDW rejected for this hot table) and used ONLY for local joins, reference, and type generation — never as an authorization source

**E7.5** WHEN the frontend needs a user's role THEN it SHALL consume the roles resolved by the SSO worker (via `auth-client` `getMe()` / JWT claims) as the only source, eliminating the `teachers`/`school_educators` email-lookup and URL-inference paths in `useUserRole`

**E7.6** WHEN the frontend gates UI based on roles THEN it MAY do so for UX only, but the authoritative enforcement SHALL be performed by Cloudflare Functions via `requireRole`/`requireProduct`; client-side role booleans SHALL NOT be persisted to `localStorage` as a trust boundary

**E7.7** WHEN recruitment permissions are enforced THEN server-side checks SHALL remain the authority (Functions via DB RPC or `auth-core`), and the client-side `ROLE_PERMISSIONS` checks (`useHasPermission`, `checkPermission`, `isCurrentUserAdmin`) SHALL be treated as advisory/UX only — never the sole gate

**E7.8** WHEN any Function determines a user's role THEN it SHALL use the verified JWT `user.roles` array (never a singular `user.role`, never `JSON.parse(storedUser)`, never `teachers.role`/`school_educators.role`), so all handlers operate on one consistent user shape

**E7.9** WHEN the frontend `ProtectedRoute` guards a route THEN the authoritative access decision SHALL be enforced by the backing Cloudflare Function(s) via `requireRole`; the client-side guard MAY remain for UX redirects but SHALL consume roles from the SSO JWT, not the email/URL resolver

#### Section 9: Product & Feature-Entitlement Enforcement

> **Binding rule:** product-gating AND feature/add-on-entitlement gating MUST be enforced inside **Cloudflare Functions** (the same boundary as role authorization). The frontend is UX-only and is never a security boundary; no other layer (client, RLS-only, or direct DB access) is the authoritative gate.

**E9.1** WHEN a Function serves a product-gated endpoint THEN it SHALL enforce product access **in the Cloudflare Function** via `requireProduct` against the JWT `products[]` at the request boundary

**E9.2** WHEN fine-grained feature/add-on access gates a Function THEN entitlement SHALL be verified **inside that Cloudflare Function** (against the `subscription_cache`/`plans_cache`/entitlement data, or the SSO subscription RPC) before returning gated data or performing the gated operation — implemented as a reusable Functions-side guard (e.g. `requireFeature(featureKey)`) analogous to `requireRole`/`requireProduct`

**E9.3** WHEN the frontend uses `featureGating.ts` / `useFeatureGate` / `PlanFeatureGate` / `FeatureLockOverlay` THEN these SHALL be treated as UX-only affordances; they SHALL NOT be the sole gate for protected functionality, and the authoritative gate SHALL always be the Cloudflare Function serving the request

**E9.4** WHEN subscription/entitlement state is read THEN the canonical source SHALL remain the SSO/auth DB (surfaced via the existing Service Binding RPC and the `*_cache` shadow tables); **all product/feature enforcement SHALL occur in Cloudflare Functions** — no product/feature access decision is authoritative outside Functions, consistent with the roles single-source-of-truth model

---

### Unchanged Behavior (Regression Prevention)

#### Section 3: Functional Behavior Preservation

**3.1** WHEN a user with role `'learner'` accesses the application THEN the system SHALL CONTINUE TO route them to `/learner` dashboard as before

**3.2** WHEN a user with role `'school_educator'` accesses the application THEN the system SHALL CONTINUE TO route them to `/educator` dashboard as before

**3.3** WHEN a user with role `'recruiter'` accesses the application THEN the system SHALL CONTINUE TO route them to `/recruitment` dashboard as before

**3.4** WHEN a user with role `'school_admin'` accesses the application THEN the system SHALL CONTINUE TO route them to `/school-admin` dashboard as before

**3.5** WHEN backend functions check if a user is an administrator THEN the system SHALL CONTINUE TO authorize the same set of roles (`admin`, `company_admin`, `owner`, `college_admin`, `university_admin`, `school_admin`) as before

**3.6** WHEN frontend code calls `pickPrimaryRole(['university_admin', 'school_admin', 'learner'])` THEN the system SHALL CONTINUE TO return `'university_admin'` (highest priority) as before

**3.7** WHEN auth store helpers like `isAdminRole()`, `isEducatorRole()`, `isLearnerRole()`, `isRecruiterRole()` are called THEN the system SHALL CONTINUE TO return the same boolean results for the same role inputs as before

**3.8** WHEN route guards check user permissions THEN the system SHALL CONTINUE TO allow/deny access to the same routes for the same roles as before

**3.9** WHEN subscription route protection checks user roles THEN the system SHALL CONTINUE TO apply the same path-to-role mappings as before (`/learner` → `learner`, `/recruitment` → `recruiter`, `/educator` → `educator`, etc.)

**3.9a** WHEN `redirectToRoleDashboard` / `ROLE_ROUTES` (`features/auth/lib/roleBasedRouter.ts:8`) map roles to dashboards THEN the system SHALL CONTINUE TO route each role to its existing path (`learner` → `/learner/dashboard`, `recruiter` → `/recruitment/overview`, `admin`/`company_admin`/`owner` → `/admin/dashboard`, etc.)

**3.10** WHEN the `college_lecturers` table is queried in 40+ files THEN the system SHALL CONTINUE TO function correctly (the table name and foreign keys are valid, only the role-comparison at `Settings.tsx:1176` is a bug)

**3.11** WHEN messaging system uses `'college_lecturer'` as an educator type label THEN the system SHALL CONTINUE TO work correctly (this is a valid type discriminator, not a user role)

**3.12** WHEN validation checks roles against `VALID_ROLES` array THEN the system SHALL CONTINUE TO accept all currently-valid roles (after removing duplicates)

**3.13** WHEN users with SSO-only roles (`owner`, `hr`, `member`) exist THEN the system SHALL CONTINUE TO handle them correctly in auth store helpers even if they have no dedicated dashboard routes

**3.13a** WHEN `isAdminRole`, `isRecruiterRole`, and `pickPrimaryRole` are called with `company_admin` THEN the system SHALL CONTINUE TO recognize it (this was already fixed and MUST NOT regress)

**3.14** WHEN code references `USER_ROLES` constants from `shared/config/constants.js` THEN the system SHALL CONTINUE TO have these constants available for backward compatibility during migration

---

## Bug Condition Derivation

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type CodebaseState = {
    role_definitions_source: string,           // "database" | "hardcoded"
    type_definitions_count: integer,           // number of distinct UserRole types
    type_exports_complete: boolean,            // all imported types are exported
    phantom_roles: Set<string>,                // roles in code not in database
    hardcoded_role_arrays: Set<string>,       // files with hardcoded role arrays
    role_categories_table_exists: boolean,     // role_categories table present
    type_generation_script_exists: boolean     // auto-generation implemented
  }
  OUTPUT: boolean
  
  // Bug exists when ANY of these conditions are true:
  RETURN (
    X.role_definitions_source ≠ "database" OR
    X.type_definitions_count > 1 OR
    X.type_exports_complete = false OR
    |X.phantom_roles| > 0 OR
    |X.hardcoded_role_arrays| > 0 OR
    X.role_categories_table_exists = false OR
    X.type_generation_script_exists = false
  )
END FUNCTION
```

### Example Bug Condition Evaluation (Current State)

```pascal
current_state = {
  role_definitions_source: "hardcoded",        // ❌ Roles in source code, not from DB
  type_definitions_count: 7,                   // ❌ 7 conflicting UserRole types
  type_exports_complete: false,                // ❌ @/shared/types missing User/UserRole/CreateUserData/UpdateUserData; RecruitmentRole not exported; authStore self-import
  phantom_roles: {"college_lecturer", "recruitment_admin", "accountant",
                  "librarian", "parent", "career_counselor"},  // ❌ used in code, not in DB enum
  hardcoded_role_arrays: {
    // frontend route guards
    "learnerRoutes.jsx", "educatorRoutes.jsx", "recruiterRoutes.jsx", "adminRoutes.jsx",
    // frontend auth flows
    "validation.ts (VALID_ROLES, 'learner' x4)", "UnifiedLogin.tsx (ALL_ROLES)",
    "UnifiedSignup.tsx (allRoles)", "LoginAdmin.tsx (ADMIN_ROLES)",
    "TeacherBulkImport.tsx (validRoles)", "AdmissionNoteModal (adminDesignations x2)",
    // backend (verified: only 3 files, NOT the 12 the historical report claimed)
    "functions/api/educator/dashboard/[[path]].ts",
    "functions/api/learners/data/[[path]].ts",
    "functions/api/ai-tutor/handlers/get-generation-usage.ts"
  },
  hardcoded_permission_matrices: {             // ❌ should be DB-driven
    "shared/types/permissions.ts (LEARNER_MANAGEMENT_PERMISSIONS)",
    "entities/user/model/useUserRole.ts (ROLE_PERMISSIONS)",
    "entities/recruitment/model/types.ts (ROLE_PERMISSIONS, manually synced)"
  },
  role_categories_table_exists: false,         // ❌ Missing table (0 matches)
  school_role_permissions_table_exists: false, // ❌ Missing table (0 matches)
  type_generation_script_exists: false,        // ❌ No auto-generation
  privilege_by_url: true                       // ❌ useUserRole infers role from URL path
}

isBugCondition(current_state) = TRUE  // ❌ BUG EXISTS
```

> Corrected vs historical report: `company_admin` IS now present in `isAdminRole`/`isRecruiterRole`/`pickPrimaryRole`; `org_admin` and `super_admin` are NOT active role checks in functions (only DB enum / RLS / a test fixture); `getManagePath` does NOT exist in `src/` and `getDashboardPath` exists in only 2 places — so duplication is far smaller than previously documented.

---

## Property Specification

### Fix Checking Properties

```pascal
// Property FC-1: Type System Correctness
FOR ALL files F WHERE F imports RecruitmentRole DO
  compilation_result ← compile(F)
  ASSERT compilation_result.success = true
    AND no_type_errors(compilation_result)
END FOR

// Property FC-2: Single Canonical UserRole Type
FOR ALL files F in codebase DO
  user_role_types ← count_distinct_UserRole_types(F)
  ASSERT user_role_types ≤ 1
    AND (user_role_types = 0 OR references_canonical_type(F))
END FOR

// Property FC-3: No Phantom Roles
FOR ALL role_checks C in codebase DO
  role_value ← extract_role_value(C)
  sso_roles ← query("SELECT name FROM sso_auth.roles")
  ASSERT role_value ∈ sso_roles
    OR role_value is valid_context_specific_label(C)
END FOR

// Property FC-4: Database-Driven Role Categories
FOR ALL role_category_checks R in codebase DO
  category ← extract_category(R)  // "admin", "educator", etc.
  ASSERT ¬is_hardcoded_array(R)
    AND queries_database_or_cache(R, "role_categories", category)
END FOR

// Property FC-5: No Hardcoded Admin Role Arrays
FOR ALL backend_files B DO
  admin_checks ← find_admin_role_checks(B)
  FOR EACH check IN admin_checks DO
    ASSERT ¬is_literal_array(check)
      AND (queries_role_service(check) OR uses_shared_constant(check))
  END FOR
END FOR

// Property FC-6: Consolidated Role-Mapping Functions
FOR ALL role_mapping_usages U DO
  source ← get_function_source(U)
  ASSERT is_imported_from_shared_module(source)
    AND ¬is_duplicated_implementation(source)
END FOR

// Property FC-7: Type Generation Script Exists
ASSERT file_exists("scripts/generate-role-types.ts")
  AND generates_types_from_database(script)
  AND output_file = "shared/types/generated/roles.ts"
END FOR

// Property FC-8: Role Categories Table Exists
ASSERT table_exists("role_categories")
  AND has_columns(["id", "role_name", "category", "priority"])
  AND foreign_key_exists("role_categories.role_name", "roles.name")
END FOR

// Property FC-9: Every role-gated Function uses requireRole/requireProduct
FOR ALL handlers H in functions/ WHERE H performs a role check DO
  ASSERT wrapped_with(H, "requireRole") OR wrapped_with(H, "requireProduct")
    AND ¬contains_inline_role_literal(H)
END FOR

// Property FC-10: Roles resolved ONLY from the verified SSO JWT
FOR ALL role_resolutions R in functions/ AND src/ DO
  ASSERT source_of(R) = "verified_jwt_claims"
    AND source_of(R) ≠ "users.role column"
    AND source_of(R) ≠ "user_roles table"
    AND source_of(R) ≠ "teachers/school_educators email lookup"
    AND source_of(R) ≠ "url_path_inference"
END FOR

// Property FC-11: No client-side authz persisted as a trust boundary
FOR ALL role_booleans B computed in src/ DO
  ASSERT ¬persisted_to_localStorage_as_authz(B)
    AND enforcement_performed_by_functions(B.gated_action)
END FOR

// Property FC-12: Product & feature gating enforced server-side
FOR ALL product_gated_handlers H in functions/ DO
  ASSERT wrapped_with(H, "requireProduct")
END FOR
FOR ALL feature_gated_handlers H in functions/ DO
  ASSERT verifies_entitlement_server_side(H)  // before returning gated data
END FOR
FOR ALL client_feature_gates G in src/ DO
  ASSERT is_ux_only(G) AND ¬sole_gate(G)
END FOR
```

### Preservation Checking Properties

```pascal
// Property PC-1: Route Behavior Preserved
FOR ALL roles R in ["learner", "school_educator", "recruiter", "school_admin"] DO
  original_route ← get_dashboard_route_before_fix(R)
  fixed_route ← get_dashboard_route_after_fix(R)
  ASSERT fixed_route = original_route
END FOR

// Property PC-2: Admin Authorization Preserved
FOR ALL admin_roles A in ["admin", "company_admin", "owner", "college_admin", "university_admin", "school_admin"] DO
  FOR ALL backend_operations O DO
    original_authorized ← is_authorized_before_fix(A, O)
    fixed_authorized ← is_authorized_after_fix(A, O)
    ASSERT fixed_authorized = original_authorized
  END FOR
END FOR

// Property PC-3: Auth Store Helpers Preserved
FOR ALL role_arrays RA DO
  FOR ALL helper_functions H in [isAdminRole, isEducatorRole, isLearnerRole, isRecruiterRole] DO
    original_result ← H_before_fix(RA)
    fixed_result ← H_after_fix(RA)
    ASSERT fixed_result = original_result
  END FOR
END FOR

// Property PC-4: Priority Selection Preserved
FOR ALL role_combinations RC DO
  original_primary ← pickPrimaryRole_before_fix(RC)
  fixed_primary ← pickPrimaryRole_after_fix(RC)
  ASSERT fixed_primary = original_primary
END FOR

// Property PC-5: Validation Behavior Preserved (minus duplicates)
FOR ALL role_values V WHERE is_valid_before_fix(V) DO
  ASSERT is_valid_after_fix(V)
END FOR
FOR ALL role_values V WHERE ¬is_valid_before_fix(V) DO
  ASSERT ¬is_valid_after_fix(V)
END FOR

// Property PC-6: Non-Role Table References Preserved
FOR ALL queries Q to "college_lecturers" table DO
  ASSERT query_still_works_after_fix(Q)
END FOR
FOR ALL educator_type_labels L WHERE L = "college_lecturer" DO
  ASSERT label_still_valid_after_fix(L)
END FOR
```

---

## Counterexamples

### Critical Counterexample 1: TypeScript Compilation Failure

**Buggy Input**:
```typescript
// File: InviteEmployeeModal.tsx
import { RecruitmentRole } from '@/entities/recruitment/model/types';

interface InviteFormData {
  role: RecruitmentRole;  // Type not exported
}
```

**Current Behavior (F)**:  
TypeScript compilation fails with error: `Module '"@/entities/recruitment/model/types"' has no exported member 'RecruitmentRole'.`

**Expected Behavior (F')**:  
TypeScript compilation succeeds because `RecruitmentRole` is properly exported from the module.

---

### Critical Counterexample 1b: Broken `@/shared/types` Barrel (verified)

**Buggy Input**:
```typescript
// File: src/entities/user/model/validation.ts:7
import type { User, UserRole, CreateUserData, UpdateUserData } from '@/shared/types';
```

**Current Behavior (F)** — confirmed via `getDiagnostics`:
```
Error: Module '"@/shared/types"' has no exported member 'User'.
Error: Module '"@/shared/types"' has no exported member 'UserRole'.
Error: Module '"@/shared/types"' has no exported member 'CreateUserData'.
Error: Module '"@/shared/types"' has no exported member 'UpdateUserData'.
```
`src/shared/types/index.ts` re-exports learner/course/tour/analytics types but NOT `User`, `UserRole`, `CreateUserData`, or `UpdateUserData`.

**Expected Behavior (F')**:  
Either the canonical `User`/`UserRole`/`CreateUserData`/`UpdateUserData` types are re-exported from `@/shared/types`, or the imports point to the correct source module — compilation succeeds.

---

### Critical Counterexample 1c: `authStore.ts` Self-Import (verified)

**Buggy Input**:
```typescript
// File: src/shared/model/authStore.ts:12
import { useAuthStore } from '@/shared/model/authStore';   // imports itself
// ...later in the same file:
export const useAuthStore = create<AuthStore>()(/* ... */);
```

**Current Behavior (F)**:  
The module imports its own export, conflicting with the local `useAuthStore` declaration (duplicate identifier / circular self-reference).

**Expected Behavior (F')**:  
The self-import on line 12 is removed; `useAuthStore` is the locally-declared store only.

---

### Critical Counterexample 2: Phantom Role Check (Silent Bug)

**Buggy Input**:
```typescript
// File: Settings.tsx:1176
const userRole = 'college_educator';  // Valid role from database

// Buggy condition
if (userRole === 'college_lecturer' || userRole === 'college_admin') {
  // This code NEVER executes for college_educator
  return <CollegeAdminSettings />;
}
```

**Current Behavior (F)**:  
Condition is always `false` because `'college_lecturer'` is not a valid `user_role` enum value. A user with `college_educator` role never sees the settings UI, creating a silent bug.

**Expected Behavior (F')**:  
Condition uses correct role `'college_educator'`:
```typescript
if (userRole === 'college_educator' || userRole === 'college_admin') {
  return <CollegeAdminSettings />;
}
```

---

### Critical Counterexample 3: Zero-Downtime Role Change Impossible

**Buggy Input**:  
Business needs to add new role `'district_admin'` to the system.

**Current Behavior (F)**:  
Requires code changes in 17+ files:
1. Add to `features/auth/api/index.ts` UserRole type
2. Add to `entities/user/model/types.ts` UserRole type
3. Add to `VALID_ROLES` in `validation.ts`
4. Add to `ADMIN_ROLES` in 12+ backend files
5. Add to `pickPrimaryRole` priority list
6. Add to `isAdminRole` helper
7. Add dashboard route mapping
8. Add manage route mapping
9. Deploy all changes
10. Downtime during deployment

**Expected Behavior (F')**:  
Requires ONLY database operations:
```sql
-- Step 1: Add role to SSO roles table
INSERT INTO sso_auth.roles (name, description) 
VALUES ('district_admin', 'District-level administrator');

-- Step 2: Add to role categories
INSERT INTO role_categories (role_name, category, priority)
VALUES ('district_admin', 'admin', 15);

-- Step 3: (Optional) Add dashboard route mapping if needed
INSERT INTO role_route_mappings (role_name, dashboard_path, manage_path)
VALUES ('district_admin', '/district-admin', '/district-admin/manage');

-- DONE - Zero code changes, zero deployment, zero downtime
```

---

### High Severity Counterexample 4: Type Safety Broken

**Buggy Input**:
```typescript
// Developer in File A uses this definition
import { UserRole } from '@/features/auth/api';  // 8 roles

// Developer in File B uses this definition  
import { UserRole } from '@/entities/user/model/types';  // 15 roles

// Both compile, but mean different things!
const roleA: UserRole = 'admin';  // ❌ Error in File A (not in 8-role type)
const roleB: UserRole = 'admin';  // ✅ OK in File B (in 15-role type)
```

**Current Behavior (F)**:  
TypeScript type safety is broken because 7 different `UserRole` definitions exist. Code that compiles in one location may fail in another, or accept invalid roles.

**Expected Behavior (F')**:  
Single canonical `UserRole` type:
```typescript
// All files import from ONE location
import { UserRole } from '@/shared/types/generated/roles';

// Type includes ALL 16 SSO roles
type UserRole = 'admin' | 'college_admin' | 'college_educator' | 
                'company_admin' | 'educator' | 'hr' | 'learner' | 
                'member' | 'owner' | 'recruiter' | 'rm_admin' | 
                'rm_manager' | 'school_admin' | 'school_educator' | 
                'super_admin' | 'university_admin';
```

---

### High Severity Counterexample 5: Hardcoded Admin Checks

**Buggy Input**:
```typescript
// File: functions/learners/dashboard.ts
const ADMIN_ROLES = ['admin', 'company_admin', 'owner', 'college_admin', 'university_admin', 'school_admin'];

export default async function handler(req: Request) {
  const userRole = req.user.role;
  if (!ADMIN_ROLES.includes(userRole)) {
    return json({ error: 'Forbidden' }, 403);
  }
  // ... admin operation
}
```

**Current Behavior (F)**:  
If a new admin role is added to the database, this hardcoded check does NOT include it. The new admin cannot access admin operations until code is updated and deployed.

**Expected Behavior (F')**:  
```typescript
// File: functions/learners/dashboard.ts
import { isAdminRole } from '@/shared/services/roleService';

export default async function handler(req: Request) {
  const userRole = req.user.role;
  const isAdmin = await isAdminRole(userRole);  // Queries role_categories table
  
  if (!isAdmin) {
    return json({ error: 'Forbidden' }, 403);
  }
  // ... admin operation
}
```

---

### High Severity Counterexample 6: `requireRole` Unused; Authz Hardcoded in Functions (verified)

**Buggy Input**:
```typescript
// File: functions/api/settings/[[path]].ts:126 (and storage/upload-url.ts, download-url.ts, etc.)
const user = getContextUser(context);              // JWT roles ARE available here
const isAdmin = user.roles?.some((r: string) =>
  ['admin','company_admin','owner','college_admin','university_admin','school_admin'].includes(r)
);
if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Only admins can modify settings', context.request);
```

**Current Behavior (F)**:  
`auth-core` exports `requireRole` and `functions/lib/auth.ts` re-exports it, but it is applied in **zero** handlers. Each handler copies a 6-role literal. Adding/renaming an admin role means editing every copy.

**Expected Behavior (F')**:
```typescript
// Single enforcement primitive, role list from one shared source
import { withAuth, requireRole } from '../../lib/auth';

export const onRequestPost = withAuth(
  requireRole(ADMIN_ROLE_GROUP, async (context) => {
    // ... settings mutation; role already enforced from the verified JWT
  })
);
```

---

### Critical Counterexample 7: Shadow Role Store Bypasses the SSO JWT (verified)

**Buggy Input**:
```typescript
// File: functions/api/school-admin/actions.ts:90 (pattern repeats in 11+ files)
const user = getContextUser(context);             // JWT already carries user.roles
const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
result.isSchoolAdmin = userData?.role === 'school_admin';   // app-DB role, not JWT
```

**Current Behavior (F)**:  
Authorization/identity is derived from the app DB's `users.role` column (and the `user_roles` join table in `college-admin/faculty.ts`), which competes with — and can drift from — the SSO `roles` table that produced the JWT. Two sources of truth.

**Expected Behavior (F')**:
```typescript
const user = getContextUser(context);
const isSchoolAdmin = user.roles.includes('school_admin');  // from verified SSO JWT only
```
The app-DB `users.role` / `user_roles` are no longer consulted for authorization (removal pending approval).

---

## Key Definitions

- **F (Original/Unfixed Code)**: The current codebase with broken compilation (`@/shared/types` barrel, `RecruitmentRole`, `authStore` self-import), 7 conflicting `UserRole` types, hardcoded role arrays in frontend + functions, three hardcoded permission matrices, the phantom `college_lecturer` check, `requireRole`/`requireProduct` unused, a shadow `users.role`/`user_roles` store competing with the SSO JWT, a third email/URL-based role-resolution path in `useUserRole`, client-side authz persisted to `localStorage`, no `role_categories`/`school_role_permissions` tables, and no type-generation script.

- **F' (Fixed Code)**: The corrected codebase where:
  1. Compilation succeeds (barrel exports fixed, `RecruitmentRole` exported, `authStore` self-import removed, `CreateInvitationRequest` corrected)
  2. ONE canonical `UserRole` type covers the 16 SSO roles; all modules re-export/import it
  3. `college_lecturer` role check fixed to `college_educator`; phantom `recruitment_admin` resolved
  4. **The sso-worker `roles` table (via `get_jwt_claims` → JWT `roles[]`) is the single source of truth**
  5. **Cloudflare Functions are the only authorization boundary** — every role-gated handler uses `requireRole`/`requireProduct` from `auth-core`; no inline role-array literals
  6. The app-DB `users.role` column and `user_roles` table are no longer consulted for authorization (removal pending approval)
  7. The frontend consumes roles solely from the SSO JWT (`getMe()`/claims); `useUserRole`'s email-lookup + URL-inference + `subject_teacher` default are removed; client-side role booleans are UX-only and not persisted as a trust boundary
  8. Permission matrices are DB-driven (`school_role_permissions`; recruitment permissions from the DB), not hardcoded
  9. All existing routes, authorizations, and priorities preserved

- **C(X) (Bug Condition)**: Returns `true` when codebase state has any of: broken compilation; multiple conflicting type definitions; phantom roles; hardcoded role arrays; an authorization decision made outside Cloudflare Functions/`auth-core` (frontend or shadow DB store); a role resolved from anywhere other than the SSO JWT; missing DB infrastructure.

- **P(result) (Desired Properties)**: 
  - ✅ All TypeScript code compiles without type errors
  - ✅ Single canonical `UserRole` type (16 SSO roles) across the codebase
  - ✅ No phantom roles (every role check references a canonical SSO role)
  - ✅ Every role-gated Function uses `requireRole`/`requireProduct` (no inline literals)
  - ✅ Roles resolved ONLY from the SSO JWT — no `users.role`/`user_roles`/email/URL resolution paths
  - ✅ Frontend role checks are UX-only; enforcement is in Functions
  - ✅ Permission matrices are DB-driven, not hardcoded
  - ✅ All existing routes, authorizations, and priorities preserved
  - ✅ Zero-downtime role management enabled (add/remove roles with DB-only changes in the SSO worker)

---

## Resolved Architectural Decisions

These four decisions were made by the product owner and are binding for Design:

1. **`role_categories` lives in the app DB.** Role grouping (which roles are `admin`/`educator`/`recruiter`/etc., with priority) is a table in the **skillpassport app database**, consumed by both Functions and a build-time type generator. It is a read-reference projection — it does NOT override the SSO JWT as the identity source.

2. **Remove the competing shadow stores completely; replace with ONE new optimised shadow `roles` table.** The existing competing role sources used for **authorization/identity** — the `users.role` column (`user_role` enum), the `user_roles` join table, and the `teachers.role` / `school_educators.role` columns used as role authorities — SHALL be removed as authorization sources. In their place, a single new **optimised shadow `roles` table** (plus `role_categories`) is created in the app DB, kept in sync with the sso-worker `roles` table, used ONLY for local joins, type generation, and reference. **Authorization continues to come exclusively from the SSO JWT.** Because this drops columns/tables, it MUST follow Expand-Migrate-Contract (§ Database Migration Strategy below); the Contract (drop) phase requires explicit approval at execution time, and all Supabase commands require approval per `04-database-api-standards.md`.

   **Sync mechanism — do NOT use FDW for this hot table; prefer event-driven push via Service Binding RPC.** The `roles` table is read on nearly every authenticated request but changes very rarely (~16 rows). An FDW foreign table does a cross-project network round-trip on every read and fails if the SSO DB is unreachable — unacceptable for hot reference data ([Supabase FDW docs](https://www.supabase.com/docs/guides/database/extensions/wrappers/overview), rephrased for compliance). Two viable sync options, in priority order:
   > - **(Preferred) Event-driven push via the existing Service Binding RPC.** The codebase already syncs SSO-owned subscription data into app-DB shadow tables this way (`functions/lib/sso-client.ts` RPC + `functions/lib/sync-shadow.ts` write-through caches). Reusing this pattern for `roles` is the most consistent and the most reliable on managed Supabase: the sso-worker pushes (or the app pulls on a schedule/cache-miss) role changes via the typed `SSO_SERVICE` binding and upserts the local shadow `roles` table. Roles change rarely, so cost is negligible.
   > - **(Conditional) PostgreSQL logical replication.** Technically ideal for a small, slowly-changing, frequently-read table ([jusdb](https://www.jusdb.com/blog/postgresql-replication-streaming-logical), rephrased), BUT cross-project `CREATE SUBSCRIPTION` between two **managed Supabase** projects needs elevated privileges / network egress that may not be available, and Supabase's replication tooling is oriented toward read replicas / ETL sinks rather than arbitrary inbound cross-project subscriptions. **Design MUST validate feasibility on the current Supabase tier before choosing this.** If viable, monitor the replication slot to avoid WAL retention.
   >
   > FDW remains acceptable only for the existing low-frequency, org-scoped recruitment queries — never for the hot `roles` reference table.

   > **✅ Decision #2 ↔ #3 conflict — RESOLVED: remove the `user_role` enum completely.** The `user_role` enum SHALL be dropped entirely. This requires re-typing every column that currently depends on it:
   > - `users.role` → **dropped** (authorization comes only from the SSO JWT; the shadow `roles` table is the local reference).
   > - `college_role_module_permissions.role_type` and `college_role_scope_rules.role_type` (the school-internal permission system KEPT under Decision #3) → re-typed from the `user_role` enum to a **FK referencing a new app-owned `school_internal_roles` lookup table** (DB-driven, so adding a school-internal role needs no code change). A `TEXT` + `CHECK` constraint is the simpler fallback if a lookup table is overkill.
   > - The signup trigger `handle_new_user` (which casts `raw_user_meta_data->>'user_role'` to the enum) → stops writing `users.role`; role assignment becomes owned by the sso-worker `membership_roles`.
   >
   > Net taxonomy after removal: **SSO auth roles** (16, JWT → shadow `roles` table + `role_categories`) for authorization; **school-internal feature roles** (`principal`, `it_admin`, etc.) live in the new `school_internal_roles` lookup + `college_role_module_permissions`/`college_role_scope_rules`, with NO shared enum between them. Dropping the enum is a BREAKING Contract-phase change requiring explicit approval and the prerequisite re-typing/RLS rewrites below.

3. **Domain permission RPCs stay server-side; auth packages stay general-purpose.** Recruitment permissions (`has_recruitment_permission`, `get_user_recruitment_roles`, etc., already FDW-backed) and college-module permissions (`college_role_module_permissions`) remain the server-side authority inside Cloudflare Functions. `@rareminds-eym/auth-core` (v2.0.0) and `@rareminds-eym/auth-client` (v1.0.6) are published, shared packages and MUST remain generic (JWT roles/products only) — they MUST NOT absorb app-specific permission logic.

4. **Scope = full architecture migration, including product/feature gating.** This spec covers the complete migration in phases: (P0) compile-breaking fixes, (P1) single canonical type + phantom-role fixes, (P2) `requireRole`/**`requireProduct`** adoption across all Functions + JWT-only resolution + remove client-side authz boundary, (P3) app-DB `role_categories` + new shadow `roles` table + type generation, (P4) remove legacy shadow stores (Contract phase, requires approval), (P5) **product/feature-entitlement enforcement done in Cloudflare Functions** — Functions are the SOLE authority for product access (JWT `products[]` via `requireProduct`) and fine-grained feature/add-on entitlements (a Functions-side `requireFeature` guard); client-side feature gating becomes UX-only and is never the security boundary.

   > **Existing precedent to reuse:** the app already has a shadow-cache pattern in `functions/lib/sync-shadow.ts` — `users_shadow`, `subscription_cache`, `plans_cache` tables in the app DB, synced from the SSO/auth DB, with subscription data flowing from the sso-worker via Service Binding RPC (`functions/lib/sso-client.ts`). The new shadow `roles` table SHALL be consistent with this established pattern (naming/location), and `users_shadow` already exists for FK references.

---

## Database Migration Strategy (per `04-database-api-standards.md`)

Removing the legacy shadow stores and adding the new tables is a multi-phase, backward-compatible migration. Supabase rules apply: **DDL only in migration files, DML only in seed files, and NO Supabase CLI command runs without explicit approval.**

- **Expand** (migration files, non-breaking): create `role_categories`, the new optimised shadow `roles` table, and the new `school_internal_roles` lookup table; wire the sync that keeps the shadow `roles` table current from the sso-worker `roles` table via **event-driven push over the `SSO_SERVICE` Service Binding RPC** (logical replication only if validated on the Supabase tier) — NOT an FDW foreign table; if needed, introduce a dedicated `school_internal_role` enum/lookup so the school-internal permission tables (`college_role_module_permissions`, `college_role_scope_rules`) no longer depend on the auth `user_role` enum; add new nullable FK columns on `college_role_module_permissions`/`college_role_scope_rules` referencing `school_internal_roles` (alongside the existing enum columns, to be backfilled before the enum is dropped).
- **Migrate** (seed/scripts, DML): backfill `role_categories` and `school_internal_roles`; backfill the new FK columns from the old enum columns; verify the shadow `roles` table matches the SSO canonical 16 roles; switch all Functions to `requireRole` (JWT) and all role lookups off `users.role`/`user_roles`/`teachers.role`/`school_educators.role`; stop the signup trigger from writing an authoritative `users.role` (role assignment becomes owned by the sso-worker `membership_roles`); rewrite or retire the RLS policies that read `users.role`/`auth.jwt()->>'role'` (assess first whether they are already vestigial under SSO + `service_role`).
- **Contract** (migration files, BREAKING — REQUIRES APPROVAL): drop the `users.role` column, the `user_roles` table, the role-authority usage of `teachers.role`/`school_educators.role`, the old enum columns on the school-internal tables, and finally `DROP TYPE public.user_role` — only after every dependent column is re-typed, all role reads use the JWT/new lookups, and all dependent RLS policies are rewritten.

Pre-Contract blockers that MUST be cleared (verified to exist):
- RLS policies on `license_assignments`, `license_pools`, `class_swap_requests`, `user_categories` (and others) reference `users.role`/`super_admin` and the `user_role` enum — all must be rewritten before `DROP TYPE`.
- `college_role_module_permissions.role_type` and `college_role_scope_rules.role_type` are typed `user_role` and must be re-typed to the new `school_internal_roles` FK (or `TEXT`+`CHECK`) and backfilled.
- The signup trigger `handle_new_user` casts `raw_user_meta_data` to `public.user_role` and writes `users.role` — must be changed before the enum/column can be dropped.


## Cross-Cutting Constraints (verified against current best practice)

### CC-1: Role/permission change propagation & revocation (JWT staleness)

Because authorization derives from the signed JWT, a role/product/feature change in the SSO source is NOT reflected until the token is refreshed. Verified facts about the current system:
- The sso-worker access token TTL is **15 minutes** (`sso-worker/src/lib/jwt.ts: ACCESS_TOKEN_TTL = "15m"`), with refresh-token rotation and a `sessions.revoked` flag (`sessions` table).
- This matches the 2026 consensus: short-lived access tokens (≈5–15 min) + refresh rotation to bound stale-permission risk ([guptadeepak CIAM](https://guptadeepak.com/ciam-compass/guides/token-lifetime-best-practices/), [openillumi](https://openillumi.com/en/en-jwt-auth-design-payload-db-tradeoff/) — rephrased for compliance).

Requirements:
- **CC-1.1** The spec SHALL document that role/product/feature changes take effect on the next token refresh (≤ ~15 min), and this is an accepted tradeoff.
- **CC-1.2** For security-critical immediate revocation (e.g. removing an admin, suspending a member), the system SHALL use the existing session-revocation path (`sessions.revoked` + refresh denial) so the next refresh fails fast; Functions already reject non-`active` membership status via `withAuth`.
- **CC-1.3** Functions MUST NOT add their own longer-lived role cache that would extend the staleness window beyond the JWT TTL.

### CC-2: No database-level authorization backstop

Cloudflare Functions use the Supabase `service_role` client (`getServiceClient`), which **bypasses RLS entirely**. Combined with the finding that the existing RLS policies are `auth.uid()`/`auth.jwt()`-based and therefore vestigial under SSO (clause 8.2a), this means **the Function-layer check is the ONLY server-side authorization gate** — there is no DB backstop. Consequences for the design:
- **CC-2.1** Every data-accessing Function MUST perform explicit `requireRole`/`requireProduct`/`requireFeature` (or an equivalent ownership check) — a missing guard equals open access, with nothing behind it.
- **CC-2.2** This raises the importance of the reusable guards and of test coverage asserting each protected endpoint denies unauthorized roles/products/features (defense-in-depth is otherwise absent).
- **CC-2.3** (Optional, for approval) Consider whether any RLS backstop should be re-introduced for direct-DB paths; currently none is effective because Functions use `service_role`.

### CC-3: Org-scoped role semantics

`get_jwt_claims(p_user_id, p_org_id)` resolves roles/products for the **active org only**, and the JWT carries a single `org_id`. Therefore `requireRole`/`requireProduct` are implicitly **org-scoped** to the active org. The design MUST account for multi-org users (e.g. recruitment): switching org issues a new JWT (`switch-org` route), and role checks always reflect the active org — not a union across all orgs.
