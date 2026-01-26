-- Debug script to check why applications aren't saving

-- 1. Check if students table has the correct structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'students'
  AND column_name IN ('id', 'user_id')
ORDER BY ordinal_position;

-- 2. Check if applied_jobs foreign key is correct
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'applied_jobs'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'student_id';

-- 3. Check a sample student record
SELECT 
  id,
  user_id,
  name,
  email
FROM students
LIMIT 1;

-- 4. Try to manually insert a test application (replace with actual values)
-- This will show us the exact error
-- Uncomment and replace values to test:
/*
INSERT INTO applied_jobs (student_id, opportunity_id, application_status)
VALUES (
  (SELECT id FROM students WHERE user_id = 'YOUR_USER_ID_HERE' LIMIT 1),
  (SELECT id FROM opportunities LIMIT 1),
  'applied'
);
*/

-- 5. Check if there are any triggers that might be blocking inserts
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'applied_jobs';
