-- This script helps you add a test educator to your school
-- Replace the email with your logged-in user's email

-- Step 1: Check what schools exist
SELECT id, name, code FROM schools ORDER BY created_at DESC LIMIT 5;

-- Step 2: Check if you already have a user in the users table
-- Replace 'your-email@example.com' with your actual email
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';

-- Step 3: If you don't have a user, create one first
-- Uncomment and modify this if needed:
/*
INSERT INTO users (email, role, created_at, updated_at)
VALUES ('your-email@example.com', 'school_admin', NOW(), NOW())
RETURNING id, email, role;
*/

-- Step 4: Add educator record
-- Replace these values:
-- - user_id: the UUID from users table (from step 2 or 3)
-- - school_id: the UUID from schools table (from step 1)
-- - email: your login email
/*
INSERT INTO school_educators (
  user_id,
  school_id,
  email,
  first_name,
  last_name,
  role,
  onboarding_status,
  account_status,
  phone_number,
  employee_id
) VALUES (
  'YOUR-USER-UUID-HERE',  -- Replace with actual user_id
  'YOUR-SCHOOL-UUID-HERE', -- Replace with actual school_id
  'your-email@example.com', -- Your login email
  'Admin',
  'User',
  'school_admin',
  'active',
  'active',
  '1234567890',
  'EMP-001'
) RETURNING id, email, school_id, role;
*/

-- Step 5: Verify the educator was created
SELECT 
  se.id,
  se.email,
  se.first_name,
  se.last_name,
  se.role,
  se.school_id,
  s.name as school_name
FROM school_educators se
LEFT JOIN schools s ON se.school_id = s.id
WHERE se.email = 'your-email@example.com';

-- Quick fix: If you want to link an existing educator to your email
-- Uncomment and modify:
/*
UPDATE school_educators 
SET email = 'your-email@example.com'
WHERE id = 'EDUCATOR-UUID-HERE';
*/
