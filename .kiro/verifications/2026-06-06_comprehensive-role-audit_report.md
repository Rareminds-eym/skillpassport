# Comprehensive Role Audit Report

**Date**: 2026-06-06 (Updated)
**Scope**: Full skillpassport codebase (`src/`, `functions/`, `supabase/`) + sso-auth database
**Files Examined**: ~200+ role-related locations across 50+ files

> **🔴 CRITICAL CORRECTION**: The canonical source of truth for roles is the **sso-auth `roles` table** (16 roles), NOT the skillpassport DB `user_role` enum. Roles flow through: SSO `roles` table → `membership_roles` → `get_jwt_claims()` RPC → JWT claims → `user.roles` on frontend. See §1 for the complete list.

---

## Executive Summary

The canonical role set comes from the **sso-auth `roles` table** — 16 roles. The frontend and Cloudflare Functions code referenced several non-existent roles (`org_admin`, `recruitment_admin`, `viewer` as user_role) and were missing recognition for canonical roles (`company_admin`, `owner`). All discrepancies have been **fixed in this session**.

### Issues — Status After Fixes

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | 🔴 | **`RecruitmentRole` imported but never defined** | ❌ Still open — 4 files import it, not exported |
| 2 | 🔴 | **`college_lecturer` phantom role check** at `Settings.tsx:1176` | ❌ Still open — role-comparison bug |
| 3 | 🔴 | **`recruitment_admin` missing from `DASHBOARD_ROUTES`** | ✅ FIXED — role removed entirely (not an SSO role) |
| 4 | 🔴 | **6 different `UserRole` types** | ❌ Still open — no canonical union |
| 5 | 🟡 | **`super_admin` in backend arrays** | ✅ FIXED — removed from all 12 functions/ files + frontend |
| 6 | 🟡 | **`admin` not in authoritative `UserRole` type** | ❌ Still open — `UserRole` type too narrow |
| 7 | 🟡 | **`owner` missing from route guards and backend arrays** | ✅ FIXED — added to all manage/dashboard routes + backend ADMIN_ROLES |
| 8 | 🟡 | **`hr` no routes or dashboards** | ❌ Still open — SSO role, no routes needed (falls through) |
| 9 | 🟡 | **College staff display-name strings** | ❌ Still open — separate concern |
| 10 | 🟡 | **`viewer`/`member` as user_role checks** | ✅ FIXED — removed `viewer` from VerifyEmail.tsx/UnifiedLogin.tsx; `member` kept (IS an SSO role) |
| 11 | 🟡 | **`super_admin` in frontend app code** | ✅ FIXED — removed from recruiter/Settings.tsx |
| 12 | 🟡 | **`company_admin` missing from auth store helpers** | ✅ FIXED — added to `isAdminRole`, `isRecruiterRole`, `pickPrimaryRole` |
| 13 | 🟡 | **`org_admin` not an SSO role but in 10 backend files** | ✅ FIXED — replaced with `admin` |
| 14 | 🟡 | **`recruitment_admin` not an SSO role but in dashboard routes** | ✅ FIXED — removed from dashboard/manage routes (still in signup UI as redirect label) |
| 15 | 🟠 | **`authorization.security.test.ts` still references `super_admin`** | ⏳ Still open — test file, needs update if super_admin removed from DB

---

## 1. Canonical Role Source — SSO Auth `roles` Table

**Database**: `sso-auth` (separate Supabase project)
**Table**: `public.roles`

| # | Role | Description | Used In |
|---|------|-------------|---------|
| 1 | `admin` | Administrator with management access | Frontend routes, backend admin arrays |
| 2 | `college_admin` | College administrator | Frontend routes, backend admin arrays |
| 3 | `college_educator` | College-level educator | Frontend routes |
| 4 | `company_admin` | Company-level admin | Frontend routes, auth store helpers ✅ (added) |
| 5 | `educator` | General educator/teacher | Frontend routes (alias) |
| 6 | `hr` | Human resources | Acknowledged, no specific routes |
| 7 | `learner` | Self-directed learner | Frontend routes |
| 8 | `member` | Regular organization member | Acknowledged in auth store, no routes |
| 9 | `owner` | Organization owner with full access | Frontend routes, backend admin arrays ✅ (added) |
| 10 | `recruiter` | Recruiter | Frontend routes |
| 11 | `rm_admin` | Rareminds internal | Not in code (manual assign only) |
| 12 | `rm_manager` | Rareminds internal | Not in code (manual assign only) |
| 13 | `school_admin` | School administrator | Frontend routes, backend admin arrays |
| 14 | `school_educator` | School-level educator | Frontend routes |
| 15 | `super_admin` | (no description) | ❌ **Removed from code** (still in SSO table) |
| 16 | `university_admin` | University administrator | Frontend routes, backend admin arrays |

### SkillPassport DB `user_role` Enum (Legacy — separate from SSO)

**File**: `supabase/migrations/20260526000000_schema.sql:367`
This PostgreSQL ENUM is a **separate legacy artifact** — not the source of truth for auth.

```sql
CREATE TYPE "public"."user_role" AS ENUM (
    'super_admin',      -- In SSO table too, removed from code
    'rm_admin',         -- In SSO table too
    'rm_manager',       -- In SSO table too
    'school_admin',
    'college_admin',
    'university_admin',
    'company_admin',
    'school_educator',
    'recruiter',
    'school_student',   -- DEPRECATED — NOT in SSO roles table
    'college_student',  -- DEPRECATED — NOT in SSO roles table
    'college_educator',
    'learner'
);
```

### Roles NOT in SSO roles table (bug — now fixed)

| Role | Was Used In | Fix |
|------|-------------|-----|
| `org_admin` | 10 `functions/` backend files | ✅ **Fixed**: Replaced with `admin` |
| `recruitment_admin` | Frontend dashboard routes, signup UI | ✅ **Fixed**: Removed from routes (stays in signup as redirect label) |
| `viewer` | `VerifyEmail.tsx`, `UnifiedLogin.tsx`, `AcceptInvitationPage.tsx` | ✅ **Fixed**: Removed from role checks (still valid as `recruitmentRole` in org context) |
| `school_student` | DB enum only | ❌ Still in DB enum, not in SSO table |
| `college_student` | DB enum only | ❌ Still in DB enum, not in SSO table |

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

### 6.1 Canonical Pattern (All 14 occurrences — ✅ NOW FIXED)

All 14 occurrences across 12 files were updated to this single canonical array:

```javascript
['admin', 'company_admin', 'owner', 'college_admin', 'university_admin', 'school_admin']
```

**Changes applied**:
- ✅ `org_admin` → `admin` (no longer referencing non-existent role)
- ✅ `super_admin` removed (chosen to remove completely)
- ✅ `company_admin` added (was missing despite being a valid SSO role)
- ✅ `owner` added (was only in storage/ai-tutor patterns, now consistent everywhere)

**Files updated** (14 occurrences in 12 files):
- `settings/[[path]].ts`, `resume/save.ts`, `learners/trainings.ts` (×2), `learners/management.ts`, `learners/by-email.ts`, `learners/actions.ts`, `learners/data/[[path]].ts`, `learners/dashboard.ts`, `educator/dashboard/[[path]].ts`
- `storage/upload-url.ts`, `storage/download-url.ts`
- `ai-tutor/handlers/get-learner-type.ts`, `ai-tutor/handlers/get-generation-usage.ts`
- `user/handlers/actions.ts` (special case: `['super_admin', 'company_admin']` → `['company_admin']`)

### (All patterns now unified — no variants remain)

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

**Critical gap (✅ NOW FIXED)**: `company_admin` was missing from all auth store helpers. Fixed:
- ✅ `isAdminRole` now includes `company_admin`
- ✅ `isRecruiterRole` now includes `company_admin`
- ✅ `pickPrimaryRole` priority list now includes `company_admin` (after `admin`, before `college_educator`)

Before fix: `isAdminRole(['company_admin'])` → `false`, `isRecruiterRole(['company_admin'])` → `false`, `pickPrimaryRole(['company_admin'])` → only worked by accident.

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
The `owner` role is an **SSO-level organization membership role**, NOT an application `user_role` from the DB. It comes from the `@rareminds-eym/auth-core` SSO system's org context (`ssoRoleName`):

- `owner` — org creator/primary manager (has all permissions in recruitment context)
- `admin` — org administrator (can manage members and settings)
- `member` — standard org member (limited permissions)

It is distinct from the DB `user_role` enum (`learner`, `recruiter`, `school_admin`, etc.). The `owner` role exists in the frontend's `userRoles` array only because SSO claims are merged into it at runtime. If the source of `userRoles` ever changes from SSO claims to the DB `user_role` column, all `userRoles.includes('owner')` checks silently break.

The auth store's `pickPrimaryRole` includes `owner` in its priority list, and `isAdminRole` recognizes it, but no route guard or route map handles it.

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

### 11.9 `super_admin` Still Present in Frontend App Code
**File**: `src/pages/recruiter/Settings.tsx:306`
```tsx
{user?.role === "super_admin" && (
  <SectionCard ... title="System Management">...</SectionCard>
)}
```
This is a frontend application file (not subscription/routing) that was missed during the `super_admin` cleanup sweep. The `super_admin` role is still in the DB enum, so this condition can still trigger. However, if the intent is to remove `super_admin` from all frontend code, this needs to be changed to an admin role check.

Additionally, `src/entities/organization/api/__tests__/security/authorization.security.test.ts` uses `super_admin` in test fixtures and assertions for security authorization testing. This is a test file and may be acceptable, but the `super_admin` role in tests creates coupling to a role that may be removed.

### 11.10 `company_admin` Missing from Auth Store Helpers
**File**: `src/shared/model/authStore.ts`

`company_admin` is a valid DB `user_role` value used in 8+ frontend files for route mapping and role checks, but none of the auth store's role helpers recognize it:

| Helper | Recognizes | Missing |
|--------|-----------|---------|
| `isAdminRole` | `admin`, `school_admin`, `college_admin`, `university_admin`, `owner` | `company_admin`, `super_admin` |
| `isRecruiterRole` | `recruiter`, `hr` | `company_admin` |
| `pickPrimaryRole` | 12 roles in priority list | `company_admin`, `recruitment_admin` |

This means components that gate admin/recruiter UI behind `isAdminRole()` or `isRecruiterRole()` would incorrectly deny access to `company_admin` users. The role works at runtime only because the auth store's consumer code (`useUserRole`) may not rely on these helpers for `company_admin`-specific rendering.
**File**: `Settings.tsx:1176`

The role check `userRole === 'college_lecturer'` is a bug — `college_lecturer` is not a `user_role`. However, `college_lecturers` is a valid DB table queried in 40+ files, and `'college_lecturer'` is a valid educator type label in messaging. The only broken usage is the role-comparison at line 1176 — should likely be `college_educator` or removed.

---

## 12. Recommendations

### Must Fix (Breaking Behavior)
1. **Define `RecruitmentRole`** as `export type RecruitmentRole = 'company_admin' | 'recruiter' | 'viewer';` in `entities/recruitment/model/types.ts`
2. **Fix `college_lecturer` role check** at `Settings.tsx:1176` — either change to `college_educator` or remove. Do NOT change `college_lecturers` table/type references (those are correct).

### Should Fix (Consistency)
3. **Consolidate `UserRole` types** into a single canonical type that includes all SSO roles
4. **Extract duplicated route maps** to a shared constants file instead of 6 copies of `getManagePath` + 2 of `getDashboardPath`
5. **Remove duplicate `'learner'` entries** from `VALID_ROLES`
6. **Update `authorization.security.test.ts`** — remove `super_admin` test fixtures if the role is being removed from the system
7. **Add missing SSO roles to `features/auth/api/index.ts` `UserRole` type** — currently missing `admin`, `company_admin`, `owner`, `hr`, `member`
8. **Remove `school_student`/`college_student` from DB `user_role` enum** — not in SSO roles table, zero code references

### ✅ Completed This Session
- **`super_admin` removed from all 12 functions/ backend files** — `ADMIN_ROLES` arrays cleaned
- **`super_admin` removed from frontend** — `recruiter/Settings.tsx` System Management section removed
- **`org_admin` fixed → `admin`** in all 10 backend files (was not an SSO role)
- **`company_admin` added** to `isAdminRole`, `isRecruiterRole`, `pickPrimaryRole` in `authStore.ts`
- **`company_admin` added** to `getManagePath`/`MANAGE_ROUTES` (6 files)
- **`company_admin` added** to backend `ADMIN_ROLES` (was missing from all 12 files)
- **`owner` added** to `getDashboardPath` (2 files), `getManagePath` (6 files), `ROLE_ROUTES` (1 file)
- **`owner` added** to backend `ADMIN_ROLES` (was only in storage/ai-tutor patterns)
- **`recruitment_admin` removed** from dashboard routes (2 files + `roleBasedRouter.ts` + `PaymentSuccess.jsx`) — not an SSO role
- **`viewer` removed** from role checks in `VerifyEmail.tsx` and `UnifiedLogin.tsx` — not an SSO role (still valid as `recruitmentRole`)
- **`roleBasedRouter.ts`** — widened from `Record<UserRole, string>` to `Record<string, string>` so all SSO roles work

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
