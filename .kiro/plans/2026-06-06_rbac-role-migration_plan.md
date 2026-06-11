# RBAC Role Migration Plan

**Date**: 2026-06-06
**Source**: Derived from `.kiro/architecture/RBAC_AND_ROLE_MANAGEMENT_ARCHITECTURE.md`

---

## Phase 1: Fix Critical Auth Bugs (Hours)

- Add `admin`, `company_admin`, `owner` to `LoginAdmin.tsx` `ADMIN_ROLES`
- Add `admin`, `company_admin`, `owner` to `UnifiedSignup.tsx` admin check
- Fix `validation.ts` `isAdminRole` / `isRecruiterRole`
- Remove duplicate `'learner'` entries from `VALID_ROLES`

## Phase 2: Single Source of Truth (Days)

- Create a DB table `role_categories` in sso-auth (or config file) defining role → category mappings
- Generate a shared `Role` type from the SSO `roles` table
- Replace all 14 backend `ADMIN_ROLES` arrays with a shared import from a single `lib/roles.ts` that queries the DB
- Replace all 6 frontend route maps with shared constants

## Phase 3: Database-Driven RBAC (Weeks)

- Migrate `shared/types/permissions.ts` hardcoded permission matrix to DB tables
- Migrate `useUserRole.ts` school roles to DB-driven lookups
- Add a `role_categories` cache layer for performance

## Phase 4: Policy-as-Code (Months — Optional)

- Evaluate OPA for centralized policy enforcement
- Extract complex auth rules (multi-tenant scoping, org-level access) to Rego policies
- Add distributed tracing for auth decisions
