-- Fix RLS policies for educator student conversations
-- This will allow educators to view and manage their student conversations properly

-- 1. Drop the broken SELECT policy
DROP POLICY IF EXISTS "Educators can view their student conversations" ON conversations;

-- 2. Create the fixed SELECT policy
CREATE POLICY "Educators can view their student conversations" ON conversations
FOR SELECT TO public
USING (
  (educator_id IN (
    SELECT id FROM school_educators WHERE user_id = auth.uid()
  )) 
  AND (conversation_type::text = 'student_educator'::text) 
  AND ((deleted_by_educator IS NULL) OR (deleted_by_educator = false))
);

-- 3. Drop the broken UPDATE policy
DROP POLICY IF EXISTS "Educators can update their student conversations" ON conversations;

-- 4. Create the fixed UPDATE policy
CREATE POLICY "Educators can update their student conversations" ON conversations
FOR UPDATE TO public
USING (
  (educator_id IN (
    SELECT id FROM school_educators WHERE user_id = auth.uid()
  )) 
  AND (conversation_type::text = 'student_educator'::text)
);

-- 5. Drop the broken INSERT policy
DROP POLICY IF EXISTS "Educators can create student conversations" ON conversations;

-- 6. Create the fixed INSERT policy
CREATE POLICY "Educators can create student conversations" ON conversations
FOR INSERT TO public
WITH CHECK (
  (educator_id IN (
    SELECT id FROM school_educators WHERE user_id = auth.uid()
  )) 
  AND (conversation_type::text = 'student_educator'::text)
);

-- Verify the policies were created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'conversations' 
AND policyname LIKE '%Educators can%student%'
ORDER BY policyname;