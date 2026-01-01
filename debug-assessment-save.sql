-- Debug script to check why assessment results aren't being saved

-- 1. Check if the current user exists in students table with matching user_id
-- Replace 'YOUR_AUTH_USER_ID' with the actual auth.uid() value
SELECT 
  id,
  user_id,
  email,
  name
FROM students 
WHERE user_id = auth.uid();

-- 2. Check if there are any assessment attempts for this user
SELECT 
  a.id as attempt_id,
  a.student_id,
  a.stream_id,
  a.grade_level,
  a.status,
  a.created_at,
  a.completed_at
FROM personal_assessment_attempts a
WHERE a.student_id = auth.uid()
ORDER BY a.created_at DESC
LIMIT 5;

-- 3. Check if there are any results for this user
SELECT 
  r.id as result_id,
  r.attempt_id,
  r.student_id,
  r.stream_id,
  r.grade_level,
  r.status,
  r.created_at
FROM personal_assessment_results r
WHERE r.student_id = auth.uid()
ORDER BY r.created_at DESC
LIMIT 5;

-- 4. Check RLS policies on the table
SELECT 
  policyname,
  cmd,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies 
WHERE tablename = 'personal_assessment_results';

-- 5. Check if RLS is enabled
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class 
WHERE relname = 'personal_assessment_results';

-- 6. Test insert (run this to see the actual error)
-- This will show if there's a constraint violation or RLS issue
/*
INSERT INTO personal_assessment_results (
  attempt_id,
  student_id,
  stream_id,
  grade_level,
  status
) VALUES (
  'YOUR_ATTEMPT_ID'::uuid,
  auth.uid(),
  'science',
  'after12',
  'completed'
);
*/
