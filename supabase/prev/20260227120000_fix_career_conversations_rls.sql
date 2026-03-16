-- Fix RLS policy for career_ai_conversations UPDATE operations
-- This migration adds WITH CHECK clause to prevent users from changing ownership
-- and ensures proper security validation on updates

-- Drop the existing incomplete UPDATE policy
DROP POLICY IF EXISTS "Users can update own career conversations" ON "public"."career_ai_conversations";

-- Create a secure UPDATE policy with both USING and WITH CHECK clauses
-- USING: Checks if the user owns the EXISTING row before allowing update
-- WITH CHECK: Prevents changing student_id to another user's ID during update
CREATE POLICY "Users can update own career conversations" 
ON "public"."career_ai_conversations" 
FOR UPDATE 
TO authenticated
USING ((SELECT auth.uid()) = student_id)
WITH CHECK ((SELECT auth.uid()) = student_id);

-- Add comment explaining the security improvement
COMMENT ON POLICY "Users can update own career conversations" ON "public"."career_ai_conversations" 
IS 'Secure UPDATE policy with both USING and WITH CHECK clauses to prevent unauthorized updates and ownership changes';
