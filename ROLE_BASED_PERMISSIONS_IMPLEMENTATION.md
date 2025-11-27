# Role-Based Permission System Implementation

## Overview

A comprehensive role-based permission system has been implemented for the Teacher Management module, following the permission matrix from the reference image.

---

## Permission Matrix

| Feature | Principal | IT Admin | Class Teacher | Subject Teacher |
|---------|-----------|----------|---------------|-----------------|
| **Add Teacher** | C/A (Create & Approve) | C (Create) | N/A | N/A |
| **Assign Classes** | A (Approve) | C (Create) | N/A | N/A |
| **Timetable Editing** | A (Approve) | U (Update) | V (View) | V (View) |

**Legend:**
- **C** = Create
- **A** = Approve
- **U** = Update
- **V** = View
- **C/A** = Create & Approve (combined permission)
- **N/A** = No Access

---

## Files Created/Modified

### 1. Database Migration
**File:** `supabase/migrations/role_based_permissions.sql`

**New Tables:**
- `role_permissions` - Stores the permission matrix
- `teacher_approvals` - Tracks approval workflow
- `class_assignments` - Manages class assignments with approval

**New Columns:**
- `teachers.role` - User role (principal, it_admin, class_teacher, subject_teacher)
- `school_educators.role` - User role (if table exists)

**New Functions:**
- `check_user_permission(user_id, feature)` - Returns permission level for user
- `can_user_perform_action(user_id, feature, action)` - Checks if user can perform action
- `get_user_role(user_id)` - Returns user's role

**RLS Policies:**
- Updated policies for `teachers`, `class_assignments`, `timetable_slots`, `teacher_approvals`
- Policies enforce role-based access control

### 2. React Hook
**File:** `src/hooks/useUserRole.ts`

**Exports:**
- `useUserRole()` - Custom hook for role-based permissions
- `UserRole` type
- `PermissionLevel` type
- `RolePermissions` interface

**Hook Returns:**
```typescript
{
  role: UserRole,
  roleLabel: string,
  permissions: RolePermissions,
  loading: boolean,
  canPerformAction: (feature, action) => boolean,
  canAddTeacher: () => boolean,
  canApproveTeacher: () => boolean,
  canAssignClasses: () => boolean,
  canApproveClasses: () => boolean,
  canEditTimetable: () => boolean,
  canApproveTimetable: () => boolean,
  canViewTimetable: () => boolean,
  isPrincipal: boolean,
  isITAdmin: boolean,
  isClassTeacher: boolean,
  isSubjectTeacher: boolean,
}
```

### 3. Updated Components

#### TeacherOnboarding.tsx
- Added role selection dropdown
- Only Principal and IT Admin can access
- Principal can create & approve immediately
- IT Admin creates for approval
- Shows role badge in header
- Different submit buttons based on role

#### TimetableAllocation.tsx
- Added role-based access control
- Principal and IT Admin can edit
- Class Teacher and Subject Teacher can only view
- Shows "View Only Mode" badge for read-only users
- Hides add/delete buttons for view-only users

#### TeacherList.tsx
- Added "Role" column to teacher table
- Shows role badges with color coding:
  - Principal: Purple
  - IT Admin: Blue
  - Class Teacher: Green
  - Subject Teacher: Gray

---

## Role Descriptions

### 1. Principal
**Highest Level Access**
- Can add teachers and approve immediately (C/A)
- Can approve class assignments (A)
- Can approve timetable changes (A)
- Can assign Principal and IT Admin roles to new teachers
- Full administrative control

### 2. IT Admin
**Administrative Access**
- Can add teachers (requires Principal approval) (C)
- Can create class assignments (requires Principal approval) (C)
- Can update timetables (U)
- Cannot assign Principal or IT Admin roles
- Technical and operational management

### 3. Class Teacher
**Limited Access**
- Cannot add teachers (N/A)
- Cannot assign classes (N/A)
- Can view timetables (V)
- Read-only access to schedules

### 4. Subject Teacher
**Limited Access**
- Cannot add teachers (N/A)
- Cannot assign classes (N/A)
- Can view timetables (V)
- Read-only access to schedules

---

## Usage Examples

### Example 1: Principal Adding a Teacher

```typescript
// Principal logs in
const { canAddTeacher, canApproveTeacher } = useUserRole();

// canAddTeacher() = true
// canApproveTeacher() = true

// Principal fills form and clicks "Create & Approve"
// Teacher is immediately active, no approval needed
```

### Example 2: IT Admin Adding a Teacher

```typescript
// IT Admin logs in
const { canAddTeacher, canApproveTeacher } = useUserRole();

// canAddTeacher() = true
// canApproveTeacher() = false

// IT Admin fills form and clicks "Submit for Approval"
// Teacher status = "pending" or "documents_uploaded"
// Requires Principal approval to become "active"
```

### Example 3: Class Teacher Viewing Timetable

```typescript
// Class Teacher logs in
const { canEditTimetable, canViewTimetable } = useUserRole();

// canEditTimetable() = false
// canViewTimetable() = true

// UI shows "View Only Mode" badge
// Add/Delete buttons are hidden
// Can only view existing timetable slots
```

### Example 4: IT Admin Editing Timetable

```typescript
// IT Admin logs in
const { canEditTimetable } = useUserRole();

// canEditTimetable() = true

// Can add new time slots
// Can delete existing slots
// Can modify timetable
// Changes may require Principal approval (optional workflow)
```

---

## Approval Workflow

### Teacher Onboarding Workflow

```
IT Admin Creates Teacher
        ↓
Status: "pending" or "documents_uploaded"
        ↓
Principal Reviews
        ↓
    Approve / Reject
        ↓
Status: "active" or "inactive"
```

### Class Assignment Workflow (Future)

```
IT Admin Assigns Class
        ↓
Status: "pending"
        ↓
Principal Reviews
        ↓
    Approve / Reject
        ↓
Status: "approved" or "rejected"
```

---

## Database Schema

### role_permissions Table

```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role VARCHAR(20) NOT NULL,
  feature VARCHAR(50) NOT NULL,
  permission_level VARCHAR(10) NOT NULL,
  UNIQUE(role, feature)
);
```

**Sample Data:**
```sql
INSERT INTO role_permissions (role, feature, permission_level) VALUES
('principal', 'add_teacher', 'C/A'),
('principal', 'assign_classes', 'A'),
('principal', 'timetable_editing', 'A'),
('it_admin', 'add_teacher', 'C'),
('it_admin', 'assign_classes', 'C'),
('it_admin', 'timetable_editing', 'U'),
('class_teacher', 'timetable_editing', 'V'),
('subject_teacher', 'timetable_editing', 'V');
```

### teacher_approvals Table

```sql
CREATE TABLE teacher_approvals (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id),
  approval_type VARCHAR(50) NOT NULL,
  requested_by UUID REFERENCES auth.users(id),
  requested_by_role VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_by_role VARCHAR(20),
  approval_date TIMESTAMP,
  rejection_reason TEXT,
  request_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### class_assignments Table

```sql
CREATE TABLE class_assignments (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id),
  class_name VARCHAR(50) NOT NULL,
  subject_name VARCHAR(100) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_by_role VARCHAR(20),
  approved_by UUID REFERENCES auth.users(id),
  approved_by_role VARCHAR(20),
  approval_date TIMESTAMP,
  UNIQUE(teacher_id, class_name, subject_name, academic_year)
);
```

---

## Security Features

### Row Level Security (RLS)

**Teachers Table:**
- SELECT: All roles can view teachers in their school
- INSERT: Only Principal and IT Admin can add teachers
- UPDATE: Principal can approve, IT Admin can update, teachers can update own profile
- DELETE: Only Principal can delete

**Timetable Slots:**
- SELECT: All roles can view (if they have 'V' permission)
- INSERT: Only Principal and IT Admin can create
- UPDATE: Principal and IT Admin can update
- DELETE: Only Principal can delete

**Teacher Approvals:**
- SELECT: Requester and Principal/IT Admin can view
- INSERT: Any authenticated user can create approval request
- UPDATE: Only Principal can approve/reject

### Function-Level Security

All permission check functions use `SECURITY DEFINER` to ensure consistent permission checks regardless of caller.

---

## Testing Checklist

### Principal Role
- [ ] Can access Teacher Onboarding
- [ ] Can select all role types (including Principal and IT Admin)
- [ ] Can create and approve teacher immediately
- [ ] Can edit timetables
- [ ] Can delete timetable slots
- [ ] Can view all teachers with roles

### IT Admin Role
- [ ] Can access Teacher Onboarding
- [ ] Cannot select Principal or IT Admin roles
- [ ] Creates teachers for approval (not immediately active)
- [ ] Can edit timetables
- [ ] Can delete timetable slots
- [ ] Can view all teachers with roles

### Class Teacher Role
- [ ] Cannot access Teacher Onboarding (Access Denied)
- [ ] Can view timetables (View Only Mode)
- [ ] Cannot add timetable slots
- [ ] Cannot delete timetable slots
- [ ] Can view teacher list

### Subject Teacher Role
- [ ] Cannot access Teacher Onboarding (Access Denied)
- [ ] Can view timetables (View Only Mode)
- [ ] Cannot add timetable slots
- [ ] Cannot delete timetable slots
- [ ] Can view teacher list

---

## Migration Steps

### Step 1: Run Database Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually
psql -h your-db-host -U postgres -d your-database -f supabase/migrations/role_based_permissions.sql
```

### Step 2: Assign Roles to Existing Teachers

```sql
-- Update existing teachers with appropriate roles
UPDATE teachers SET role = 'principal' WHERE email = 'principal@school.edu';
UPDATE teachers SET role = 'it_admin' WHERE email = 'admin@school.edu';
UPDATE teachers SET role = 'class_teacher' WHERE /* your criteria */;
UPDATE teachers SET role = 'subject_teacher' WHERE role IS NULL;
```

### Step 3: Test Permissions

1. Login as Principal → Test all features
2. Login as IT Admin → Test create/update features
3. Login as Class Teacher → Test view-only access
4. Login as Subject Teacher → Test view-only access

### Step 4: Verify RLS Policies

```sql
-- Check if policies are active
SELECT * FROM pg_policies WHERE tablename IN ('teachers', 'timetable_slots', 'teacher_approvals');

-- Test permission function
SELECT check_user_permission('user-uuid', 'add_teacher');
SELECT can_user_perform_action('user-uuid', 'timetable_editing', 'U');
```

---

## Troubleshooting

### Issue: User has no role assigned
**Solution:** Default role is 'subject_teacher'. Update manually if needed.

```sql
UPDATE teachers SET role = 'principal' WHERE email = 'user@school.edu';
```

### Issue: Permission denied errors
**Solution:** Check RLS policies are enabled and user has correct role.

```sql
-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'teachers';

-- Check user role
SELECT role FROM teachers WHERE email = (SELECT email FROM auth.users WHERE id = 'user-uuid');
```

### Issue: Hook returns wrong permissions
**Solution:** Clear cache and re-fetch user data.

```typescript
// Force re-fetch
const { role, loading } = useUserRole();
useEffect(() => {
  // Trigger re-fetch on mount
}, []);
```

---

## Future Enhancements

### Phase 2
- [ ] Approval dashboard for Principal
- [ ] Email notifications for approval requests
- [ ] Audit log for permission changes
- [ ] Bulk role assignment
- [ ] Role hierarchy management

### Phase 3
- [ ] Custom permission templates
- [ ] Time-based permissions (temporary access)
- [ ] Department-level permissions
- [ ] Multi-school role management

---

## API Reference

### useUserRole Hook

```typescript
import { useUserRole } from '../hooks/useUserRole';

function MyComponent() {
  const {
    role,              // 'principal' | 'it_admin' | 'class_teacher' | 'subject_teacher'
    roleLabel,         // 'Principal' | 'IT Admin' | 'Class Teacher' | 'Subject Teacher'
    permissions,       // { add_teacher: 'C/A', assign_classes: 'A', ... }
    loading,           // boolean
    canAddTeacher,     // () => boolean
    canApproveTeacher, // () => boolean
    canEditTimetable,  // () => boolean
    canViewTimetable,  // () => boolean
    isPrincipal,       // boolean
    isITAdmin,         // boolean
  } = useUserRole();

  if (loading) return <Spinner />;
  
  if (!canAddTeacher()) {
    return <AccessDenied />;
  }

  return <TeacherForm />;
}
```

### Database Functions

```sql
-- Check user permission
SELECT check_user_permission('user-uuid', 'add_teacher');
-- Returns: 'C/A', 'C', 'U', 'V', or 'N/A'

-- Check if user can perform action
SELECT can_user_perform_action('user-uuid', 'timetable_editing', 'U');
-- Returns: true or false

-- Get user role
SELECT get_user_role('user-uuid');
-- Returns: 'principal', 'it_admin', 'class_teacher', or 'subject_teacher'
```

---

## Summary

The role-based permission system is now fully implemented with:

✅ 4 distinct roles (Principal, IT Admin, Class Teacher, Subject Teacher)  
✅ Permission matrix matching reference image  
✅ Database-level security with RLS policies  
✅ React hook for easy permission checks  
✅ Updated UI components with role-based access  
✅ Approval workflow for IT Admin actions  
✅ Visual indicators for user roles and permissions  

**Status:** ✅ Complete and Ready for Testing  
**Version:** 1.0  
**Date:** November 2024
