-- ============================================
-- CREATE AUTH USERS FOR STUDENTS
-- This creates actual login accounts
-- ============================================

-- Note: This requires Supabase's auth extension
-- Run this AFTER inserting students data

-- Create auth users (requires admin privileges)
-- You may need to run this via Supabase Dashboard or Admin API

-- STUDENT 1: Rahul Kumar
-- Email: rahul.kumar@example.com
-- Password: Student@123

-- STUDENT 2: Priya Sharma  
-- Email: priya.sharma@example.com
-- Password: Student@123

-- STUDENT 3: Arjun Patel
-- Email: arjun.patel@example.com
-- Password: Student@123

-- ============================================
-- MANUAL STEPS (Recommended):
-- ============================================

-- Go to Supabase Dashboard → Authentication → Users
-- Click "Add User" for each student:

-- 1. Rahul Kumar
--    Email: rahul.kumar@example.com
--    Password: Student@123
--    Auto Confirm: Yes

-- 2. Priya Sharma
--    Email: priya.sharma@example.com
--    Password: Student@123
--    Auto Confirm: Yes

-- 3. Arjun Patel
--    Email: arjun.patel@example.com
--    Password: Student@123
--    Auto Confirm: Yes

-- ============================================
-- AFTER CREATING AUTH USERS:
-- ============================================

-- Link auth users to your tables
-- Run this query to update user_id in students table:

UPDATE students s
SET user_id = au.id
FROM auth.users au
WHERE s.email = au.email
AND s.school_id = '550e8400-e29b-41d4-a716-446655440000';

-- Update users table
UPDATE users u
SET id = au.id
FROM auth.users au
WHERE u.email = au.email
AND u.email IN (
  'rahul.kumar@example.com',
  'priya.sharma@example.com',
  'arjun.patel@example.com'
);

-- Verify the linkage
SELECT 
  au.email,
  au.created_at as auth_created,
  u.role as user_role,
  s.name as student_name,
  s.grade,
  s.section
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
LEFT JOIN students s ON au.id = s.user_id
WHERE au.email IN (
  'rahul.kumar@example.com',
  'priya.sharma@example.com',
  'arjun.patel@example.com'
);
