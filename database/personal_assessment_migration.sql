-- ==================================================================================
-- MIGRATION SCRIPT: Add Middle School and High School Assessment Support
-- This script safely migrates existing "After 12th" assessment tables to support
-- multi-grade level assessments (Grades 6-8, 9-12, and After 12th)
-- ==================================================================================

-- IMPORTANT: This migration is idempotent - it can be run multiple times safely
-- Existing "After 12th" assessment data will NOT be affected

-- ==================================================================================
-- STEP 1: CREATE NEW TABLES (if they don't exist)
-- ==================================================================================

-- Streams table (grade level categories) - UPDATE EXISTING TABLE
-- The table already exists, so we'll add missing columns
DO $$
BEGIN
  -- Add name column if it doesn't exist (duplicate of label for compatibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_streams'
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.personal_assessment_streams
    ADD COLUMN name TEXT;

    -- Copy label to name for existing records
    UPDATE public.personal_assessment_streams SET name = label WHERE name IS NULL;

    RAISE NOTICE 'Added name column to personal_assessment_streams';
  END IF;

  -- Add grade_level column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_streams'
    AND column_name = 'grade_level'
  ) THEN
    ALTER TABLE public.personal_assessment_streams
    ADD COLUMN grade_level TEXT CHECK (grade_level IN ('middle', 'highschool', 'after12'));

    RAISE NOTICE 'Added grade_level column to personal_assessment_streams';
  END IF;

  -- Add display_order column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_streams'
    AND column_name = 'display_order'
  ) THEN
    ALTER TABLE public.personal_assessment_streams
    ADD COLUMN display_order INTEGER DEFAULT 0;

    RAISE NOTICE 'Added display_order column to personal_assessment_streams';
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_streams'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.personal_assessment_streams
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

    RAISE NOTICE 'Added updated_at column to personal_assessment_streams';
  END IF;
END $$;

-- Response scales table (for rating questions)
CREATE TABLE IF NOT EXISTS public.personal_assessment_response_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.personal_assessment_sections(id) ON DELETE CASCADE,
  scale_name TEXT NOT NULL,
  scale_values JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(section_id, scale_name)
);

-- Restrictions table (90-day retake prevention)
CREATE TABLE IF NOT EXISTS public.personal_assessment_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  last_attempt_date TIMESTAMP WITH TIME ZONE NOT NULL,
  next_allowed_date TIMESTAMP WITH TIME ZONE NOT NULL,
  grade_level TEXT NOT NULL CHECK (grade_level IN ('middle', 'highschool', 'after12')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, grade_level)
);

-- ==================================================================================
-- STEP 2: ADD MISSING COLUMNS TO EXISTING TABLES
-- ==================================================================================

-- Add grade_level column to sections table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_sections'
    AND column_name = 'grade_level'
  ) THEN
    ALTER TABLE public.personal_assessment_sections
    ADD COLUMN grade_level TEXT DEFAULT 'after12' CHECK (grade_level IN ('middle', 'highschool', 'after12'));

    -- Set all existing sections to 'after12' grade level
    UPDATE public.personal_assessment_sections SET grade_level = 'after12' WHERE grade_level IS NULL;

    -- Make it NOT NULL after setting defaults
    ALTER TABLE public.personal_assessment_sections ALTER COLUMN grade_level SET NOT NULL;

    RAISE NOTICE 'Added grade_level column to personal_assessment_sections';
  ELSE
    RAISE NOTICE 'Column grade_level already exists in personal_assessment_sections';
  END IF;
END $$;

-- Add color column to sections table (for UI consistency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_sections'
    AND column_name = 'color'
  ) THEN
    ALTER TABLE public.personal_assessment_sections
    ADD COLUMN color TEXT DEFAULT 'blue';

    RAISE NOTICE 'Added color column to personal_assessment_sections';
  ELSE
    RAISE NOTICE 'Column color already exists in personal_assessment_sections';
  END IF;
END $$;

-- Add icon column to sections table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_sections'
    AND column_name = 'icon'
  ) THEN
    ALTER TABLE public.personal_assessment_sections
    ADD COLUMN icon TEXT;

    RAISE NOTICE 'Added icon column to personal_assessment_sections';
  ELSE
    RAISE NOTICE 'Column icon already exists in personal_assessment_sections';
  END IF;
END $$;

-- Add instruction column to sections table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_sections'
    AND column_name = 'instruction'
  ) THEN
    ALTER TABLE public.personal_assessment_sections
    ADD COLUMN instruction TEXT;

    RAISE NOTICE 'Added instruction column to personal_assessment_sections';
  ELSE
    RAISE NOTICE 'Column instruction already exists in personal_assessment_sections';
  END IF;
END $$;

-- Add grade_level column to attempts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_attempts'
    AND column_name = 'grade_level'
  ) THEN
    ALTER TABLE public.personal_assessment_attempts
    ADD COLUMN grade_level TEXT DEFAULT 'after12' CHECK (grade_level IN ('middle', 'highschool', 'after12'));

    -- Set all existing attempts to 'after12' grade level
    UPDATE public.personal_assessment_attempts SET grade_level = 'after12' WHERE grade_level IS NULL;

    -- Make it NOT NULL after setting defaults
    ALTER TABLE public.personal_assessment_attempts ALTER COLUMN grade_level SET NOT NULL;

    RAISE NOTICE 'Added grade_level column to personal_assessment_attempts';
  ELSE
    RAISE NOTICE 'Column grade_level already exists in personal_assessment_attempts';
  END IF;
END $$;

-- Add stream_id foreign key to questions table (for stream-specific questions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_questions'
    AND column_name = 'stream_id'
  ) THEN
    ALTER TABLE public.personal_assessment_questions
    ADD COLUMN stream_id TEXT REFERENCES public.personal_assessment_streams(id);

    RAISE NOTICE 'Added stream_id column to personal_assessment_questions';
  ELSE
    RAISE NOTICE 'Column stream_id already exists in personal_assessment_questions';
  END IF;
END $$;

-- Add placeholder column to questions table (for text input questions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_questions'
    AND column_name = 'placeholder'
  ) THEN
    ALTER TABLE public.personal_assessment_questions
    ADD COLUMN placeholder TEXT;

    RAISE NOTICE 'Added placeholder column to personal_assessment_questions';
  ELSE
    RAISE NOTICE 'Column placeholder already exists in personal_assessment_questions';
  END IF;
END $$;

-- Add description column to questions table (for task descriptions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_questions'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.personal_assessment_questions
    ADD COLUMN description TEXT;

    RAISE NOTICE 'Added description column to personal_assessment_questions';
  ELSE
    RAISE NOTICE 'Column description already exists in personal_assessment_questions';
  END IF;
END $$;

-- Add strength_type column to questions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_questions'
    AND column_name = 'strength_type'
  ) THEN
    ALTER TABLE public.personal_assessment_questions
    ADD COLUMN strength_type TEXT;

    RAISE NOTICE 'Added strength_type column to personal_assessment_questions';
  ELSE
    RAISE NOTICE 'Column strength_type already exists in personal_assessment_questions';
  END IF;
END $$;

-- Add task_type column to questions table (for aptitude sampling)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_questions'
    AND column_name = 'task_type'
  ) THEN
    ALTER TABLE public.personal_assessment_questions
    ADD COLUMN task_type TEXT;

    RAISE NOTICE 'Added task_type column to personal_assessment_questions';
  ELSE
    RAISE NOTICE 'Column task_type already exists in personal_assessment_questions';
  END IF;
END $$;

-- Update question_type CHECK constraint to include new types
DO $$
BEGIN
  -- Drop the old constraint
  ALTER TABLE public.personal_assessment_questions
  DROP CONSTRAINT IF EXISTS assessment_questions_question_type_check;

  -- Add new constraint with additional question types
  ALTER TABLE public.personal_assessment_questions
  ADD CONSTRAINT assessment_questions_question_type_check
  CHECK (question_type IN ('likert', 'mcq', 'sjt', 'rating', 'multiselect', 'singleselect', 'text'));

  RAISE NOTICE 'Updated question_type CHECK constraint with new types';
END $$;

-- Add max_selections column to questions table (for multiselect questions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_questions'
    AND column_name = 'max_selections'
  ) THEN
    ALTER TABLE public.personal_assessment_questions
    ADD COLUMN max_selections INTEGER;

    RAISE NOTICE 'Added max_selections column to personal_assessment_questions';
  ELSE
    RAISE NOTICE 'Column max_selections already exists in personal_assessment_questions';
  END IF;
END $$;

-- Add category_mapping column to questions table (for RIASEC mapping)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_questions'
    AND column_name = 'category_mapping'
  ) THEN
    ALTER TABLE public.personal_assessment_questions
    ADD COLUMN category_mapping JSONB;

    RAISE NOTICE 'Added category_mapping column to personal_assessment_questions';
  ELSE
    RAISE NOTICE 'Column category_mapping already exists in personal_assessment_questions';
  END IF;
END $$;

-- Add grade_level column to results table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_results'
    AND column_name = 'grade_level'
  ) THEN
    ALTER TABLE public.personal_assessment_results
    ADD COLUMN grade_level TEXT DEFAULT 'after12' CHECK (grade_level IN ('middle', 'highschool', 'after12'));

    -- Set all existing results to 'after12' grade level
    UPDATE personal_assessment_results SET grade_level = 'after12' WHERE grade_level IS NULL;

    -- Make it NOT NULL after setting defaults
    ALTER TABLE public.personal_assessment_results ALTER COLUMN grade_level SET NOT NULL;

    RAISE NOTICE 'Added grade_level column to personal_assessment_results';
  ELSE
    RAISE NOTICE 'Column grade_level already exists in personal_assessment_results';
  END IF;
END $$;

-- ==================================================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ==================================================================================

CREATE INDEX IF NOT EXISTS idx_sections_grade_level ON public.personal_assessment_sections(grade_level);
CREATE INDEX IF NOT EXISTS idx_attempts_grade_level ON public.personal_assessment_attempts(grade_level);
CREATE INDEX IF NOT EXISTS idx_results_grade_level ON public.personal_assessment_results(grade_level);
CREATE INDEX IF NOT EXISTS idx_restrictions_student_grade ON public.personal_assessment_restrictions(student_id, grade_level);
CREATE INDEX IF NOT EXISTS idx_questions_stream_id ON public.personal_assessment_questions(stream_id);
CREATE INDEX IF NOT EXISTS idx_response_scales_section ON public.personal_assessment_response_scales(section_id);

-- ==================================================================================
-- STEP 4: CREATE HELPER FUNCTIONS
-- ==================================================================================

-- Function to check if student can take assessment (90-day restriction)
CREATE OR REPLACE FUNCTION can_take_assessment(p_student_id TEXT, p_grade_level TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_restriction RECORD;
BEGIN
  SELECT * INTO v_last_restriction
  FROM public.personal_assessment_restrictions
  WHERE student_id = p_student_id AND grade_level = p_grade_level
  ORDER BY last_attempt_date DESC LIMIT 1;

  IF v_last_restriction IS NULL THEN
    RETURN true;
  END IF;

  IF NOW() >= v_last_restriction.next_allowed_date THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create 90-day restriction on assessment completion
CREATE OR REPLACE FUNCTION create_assessment_restriction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.personal_assessment_restrictions (student_id, last_attempt_date, next_allowed_date, grade_level)
    VALUES (NEW.student_id, NEW.completed_at, NEW.completed_at + INTERVAL '90 days', NEW.grade_level)
    ON CONFLICT (student_id, grade_level)
    DO UPDATE SET
      last_attempt_date = EXCLUDED.last_attempt_date,
      next_allowed_date = EXCLUDED.next_allowed_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_create_assessment_restriction'
  ) THEN
    CREATE TRIGGER trigger_create_assessment_restriction
    AFTER UPDATE ON public.personal_assessment_attempts
    FOR EACH ROW
    EXECUTE FUNCTION create_assessment_restriction();

    RAISE NOTICE 'Created trigger_create_assessment_restriction';
  ELSE
    RAISE NOTICE 'Trigger trigger_create_assessment_restriction already exists';
  END IF;
END $$;

-- ==================================================================================
-- STEP 5: ENABLE RLS ON NEW TABLES
-- ==================================================================================

ALTER TABLE public.personal_assessment_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_assessment_response_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_assessment_restrictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for streams (everyone can view active streams)
DROP POLICY IF EXISTS "Anyone can view active streams" ON public.personal_assessment_streams;
CREATE POLICY "Anyone can view active streams" ON public.personal_assessment_streams
  FOR SELECT USING (is_active = true);

-- RLS Policies for response scales (everyone can view scales)
DROP POLICY IF EXISTS "Anyone can view response scales" ON public.personal_assessment_response_scales;
CREATE POLICY "Anyone can view response scales" ON public.personal_assessment_response_scales
  FOR SELECT USING (true);

-- RLS Policies for restrictions (students can only view their own restrictions)
DROP POLICY IF EXISTS "Students can view their own restrictions" ON public.personal_assessment_restrictions;
CREATE POLICY "Students can view their own restrictions" ON public.personal_assessment_restrictions
  FOR SELECT USING (auth.uid()::text = student_id);

-- ==================================================================================
-- STEP 6: INSERT DEFAULT STREAMS (if they don't exist)
-- ==================================================================================

INSERT INTO public.personal_assessment_streams (id, label, name, description, grade_level, is_active, display_order) VALUES
  ('middle_school', 'Grades 6-8 (Middle School)', 'Grades 6-8 (Middle School)', 'Assessment for middle school students', 'middle', true, 1),
  ('high_school', 'Grades 9-12 (High School)', 'Grades 9-12 (High School)', 'Assessment for high school students', 'highschool', true, 2)
ON CONFLICT (id) DO NOTHING;

-- ==================================================================================
-- VERIFICATION QUERIES
-- ==================================================================================

-- Check if migration completed successfully
DO $$
DECLARE
  v_sections_grade_level BOOLEAN;
  v_attempts_grade_level BOOLEAN;
  v_streams_table BOOLEAN;
BEGIN
  -- Check if grade_level column exists in sections
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_sections'
    AND column_name = 'grade_level'
  ) INTO v_sections_grade_level;

  -- Check if grade_level column exists in attempts
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_attempts'
    AND column_name = 'grade_level'
  ) INTO v_attempts_grade_level;

  -- Check if streams table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'personal_assessment_streams'
  ) INTO v_streams_table;

  IF v_sections_grade_level AND v_attempts_grade_level AND v_streams_table THEN
    RAISE NOTICE '✓ Migration completed successfully!';
    RAISE NOTICE '✓ All required columns and tables are in place';
    RAISE NOTICE '✓ You can now run the sample data SQL file';
  ELSE
    RAISE WARNING '✗ Migration may be incomplete. Please check the logs above.';
  END IF;
END $$;

-- Display summary of grade levels
SELECT
  grade_level,
  COUNT(*) as section_count
FROM public.personal_assessment_sections
GROUP BY grade_level
ORDER BY grade_level;

-- ==================================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ==================================================================================
/*
-- CAUTION: Only run this if you need to completely rollback the migration
-- This will remove all grade level support and delete middle/high school data

-- Drop new tables
DROP TABLE IF EXISTS public.personal_assessment_restrictions CASCADE;
DROP TABLE IF EXISTS public.personal_assessment_response_scales CASCADE;
DROP TABLE IF EXISTS public.personal_assessment_streams CASCADE;

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_create_assessment_restriction ON public.personal_assessment_attempts;
DROP FUNCTION IF EXISTS create_assessment_restriction();
DROP FUNCTION IF EXISTS can_take_assessment(TEXT, TEXT);

-- Remove added columns (be careful - this deletes data)
ALTER TABLE public.personal_assessment_sections DROP COLUMN IF EXISTS grade_level CASCADE;
ALTER TABLE public.personal_assessment_sections DROP COLUMN IF EXISTS color CASCADE;
ALTER TABLE public.personal_assessment_sections DROP COLUMN IF EXISTS icon CASCADE;
ALTER TABLE public.personal_assessment_sections DROP COLUMN IF EXISTS instruction CASCADE;
ALTER TABLE public.personal_assessment_attempts DROP COLUMN IF EXISTS grade_level CASCADE;
ALTER TABLE public.personal_assessment_questions DROP COLUMN IF EXISTS stream_id CASCADE;
ALTER TABLE public.personal_assessment_questions DROP COLUMN IF EXISTS placeholder CASCADE;
ALTER TABLE public.personal_assessment_questions DROP COLUMN IF EXISTS description CASCADE;
ALTER TABLE public.personal_assessment_questions DROP COLUMN IF EXISTS strength_type CASCADE;
ALTER TABLE public.personal_assessment_questions DROP COLUMN IF EXISTS task_type CASCADE;
ALTER TABLE public.personal_assessment_results DROP COLUMN IF EXISTS grade_level CASCADE;

-- Delete middle and high school sections and questions
DELETE FROM public.personal_assessment_questions WHERE section_id IN (
  SELECT id FROM public.personal_assessment_sections WHERE grade_level IN ('middle', 'highschool')
);
DELETE FROM public.personal_assessment_sections WHERE grade_level IN ('middle', 'highschool');
*/

-- ==================================================================================
-- MIGRATION COMPLETE
-- ==================================================================================

DO $$
BEGIN
  RAISE NOTICE '================================';
  RAISE NOTICE 'Migration script completed!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review the verification output above';
  RAISE NOTICE '2. Run personal_assessment_sample_data.sql to populate questions';
  RAISE NOTICE '3. Test the assessment in your application';
  RAISE NOTICE '================================';
END $$;
