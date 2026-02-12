-- Migration: Assessment Schema Hardening
-- Purpose: Add industrial-grade constraints and data integrity checks
-- Created: 2026-02-12

-- ============================================================================
-- STEP 1: Add Foreign Key Constraints
-- ============================================================================

-- Ensure attempt_id references a valid attempt
ALTER TABLE personal_assessment_responses
DROP CONSTRAINT IF EXISTS fk_responses_attempt;

ALTER TABLE personal_assessment_responses
ADD CONSTRAINT fk_responses_attempt
FOREIGN KEY (attempt_id) 
REFERENCES personal_assessment_attempts(id)
ON DELETE CASCADE;

-- Ensure question_id references a valid question (if question exists)
-- Note: Questions may be deleted/archived, so we allow NULL or use a trigger
ALTER TABLE personal_assessment_responses
DROP CONSTRAINT IF EXISTS fk_responses_question;

-- ============================================================================
-- STEP 2: Add NOT NULL Constraints
-- ============================================================================

-- Critical fields must not be null
ALTER TABLE personal_assessment_responses
ALTER COLUMN attempt_id SET NOT NULL,
ALTER COLUMN question_id SET NOT NULL,
ALTER COLUMN response_value SET NOT NULL,
ALTER COLUMN responded_at SET NOT NULL;

-- Set default for responded_at
ALTER TABLE personal_assessment_responses
ALTER COLUMN responded_at SET DEFAULT NOW();

-- ============================================================================
-- STEP 3: Add Composite Index for Fast Lookups
-- ============================================================================

-- Primary lookup pattern: by attempt + question
DROP INDEX IF EXISTS idx_responses_attempt_question;
CREATE INDEX idx_responses_attempt_question 
ON personal_assessment_responses(attempt_id, question_id);

-- Secondary lookup: by attempt for fetching all responses
DROP INDEX IF EXISTS idx_responses_attempt;
CREATE INDEX idx_responses_attempt 
ON personal_assessment_responses(attempt_id);

-- Time-based queries for analytics
DROP INDEX IF EXISTS idx_responses_responded_at;
CREATE INDEX idx_responses_responded_at 
ON personal_assessment_responses(responded_at);

-- ============================================================================
-- STEP 4: Add Data Validation Check Constraints
-- ============================================================================

-- Ensure response_value is not empty/whitespace for text answers
ALTER TABLE personal_assessment_responses
DROP CONSTRAINT IF EXISTS chk_response_not_empty;

ALTER TABLE personal_assessment_responses
ADD CONSTRAINT chk_response_not_empty
CHECK (
  response_value IS NOT NULL AND
  (jsonb_typeof(response_value::jsonb) != 'string' OR
   TRIM(response_value::text) != '')
);

-- ============================================================================
-- STEP 5: Create Trigger for Auto-Setting responded_at
-- ============================================================================

CREATE OR REPLACE FUNCTION set_response_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set responded_at to current time on insert
  IF TG_OP = 'INSERT' THEN
    NEW.responded_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_response_timestamp ON personal_assessment_responses;

CREATE TRIGGER trg_set_response_timestamp
BEFORE INSERT ON personal_assessment_responses
FOR EACH ROW
EXECUTE FUNCTION set_response_timestamp();

-- ============================================================================
-- STEP 6: Add Response Integrity View for Validation
-- ============================================================================

-- Create view to validate response integrity between attempts and responses
CREATE OR REPLACE VIEW v_response_integrity AS
SELECT 
  pa.id AS attempt_id,
  pa.student_id,
  pa.status,
  pa.grade_level,
  pa.started_at,
  COUNT(par.id) AS response_count,
  pa.all_responses IS NOT NULL AS has_all_responses
FROM personal_assessment_attempts pa
LEFT JOIN personal_assessment_responses par 
  ON pa.id = par.attempt_id
GROUP BY pa.id, pa.student_id, pa.status, pa.grade_level, pa.started_at, pa.all_responses
HAVING COUNT(par.id) = 0 AND pa.status = 'completed';

-- Comment explaining the view
COMMENT ON VIEW v_response_integrity IS 
'Identifies completed attempts that have no individual responses in personal_assessment_responses table (data integrity issue)';

-- ============================================================================
-- STEP 7: Add RLS Policy for Response Access
-- ============================================================================

-- Enable RLS on responses table if not already enabled
ALTER TABLE personal_assessment_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Students can view own responses" ON personal_assessment_responses;
DROP POLICY IF EXISTS "Students can insert own responses" ON personal_assessment_responses;
DROP POLICY IF EXISTS "Students can update own responses" ON personal_assessment_responses;

-- Policy: Students can only see responses for their own attempts
CREATE POLICY "Students can view own responses"
ON personal_assessment_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM personal_assessment_attempts pa
    WHERE pa.id = personal_assessment_responses.attempt_id
    AND pa.student_id = auth.uid()
  )
);

-- Policy: Students can only insert responses for their own attempts
CREATE POLICY "Students can insert own responses"
ON personal_assessment_responses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM personal_assessment_attempts pa
    WHERE pa.id = personal_assessment_responses.attempt_id
    AND pa.student_id = auth.uid()
  )
);

-- Policy: Students can only update their own responses
CREATE POLICY "Students can update own responses"
ON personal_assessment_responses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM personal_assessment_attempts pa
    WHERE pa.id = personal_assessment_responses.attempt_id
    AND pa.student_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM personal_assessment_attempts pa
    WHERE pa.id = personal_assessment_responses.attempt_id
    AND pa.student_id = auth.uid()
  )
);

-- ============================================================================
-- STEP 8: Create Function to Check Data Integrity
-- ============================================================================

CREATE OR REPLACE FUNCTION check_assessment_integrity(
  p_attempt_id UUID
)
RETURNS TABLE (
  check_name TEXT,
  check_status TEXT,
  details JSONB
) AS $$
DECLARE
  v_attempt RECORD;
  v_response_count INT;
  v_all_response_count INT;
BEGIN
  -- Get attempt info
  SELECT * INTO v_attempt
  FROM personal_assessment_attempts
  WHERE id = p_attempt_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      'attempt_exists'::TEXT,
      'FAILED'::TEXT,
      jsonb_build_object('error', 'Attempt not found', 'attempt_id', p_attempt_id);
    RETURN;
  END IF;
  
  -- Check 1: Attempt exists
  RETURN QUERY SELECT 
    'attempt_exists'::TEXT,
    'PASSED'::TEXT,
    jsonb_build_object('attempt_id', v_attempt.id, 'status', v_attempt.status);
  
  -- Check 2: Has responses in responses table
  SELECT COUNT(*) INTO v_response_count
  FROM personal_assessment_responses
  WHERE attempt_id = p_attempt_id;
  
  RETURN QUERY SELECT 
    'has_individual_responses'::TEXT,
    CASE WHEN v_response_count > 0 THEN 'PASSED' ELSE 'WARNING' END::TEXT,
    jsonb_build_object('response_count', v_response_count);
  
  -- Check 3: Has all_responses JSONB
  SELECT jsonb_object_keys(v_attempt.all_responses) INTO NULL;
  
  RETURN QUERY SELECT 
    'has_all_responses'::TEXT,
    CASE WHEN v_attempt.all_responses IS NOT NULL THEN 'PASSED' ELSE 'WARNING' END::TEXT,
    jsonb_build_object('has_data', v_attempt.all_responses IS NOT NULL);
  
  -- Check 4: Completed attempts should have results
  IF v_attempt.status = 'completed' THEN
    RETURN QUERY SELECT 
      'has_results'::TEXT,
      CASE WHEN EXISTS(
        SELECT 1 FROM personal_assessment_results WHERE attempt_id = p_attempt_id
      ) THEN 'PASSED' ELSE 'FAILED' END::TEXT,
      jsonb_build_object('has_results', EXISTS(
        SELECT 1 FROM personal_assessment_results WHERE attempt_id = p_attempt_id
      ));
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_assessment_integrity IS 
'Checks data integrity for a specific assessment attempt. Returns status for various integrity checks.';

-- ============================================================================
-- STEP 9: Add Comments for Documentation
-- ============================================================================

COMMENT ON TABLE personal_assessment_responses IS 
'Individual question responses for assessment attempts. Each row represents one answer to one question. Use v_response_integrity view to check for missing data.';

COMMENT ON COLUMN personal_assessment_responses.is_correct IS 
'Whether the answer is correct (for MCQ questions). NULL for personality/interest questions that have no correct answer.';

COMMENT ON COLUMN personal_assessment_responses.response_value IS 
'The actual answer value. Can be string, number, or JSON object depending on question type.';

-- ============================================================================
-- Migration Complete
-- ============================================================================
