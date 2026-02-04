-- Add adaptive_aptitude_session_id column to personal_assessment_results table
-- This column references adaptive_aptitude_results.session_id

ALTER TABLE personal_assessment_results
ADD COLUMN IF NOT EXISTS adaptive_aptitude_session_id UUID;

-- Add foreign key constraint
ALTER TABLE personal_assessment_results
ADD CONSTRAINT personal_assessment_results_adaptive_aptitude_session_id_fkey
FOREIGN KEY (adaptive_aptitude_session_id)
REFERENCES adaptive_aptitude_results(session_id)
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_personal_assessment_results_adaptive_aptitude_session_id
ON personal_assessment_results(adaptive_aptitude_session_id);
