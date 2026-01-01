-- Debug why results aren't being saved to personal_assessment_results

-- 1. Check RLS policies on the table
SELECT 
  policyname,
  cmd,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies 
WHERE tablename = 'personal_assessment_results';

-- 2. Check if RLS is enabled
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'personal_assessment_results';

-- 3. Check the foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'personal_assessment_results'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 4. Check if the student exists in students table with user_id
SELECT id, user_id, email, name 
FROM students 
WHERE user_id = '374d93e2-0c5f-41e0-9028-f27882173b9f';

-- 5. Check the latest attempt for this student
SELECT 
  id as attempt_id,
  student_id,
  stream_id,
  grade_level,
  status,
  started_at,
  completed_at
FROM personal_assessment_attempts
WHERE student_id = '374d93e2-0c5f-41e0-9028-f27882173b9f'
ORDER BY created_at DESC
LIMIT 1;

-- 6. Try to insert a test record (run as service role to bypass RLS)
-- This will show if there's a constraint violation
/*
INSERT INTO personal_assessment_results (
  attempt_id,
  student_id,
  stream_id,
  grade_level,
  status,
  gemini_results
) 
SELECT 
  id as attempt_id,
  student_id,
  stream_id,
  grade_level,
  'completed',
  '{"test": true}'::jsonb
FROM personal_assessment_attempts
WHERE student_id = '374d93e2-0c5f-41e0-9028-f27882173b9f'
  AND status = 'completed'
ORDER BY created_at DESC
LIMIT 1;
*/
