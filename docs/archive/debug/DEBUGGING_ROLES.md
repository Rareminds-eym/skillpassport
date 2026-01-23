# Debugging Role Selection Issue

## Quick Steps to Debug

### Option 1: Use the Debug Page (Easiest)

1. Navigate to: `http://localhost:5173/debug-roles` (or your app URL + `/debug-roles`)
2. Enter the email and password of the user you're testing
3. Click "Check Roles"
4. You'll see:
   - User ID
   - All roles found in the database
   - The result from `getUserRole()` function
   - Whether the user should see role selection

### Option 2: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Try logging in with your test user
4. Look for these log messages:
   ```
   🔍 Role lookup result: { role: ..., roles: [...], ... }
   ```
5. Check if:
   - `roles` array has more than 1 item → Should show role selection
   - `role` is set and `roles` is undefined → Single role, direct login
   - Error message → Something went wrong

### Option 3: Check Database Directly

Run this SQL query in Supabase SQL Editor:

```sql
-- Replace 'user@example.com' with your test user's email
WITH user_auth AS (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
)
SELECT 
  'student' as role,
  s.id,
  s.email,
  s.name
FROM students s, user_auth
WHERE s.user_id = user_auth.id

UNION ALL

SELECT 
  'recruiter' as role,
  r.id,
  r.email,
  r.name
FROM recruiters r, user_auth
WHERE r.user_id = user_auth.id

UNION ALL

SELECT 
  'educator' as role,
  e.id,
  e.email,
  e.first_name || ' ' || e.last_name as name
FROM school_educators e, user_auth
WHERE e.user_id = user_auth.id

UNION ALL

SELECT 
  'educator' as role,
  e.id,
  e.email,
  e.first_name || ' ' || e.last_name as name
FROM educators e, user_auth
WHERE e.user_id = user_auth.id

UNION ALL

SELECT 
  u.role,
  u.id,
  u.email,
  u.name
FROM users u, user_auth
WHERE u.user_id = user_auth.id
AND u.role IN ('school_admin', 'college_admin', 'university_admin');
```

## Common Issues

### Issue 1: User Only Has One Role

**Symptom:** Login works but no role selection screen appears

**Cause:** The user only has one role in the database

**Solution:** 
- This is expected behavior! Role selection only shows for users with multiple roles
- To test multi-role, create a test user with multiple roles (see below)

### Issue 2: User Has No Roles

**Symptom:** Error message "Account not properly configured"

**Cause:** User exists in auth.users but not in any role table

**Solution:**
- Add the user to at least one role table (students, recruiters, school_educators, etc.)
- Use the SQL script in `create-multi-role-user.sql`

### Issue 3: Role Selection Not Showing Despite Multiple Roles

**Symptom:** User has multiple roles but sees direct login

**Possible Causes:**
1. The `getUserRole()` function is returning early (check console logs)
2. The UI condition is not being met
3. State is not updating correctly

**Debug Steps:**
1. Check browser console for the debug logs
2. Use the `/debug-roles` page to verify roles are detected
3. Check if `state.showRoleSelection` is being set to `true`

## Creating a Test User with Multiple Roles

### Method 1: Using Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Create a new user (e.g., `multirole@test.com`)
3. Copy the User ID (UUID)
4. Go to SQL Editor
5. Run the queries from `create-multi-role-user.sql` (replace `YOUR_USER_ID_HERE` with the actual UUID)

### Method 2: Using SQL Script

```sql
-- 1. First create auth user via Supabase Dashboard or API
-- Email: multirole@test.com
-- Password: Test123!

-- 2. Get the user_id from auth.users
SELECT id, email FROM auth.users WHERE email = 'multirole@test.com';

-- 3. Insert into multiple role tables (replace USER_ID)
-- Student role
INSERT INTO students (user_id, email, name, approval_status)
VALUES ('USER_ID', 'multirole@test.com', 'Multi Role User', 'approved');

-- Recruiter role
INSERT INTO recruiters (user_id, email, name, company)
VALUES ('USER_ID', 'multirole@test.com', 'Multi Role User', 'Test Company');

-- Educator role
INSERT INTO school_educators (user_id, email, first_name, last_name, school_id)
VALUES ('USER_ID', 'multirole@test.com', 'Multi', 'User', (SELECT id FROM schools LIMIT 1));
```

## Expected Behavior

### Single Role User
1. User enters credentials
2. System authenticates
3. System finds one role
4. User is redirected directly to their dashboard
5. **No role selection screen**

### Multiple Role User
1. User enters credentials
2. System authenticates
3. System finds multiple roles (e.g., student + recruiter)
4. **Role selection screen appears**
5. User selects a role
6. User is redirected to the selected role's dashboard

## Verification Checklist

- [ ] User exists in `auth.users` table
- [ ] User has records in at least one role table
- [ ] For multi-role test: User has records in 2+ role tables
- [ ] All role records have the same `user_id` matching `auth.users.id`
- [ ] Browser console shows debug logs when logging in
- [ ] `/debug-roles` page shows the expected roles
- [ ] Role selection UI appears when multiple roles are detected

## Need More Help?

If you're still not seeing the role selection:

1. Share the output from `/debug-roles` page
2. Share the browser console logs
3. Share the SQL query results showing the user's roles
4. Confirm which user email you're testing with

This will help identify the exact issue!
