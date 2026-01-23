# College Admin Login Debug Steps

## Current Situation
- **User ID:** `91bf6be4-31a5-4d6a-853d-675596755cee`
- **Email:** `aditya@college.edu`
- **Problem:** Role lookup returns 0 roles, but user exists in `users` table

## Possible Causes

### 1. Column Name Mismatch
The `users` table might not have a `user_id` column, or it's named differently.

### 2. Data Mismatch
The `user_id` in the `users` table might not match the auth user's ID.

### 3. Missing Role Value
The `role` column might be NULL or have an unexpected value.

## Debug Steps

### Step 1: Check Users Table Structure

Run this in Supabase SQL Editor:

```sql
-- Show all columns in users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

**Look for:**
- Is there a `user_id` column?
- Is there an `id` column?
- Is there a `role` column?
- Is there an `email` column?

### Step 2: Find the User Record

```sql
-- Try finding by email
SELECT * FROM users WHERE email = 'aditya@college.edu';

-- Try finding by user_id
SELECT * FROM users WHERE user_id = '91bf6be4-31a5-4d6a-853d-675596755cee';

-- Try finding by id
SELECT * FROM users WHERE id = '91bf6be4-31a5-4d6a-853d-675596755cee';
```

**Check:**
- Which query returns the user?
- What is the value in the `role` column?
- What is the value in the `user_id` or `id` column?

### Step 3: Use Updated Debug Page

1. Go to `/debug-roles`
2. Enter: `aditya@college.edu` and password
3. Click "Check Roles"
4. **Open Browser Console (F12)**
5. Look for these logs:

```
Checking users table for userId: 91bf6be4-31a5-4d6a-853d-675596755cee
Users table (by user_id): { userData1: ..., userError1: ... }
Users table (by email): { userData2: ..., userError2: ... }
Users table (by id): { userData3: ..., userError3: ... }
```

One of these should show the user data!

### Step 4: Check Role Value

If the user is found, check the role value:

```sql
SELECT 
    id,
    user_id,
    email,
    role,
    CASE 
        WHEN role = 'college_admin' THEN '✅ Correct'
        WHEN role IS NULL THEN '❌ NULL - needs to be set'
        ELSE '⚠️ Unexpected value: ' || role
    END as role_status
FROM users 
WHERE email = 'aditya@college.edu';
```

## Common Issues & Fixes

### Issue 1: user_id Column Doesn't Exist

**Symptom:** Query by `user_id` returns nothing, but query by `email` works

**Fix:** The table uses `id` instead of `user_id`. The updated code now tries both!

### Issue 2: Role is NULL

**Symptom:** User found but `role` column is NULL

**Fix:**
```sql
UPDATE users 
SET role = 'college_admin'
WHERE email = 'aditya@college.edu';
```

### Issue 3: Role Has Wrong Value

**Symptom:** User found but role is not 'college_admin'

**Fix:**
```sql
-- Check current value
SELECT email, role FROM users WHERE email = 'aditya@college.edu';

-- Update to correct value
UPDATE users 
SET role = 'college_admin'
WHERE email = 'aditya@college.edu';
```

### Issue 4: user_id Doesn't Match

**Symptom:** User exists but `user_id` doesn't match auth user ID

**Fix:**
```sql
-- Update user_id to match auth user
UPDATE users 
SET user_id = '91bf6be4-31a5-4d6a-853d-675596755cee'
WHERE email = 'aditya@college.edu';
```

### Issue 5: User Doesn't Exist in users Table

**Symptom:** No queries return the user

**Fix:**
```sql
-- Insert the user
INSERT INTO users (user_id, email, name, role)
VALUES (
    '91bf6be4-31a5-4d6a-853d-675596755cee',
    'aditya@college.edu',
    'Aditya',
    'college_admin'
);
```

## Quick Test Script

Run this complete diagnostic:

```sql
-- Complete diagnostic for aditya@college.edu
DO $$
DECLARE
    auth_id uuid := '91bf6be4-31a5-4d6a-853d-675596755cee';
    user_email text := 'aditya@college.edu';
BEGIN
    -- Check auth.users
    RAISE NOTICE '=== AUTH.USERS ===';
    PERFORM * FROM auth.users WHERE id = auth_id;
    IF FOUND THEN
        RAISE NOTICE '✅ User exists in auth.users';
    ELSE
        RAISE NOTICE '❌ User NOT in auth.users';
    END IF;

    -- Check users table structure
    RAISE NOTICE '=== USERS TABLE STRUCTURE ===';
    RAISE NOTICE 'Columns: %', (
        SELECT string_agg(column_name, ', ')
        FROM information_schema.columns
        WHERE table_name = 'users'
    );

    -- Check users table by user_id
    RAISE NOTICE '=== USERS TABLE (by user_id) ===';
    PERFORM * FROM users WHERE user_id = auth_id;
    IF FOUND THEN
        RAISE NOTICE '✅ Found by user_id';
        RAISE NOTICE 'Role: %', (SELECT role FROM users WHERE user_id = auth_id);
    ELSE
        RAISE NOTICE '❌ NOT found by user_id';
    END IF;

    -- Check users table by email
    RAISE NOTICE '=== USERS TABLE (by email) ===';
    PERFORM * FROM users WHERE email = user_email;
    IF FOUND THEN
        RAISE NOTICE '✅ Found by email';
        RAISE NOTICE 'Role: %', (SELECT role FROM users WHERE email = user_email);
        RAISE NOTICE 'user_id: %', (SELECT user_id FROM users WHERE email = user_email);
    ELSE
        RAISE NOTICE '❌ NOT found by email';
    END IF;

    -- Check users table by id
    RAISE NOTICE '=== USERS TABLE (by id) ===';
    PERFORM * FROM users WHERE id = auth_id;
    IF FOUND THEN
        RAISE NOTICE '✅ Found by id';
        RAISE NOTICE 'Role: %', (SELECT role FROM users WHERE id = auth_id);
    ELSE
        RAISE NOTICE '❌ NOT found by id';
    END IF;
END $$;
```

## After Fixing

1. Clear browser cache
2. Go to `/login`
3. Enter `aditya@college.edu` and password
4. Should now work!

## Still Not Working?

Share the output from:
1. The diagnostic script above
2. Browser console logs from `/debug-roles`
3. This query: `SELECT * FROM users WHERE email = 'aditya@college.edu';`
