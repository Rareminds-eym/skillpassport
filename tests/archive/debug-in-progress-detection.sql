-- Debug: Check why in-progress attempt is not being detected
-- Run this to see the exact data

-- 1. Check the in-progress attempt
SELECT 
  'IN-PROGRESS ATTEMPT' as check_type,
  pa.id,
  pa.student_id,
  pa.status,
  pa.grade_level,
  pa.stream_id,
  pa.created_at
FROM personal_assessment_attempts pa
WHERE pa.status = 'in_progress'
ORDER BY pa.created_at DESC
LIMIT 1;

-- 2. Check the student record
SELECT 
  'STUDENT RECORD' as check_type,
  s.id as student_id,
  s.user_id,
  s.email,
  s.name
FROM students s
WHERE s.email = 'uuul@gmail.com' -- Replace with your email
LIMIT 1;

-- 3. Check if there's a completed result (which would override in-progress)
SELECT 
  'COMPLETED RESULT' as check_type,
  pr.id,
  pr.student_id,
  pr.status,
  pr.created_at
FROM personal_assessment_results pr
WHERE pr.student_id = (SELECT id FROM students WHERE email = 'uuul@gmail.com') -- Replace with your email
  AND pr.status = 'completed'
ORDER BY pr.created_at DESC
LIMIT 1;

-- 4. Check if student_id matches between attempt and student table
SELECT 
  'ID MATCH CHECK' as check_type,
  pa.student_id as attempt_student_id,
  s.id as student_table_id,
  CASE 
    WHEN pa.student_id = s.id THEN '✅ MATCH'
    ELSE '❌ MISMATCH'
  END as match_status
FROM personal_assessment_attempts pa
CROSS JOIN students s
WHERE pa.status = 'in_progress'
  AND s.email = 'uuul@gmail.com' -- Replace with your email
LIMIT 1;
