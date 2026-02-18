-- Add adaptive question fields to personal_assessment_questions table
ALTER TABLE personal_assessment_questions 
  ADD COLUMN IF NOT EXISTS grade INTEGER,
  ADD COLUMN IF NOT EXISTS dimension TEXT,
  ADD COLUMN IF NOT EXISTS difficulty_rank INTEGER,
  ADD COLUMN IF NOT EXISTS time_target_sec INTEGER;

-- Create indexes for adaptive question queries
CREATE INDEX IF NOT EXISTS idx_paq_grade ON personal_assessment_questions(grade);
CREATE INDEX IF NOT EXISTS idx_paq_dimension ON personal_assessment_questions(dimension);
CREATE INDEX IF NOT EXISTS idx_paq_difficulty_rank ON personal_assessment_questions(difficulty_rank);