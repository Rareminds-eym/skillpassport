-- Fix RLS policies for external_assessment_attempts table
-- This allows students to update their own assessment progress

-- First, check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'external_assessment_attempts';

-- Drop existing policies if they're too restrictive
DROP POLICY IF EXISTS "Students can view own attempts" ON external_assessment_attempts;
DROP POLICY IF EXISTS "Students can insert own attempts" ON external_assessment_attempts;
DROP POLICY IF EXISTS "Students can update own attempts" ON external_assessment_attempts;

-- Enable RLS
ALTER TABLE external_assessment_attempts ENABLE ROW LEVEL SECURITY;

-- Allow students to SELECT their own attempts
CREATE POLICY "Students can view own attempts"
ON external_assessment_attempts
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Allow students to INSERT their own attempts
CREATE POLICY "Students can insert own attempts"
ON external_assessment_attempts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- Allow students to UPDATE their own attempts (THIS IS THE KEY FIX!)
CREATE POLICY "Students can update own attempts"
ON external_assessment_attempts
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Verify the new policies
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
WHERE tablename = 'external_assessment_attempts';
