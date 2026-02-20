-- Add metadata JSONB column to personal_assessment_questions
ALTER TABLE personal_assessment_questions 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Migrate existing column data to metadata JSON
UPDATE personal_assessment_questions
SET metadata = jsonb_strip_nulls(jsonb_build_object(
  'strength_type', strength_type,
  'task_type', task_type,
  'max_selections', max_selections,
  'grade', grade,
  'dimension', dimension,
  'difficulty_rank', difficulty_rank,
  'time_target_sec', time_target_sec
))
WHERE strength_type IS NOT NULL 
   OR task_type IS NOT NULL 
   OR max_selections IS NOT NULL 
   OR grade IS NOT NULL 
   OR dimension IS NOT NULL 
   OR difficulty_rank IS NOT NULL 
   OR time_target_sec IS NOT NULL;

-- Drop indexes on columns that will be moved to metadata
DROP INDEX IF EXISTS idx_paq_grade;
DROP INDEX IF EXISTS idx_paq_dimension;
DROP INDEX IF EXISTS idx_paq_difficulty_rank;

-- Create GIN index on metadata for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_paq_metadata ON personal_assessment_questions USING gin (metadata);

-- Create composite index for efficient section ordering queries
CREATE INDEX IF NOT EXISTS idx_questions_section_order ON personal_assessment_questions (section_id, order_number);

-- Drop the old individual columns
ALTER TABLE personal_assessment_questions 
  DROP COLUMN IF EXISTS strength_type,
  DROP COLUMN IF EXISTS task_type,
  DROP COLUMN IF EXISTS max_selections,
  DROP COLUMN IF EXISTS grade,
  DROP COLUMN IF EXISTS dimension,
  DROP COLUMN IF EXISTS difficulty_rank,
  DROP COLUMN IF EXISTS time_target_sec;

-- Drop unused columns from personal_assessment_questions table
ALTER TABLE personal_assessment_questions 
  DROP COLUMN IF EXISTS subtype,
  DROP COLUMN IF EXISTS module_title,
  DROP COLUMN IF EXISTS part_type,
  DROP COLUMN IF EXISTS best_answer,
  DROP COLUMN IF EXISTS worst_answer,
  DROP COLUMN IF EXISTS scenario,
  DROP COLUMN IF EXISTS placeholder;

-- Drop duplicate index on stream_id
DROP INDEX IF EXISTS idx_questions_stream_id;

-- Change correct_answer from varchar to jsonb to support multiselect
ALTER TABLE personal_assessment_questions 
  ALTER COLUMN correct_answer TYPE jsonb USING 
    CASE 
      WHEN correct_answer IS NULL THEN NULL
      WHEN correct_answer ~ '^[0-9]+$' THEN to_jsonb(correct_answer::integer)
      ELSE to_jsonb(correct_answer)
    END;

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at on personal_assessment_questions
DROP TRIGGER IF EXISTS update_personal_assessment_questions_updated_at ON personal_assessment_questions;
CREATE TRIGGER update_personal_assessment_questions_updated_at
  BEFORE UPDATE ON personal_assessment_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- Create enum type for question types
DO $$ BEGIN
  CREATE TYPE question_type_enum AS ENUM (
    'likert',
    'mcq',
    'sjt',
    'rating',
    'multiselect',
    'singleselect',
    'text'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Drop the old check constraint
ALTER TABLE personal_assessment_questions 
  DROP CONSTRAINT IF EXISTS assessment_questions_question_type_check;

-- Change question_type column to use enum
ALTER TABLE personal_assessment_questions 
  ALTER COLUMN question_type TYPE question_type_enum USING question_type::question_type_enum;

DROP INDEX IF EXISTS idx_assessment_questions_section;
ALTER TABLE public.personal_assessment_questions
ALTER COLUMN is_active SET NOT NULL;
 
CREATE UNIQUE INDEX uniq_questions_section_order
ON public.personal_assessment_questions (section_id, order_number);

 
CREATE INDEX idx_questions_active_section_order
ON public.personal_assessment_questions (section_id, order_number)
WHERE is_active = true;