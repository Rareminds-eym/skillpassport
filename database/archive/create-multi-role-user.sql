-- Script to create a test user with multiple roles
-- This will help you test the multi-role login functionality

-- Step 1: Create the auth user (run this in Supabase SQL Editor or via API)
-- You'll need to do this via the Supabase Auth API or Dashboard first
-- Example email: multirole@test.com
-- Password: Test123!

-- After creating the auth user, get the user_id from auth.users table
-- Then run the following queries with the actual user_id

-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from auth.users

-- Step 2: Create student record
INSERT INTO students (
  user_id,
  email,
  name,
  school_id,
  approval_status,
  profile
) VALUES (
  'YOUR_USER_ID_HERE',
  'multirole@test.com',
  'Multi Role Test User',
  (SELECT id FROM schools LIMIT 1), -- Uses first available school
  'approved',
  jsonb_build_object('name', 'Multi Role Test User')
);

-- Step 3: Create recruiter record
INSERT INTO recruiters (
  user_id,
  email,
  name,
  company
) VALUES (
  'YOUR_USER_ID_HERE',
  'multirole@test.com',
  'Multi Role Test User',
  'Test Company'
);

-- Step 4: Create educator record
INSERT INTO school_educators (
  user_id,
  email,
  first_name,
  last_name,
  school_id
) VALUES (
  'YOUR_USER_ID_HERE',
  'multirole@test.com',
  'Multi Role',
  'Test User',
  (SELECT id FROM schools LIMIT 1) -- Uses first available school
);

-- Verify the user has multiple roles
SELECT 
  'student' as role,
  id,
  email,
  name
FROM students
WHERE user_id = 'YOUR_USER_ID_HERE'

UNION ALL

SELECT 
  'recruiter' as role,
  id,
  email,
  name
FROM recruiters
WHERE user_id = 'YOUR_USER_ID_HERE'

UNION ALL

SELECT 
  'educator' as role,
  id,
  email,
  first_name || ' ' || last_name as name
FROM school_educators
WHERE user_id = 'YOUR_USER_ID_HERE';

-- Expected result: 3 rows showing student, recruiter, and educator roles
