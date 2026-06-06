# Bugfix Requirements Document

## Introduction

The SkillPassport codebase currently violates the established RBAC (Role-Based Access Control) architecture defined in `.kiro/architecture/RBAC_AND_ROLE_MANAGEMENT_ARCHITECTURE.md`. The architecture mandates a **database-driven RBAC system** where roles are consumed from the SSO auth database at runtime, enabling zero-downtime role changes. However, the codebase has multiple critical violations:

1. **Hardcoded role arrays** in 10+ locations across frontend and backend
2. **7 different conflicting `UserRole` type definitions** with no canonical source
3. **Type compilation failures** (`RecruitmentRole` imported but not exported)
4. **Phantom role checks** (`college_lecturer` used as user_role but doesn't exist in DB enum)
5. **Missing role categories and permissions tables** that architecture specifies

These violations prevent zero-downtime role management, cause type safety issues, create silent bugs (conditions that never execute), and require code deployments for what should be database-only operations.

**Impact**: 
- **Zero-downtime role changes impossible** — adding/removing roles requires code deployment
- **Type safety broken** — 7 conflicting type definitions cause TypeScript to accept invalid roles
- **Silent bugs** — `college_lecturer` role check will never be true, creating dead code
- **Compilation failures** — 4 files import undefined `RecruitmentRole` type
- **Maintenance burden** — Role updates require changes in 12+ locations

**Bug Condition Summary**:  
The bug exists when: (1) roles are hardcoded in source code rather than consumed from database, (2) multiple conflicting type definitions exist, (3) phantom roles appear in code but not in database, (4) missing type exports break compilation.

---

## Bug Analysis

### Current Behavior (Defect)

#### Section 1: Type System Violations

**1.1** WHEN code imports `RecruitmentRole` type from `@/entities/recruitment/model/types` THEN the system fails TypeScript compilation because the type is imported in 4 files but never exported from the module

**1.2** WHEN developers reference a `UserRole` type THEN the system has 7 different conflicting definitions across the codebase with no canonical source (files: `features/auth/api/index.ts` with 8 roles, `entities/user/model/types.ts` with 15 roles, `shared/types/permissions.ts` with 9 school-specific roles, `shared/types/messaging.ts` with 7 roles, `useUserRole.ts` with 5 school roles, `Settings.tsx` with 9 roles local type, `UnifiedSignup.tsx` with 8 roles local type)

**1.3** WHEN code checks if `userRole === 'college_lecturer'` at `Settings.tsx:1176` THEN the system performs a comparison that will NEVER be true because `college_lecturer` is not a valid `user_role` enum value in the database (it's a table name, not a role)

**1.4** WHEN validation code checks against `VALID_ROLES` array in `entities/user/model/validation.ts:14` THEN the system has duplicate `'learner'` entries appearing 3 times in the array

#### Section 2: Hardcoded Role Arrays (Architecture Violation)

**2.1** WHEN the codebase needs to determine which roles are learners THEN the system uses hardcoded array `LEARNER_ROLES = ['learner']` in `learnerRoutes.jsx` instead of querying from database

**2.2** WHEN the codebase needs to determine which roles are educators THEN the system uses hardcoded array `EDUCATOR_ROLES = ['educator', 'school_educator', 'college_educator']` in `educatorRoutes.jsx` instead of querying role categories from database

**2.3** WHEN the codebase needs to determine which roles are recruiters THEN the system uses hardcoded array `RECRUITER_ROLES = ['recruiter', 'company_admin']` in `recruiterRoutes.jsx` instead of querying from database

**2.4** WHEN the codebase needs to determine which roles are administrators THEN the system uses hardcoded array `ADMIN_ROLES = ['admin', 'company_admin', 'owner', 'college_admin', 'university_admin', 'school_admin']` in 12+ backend functions files instead of querying from database

**2.5** WHEN the backend needs to authorize admin-level operations THEN the system has 14 occurrences of `ADMIN_ROLES` arrays across 12 files (`settings/[[path]].ts`, `resume/save.ts`, `learners/trainings.ts` (×2), `learners/management.ts`, `learners/by-email.ts`, `learners/actions.ts`, `learners/data/[[path]].ts`, `learners/dashboard.ts`, `educator/dashboard/[[path]].ts`, `storage/upload-url.ts`, `storage/download-url.ts`, `ai-tutor/handlers/get-learner-type.ts`, `ai-tutor/handlers/get-generation-usage.ts`)

**2.6** WHEN the codebase needs role validation THEN the system uses hardcoded `VALID_ROLES` array in `validation.ts` with duplicate entries instead of querying valid roles from database

**2.7** WHEN frontend code needs all possible roles THEN the system uses hardcoded `ALL_ROLES = ['learner', 'recruiter', 'educator', 'school_admin', 'college_admin', 'university_admin']` in `UnifiedLogin.tsx` instead of fetching from database

#### Section 3: Duplicated Role-Mapping Functions

**3.1** WHEN the codebase needs to map roles to management paths THEN the system has 6 identical copies of `getManagePath` function in different files (`SubscriptionPlans.jsx` (×2), `PaymentCompletion.jsx`, `SubscriptionRouteGuard.jsx` (×2), `PaymentSuccess.jsx` as `MANAGE_ROUTES`)

**3.2** WHEN the codebase needs to map roles to dashboard paths THEN the system has 3 identical copies of `getDashboardPath` function in different files (`SubscriptionPlans.jsx` (×2), `PaymentSuccess.jsx` as `DASHBOARD_ROUTES`)

**3.3** WHEN the codebase needs to map paths to roles THEN the system has 3 identical copies of path-to-role mapping in different files (`SubscriptionProtectedRoute.jsx`, `SubscriptionRouteGuard.jsx`, `MySubscription.jsx`)

#### Section 4: Missing Database Infrastructure

**4.1** WHEN the architecture specifies a `role_categories` table to classify roles into groups (learner, educator, recruiter, admin) THEN the system does not have this table in the database schema

**4.2** WHEN the architecture specifies a `school_role_permissions` table for school-internal feature permissions THEN the system does not have this table and instead has hardcoded permission matrix in `shared/types/permissions.ts`

**4.3** WHEN the architecture specifies TypeScript types should be auto-generated from database THEN the system has no type generation script and all types are manually maintained with conflicts

#### Section 5: Role Inconsistencies

**5.1** WHEN backend code needs to check for admin roles THEN the system has 4 different `ADMIN_ROLES` array variants across files (standard pattern with 6 roles in 9 files, storage pattern with 2 roles in 2 files, ai-tutor pattern with 2 roles in 1 file, college-admin pattern with different roles entirely in 1 file)

**5.2** WHEN the SSO roles table contains 16 canonical roles (`admin`, `college_admin`, `college_educator`, `company_admin`, `educator`, `hr`, `learner`, `member`, `owner`, `recruiter`, `rm_admin`, `rm_manager`, `school_admin`, `school_educator`, `super_admin`, `university_admin`) THEN the main `UserRole` type in `features/auth/api/index.ts` only includes 8 roles and is missing `admin`, `company_admin`, `owner`, `hr`, `member`, `rm_admin`, `rm_manager`, `super_admin`

**5.3** WHEN code needs to pick the primary role from multiple roles THEN the system has `pickPrimaryRole` priority list in `authStore.ts:132` that includes `owner`, `hr`, `member` but these roles have no dashboard routes, no manage routes, and no route guards (they fall through to default)

---

### Expected Behavior (Correct)

#### Section 1: Type System Correctness

**2.1** WHEN code imports `RecruitmentRole` type from `@/entities/recruitment/model/types` THEN the system SHALL successfully compile because the type is properly exported as `export type RecruitmentRole = 'company_admin' | 'recruiter' | 'viewer';`

**2.2** WHEN developers reference a `UserRole` type THEN the system SHALL have ONE canonical type definition that includes all 16 SSO roles from the `sso-auth.roles` table, located in a single authoritative file

**2.3** WHEN code needs to check for college educator role at `Settings.tsx:1176` THEN the system SHALL use the correct role value `college_educator` (not `college_lecturer`) or remove the check if it's unnecessary

**2.4** WHEN validation code uses `VALID_ROLES` array THEN the system SHALL have no duplicate entries (currently `'learner'` appears 3 times)

#### Section 2: Database-Driven Role Categories

**2.5** WHEN the codebase needs to determine which roles belong to a category (learner, educator, recruiter, admin) THEN the system SHALL query the `role_categories` table at runtime instead of using hardcoded arrays

**2.6** WHEN the backend needs to authorize admin-level operations THEN the system SHALL query roles from `role_categories` where `category = 'admin'` instead of using 14 hardcoded `ADMIN_ROLES` arrays across 12 files

**2.7** WHEN the frontend needs to determine educator roles THEN the system SHALL query or cache roles from the database where category is 'educator' instead of hardcoded `EDUCATOR_ROLES = ['educator', 'school_educator', 'college_educator']`

**2.8** WHEN a new role is added to the system THEN the system SHALL require ONLY a database insert (into `roles` table and `role_categories` table) with ZERO code changes or deployments

**2.9** WHEN a role is removed from the system THEN the system SHALL require ONLY a database delete/soft-delete with ZERO code changes or deployments

#### Section 3: Consolidated Role-Mapping Functions

**2.10** WHEN the codebase needs to map roles to management paths THEN the system SHALL use a SINGLE shared function `getManagePath` imported from a common constants file instead of 6 duplicated copies

**2.11** WHEN the codebase needs to map roles to dashboard paths THEN the system SHALL use a SINGLE shared function `getDashboardPath` imported from a common constants file instead of 3 duplicated copies

**2.12** WHEN the codebase needs to map paths to roles THEN the system SHALL use a SINGLE shared constant `PATH_TO_ROLE` imported from a common file instead of 3 duplicated implementations

#### Section 4: Type Generation from Database

**2.13** WHEN TypeScript types need to represent valid user roles THEN the system SHALL auto-generate the `UserRole` type from the `sso-auth.roles` table via a type generation script

**2.14** WHEN the `roles` table is updated THEN the system SHALL regenerate TypeScript types automatically (via pre-commit hook or migration hook) to maintain type safety

#### Section 5: Database Schema for Architecture Compliance

**2.15** WHEN the system needs to categorize roles THEN the system SHALL have a `role_categories` table with columns: `id`, `role_name` (FK to `roles.name`), `category` (enum: 'learner', 'educator', 'recruiter', 'admin', 'system'), `priority` (integer for sorting), `created_at`, `updated_at`

**2.16** WHEN the system needs school-internal role permissions THEN the system SHALL have a `school_role_permissions` table instead of hardcoded permission matrix in `shared/types/permissions.ts`

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

**3.10** WHEN the `college_lecturers` table is queried in 40+ files THEN the system SHALL CONTINUE TO function correctly (the table name and foreign keys are valid, only the role-comparison at `Settings.tsx:1176` is a bug)

**3.11** WHEN messaging system uses `'college_lecturer'` as an educator type label THEN the system SHALL CONTINUE TO work correctly (this is a valid type discriminator, not a user role)

**3.12** WHEN validation checks roles against `VALID_ROLES` array THEN the system SHALL CONTINUE TO accept all currently-valid roles (after removing duplicates)

**3.13** WHEN users with SSO-only roles (`owner`, `hr`, `member`) exist THEN the system SHALL CONTINUE TO handle them correctly in auth store helpers even if they have no dedicated dashboard routes

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
  type_exports_complete: false,                // ❌ RecruitmentRole imported but not exported
  phantom_roles: {"college_lecturer"},         // ❌ Phantom role in Settings.tsx:1176
  hardcoded_role_arrays: {
    "learnerRoutes.jsx",
    "educatorRoutes.jsx", 
    "recruiterRoutes.jsx",
    "settings/[[path]].ts",
    "resume/save.ts",
    "learners/trainings.ts",
    "learners/management.ts",
    "learners/by-email.ts",
    "learners/actions.ts",
    "learners/data/[[path]].ts",
    "learners/dashboard.ts",
    "educator/dashboard/[[path]].ts",
    "storage/upload-url.ts",
    "storage/download-url.ts",
    "ai-tutor/handlers/get-learner-type.ts",
    "ai-tutor/handlers/get-generation-usage.ts",
    "validation.ts",
    "UnifiedLogin.tsx"
  },                                            // ❌ 17+ files with hardcoded arrays
  role_categories_table_exists: false,         // ❌ Missing table
  type_generation_script_exists: false         // ❌ No auto-generation
}

isBugCondition(current_state) = TRUE  // ❌ BUG EXISTS
```

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

## Key Definitions

- **F (Original/Unfixed Code)**: The current codebase with 7 conflicting `UserRole` types, 17+ hardcoded role arrays, missing `RecruitmentRole` export, phantom `college_lecturer` role check, no `role_categories` table, no type generation script

- **F' (Fixed Code)**: The corrected codebase with:
  1. Single canonical auto-generated `UserRole` type from database
  2. Exported `RecruitmentRole` type enabling compilation
  3. Fixed `college_lecturer` → `college_educator` role check
  4. Zero hardcoded role arrays (all queries from `role_categories` table)
  5. `role_categories` table implemented with category-to-roles mappings
  6. Type generation script that auto-generates types from `sso-auth.roles` table
  7. Consolidated role-mapping functions (no duplication)
  8. All behavioral preservation (same routes, same authorization, same priorities)

- **C(X) (Bug Condition)**: Returns `true` when codebase state has any of: multiple conflicting type definitions, missing type exports, phantom roles, hardcoded role arrays, missing database infrastructure

- **P(result) (Desired Properties)**: 
  - ✅ All TypeScript code compiles without type errors
  - ✅ Single canonical `UserRole` type across entire codebase
  - ✅ No phantom roles (all role checks reference valid database roles)
  - ✅ Zero hardcoded role arrays (all consumed from database)
  - ✅ `role_categories` table exists with proper schema
  - ✅ Type generation script exists and works
  - ✅ Role-mapping functions consolidated (no duplication)
  - ✅ All existing routes, authorizations, and priorities preserved
  - ✅ Zero-downtime role management enabled (add/remove roles with DB-only changes)

