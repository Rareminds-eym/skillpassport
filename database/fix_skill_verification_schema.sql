-- Fix schema and RLS issues
-- We determined that students.id is UUID, so skill_verification_requests.student_id must also be UUID.

-- 1. Drop policies that depend on the column to allow alterations
DROP POLICY IF EXISTS "Students can view their own verification requests" ON skill_verification_requests;
DROP POLICY IF EXISTS "Students can insert verification requests" ON skill_verification_requests;
DROP POLICY IF EXISTS "Admins can view all verification requests" ON skill_verification_requests;
DROP POLICY IF EXISTS "Admins can update verification requests" ON skill_verification_requests;

-- 2. Drop foreign key constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'skill_verification_requests_student_id_fkey') THEN
    ALTER TABLE skill_verification_requests DROP CONSTRAINT skill_verification_requests_student_id_fkey;
  END IF;
END $$;

-- 3. Ensure student_id is UUID (convert if it was changed to TEXT)
-- Using USING clause to handle conversion if needed
ALTER TABLE skill_verification_requests 
  ALTER COLUMN student_id TYPE UUID USING student_id::uuid;

-- 4. Re-add the foreign key constraint
ALTER TABLE skill_verification_requests 
  ADD CONSTRAINT skill_verification_requests_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- 5. Re-create RLS policies (using UUID comparisons)

-- Students can view their own requests
CREATE POLICY "Students can view their own verification requests" 
  ON skill_verification_requests FOR SELECT 
  USING (auth.uid() = student_id);

-- Students can insert their own requests
CREATE POLICY "Students can insert verification requests" 
  ON skill_verification_requests FOR INSERT 
  WITH CHECK (auth.uid() = student_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all verification requests" 
  ON skill_verification_requests FOR SELECT 
  USING (true);

-- Admins can update requests
CREATE POLICY "Admins can update verification requests" 
  ON skill_verification_requests FOR UPDATE 
  USING (true);

-- 6. Fix RLS for students table: Allow public read access (or at least authenticated) so Admins can see student details in the join
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'students' AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON students FOR SELECT USING (true);
  END IF;
END $$;
