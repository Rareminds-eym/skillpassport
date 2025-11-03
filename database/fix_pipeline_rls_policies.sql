-- ==================================================================================
-- RLS Policies for Pipeline Integration
-- ==================================================================================
-- This ensures the trigger can write to pipeline_candidates and students/recruiters can read
-- ==================================================================================

-- Temporarily disable RLS to allow trigger to work
ALTER TABLE pipeline_candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE requisitions DISABLE ROW LEVEL SECURITY;

-- Re-enable with proper policies
ALTER TABLE pipeline_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON pipeline_candidates;
DROP POLICY IF EXISTS "Enable read access for all users" ON pipeline_candidates;
DROP POLICY IF EXISTS "Authenticated users can view pipeline candidates" ON pipeline_candidates;
DROP POLICY IF EXISTS "Authenticated users can manage pipeline candidates" ON pipeline_candidates;
DROP POLICY IF EXISTS "Students can view their own pipeline status" ON pipeline_candidates;
DROP POLICY IF EXISTS "Recruiters can view all pipeline candidates" ON pipeline_candidates;
DROP POLICY IF EXISTS "Recruiters can manage pipeline candidates" ON pipeline_candidates;

-- Pipeline Candidates Policies
-- Allow service role (triggers) to insert
CREATE POLICY "Service role can insert pipeline candidates"
  ON pipeline_candidates
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to insert (for direct application flow)
CREATE POLICY "Authenticated can insert pipeline candidates"
  ON pipeline_candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Students can view their own pipeline status
CREATE POLICY "Students can view own pipeline"
  ON pipeline_candidates
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR
    student_id IN (
      SELECT id FROM students WHERE id = auth.uid()
    )
  );

-- Recruiters can view all pipeline candidates
CREATE POLICY "Recruiters can view all pipeline"
  ON pipeline_candidates
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'recruiter'
    )
    OR
    auth.uid() IN (
      SELECT recruiter_id FROM recruiters
    )
  );

-- Recruiters can update pipeline candidates
CREATE POLICY "Recruiters can update pipeline"
  ON pipeline_candidates
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'recruiter'
    )
    OR
    auth.uid() IN (
      SELECT recruiter_id FROM recruiters
    )
  );

-- Recruiters can delete pipeline candidates
CREATE POLICY "Recruiters can delete pipeline"
  ON pipeline_candidates
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'recruiter'
    )
    OR
    auth.uid() IN (
      SELECT recruiter_id FROM recruiters
    )
  );

-- Requisitions Policies
DROP POLICY IF EXISTS "Enable read access for requisitions" ON requisitions;
DROP POLICY IF EXISTS "Recruiters can manage requisitions" ON requisitions;

-- Allow everyone to read requisitions (needed for joins)
CREATE POLICY "All authenticated can read requisitions"
  ON requisitions
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role can insert/update (for auto-creation)
CREATE POLICY "Service role can manage requisitions"
  ON requisitions
  FOR ALL
  TO service_role
  WITH CHECK (true);

-- Recruiters can manage requisitions
CREATE POLICY "Recruiters can manage requisitions"
  ON requisitions
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'recruiter'
    )
    OR
    auth.uid() IN (
      SELECT recruiter_id FROM recruiters
    )
  );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('pipeline_candidates', 'requisitions')
ORDER BY tablename, policyname;
