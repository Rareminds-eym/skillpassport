-- Verify that the student_id in attempts matches the students table
-- Replace 'litikesh23@rareminds.in' with your actual email

-- 1. Get your student record
SELECT 
  'YOUR STUDENT RECORD' as info,
  id as student_id,
  user_id,
  email,
  name
FROM students 
WHERE email = 'litikesh23@rareminds.in';

-- 2. Get in-progress attempts
SELECT 
  'IN-PROGRESS ATTEMPTS' as info,
  id as attempt_id,
  student_id,
  status,
  grade_level,
  stream_id,
  created_at,
  updated_at
FROM personal_assessment_attempts
WHERE status = 'in_progress'
ORDER BY created_at DESC;

-- 3. Check if the student_id matches
SELECT 
  'MATCH CHECK' as info,
  s.id as student_table_id,
  s.email,
  pa.id as attempt_id,
  pa.student_id as attempt_student_id,
  CASE 
    WHEN s.id = pa.student_id THEN '✅ IDs MATCH'
    ELSE '❌ IDs DO NOT MATCH'
  END as match_status
FROM students s
LEFT JOIN personal_assessment_attempts pa ON pa.student_id = s.id AND pa.status = 'in_progress'
WHERE s.email = 'litikesh23@rareminds.in';

-- 4. Check if there's a completed result (which would override in-progress)
SELECT 
  'COMPLETED RESULTS' as info,
  pr.id as result_id,
  pr.student_id,
  pr.status,
  pr.created_at
FROM personal_assessment_results pr
WHERE pr.student_id = (SELECT id FROM students WHERE email = 'litikesh23@rareminds.in')
  AND pr.status = 'completed'
ORDER BY pr.created_at DESC;
