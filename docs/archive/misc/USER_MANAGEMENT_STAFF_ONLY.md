# User Management - Staff Only (No Students)

## Overview
The User Management page now displays **only staff members** (lecturers, faculty, admins) from the `college_lecturers` table. Students are excluded and should be managed through the Student Admission module.

## Changes Made

### 1. Removed Student Fetching
- **Before**: Fetched from both `college_lecturers` and `students` tables
- **After**: Fetches only from `college_lecturers` table

### 2. Updated Role Filter
Removed "Student" option from the dropdown. Available roles:
- College Admin
- HoD (Head of Department)
- Faculty
- Lecturer
- Exam Cell
- Finance Admin
- Placement Officer

### 3. Enhanced Role Display
Now properly reads roles from `college_lecturers.metadata.role`:
- `college_admin` → "College Admin"
- `hod` → "HoD"
- `professor` → "Faculty"
- `assistant_professor` → "Faculty"
- `lecturer` → "Lecturer"
- `exam_cell` → "Exam Cell"
- `finance_admin` → "Finance Admin"
- `placement_officer` → "Placement Officer"

### 4. Improved Data Display
- Name: Reads from `metadata.first_name` + `metadata.last_name`
- Email: Reads from `metadata.email`
- Employee ID: From `employeeId` column
- Roles: Mapped from `metadata.role`
- Status: From `accountStatus` column

## Data Source

### Single Table: `college_lecturers`

```sql
SELECT 
  id,
  userId,
  user_id,
  collegeId,
  employeeId,
  department,
  specialization,
  qualification,
  experienceYears,
  dateOfJoining,
  accountStatus,
  metadata,
  createdAt,
  updatedAt
FROM college_lecturers
WHERE accountStatus = 'active'  -- if status filter applied
AND department = 'dept-id'      -- if department filter applied
```

### Metadata Structure
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@college.edu",
  "phone_number": "+1234567890",
  "role": "college_admin",
  "temporary_password": "abc123xyz",
  "password_created_at": "2024-01-01T00:00:00Z",
  "created_by": "admin@college.edu",
  "subject_expertise": [
    {
      "name": "Machine Learning",
      "proficiency": "expert",
      "years_experience": 5
    }
  ]
}
```

## User Management vs Student Management

| Feature | User Management | Student Management |
|---------|----------------|-------------------|
| **Purpose** | Manage staff/faculty | Manage students |
| **Table** | `college_lecturers` | `students` |
| **Location** | `/college-admin/users` | `/college-admin/student-admission` |
| **Roles** | Admin, HoD, Faculty, etc. | Student only |
| **Create** | ✅ Via "Add User" button | ✅ Via Student Admission |
| **Edit** | ✅ Edit details | ✅ Edit details |
| **Status** | Active/Inactive/Pending/Suspended | Active (is_deleted flag) |

## Features

### View Staff Users
- Lists all staff from `college_lecturers` table
- Shows name, email, roles, employee ID, status
- Displays role badges (color-coded)

### Search & Filter
- **Search**: By name, email, or employee ID
- **Role Filter**: Filter by specific role
- **Status Filter**: Active, Inactive, Pending, Suspended

### Add New Staff
Click "Add User" button to create:
- College Admin
- HoD
- Faculty
- Lecturer
- Exam Cell staff
- Finance Admin
- Placement Officer

### Actions
- **Edit** (pencil icon): Update user details
- **Reset Password** (key icon): Send password reset email
- **Deactivate** (trash icon): Set status to inactive

## Console Logs

When the page loads, check browser console for:

```
🔍 Fetching users with filters: { role: "", status: "", search: "" }
📚 Lecturers query result: { count: 5, error: null }
✅ Total staff users fetched: {
  total: 5,
  filtered: 5,
  byRole: {
    'College Admin': 1,
    'HoD': 1,
    'Faculty': 2,
    'Lecturer': 1,
    'Exam Cell': 0,
    'Finance Admin': 0
  }
}
```

## Testing

### 1. Verify No Students Displayed
- Go to `/college-admin/users`
- Check that only staff members appear
- Students should NOT be in the list

### 2. Check Role Filter
- Select different roles from dropdown
- Verify only users with that role appear

### 3. Test Search
- Search by name, email, or employee ID
- Verify results are filtered correctly

### 4. Create New Staff User
- Click "Add User"
- Fill in form with staff role
- Verify user appears in list

## SQL Verification

Check what's being displayed:

```sql
-- Count staff by role
SELECT 
  metadata->>'role' as role,
  COUNT(*) as count
FROM college_lecturers
GROUP BY metadata->>'role';

-- View sample staff data
SELECT 
  "employeeId",
  metadata->>'first_name' as first_name,
  metadata->>'last_name' as last_name,
  metadata->>'email' as email,
  metadata->>'role' as role,
  "accountStatus"
FROM college_lecturers
ORDER BY "createdAt" DESC
LIMIT 10;

-- Verify no students in the query
-- (This should return 0 if working correctly)
SELECT COUNT(*) 
FROM students 
WHERE email IN (
  SELECT metadata->>'email' 
  FROM college_lecturers
);
```

## Benefits

### 1. Clear Separation
- Staff management separate from student management
- No confusion between user types
- Cleaner interface

### 2. Appropriate Features
- Staff-specific actions (reset password, deactivate)
- Role-based filtering
- Department assignment

### 3. Better Performance
- Queries only one table instead of two
- Faster load times
- Simpler data transformation

### 4. Correct Permissions
- Staff users have admin/faculty permissions
- Students managed through different module
- Clear access control

## Where to Manage Students

Students should be managed through:
- **Student Admission** module at `/college-admin/student-admission`
- **Student Data** page
- Bulk import features for students

## Summary

✅ User Management now shows **only staff** (no students)
✅ Fetches from `college_lecturers` table only
✅ Displays proper roles from metadata
✅ Role filter updated (removed "Student")
✅ Search works for staff members
✅ Create new staff users with appropriate roles
✅ Students managed separately in Student Admission module
