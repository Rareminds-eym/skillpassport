-- Verify college admin can now log in
-- User: aditya@college.edu
-- ID: 91bf6be4-31a5-4d6a-853d-675596755cee

-- 1. Verify user exists in auth.users
SELECT 
    '1. Auth User' as check_name,
    id,
    email,
    email_confirmed_at,
    CASE 
        WHEN id = '91bf6be4-31a5-4d6a-853d-675596755cee' THEN '✅ Correct ID'
        ELSE '❌ ID mismatch'
    END as status
FROM auth.users
WHERE email = 'aditya@college.edu';

-- 2. Verify user exists in users table with correct structure
SELECT 
    '2. Users Table' as check_name,
    id,
    email,
    "firstName",
    "lastName",
    role,
    "isActive",
    CASE 
        WHEN id = '91bf6be4-31a5-4d6a-853d-675596755cee' THEN '✅ ID matches auth.users'
        ELSE '❌ ID does not match'
    END as id_status,
    CASE 
        WHEN role = 'college_admin' THEN '✅ Correct role'
        WHEN role IS NULL THEN '❌ Role is NULL'
        ELSE '⚠️ Role is: ' || role::text
    END as role_status
FROM users
WHERE email = 'aditya@college.edu';

-- 3. Check if user is active
SELECT 
    '3. Active Status' as check_name,
    email,
    "isActive",
    CASE 
        WHEN "isActive" = true THEN '✅ User is active'
        ELSE '❌ User is inactive'
    END as status
FROM users
WHERE email = 'aditya@college.edu';

-- 4. Verify foreign key constraint
SELECT 
    '4. Foreign Key' as check_name,
    u.id as users_id,
    au.id as auth_id,
    CASE 
        WHEN u.id = au.id THEN '✅ Foreign key valid'
        ELSE '❌ Foreign key mismatch'
    END as status
FROM users u
JOIN auth.users au ON u.email = au.email
WHERE u.email = 'aditya@college.edu';

-- 5. Check if user has a college
SELECT 
    '5. College Association' as check_name,
    c.id as college_id,
    c.name as college_name,
    c."accountStatus",
    c."approvalStatus",
    CASE 
        WHEN c.id IS NOT NULL THEN '✅ Has college'
        ELSE '⚠️ No college found'
    END as status
FROM users u
LEFT JOIN colleges c ON c.created_by = u.id
WHERE u.email = 'aditya@college.edu';

-- Summary
SELECT 
    '=== SUMMARY ===' as summary,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM users 
            WHERE email = 'aditya@college.edu' 
            AND id = '91bf6be4-31a5-4d6a-853d-675596755cee'
            AND role = 'college_admin'
            AND "isActive" = true
        ) THEN '✅ ALL CHECKS PASSED - Login should work!'
        ELSE '❌ ISSUES FOUND - Check details above'
    END as result;
