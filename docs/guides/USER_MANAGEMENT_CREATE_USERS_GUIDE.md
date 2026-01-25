# User Management - Create Users Guide

## Overview
The User Management page now supports creating new users with specific roles (College Admin, HoD, Faculty, etc.) and automatically creates the necessary records in the appropriate tables.

## Features

### Add New User Form
Located at: `/college-admin/users`

**Fields:**
- **Name*** - Full name of the user
- **Email*** - Unique email address
- **Employee ID** - Optional employee identifier
- **Student ID** - Optional student identifier
- **Roles*** - Select one or more roles:
  - College Admin
  - HoD (Head of Department)
  - Faculty
  - Exam Cell
  - Finance Admin
  - Placement Officer
- **Department** - Select from available departments
- **Status** - Active or Inactive

## How It Works

### User Creation Flow

```
1. Fill Form → 2. Validate → 3. Create Auth User → 4. Create Public User → 5. Create Role Record
```

#### Step 1: Form Validation
- Name and Email are required
- At least one role must be selected
- Email must be unique across all tables

#### Step 2: Duplicate Check
The system checks for duplicate emails in:
- `users` table
- `students` table
- `college_lecturers` table (metadata)

#### Step 3: Create Auth User
- Creates user in Supabase Auth (`auth.users`)
- Generates temporary password
- Sets user metadata (name, roles)

#### Step 4: Create Public User
- Creates record in `public.users` table
- Links to auth user via ID

#### Step 5: Create Role-Specific Record
Based on selected roles:

**For Staff Roles** (College Admin, HoD, Faculty, etc.):
- Creates record in `college_lecturers` table
- Stores metadata:
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@college.edu",
    "role": "college_admin",
    "temporary_password": "abc123xyz",
    "password_created_at": "2024-01-01T00:00:00Z",
    "created_by": "admin@college.edu"
  }
  ```

## Database Tables Affected

### 1. auth.users (Supabase Auth)
```sql
- id (uuid)
- email
- encrypted_password
- email_confirmed_at
- user_metadata (jsonb)
```

### 2. public.users
```sql
- id (uuid, matches auth.users.id)
- email
- full_name
- name
- created_at
- updated_at
```

### 3. college_lecturers (for staff)
```sql
- id (uuid)
- userId / user_id (references users.id)
- collegeId (references colleges.id)
- employeeId
- department
- accountStatus
- metadata (jsonb)
  - first_name
  - last_name
  - email
  - role
  - temporary_password
  - password_created_at
  - created_by
```

## Usage Examples

### Example 1: Create College Admin
```
Name: Dr. Sarah Johnson
Email: sarah.johnson@college.edu
Employee ID: ADM001
Roles: ✓ College Admin
Department: Administration
Status: Active
```

**Result:**
- Auth user created with temporary password
- Record in `users` table
- Record in `college_lecturers` with role "college_admin"

### Example 2: Create Faculty Member
```
Name: Prof. Michael Chen
Email: michael.chen@college.edu
Employee ID: FAC042
Roles: ✓ Faculty, ✓ HoD
Department: Computer Science
Status: Active
```

**Result:**
- Auth user created
- Record in `users` table
- Record in `college_lecturers` with role "faculty"
- Can be assigned as HoD for department

### Example 3: Create Multiple Role User
```
Name: Dr. Emily Brown
Email: emily.brown@college.edu
Employee ID: EXM001
Roles: ✓ Faculty, ✓ Exam Cell
Department: Mathematics
Status: Active
```

**Result:**
- User can access both faculty and exam cell features
- Single record in `college_lecturers`
- Multiple roles stored in metadata

## Viewing Created Users

The User Management page displays:

### All Users Table
Shows users from:
- `college_lecturers` (staff)
- `students` (students)

### Columns Displayed
1. **Name** - Full name
2. **Email** - Email address
3. **Roles** - Badge for each role
4. **ID** - Employee ID or Student ID
5. **Status** - Active/Inactive badge
6. **Actions** - Edit, Reset Password, Deactivate

### Filtering Options
- **Search** - By name, email, or ID
- **Role Filter** - Show only specific roles
- **Status Filter** - Active or Inactive

## Important Notes

### Temporary Passwords
- System generates random temporary password
- Stored in `college_lecturers.metadata.temporary_password`
- User should change on first login
- Password is also sent via email (if email service configured)

### College Association
- New users are automatically associated with the college of the creator
- System looks up college ID from current user's email
- Falls back to first available college if not found

### Permissions
- Only College Admins can create users
- Created users inherit college association
- RLS policies apply based on college

### Rollback on Error
If any step fails, the system automatically:
1. Deletes auth user (if created)
2. Deletes public user record (if created)
3. Returns error message

## Troubleshooting

### Error: "A user with this email already exists"
**Cause**: Email is already in use
**Solution**: Use a different email or check existing users

### Error: "Failed to create auth user"
**Cause**: Supabase Auth issue (invalid email format, etc.)
**Solution**: Check email format and Supabase Auth settings

### Error: "No college ID found"
**Cause**: Current user not associated with any college
**Solution**: 
1. Ensure your email exists in `colleges` table
2. Or manually set college ID in the code

### Error: "Failed to create lecturer record"
**Cause**: Database constraint violation or RLS policy
**Solution**: 
1. Check RLS policies on `college_lecturers`
2. Verify college ID exists
3. Check database constraints

## Testing

### Test User Creation
1. Go to `/college-admin/users`
2. Click "Add User" button
3. Fill in the form:
   - Name: Test User
   - Email: test.user@college.edu
   - Employee ID: TEST001
   - Roles: Faculty
   - Status: Active
4. Click "Create User"
5. Check browser console for logs
6. Verify user appears in table

### Verify in Database
```sql
-- Check auth user
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'test.user@college.edu';

-- Check public user
SELECT id, email, full_name 
FROM public.users 
WHERE email = 'test.user@college.edu';

-- Check lecturer record
SELECT id, "employeeId", metadata 
FROM college_lecturers 
WHERE metadata->>'email' = 'test.user@college.edu';
```

## Next Steps

After creating a user:
1. Share temporary password securely
2. User logs in and changes password
3. Assign additional permissions if needed
4. Add to departments/courses as needed
5. Configure timetable and schedules

## API Reference

### Create User
```typescript
const result = await userManagementService.createUser({
  name: 'John Doe',
  email: 'john.doe@college.edu',
  employee_id: 'EMP001',
  roles: ['Faculty', 'HoD'],
  department_id: 'dept-uuid',
  status: 'active'
});

if (result.success) {
  console.log('User created:', result.data);
} else {
  console.error('Error:', result.error.message);
}
```

### Response Format
```typescript
{
  success: boolean;
  data?: User;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}
```
