-- Check if college admin user exists and is properly configured
-- Replace 'college@example.com' with your actual college admin email

-- 1. Check if user exists in auth.users
SELECT 
    'Auth User' as source,
    id as user_id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
WHERE email = 'college@example.com';

-- 2. Check if user exists in users table with college_admin role
SELECT 
    'Users Table' as source,
    id,
    user_id,
    email,
    name,
    role,
    created_at
FROM users
WHERE email = 'college@example.com';

-- 3. Check if user has a college record (via created_by)
SELECT 
    'Colleges Table' as source,
    id,
    name,
    code,
    created_by,
    "deanName",
    "deanEmail",
    "accountStatus",
    "approvalStatus"
FROM colleges
WHERE created_by IN (
    SELECT id FROM auth.users WHERE email = 'college@example.com'
);

-- 4. Check all roles for this user
WITH user_auth AS (
  SELECT id FROM auth.users WHERE email = 'college@example.com'
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
  u.role,
  u.id,
  u.email,
  u.name
FROM users u, user_auth
WHERE u.user_id = user_auth.id;

-- 5. If no results above, the user needs to be added to the users table
-- Run this to add them (replace values):
/*
INSERT INTO users (user_id, email, name, role)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'college@example.com'),
    'college@example.com',
    'College Admin Name',
    'college_admin'
);
*/
