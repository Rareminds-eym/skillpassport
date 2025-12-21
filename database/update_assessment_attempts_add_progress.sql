-- Update existing external_assessment_attempts table to add progress tracking
-- Run this if the table already exists

-- Add new columns for progress tracking
ALTER TABLE external_assessment_attempts 
  ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress',
  ADD COLUMN IF NOT EXISTS time_remaining INTEGER,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing columns to allow NULL for incomplete assessments
ALTER TABLE external_assessment_attempts 
  ALTER COLUMN score DROP NOT NULL,
  ALTER COLUMN correct_answers DROP NOT NULL,
  ALTER COLUMN completed_at DROP NOT NULL;

-- Set default status for existing records
UPDATE external_assessment_attempts 
SET status = 'completed' 
WHERE status IS NULL AND completed_at IS NOT NULL;

-- Add index for status
CREATE INDEX IF NOT EXISTS idx_external_assessment_attempts_status 
  ON external_assessment_attempts(status);

-- Update the unique constraint comment
COMMENT ON INDEX idx_external_assessment_one_per_course IS 
  'Ensures one attempt per student per course (including in-progress)';

-- Update table comment
COMMENT ON TABLE external_assessment_attempts IS 
  'Stores external course assessment attempts with progress tracking. Status can be in_progress or completed.';

COMMENT ON COLUMN external_assessment_attempts.status IS 
  'Assessment status: in_progress or completed';

COMMENT ON COLUMN external_assessment_attempts.current_question_index IS 
  'Index of current question (0-based). Used to resume assessment.';

COMMENT ON COLUMN external_assessment_attempts.time_remaining IS 
  'Seconds remaining on timer. NULL if no timer.';

COMMENT ON COLUMN external_assessment_attempts.last_activity_at IS 
  'Last time student interacted with assessment. Used for timeout detection.';
