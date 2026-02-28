-- Add DELETE policy for experience table
-- Without this policy, students cannot delete their own experience records

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Students can delete their own experience" ON experience;

-- Create DELETE policy: Students can delete their own experience
CREATE POLICY "Students can delete their own experience"
ON experience
FOR DELETE
USING (
  auth.uid() = student_id
);

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE '✅ Added DELETE policy for experience table';
  RAISE NOTICE '   Students can now delete their own experience records';
END $$;
