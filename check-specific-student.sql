-- Check if the specific student exists in the database
-- student_id from console: c802ab39-21ed-4d6c-9f8f-869b442b0939

-- 1. Check if this UUID exists in students table
SELECT 
  '1. Check by user_id' as section,
  id,
  user_id,
  name,
  email,
  approval_status
FROM students
WHERE user_id = 'c802ab39-21ed-4d6c-9f8f-869b442b0939';

-- 2. Check if it exists as students.id instead
SELECT 
  '2. Check by id' as section,
  id,
  user_id,
  name,
  email,
  approval_status
FROM students
WHERE id = 'c802ab39-21ed-4d6c-9f8f-869b442b0939';

-- 3. Check all students to see what data exists
SELECT 
  '3. All Students Sample' as section,
  id,
  user_id,
  name,
  email
FROM students
LIMIT 10;

-- 4. Check the applied_jobs entry
SELECT 
  '4. Applied Jobs Entry' as section,
  id,
  student_id,
  opportunity_id,
  application_status
FROM applied_jobs
WHERE student_id = 'c802ab39-21ed-4d6c-9f8f-869b442b0939';
