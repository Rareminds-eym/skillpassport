-- Fix RLS policies for personal_assessment_results table
-- The issue is that student_id is UUID but the policy was comparing with text

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view their own results" ON public.personal_assessment_results;
DROP POLICY IF EXISTS "Students can insert their own results" ON public.personal_assessment_results;

-- Create corrected policies with proper UUID comparison
CREATE POLICY "Students can view their own results" ON public.personal_assessment_results
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own results" ON public.personal_assessment_results
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Also add UPDATE policy so students can update their own results (for regeneration)
DROP POLICY IF EXISTS "Students can update their own results" ON public.personal_assessment_results;
CREATE POLICY "Students can update their own results" ON public.personal_assessment_results
  FOR UPDATE USING (auth.uid() = student_id);

-- Verify the policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'personal_assessment_results';
