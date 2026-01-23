# Fix College Admin Login Issue

## Problem
College admin users are getting "Account not properly configured. Contact support" error when trying to log in.

## Root Cause
The college admin user exists in `auth.users` but is **NOT** in the `users` table with `role = 'college_admin'`.

The unified login system checks the `users` table for admin roles, but the college admin record is missing.

## Solution

### Step 1: Verify the Issue

Run this SQL query in Supabase SQL Editor (replace the email):

```sql
-- Check if user exists in auth.users
SELECT id, email FROM auth.users WHERE email = 'your-college-admin@example.com';

-- Check if user exists in users table
SELECT * FROM users WHERE email = 'your-college-admin@example.com';
```

If the first query returns a result but the second doesn't, you need to add the user to the `users` table.

### Step 2: Add College Admin to Users Table

```sql
-- Get the auth user ID first
WITH auth_user AS (
  SELECT id FROM auth.users WHERE email = 'your-college-admin@example.com'
)
-- Insert into users table
INSERT INTO users (user_id, email, name, role)
SELECT 
  id,
  'your-college-admin@example.com',
  'College Admin Name', -- Replace with actual name
  'college_admin'
FROM auth_user
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE user_id = auth_user.id
);
```

### Step 3: Verify the Fix

```sql
-- This should now return a row with role = 'college_admin'
SELECT * FROM users WHERE email = 'your-college-admin@example.com';
```

### Step 4: Test Login

1. Go to `/login`
2. Enter the college admin email and password
3. Should now successfully log in and redirect to `/college-admin/dashboard`

## Alternative: Use Debug Page

1. Navigate to `/debug-roles`
2. Enter the college admin email and password
3. Click "Check Roles"
4. Look at the results:
   - If "Users Table" section is empty → User needs to be added to users table
   - If "Users Table" shows the user but no role → Role needs to be set to 'college_admin'

## For Multiple College Admins

If you have multiple college admins to fix:

```sql
-- Add all college admins who are missing from users table
INSERT INTO users (user_id, email, name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'College Admin'),
  'college_admin'
FROM auth.users au
WHERE au.email IN (
  'admin1@college.com',
  'admin2@college.com',
  'admin3@college.com'
  -- Add more emails as needed
)
AND NOT EXISTS (
  SELECT 1 FROM users u WHERE u.user_id = au.id
);
```

## Understanding the Tables

### `auth.users` Table
- Managed by Supabase Auth
- Contains authentication credentials
- Every user must be here first

### `users` Table
- Application-level user data
- Contains the `role` field for admin users
- Required for college_admin, school_admin, university_admin

### `colleges` Table
- Contains college information
- `created_by` references the auth user who created the college
- Does NOT determine login role

## Common Scenarios

### Scenario 1: New College Registration
When a college admin registers:
1. User is created in `auth.users` ✅
2. College is created in `colleges` table ✅
3. **User must also be added to `users` table with role** ⚠️

### Scenario 2: Existing College Admin
If college admin was created before unified login:
1. User exists in `auth.users` ✅
2. College exists in `colleges` table ✅
3. **User might be missing from `users` table** ⚠️

## Prevention

To prevent this issue in the future, update your college registration flow to:

1. Create user in `auth.users`
2. Create college in `colleges` table
3. **Create user record in `users` table with role = 'college_admin'**

Example:
```typescript
// After creating auth user and college
await supabase.from('users').insert({
  user_id: authUser.id,
  email: authUser.email,
  name: collegeAdminName,
  role: 'college_admin'
});
```

## Quick Fix Script

Use the SQL script: `check-college-admin-user.sql`

```bash
# In Supabase SQL Editor:
# 1. Replace 'college@example.com' with actual email
# 2. Run the queries to check status
# 3. If needed, run the INSERT statement at the bottom
```

## Still Having Issues?

1. Check browser console for detailed logs
2. Use `/debug-roles` page to see exactly what's being detected
3. Verify the user's email is correct
4. Check if the user's email is confirmed in Supabase Auth
5. Ensure RLS policies allow reading from `users` table

## Contact Support

If the issue persists after following these steps, provide:
- User email
- Output from `/debug-roles` page
- Results from `check-college-admin-user.sql`
- Browser console logs
