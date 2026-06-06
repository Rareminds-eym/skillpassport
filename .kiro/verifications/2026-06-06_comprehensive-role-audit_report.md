# Comprehensive Role Audit Report

**Date**: 2026-06-06
**Scope**: Full skillpassport codebase (`src/`, `functions/`, `supabase/`)
**Files Examined**: ~200+ role-related locations across 50+ files

---

## Executive Summary

The codebase has **7 distinct `UserRole` type definitions**, **14+ role-mapping route objects**, **15 inline admin-role arrays**, and **~50 files** containing role-checking logic. There is **no single source of truth** for what roles exist. The DB schema has values that the app code never handles (and vice versa), and the app code references roles that were never added to the DB enum.

### Critical Issues

| # | Severity | Issue | Files Affected |
|---|----------|-------|----------------|
| 1 | 🔴 | **`RecruitmentRole` imported but never defined** — TypeScript `import type { RecruitmentRole }` resolves to nothing | `EmployeeList.tsx`, `InviteEmployeeModal.tsx`, `InvitationsList.tsx`, `ChangeRoleModal.tsx` |
| 2 | 🔴 | **`college_lecturer` phantom role check** — `userRole === 'college_lecturer'` at Settings.tsx:1176 treats it as a `user_role` value. As a DB table name (`college_lecturers`) and educator type label, it appears correctly in 40+ files — the bug is only the role-comparison usage. | `src/pages/educator/Settings.tsx` (role check); 40+ files use `college_lecturers` table name correctly |
| 3 | 🔴 | **`recruitment_admin` missing from `DASHBOARD_ROUTES`** — post-payment redirect wrong for this role | `PaymentSuccess.jsx` |
| 4 | 🔴 | **6 different `UserRole` types** — no canonical union; each adds/removes roles inconsistently | 6 type definition files |
| 5 | 🟡 | **`super_admin` in 12 backend function files** — admin role arrays include it; frontend removed but backend not | 12 `functions/` files |
| 6 | 🟡 | **`admin` not in authoritative `UserRole` type** but used everywhere in route maps and role checks | `features/auth/api/index.ts` + 20+ files |
| 7 | 🟡 | **`owner` role** — recognized by `pickPrimaryRole` and `isAdminRole` in auth store but missing from most route guards and role arrays | `authStore.ts`, 5 routes files |
| 8 | 🟡 | **`hr` role** — in `VALID_ROLES` and `pickPrimaryRole` priority list but only referenced in `isRecruiterRole` — no routes, no dashboards | `validation.ts`, `authStore.ts` |
| 9 | 🟡 | **`Viewer`, `College Admin`, `HoD`, etc.** — college staff roles checked via an array of display-name-style strings that don't match any enum | `college-admin/api/userManagementService.ts:84-85` |
| 10 | 🟡 | **`viewer`/`member` used as `user_role` checks** — `VerifyEmail.tsx:87` does `userRoles.includes('viewer')` and `UnifiedLogin.tsx:249` checks `role === 'viewer'` / `role === 'member'`. These are SSO-only recruitment roles, not DB `user_role` values — checks always false. | `VerifyEmail.tsx`, `UnifiedLogin.tsx` |

---

## 1. DB Schema Role Enum (Ground Truth)

**File**: `supabase/migrations/20260526000000_schema.sql:367`
**Type**: `public.user_role` (PostgreSQL ENUM)

```sql
CREATE TYPE "public"."user_role" AS ENUM (
    'super_admin',      -- Still in DB, removed from frontend
    'rm_admin',         -- Still in DB, removed from frontend
    'rm_manager',       -- Still in DB, removed from frontend
    'school_admin',
    'college_admin',
    'university_admin',
    'company_admin',
    'school_educator',
    'recruiter',
    'school_student',   -- DEPRECATED (per comment), unused
    'college_student',  -- DEPRECATED (per comment), unused
    'college_educator',
    'learner'
);
```

**Roles in DB but NOT in any TypeScript `UserRole` type**:
- `super_admin` (in `functions/` backend only)
- `rm_admin` (removed from all code; still in DB)
- `rm_manager` (removed from all code; still in DB)
- `company_admin` (in some route maps, not in type definition)

**Roles in code but NOT in DB enum**:
- `admin` (alias role used in frontend routing)
- `educator` (alias role used in frontend, maps to `school_educator`/`college_educator` in DB)
- `owner` (SSO role, not a DB `user_role`)
- `hr` (appears in validation, not in DB)
- `principal`, `vice_principal`, `it_admin`, `class_teacher`, `subject_teacher`, `accountant`, `librarian`, `parent`, `career_counselor` (school vertical roles, not in DB enum)
- `recruitment_admin` (used in route maps, not in DB enum)
- `college_lecturer` (phantom — used in one file, not in DB or any type)
- `org_admin` (used in 9+ `functions/` admin arrays, not in DB enum)
- `viewer` (recruitment-specific, not a `user_role`)

---

## 2. Type Definitions (7 Distinct `UserRole` Types)

| # | File | Roles Included | Missing Roles | Notes |
|---|------|----------------|---------------|-------|
| 1 | `features/auth/api/index.ts:10` | `learner, recruiter, educator, school_educator, college_educator, school_admin, college_admin, university_admin` | ✅ `admin`, `company_admin`, `recruitment_admin` | The "official" auth type, but missing runtime roles |
| 2 | `entities/user/model/types.ts:10` | 15 roles incl. `admin`, `hr`, `principal`, `vice_principal`, `it_admin`, `class_teacher`, `subject_teacher` | ❌ missing `company_admin`, `recruitment_admin` | Most comprehensive but still incomplete |
| 3 | `shared/types/permissions.ts:3` | 9 school-specific roles (principal through career_counselor) | ❌ completely different domain | School RBAC only |
| 4 | `shared/types/messaging.ts:9` | 7 roles (no school_educator, no admin variants) | ❌ `school_educator` | Messaging system only |
| 5 | `entities/user/model/useUserRole.ts:7` | `school_admin, principal, it_admin, class_teacher, subject_teacher` | ❌ School-only | School educator hook |
| 6 | `pages/admin/schoolAdmin/Settings.tsx:39` | 9 school roles (similar to permissions.ts) | ❌ Local type | School admin settings |
| 7 | `features/auth/ui/UnifiedSignup.tsx:37` | `learner, recruiter, recruitment_admin, school_educator, college_educator, school_admin, college_admin, university_admin` | ❌ `educator`, `admin` | Local type, includes `recruitment_admin` uniquely |

---

## 3. Role Constants & Arrays

### 3.1 `USER_ROLES` (constants.js)
**File**: `src/shared/config/constants.js`
```javascript
export const USER_ROLES = {
  SCHOOL_ADMIN: 'school_admin',
  COLLEGE_ADMIN: 'college_admin',
  UNIVERSITY_ADMIN: 'university_admin',
  COMPANY_ADMIN: 'company_admin',
  SCHOOL_EDUCATOR: 'school_educator',
  COLLEGE_EDUCATOR: 'college_educator',
  RECRUITER: 'recruiter',
  SCHOOL_LEARNER: 'learner',
  COLLEGE_LEARNER: 'learner',
};
```
Has `COMPANY_ADMIN` but missing `educator`, `admin`, `recruitment_admin`.

### 3.2 `VALID_ROLES` (validation.ts)
**File**: `src/entities/user/model/validation.ts:14`
```typescript
const VALID_ROLES = [
  'learner', 'recruiter', 'educator', 'school_admin', 'college_admin',
  'university_admin', 'learner', 'learner',       // DUPLICATED: 'learner' appears 3 times!
  'school_educator', 'college_educator', 'admin',
  'learner', 'hr',
  'principal', 'vice_principal', 'it_admin', 'class_teacher', 'subject_teacher',
];
```
Has `hr` (unique to this array) and duplicate `learner` entries. Missing `recruitment_admin`, `company_admin`.

### 3.3 `ALL_ROLES` (UnifiedLogin.tsx)
```typescript
const ALL_ROLES = ['learner', 'recruiter', 'educator', 'school_admin', 'college_admin', 'university_admin'];
```
Missing: `school_educator`, `college_educator`, `admin`, `company_admin`, `recruitment_admin`.

### 3.4 Route Role Arrays

| Array | Roles | File |
|-------|-------|------|
| `LEARNER_ROLES` | `['learner']` | `learnerRoutes.jsx` |
| `EDUCATOR_ROLES` | `['educator', 'school_educator', 'college_educator']` | `educatorRoutes.jsx` |
| `RECRUITER_ROLES` | `['recruiter', 'company_admin']` | `recruiterRoutes.jsx` |
| `COLLEGE_ADMIN_ROLES` | `['college_admin']` | `adminRoutes.jsx` |
| `SCHOOL_ADMIN_ROLES` | `['school_admin']` | `adminRoutes.jsx` |
| `UNIVERSITY_ADMIN_ROLES` | `['university_admin']` | `adminRoutes.jsx` |

Note: `RECRUITER_ROLES` has `company_admin` but `admin` and `recruitment_admin` have no route arrays anywhere.

---

## 4. Role-Mapping Objects

### 4.1 Dashboard Route Maps

| Source | Roles | Missing vs getDashboardPath |
|--------|-------|-----------------------------|
| `getDashboardPath` (SubscriptionPlans ×2) | `learner, educator, school_educator, college_educator, school_admin, college_admin, university_admin, recruiter, recruitment_admin, admin, company_admin` | (reference baseline) |
| `DASHBOARD_ROUTES` (PaymentSuccess) | Same minus `recruitment_admin` | 🔴 `recruitment_admin` |
| `ROLE_ROUTES` (roleBasedRouter.ts) | Same minus `admin`, `company_admin` | 🟡 `admin`, `company_admin` |
| `getDashboardPath` (LoginAdmin.jsx) | `school_admin, college_admin, university_admin` only | Only used for demo login |
| `getDashboardPath` (Sidebar.tsx) | `school_admin, university_admin, college_admin` only | Only used for sidebar dashboard link |

### 4.2 Manage Route Maps (6 files, all identical)
All 6 copies of `getManagePath`/`MANAGE_ROUTES` have:
```
admin, school_admin, college_admin, university_admin, educator,
school_educator, college_educator, recruiter, learner
```
Missing: `company_admin`, `recruitment_admin`.

### 4.3 Path-to-Role Maps (3 duplicates, all consistent)
```
/learner → learner
/recruitment → recruiter
/educator → educator
/college-admin → college_admin
/school-admin → school_admin
/university-admin → university_admin
/admin → admin
```
All 3 duplicates (SubscriptionProtectedRoute, SubscriptionRouteGuard, MySubscription) are consistent.

---

## 5. `pickPrimaryRole` Priority List

**File**: `src/shared/model/authStore.ts:132`
```typescript
const priority = [
  'university_admin', 'college_admin', 'school_admin',
  'owner', 'admin',
  'college_educator', 'school_educator', 'educator',
  'learner', 'recruiter', 'hr', 'member',
];
```

`owner`, `hr`, `member` are in this priority list but have **no dashboard routes**, **no manage routes**, and **no route guards**. They would all fall through to the default route.

Additionally, `member` is used as a role check in `UnifiedLogin.tsx:249` (see §8.7), creating a brittle SSO-claims dependency.

---

## 6. `ADMIN_ROLES` Arrays (Backend — functions/)

### 6.1 Standard Pattern (9 files)
```javascript
['admin', 'super_admin', 'org_admin', 'college_admin', 'university_admin', 'school_admin']
```
Used in: `settings/[[path]].ts`, `resume/save.ts`, `learners/trainings.ts` (×2), `learners/management.ts`, `learners/by-email.ts`, `learners/actions.ts`, `learners/data/[[path]].ts`, `learners/dashboard.ts`, `educator/dashboard/[[path]].ts`

### 6.2 Storage Pattern (2 files)
```javascript
['admin', 'owner', 'school_admin', 'college_admin', 'university_admin']
```
Used in: `storage/upload-url.ts`, `storage/download-url.ts`

### 6.3 AI Tutor Pattern
```javascript
['admin', 'school_admin', 'college_admin', 'university_admin', 'owner']
```
Used in: `ai-tutor/handlers/get-learner-type.ts:66`

### 6.4 Generation Usage Pattern
```javascript
new Set(['admin', 'school_admin', 'college_admin', 'university_admin', 'owner'])
```
Used in: `ai-tutor/handlers/get-generation-usage.ts:18`

Note: `owner` appears in 3/4 backend admin patterns but `super_admin` only in the main pattern. `org_admin` appears in 9 files but is not a DB enum value.

---

## 7. Auth Store Role Helpers

**File**: `src/shared/model/authStore.ts`

```typescript
isLearnerRole(roles): roles.some(r => r === 'learner')
isEducatorRole(roles): roles.some(r => r === 'educator' || r === 'school_educator' || r === 'college_educator')
isAdminRole(roles): roles.some(r => r === 'admin' || r === 'school_admin' || r === 'college_admin' || r === 'university_admin' || r === 'owner')
isRecruiterRole(roles): roles.some(r => r === 'recruiter' || r === 'hr')
```

`isAdminRole` includes `owner` but NOT `company_admin` or `super_admin`.
`isRecruiterRole` includes `hr` but NOT `company_admin`.

---

## 8. Phantom & Mismatched Roles

### 8.1 `college_lecturer` (Phantom Role Check — Valid Table/Type Name)
**File**: `src/pages/educator/Settings.tsx:1176`
```tsx
{(userRole === 'college_lecturer' || userRole === 'college_admin') && (...)}
```
This line treats `'college_lecturer'` as a `user_role` value — but it **does not exist** in the DB `user_role` enum or any TypeScript `UserRole` type. The condition will never be true.

**However**, `college_lecturer` **is** a valid concept elsewhere:
- **DB table**: `college_lecturers` — a separate table for college educator profiles, queried in 40+ files (Settings.tsx, MarkAttendance.tsx, MentorNotes.tsx, Messages.jsx, AssessmentResults.tsx, ProfileFixed.tsx, etc.)
- **Educator type label**: Used as `type: 'college_lecturer'` in messaging and educator-type discrimination throughout the codebase
- **Foreign key**: `college_lecturer_id` used in mentor notes schemas

The bug is only the **role-comparison** at line 1176. The broader usage of `college_lecturer` as a table/type name is correct and should not be changed.

### 8.2 `org_admin` (Undefined)
**File**: 9 `functions/` files reference `'org_admin'` in admin role arrays
This role does not exist in the DB `user_role` enum. Any user with this role would match these admin checks only if `'org_admin'` exists as a role value elsewhere (e.g., in JWT claims).

### 8.3 College Staff Roles (String-mismatched)
**File**: `src/features/college-admin/api/userManagementService.ts:84-85`
```typescript
['College Admin', 'HoD', 'Faculty', 'Exam Cell', 'Finance Admin', 'Placement Officer', 'Lecturer']
```
These are display-name-style strings with spaces and capital letters — they don't match any snake_case DB enum value or TypeScript union.

### 8.4 `super_admin` in Backend But Not Frontend
12 `functions/` files reference `super_admin` in admin role arrays. The frontend has been cleaned of it. If a `super_admin` user exists in the DB, they would be authorized by the backend but would see no dashboard (frontend has no route for them).

### 8.5 `owner` in SSO Context
The recruitment org context uses `'owner' | 'admin' | 'member'` as SSO role names (from the SSO system), which are different from the application `user_role` enum. The auth store's `pickPrimaryRole` includes `owner` in its priority list, and `isAdminRole` recognizes it, but no route guard or route map handles it.

**Usage scope** (5+ frontend files treat `owner` as a legitimate role in user role arrays):
- `VerifyEmail.tsx:88, 107, 177, 178` — `userRoles.includes('owner')` alongside `company_admin`, `recruiter`
- `CompleteProfile.tsx:279, 300` — same `isCompanyAdmin` pattern using `owner`
- `CompanySignup.tsx:214, 220, 222` — explicitly documented: "user has 'owner' role in SSO, but we map it to 'recruiter' in the app"
- `Recruiter/Profile.tsx:96` — `isAdmin` check using `owner`
- `UnifiedLogin.tsx:249` — `role === 'owner'` in login flow role check
- Test files — `VerifyEmail.bug-condition-exploration.test.ts` uses `'owner'` in test fixtures

These usages are **functionally correct** because `userRoles` comes from SSO claims (which include `owner`) rather than the DB `user_role` enum. However, the mix of SSO roles and DB roles in `userRoles` arrays is confusing and not documented — a future change to populate `userRoles` from the DB enum would silently break these checks.

### 8.6 `viewer` as Pseudo-`user_role` Check
**Files**: `src/pages/auth/VerifyEmail.tsx:87`, `src/features/auth/ui/UnifiedLogin.tsx:249`

```typescript
// VerifyEmail.tsx:87 — treats 'viewer' as a user_role
userRoles.includes('viewer')

// UnifiedLogin.tsx:249 — treats 'viewer' as a role alongside user_role values
role === 'recruiter' || role === 'owner' || role === 'company_admin' || role === 'viewer' || role === 'member'
```

`'viewer'` is an SSO recruitment-specific role (`ssoRoleName`) — it is NOT a DB `user_role` enum value. These checks will always be `false` if `userRoles` is populated from the DB `user_role` column. If `userRoles` comes from SSO claims, they would work, but this dependency is implicit and brittle.

### 8.7 `member` as Pseudo-`user_role` Check
**File**: `src/features/auth/ui/UnifiedLogin.tsx:249`

```typescript
role === 'recruiter' || role === 'owner' || role === 'company_admin' || role === 'viewer' || role === 'member'
```

`'member'` is an SSO-only role name (`ssoRoleName`) — it does not exist in the DB `user_role` enum. Same brittle dependency as `viewer`.

### 8.8 `company_admin` in Login Flow
**File**: `src/features/auth/ui/UnifiedLogin.tsx:249`

`company_admin` is checked in the login flow alongside `recruiter`, `owner`, etc. — but `company_admin` IS a valid DB `user_role` value and correctly included here.

---

## 9. Consistency Matrix

| Role | DB Enum | TypeScript `UserRole` | `VALID_ROLES` | Route Array | Dashboard Map | Manage Map | Backend Admin Arrays |
|------|:-------:|:---------------------:|:-------------:|:-----------:|:-------------:|:----------:|:--------------------:|
| `learner` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `educator` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `school_educator` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `college_educator` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `school_admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `college_admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `university_admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `recruiter` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `admin` | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| `company_admin` | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `recruitment_admin` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `super_admin` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `rm_admin` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `rm_manager` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `owner` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `hr` | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `school_student` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `college_student` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `org_admin` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (9 files) |
| `principal` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `it_admin` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `class_teacher` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `subject_teacher` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `vice_principal` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `accountant` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `librarian` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `parent` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `career_counselor` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `member` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `viewer` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `college_lecturer` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 10. Duplication Map

### 10.1 `getManagePath` — Duplicated 6 times
Identical code exists in:
1. `src/pages/subscription/SubscriptionPlans.jsx`
2. `src/features/subscription/ui/individual/SubscriptionPlans.jsx`
3. `src/pages/subscription/PaymentCompletion.jsx`
4. `src/features/subscription/ui/SubscriptionRouteGuard.jsx`
5. `src/features/subscription/ui/shared/SubscriptionRouteGuard.jsx`
6. `src/features/subscription/ui/shared/PaymentSuccess.jsx` (as `MANAGE_ROUTES`)

### 10.2 `getDashboardPath` — Duplicated 3 times
1. `src/pages/subscription/SubscriptionPlans.jsx`
2. `src/features/subscription/ui/individual/SubscriptionPlans.jsx`
3. `src/features/subscription/ui/shared/PaymentSuccess.jsx` (as `DASHBOARD_ROUTES`)

### 10.3 Path-to-Role — Duplicated 3 times
1. `src/features/subscription/ui/shared/SubscriptionProtectedRoute.jsx`
2. `src/features/subscription/ui/shared/SubscriptionRouteGuard.jsx` (as if/else)
3. `src/pages/subscription/MySubscription.jsx` (as if/else)

### 10.4 `ADMIN_ROLES` Arrays — 4+ variants across 12 files
- Standard pattern: 9 files
- Storage pattern: 2 files
- AI tutor pattern: 1 file
- College admin pattern: 1 file (different roles entirely)

---

## 11. Key Code Quality Findings

### 11.1 `RecruitmentRole` Missing Type Definition 🔴
**Severity**: Critical
**Files**: `EmployeeList.tsx`, `InviteEmployeeModal.tsx`, `InvitationsList.tsx`, `ChangeRoleModal.tsx`
**Issue**: These files import `type { RecruitmentRole }` from `@/entities/recruitment/model/types` but that module does not export any `RecruitmentRole` type. The type is used inline in interfaces but never extracted to a named export.

### 11.2 `VALID_ROLES` Contains Duplicates
**File**: `src/entities/user/model/validation.ts:14`
**Issue**: `'learner'` appears 3 times:
```typescript
const VALID_ROLES = [
  'learner', 'recruiter', 'educator', 'school_admin', 'college_admin',
  'university_admin', 'learner', 'learner',  // duplicate!
  ...
];
```

### 11.3 Subscription Plan Files Duplicated Entirely
`src/pages/subscription/SubscriptionPlans.jsx` and `src/features/subscription/ui/individual/SubscriptionPlans.jsx` are two different implementations of the same component with different code patterns. The `pages/` version handles freemium inline while the `features/` version uses a separate `handleFreemiumSubscription` callback.

### 11.4 Stale Closure in Features SubscriptionPlans
`handlePlanSelection`'s dependency array is missing `handleFreemiumSubscription`, which it calls for freemium plan selection. Low risk (shared deps trigger recreation), but technically a violation.

### 11.5 `recruiterRoutes.jsx` Allows `company_admin`
The recruiter route guard allows `company_admin` through, but there is no separate `company_admin` route component — a `company_admin` sees the same recruiter UI.

### 11.6 `viewer` and `member` Used as Pseudo-`user_role` Values
**Files**: `VerifyEmail.tsx:87`, `UnifiedLogin.tsx:249`

`'viewer'` and `'member'` are SSO-only recruitment roles (`ssoRoleName: 'owner' | 'admin' | 'member'` and `recruitmentRole: 'company_admin' | 'recruiter' | 'viewer'`). They are NOT in the DB `user_role` enum. Using them in `userRoles.includes()` or `role ===` checks alongside real `user_role` values creates a brittle dependency on the SSO claims provider — if the provider or role-mapping changes, these checks silently break.

### 11.7 `owner` Usage Implicitly Depends on SSO Claims
**Files**: `VerifyEmail.tsx`, `CompleteProfile.tsx`, `CompanySignup.tsx`, `Recruiter/Profile.tsx`

`'owner'` is used across 5+ frontend files as a legitimate role check, but it's an SSO role name, not a DB `user_role`. These checks work because `userRoles` is currently populated from SSO claims (which include `owner`), but the dependency is undocumented. A future refactor that sources `userRoles` from the DB `user_role` column would silently break all `userRoles.includes('owner')` checks.

### 11.8 `college_lecturer` Role Check vs Table Name Confusion
**File**: `Settings.tsx:1176`

The role check `userRole === 'college_lecturer'` is a bug — `college_lecturer` is not a `user_role`. However, `college_lecturers` is a valid DB table queried in 40+ files, and `'college_lecturer'` is a valid educator type label in messaging. The only broken usage is the role-comparison at line 1176 — should likely be `college_educator` or removed.

---

## 12. Recommendations

### Must Fix (Breaking Behavior)
1. **Define `RecruitmentRole`** as `export type RecruitmentRole = 'company_admin' | 'recruiter' | 'viewer';` in `entities/recruitment/model/types.ts`
2. **Add `recruitment_admin` to `DASHBOARD_ROUTES`** in `PaymentSuccess.jsx`
3. **Fix `college_lecturer` role check** at `Settings.tsx:1176` — either change to `college_educator` or remove. Do NOT change `college_lecturers` table/type references (those are correct).

### Should Fix (Consistency)
4. **Consolidate `UserRole` types** into a single canonical type that includes all runtime roles
5. **Extract duplicated route maps** to a shared constants file instead of 6 copies of `getManagePath`
6. **Clean up functions/ backend `super_admin` references** (12 files) — decide if it's still a valid role
7. **Add `admin`, `company_admin`** to the authoritative `UserRole` type
8. **Remove duplicate `'learner'` entries** from `VALID_ROLES`
9. **Audit `viewer`/`member` checks** in `VerifyEmail.tsx:87` and `UnifiedLogin.tsx:249` — replace SSO-role-dependent checks with proper `user_role`-based logic or document the SSO dependency explicitly
10. **Document SSO role dependency** for `owner` checks across 5+ files (`VerifyEmail.tsx`, `CompleteProfile.tsx`, `CompanySignup.tsx`, `Recruiter/Profile.tsx`) — make explicit that `userRoles` includes SSO claim values, not just DB `user_role`

### Consider for Cleanup
11. Decide fate of `org_admin` — role checked in 9 backend files but not in DB enum
12. Decide fate of `hr`, `owner`, `member`, `viewer` — recognized by auth helpers but have no routes
13. Clean up `school_student` and `college_student` from DB enum (marked deprecated)
14. Align `ADMIN_ROLES` arrays across all 12 backend files (4 variants exist)

---

## Appendix: Complete File Index

### Type Definition Files (6)
- `src/features/auth/api/index.ts`
- `src/entities/user/model/types.ts`
- `src/shared/types/permissions.ts`
- `src/shared/types/messaging.ts`
- `src/entities/user/model/useUserRole.ts`
- `src/features/auth/ui/UnifiedSignup.tsx` (local)

### Role-Mapping Files (~14)
- `src/features/auth/lib/roleBasedRouter.ts` (ROLE_ROUTES)
- `src/pages/subscription/SubscriptionPlans.jsx` (getManagePath, getDashboardPath, getManagePathFromType)
- `src/features/subscription/ui/individual/SubscriptionPlans.jsx` (same 3 functions)
- `src/features/subscription/ui/shared/PaymentSuccess.jsx` (DASHBOARD_ROUTES, MANAGE_ROUTES)
- `src/pages/subscription/PaymentCompletion.jsx` (getManagePath)
- `src/features/subscription/ui/SubscriptionRouteGuard.jsx` (getManagePath)
- `src/features/subscription/ui/shared/SubscriptionRouteGuard.jsx` (getManagePath, getUserTypeFromPath)
- `src/features/subscription/ui/shared/SubscriptionProtectedRoute.jsx` (PATH_TO_USER_TYPE)
- `src/pages/subscription/MySubscription.jsx` (getDashboardPathFromUrl)
- `src/features/subscription/ui/individual/MySubscription.jsx` (getDashboardPathFromUrl)
- `src/pages/subscription/AcceptInvitationPage.tsx` (getDashboardPath)
- `src/features/admin/ui/Sidebar.tsx` (getDashboardPath, getSettingsPath)
- `src/pages/auth/LoginAdmin.jsx` (dashboardRoutes)
- `src/app/components/ProtectedRoute.jsx` (getRoleCategory)

### Role-Constant Files (6)
- `src/shared/config/constants.js`
- `src/entities/user/model/validation.ts`
- `src/features/auth/ui/UnifiedLogin.tsx`
- `src/features/auth/ui/UnifiedSignup.tsx`
- `src/app/routes/learnerRoutes.jsx`
- `src/app/routes/educatorRoutes.jsx`
- `src/app/routes/recruiterRoutes.jsx`
- `src/app/routes/adminRoutes.jsx`

### Auth Store Helpers
- `src/shared/model/authStore.ts`

### Backend Admin Arrays (~12 files)
- `functions/api/settings/[[path]].ts`
- `functions/api/resume/save.ts`
- `functions/api/learners/trainings.ts`
- `functions/api/learners/management.ts`
- `functions/api/learners/by-email.ts`
- `functions/api/learners/actions.ts`
- `functions/api/learners/data/[[path]].ts`
- `functions/api/learners/dashboard.ts`
- `functions/api/educator/dashboard/[[path]].ts`
- `functions/api/ai-tutor/handlers/get-learner-type.ts`
- `functions/api/ai-tutor/handlers/get-generation-usage.ts`
- `functions/api/storage/upload-url.ts`
- `functions/api/storage/download-url.ts`

### Key Role-Checking Files (50+ total)
- All subscription route guards (5 files)
- `src/app/layouts/PublicLayout.jsx`
- `src/app/components/ProtectedRoute.jsx`
- `src/features/auth/ui/UnifiedLogin.tsx`
- `src/features/auth/ui/UnifiedSignup.tsx`
- `src/pages/auth/VerifyEmail.tsx`
- `src/pages/auth/CompleteProfile.tsx`
- `src/features/messaging/` (multiple files)
- `src/entities/message/model/utils.ts`
- `src/entities/user/model/utils.ts`
- `src/pages/educator/Settings.tsx`
- `src/pages/recruiter/Settings.tsx`
- `functions/api/user/handlers/unified.ts`
- `functions/api/user/handlers/actions.ts`
- `functions/api/user/handlers/authenticated.ts`
- `functions/api/opportunities/index.ts`
- `functions/api/recruitment/invitations/` (2 files)
- `functions/api/college-admin/actions.ts`
- `functions/api/school-admin/` (2 files)
- `functions/api/educator-copilot/actions.ts`
- `functions/api/ai-tutor/handlers/ai-tutor-chat.ts`
- `functions/api/streak/[[path]].ts`
- `functions/api/messaging/actions.ts`
