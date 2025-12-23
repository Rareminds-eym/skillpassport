-- Fix permissions for generated_external_assessment table
-- This allows students to read generated assessments

-- Enable RLS
ALTER TABLE generated_external_assessment ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read generated assessments (they're not user-specific)
CREATE POLICY "Anyone can read generated assessments"
ON generated_external_assessment
FOR SELECT
TO authenticated
USING (true);

-- Only allow system/admin to insert (or you can allow authenticated users)
CREATE POLICY "Authenticated users can insert generated assessments"
ON generated_external_assessment
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Optional: Allow updates (if you want to version assessments)
CREATE POLICY "Authenticated users can update generated assessments"
ON generated_external_assessment
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify policies
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
WHERE tablename = 'generated_external_assessment';
