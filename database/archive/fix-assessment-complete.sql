-- Complete Fix for Assessment Resume Feature
-- Run this SQL in Supabase SQL Editor

-- 1. Ensure the table has all required columns
ALTER TABLE external_assessment_attempts 
  ALTER COLUMN current_question_index SET DEFAULT 0,
  ALTER COLUMN status SET DEFAULT 'in_progress',
  ALTER COLUMN time_remaining SET DEFAULT 900,
  ALTER COLUMN completed_at DROP NOT NULL;

-- 2. Update any existing records with null values
UPDATE external_assessment_attempts 
SET 
  current_question_index = 0 
WHERE current_question_index IS NULL;

UPDATE external_assessment_attempts 
SET 
  status = 'in_progress' 
WHERE status IS NULL AND completed_at IS NULL;

UPDATE external_assessment_attempts 
SET 
  status = 'completed' 
WHERE status IS NULL AND completed_at IS NOT NULL;

-- 3. Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_external_assessment_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Ensure trigger exists
DROP TRIGGER IF EXISTS update_external_assessment_attempts_timestamp ON external_assessment_attempts;
CREATE TRIGGER update_external_assessment_attempts_timestamp
  BEFORE UPDATE ON external_assessment_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_external_assessment_attempts_updated_at();

-- 5. Add helpful comments
COMMENT ON COLUMN external_assessment_attempts.current_question_index IS 
  'Current question index (0-based). Saves after each answer selection.';

COMMENT ON COLUMN external_assessment_attempts.student_answers IS 
  'Array of answer objects: [{question_id, selected_answer, is_correct, time_taken}]. Updates after each answer.';

COMMENT ON COLUMN external_assessment_attempts.status IS 
  'Assessment status: in_progress or completed. Use in_progress for resumable assessments.';

-- 6. Verify the structure
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'external_assessment_attempts'
  AND column_name IN ('current_question_index', 'status', 'time_remaining', 'student_answers')
ORDER BY ordinal_position;
