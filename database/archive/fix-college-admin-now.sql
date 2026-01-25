-- QUICK FIX: Add college admin to users table
-- Run this in Supabase SQL Editor

-- Step 1: Check current status
SELECT 
    'Before Fix' as status,
    au.id as auth_user_id,
    au.email,
    u.id as users_table_id,
    u.role
FROM auth.users au
LEFT JOIN users u ON u.user_id = au.id
WHERE au.email = 'YOUR_COLLEGE_ADMIN_EMAIL_HERE'; -- REPLACE THIS

-- Step 2: Add to users table if missing
INSERT INTO users (user_id, email, name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name',
        'College Admin'
    ),
    'college_admin',
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'YOUR_COLLEGE_ADMIN_EMAIL_HERE' -- REPLACE THIS
AND NOT EXISTS (
    SELECT 1 FROM users WHERE user_id = au.id
);

-- Step 3: Verify the fix
SELECT 
    'After Fix' as status,
    au.id as auth_user_id,
    au.email,
    u.id as users_table_id,
    u.role,
    u.name
FROM auth.users au
LEFT JOIN users u ON u.user_id = au.id
WHERE au.email = 'YOUR_COLLEGE_ADMIN_EMAIL_HERE'; -- REPLACE THIS

-- Expected result: Should show role = 'college_admin'

-- Step 4: Test login
-- Now try logging in at /login with this email
