# Organization Setup Flow

## Overview

This document describes the organization setup flow for admin users (school_admin, college_admin, university_admin). When an admin user logs in for the first time, they are required to create their organization before accessing their dashboard.

## Architecture

### Unified Organizations Table

All organization data is stored in a single `organizations` table with the following key columns:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | varchar | Organization name |
| organization_type | varchar | 'school', 'college', or 'university' |
| code | varchar | Unique code for the organization (e.g., school code, college code) |
| admin_id | uuid | References the admin user who owns this organization |
| email | text | Organization contact email |
| phone | text | Organization phone number |
| address | text | Street address |
| city | varchar | City |
| state | text | State |
| country | varchar | Country |
| pincode | varchar | Postal/ZIP code |
| website | text | Organization website |
| logo_url | text | URL to organization logo |
| established_year | integer | Year the organization was established |
| metadata | jsonb | Additional organization-specific data (principal info, dean info, etc.) |
| approval_status | varchar | 'pending', 'approved', 'rejected' |
| account_status | varchar | 'active', 'inactive', 'suspended' |
| is_active | boolean | Whether the organization is active |

### Legacy Tables (REMOVED)

The following tables have been **REMOVED** from the database:
- `schools` - Migrated to `organizations` with `organization_type='school'`
- `colleges` - Migrated to `organizations` with `organization_type='college'`
- `universities` - Migrated to `organizations` with `organization_type='university'`

All data has been migrated to the unified `organizations` table. All foreign keys now point to `organizations`.

### Key Components

1. **OrganizationGuard** (`src/components/organization/OrganizationGuard.tsx`)
   - Wrapper component that checks if admin has an organization
   - Shows OrganizationSetup form if no organization exists
   - Renders dashboard (children) once organization is created

2. **OrganizationSetup** (`src/pages/organization/OrganizationSetup.tsx`)
   - Full-featured form for creating organizations
   - Validates required fields (name, city, state)
   - Creates organization in the `organizations` table

3. **useOrganizationCheck** (`src/hooks/useOrganizationCheck.ts`)
   - Hook to check if admin has an organization
   - Queries `organizations` table by `admin_id` and `organization_type`

4. **organizationService** (`src/services/organizationService.ts`)
   - Centralized service for all organization queries
   - Provides functions: `getOrganizationByAdminId`, `getOrganizationById`, `getOrganizations`, `getSchools`, `getColleges`, `getUniversities`, `createOrganization`, `updateOrganization`, `deleteOrganization`

5. **useOrganization** (`src/hooks/useOrganization.ts`)
   - React hooks for components to use
   - Provides: `useCurrentOrganization`, `useOrganizationById`, `useOrganizations`, `useSchools`, `useColleges`, `useUniversities`

## Flow Diagram

```
Admin Login
    │
    ▼
OrganizationGuard
    │
    ├── Check organizations table
    │   (admin_id = user.id AND organization_type = role_type)
    │
    ├── Organization exists? ──Yes──► Render Dashboard
    │
    └── No organization ──► Show OrganizationSetup Form
                                │
                                ▼
                          User fills form
                                │
                                ▼
                          Create organization
                          in organizations table
                                │
                                ▼
                          Redirect to Dashboard
```

## Route Integration

The OrganizationGuard is integrated into AppRoutes.jsx for all admin routes:

```jsx
// College Admin
<Route path="/college-admin/*" element={
  <SubscriptionProtectedRoute allowedRoles={["college_admin"]}>
    <OrganizationGuard organizationType="college">
      <AdminLayout />
    </OrganizationGuard>
  </SubscriptionProtectedRoute>
}>

// School Admin
<Route path="/school-admin/*" element={
  <SubscriptionProtectedRoute allowedRoles={["school_admin"]}>
    <OrganizationGuard organizationType="school">
      <AdminLayout />
    </OrganizationGuard>
  </SubscriptionProtectedRoute>
}>

// University Admin
<Route path="/university-admin/*" element={
  <SubscriptionProtectedRoute allowedRoles={["university_admin"]}>
    <OrganizationGuard organizationType="university">
      <AdminLayout />
    </OrganizationGuard>
  </SubscriptionProtectedRoute>
}>
```

## Database Migration

The following migrations were applied to set up the unified organizations table:

1. **add_organization_admin_columns** - Added columns: `organization_type`, `admin_id`, `address`, `city`, `country`, `logo_url`
2. **add_organizations_rls_policies** - Added RLS policies for CRUD operations
3. **migrate_existing_orgs_to_organizations_table** - Migrated existing data from legacy tables
4. **add_organizations_extended_columns** - Added columns: `code`, `pincode`, `established_year`, `metadata`
5. **drop_legacy_tables** - Dropped `schools`, `colleges`, `universities` tables
6. **update_foreign_keys** - Updated 68 foreign keys to point to `organizations` table
7. **update_database_functions** - Updated 8 functions to use `organizations` table:
   - `generate_teacher_id`
   - `get_lecturer_details`
   - `get_student_academic_summary`
   - `get_student_details`
   - `notify_project_approval`
   - `notify_project_approval_unified`
   - `set_experience_approval_authority`
   - `set_project_approval_authority`

## Services Updated

The following services have been updated to use the unified `organizations` table:

### Core Services
- `src/services/adminAuthService.js` - Admin authentication now queries organizations table
- `src/services/collegeService.js` - College CRUD operations use organizations table
- `src/services/universityService.js` - University CRUD operations use organizations table
- `src/services/schoolService.js` - School CRUD operations use organizations table
- `src/services/studentService.js` - `getAllColleges()` and `getAllSchools()` use organizations table
- `src/services/organizationService.ts` - Centralized organization service
- `src/services/messageService.ts` - Message service uses organizations table
- `src/services/libraryService.ts` - Library service uses organizations table
- `src/services/clubsService.ts` - Clubs service uses organizations table
- `src/services/competitionsService.ts` - Competitions service uses organizations table
- `src/services/schoolLibraryService.ts` - School library service uses organizations table
- `src/services/curriculumService.ts` - Curriculum service uses organizations table
- `src/services/csvImportService.ts` - CSV import service uses organizations table
- `src/services/analyticsService.ts` - Analytics service uses organizations table
- `src/services/organization/organizationBillingService.ts` - Billing service uses organizations table
- `src/services/college/reportsService.ts` - Reports service uses organizations table
- `src/services/college/userManagementService.ts` - User management uses organizations table

### Hooks
- `src/hooks/useAdminStudents.ts` - Admin student queries use organizations table
- `src/hooks/useOrganization.ts` - Organization hooks
- `src/hooks/useOrganizationCheck.ts` - Organization check hook
- `src/hooks/useCollegeAdminMessages.js` - College admin messages use organizations table

### Utils
- `src/utils/educationSearch.js` - Search functions use organizations table
- `src/utils/organizationHelper.ts` - Organization helper utilities

### School Admin Pages
- `src/pages/admin/schoolAdmin/Dashboard.tsx`
- `src/pages/admin/schoolAdmin/Settings.tsx`
- `src/pages/admin/schoolAdmin/AttendanceReports.tsx`
- `src/pages/admin/schoolAdmin/Reports.tsx`
- `src/pages/admin/schoolAdmin/ClassManagement.tsx`
- `src/pages/admin/schoolAdmin/Library.tsx`
- `src/pages/admin/schoolAdmin/SkillCurricular.tsx`
- `src/pages/admin/schoolAdmin/SkillBadges.tsx`
- `src/pages/admin/schoolAdmin/StudentReports.tsx`
- `src/pages/admin/schoolAdmin/AssessmentResults.tsx`
- `src/pages/admin/schoolAdmin/CurriculumBuilder.tsx`
- `src/pages/admin/schoolAdmin/finance/index.tsx`
- `src/pages/admin/schoolAdmin/components/TimetableBuilderEnhanced.tsx`
- `src/pages/admin/schoolAdmin/components/TimetableAllocation.tsx`
- `src/pages/admin/schoolAdmin/components/TeacherList.tsx`
- `src/pages/admin/schoolAdmin/components/TeacherManagementDashboard.tsx`
- `src/pages/admin/schoolAdmin/components/TeacherOnboarding.tsx`

### College Admin Pages
- `src/pages/admin/collegeAdmin/Departmentmanagement.tsx`
- `src/pages/admin/collegeAdmin/ReportsAnalytics.tsx`
- `src/pages/admin/collegeAdmin/AssessmentResults.tsx`
- `src/pages/admin/collegeAdmin/DigitalPortfolio.tsx`
- `src/pages/admin/collegeAdmin/Library.tsx`
- `src/pages/admin/collegeAdmin/StudentCollegeAdminCommunication.tsx`
- `src/pages/admin/collegeAdmin/finance/index.tsx`
- `src/pages/admin/collegeAdmin/finance/hooks/useDepartmentBudgets.ts`
- `src/pages/admin/collegeAdmin/finance/hooks/useFeeStructures.ts`
- `src/pages/admin/collegeAdmin/finance/hooks/useFeeTracking.ts`
- `src/pages/admin/collegeAdmin/events/index.tsx`

### University Admin Pages
- `src/pages/admin/universityAdmin/AssessmentResults.tsx`
- `src/pages/admin/universityAdmin/CollegeRegistration.tsx`
- `src/pages/admin/universityAdmin/Courses.tsx`
- `src/pages/admin/universityAdmin/DigitalPortfolio.tsx`

### Educator Pages
- `src/pages/educator/Profile.tsx`
- `src/pages/educator/EducatorManagement.tsx`

### Student Pages
- `src/pages/student/Messages.jsx`

## Usage

### For New Admin Users

1. Admin signs up and gets assigned a role (school_admin, college_admin, university_admin)
2. On first login, OrganizationGuard detects no organization exists
3. OrganizationSetup form is displayed
4. Admin fills in organization details and submits
5. Organization is created in `organizations` table with `admin_id` set to user's ID
6. Admin is redirected to their dashboard

### For Existing Admin Users

1. Admin logs in
2. OrganizationGuard checks `organizations` table for matching `admin_id` and `organization_type`
3. If organization exists, dashboard is rendered immediately
4. If no organization (legacy user), setup form is shown

## Important Notes

- The `organizations` table is the **single source of truth** for all organization data
- Legacy tables (`schools`, `colleges`, `universities`) are **DEPRECATED** and kept only for foreign key compatibility
- All new code should use `organizationService.ts` or `useOrganization.ts` hooks
- The `admin_id` column links the organization to its admin user
- The `organization_type` column distinguishes between school, college, and university
- The `metadata` JSONB column stores type-specific data (principal info for schools, dean info for colleges, etc.)
