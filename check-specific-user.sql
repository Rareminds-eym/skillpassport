-- Check specific user: aditya@college.edu
-- User ID: 91bf6be4-31a5-4d6a-853d-675596755cee

-- 1. Check auth.users
SELECT 
    'auth.users' as table_name,
    id,
    email,
    created_at
FROM auth.users
WHERE id = '91bf6be4-31a5-4d6a-853d-675596755cee';

-- 2. Check users table - by user_id
SELECT 
    'users (by user_id)' as table_name,
    id,
    user_id,
    email,
    name,
    role,
    created_at
FROM users
WHERE user_id = '91bf6be4-31a5-4d6a-853d-675596755cee';

-- 3. Check users table - by email
SELECT 
    'users (by email)' as table_name,
    id,
    user_id,
    email,
    name,
    role,
    created_at
FROM users
WHERE email = 'aditya@college.edu';

-- 4. Check if user_id column exists and what it contains
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('id', 'user_id', 'role', 'email');

-- 5. Show ALL columns in users table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
