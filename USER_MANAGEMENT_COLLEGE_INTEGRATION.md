# User Management - College Integration Complete

## Overview
Updated the User Management page to fetch users from both `college_lecturers` and `students` tables who are part of the college.

## Changes Made

### 1. Updated Service Layer
**File**: `src/services/college/userManagementService.ts`

- Modified `getUsers()` method to fetch from both tables:
  - **college_lecturers**: Fetches lecturers with their user details via foreign key
  - **students**: Fetches students who belong to the college

- Data transformation:
  - Lecturers are mapped with roles: `['Faculty', 'Lecturer']`
  - Students are mapped with role: `['Student']`
  - Both include metadata for type-specific information

### 2. Updated Type Definitions
**File**: `src/types/college.ts`

Added `metadata` field to User interface to support:
- Lecturer info: specialization, qualification, experience, joining date
- Student info: grade, section, roll number, admission number, CGPA, course

### 3. Updated UI Component
**File**: `src/pages/admin/collegeAdmin/UserManagement.tsx`

- Added "Student" and "Lecturer" options to role filter dropdown
- Reordered filters to show Student first

## Data Flow

```
User Management Page
    ↓
useUsers Hook
    ↓
userManagementService.getUsers()
    ↓
    ├─→ college_lecturers table (with users join)
    │   └─→ Transform to User format with 'lecturer' metadata
    │
    └─→ students table
        └─→ Transform to User format with 'student' metadata
    ↓
Combined & Filtered Results
    ↓
Display in Table
```

## Features

### Filtering
- **Role Filter**: All Roles, Student, Lecturer, Faculty, College Admin, HoD, Exam Cell, Finance Admin
- **Status Filter**: Active, Inactive (applies to lecturers)
- **Search**: Name, email, employee ID, student ID, roll number

### Display Fields
- Name
- Email
- Roles (badges)
- ID (employee_id or student_id)
- Status
- Actions (Edit, Reset Password, Deactivate)

## Database Schema Used

### college_lecturers
```sql
- id, userId, user_id
- collegeId, employeeId
- department, specialization, qualification
- experienceYears, dateOfJoining
- accountStatus (active/inactive)
```

### students
```sql
- id, user_id, email, name
- student_id, college_id
- grade, section, roll_number, admission_number
- course_name, branch_field, currentCgpa
- is_deleted (filtered out)
```

## Testing

To test the integration:

1. Ensure you have data in both tables
2. Navigate to User Management page
3. Try different filters:
   - Filter by "Student" role
   - Filter by "Lecturer" role
   - Search by name/email
4. Verify both lecturers and students appear in the list

## Notes

- Students don't have explicit status field, so they're shown as 'active' by default
- Deleted students (is_deleted = true) are excluded
- The service handles errors gracefully - if one table fails, the other still loads
- Role filtering works across both user types
