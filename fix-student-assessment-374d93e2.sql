-- Fix assessment results for student 374d93e2-0c5f-41e0-9028-f27882173b9f

-- Step 1: Check if student exists in students table with this user_id
SELECT id, user_id, email, name 
FROM students 
WHERE user_id = '374d93e2-0c5f-41e0-9028-f27882173b9f';

-- Step 2: Check if there are any attempts for this student
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
ORDER BY created_at DESC;

-- Step 3: Check if there are any results for this student
SELECT 
  id,
  attempt_id,
  student_id,
  stream_id,
  status,
  created_at
FROM personal_assessment_results
WHERE student_id = '374d93e2-0c5f-41e0-9028-f27882173b9f';

-- Step 4: Fix RLS policies (the main issue)
-- Drop existing policies
DROP POLICY IF EXISTS "Students can view their own results" ON public.personal_assessment_results;
DROP POLICY IF EXISTS "Students can insert their own results" ON public.personal_assessment_results;
DROP POLICY IF EXISTS "Students can update their own results" ON public.personal_assessment_results;

-- Create corrected policies with proper UUID comparison
CREATE POLICY "Students can view their own results" ON public.personal_assessment_results
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own results" ON public.personal_assessment_results
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own results" ON public.personal_assessment_results
  FOR UPDATE USING (auth.uid() = student_id);

-- Step 5: If there's a completed attempt but no result, we need to check localStorage
-- The student should retake or we can manually insert from localStorage data

-- Step 6: Verify RLS is working - test query
-- Run this while logged in as the student to verify they can see their data
SELECT * FROM personal_assessment_results 
WHERE student_id = '374d93e2-0c5f-41e0-9028-f27882173b9f';
