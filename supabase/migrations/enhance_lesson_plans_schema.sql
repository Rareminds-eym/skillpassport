-- Enhancement for Lesson Plans Schema
-- Adds curriculum integration, teaching methodology, enhanced materials, structured evaluation, and differentiation
-- Note: Core lesson_plans table already exists with basic fields

-- Add curriculum integration fields
ALTER TABLE lesson_plans 
ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES curriculum_chapters(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS chapter_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS selected_learning_outcomes JSONB DEFAULT '[]'::jsonb;

-- Add teaching methodology
ALTER TABLE lesson_plans 
ADD COLUMN IF NOT EXISTS teaching_methodology TEXT;

-- Add detailed materials fields (separate from existing 'resources' JSONB)
ALTER TABLE lesson_plans 
ADD COLUMN IF NOT EXISTS required_materials TEXT,
ADD COLUMN IF NOT EXISTS resource_files JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS resource_links JSONB DEFAULT '[]'::jsonb;

-- Add structured evaluation (separate from existing 'assessment_methods' text)
ALTER TABLE lesson_plans 
ADD COLUMN IF NOT EXISTS evaluation_criteria TEXT,
ADD COLUMN IF NOT EXISTS evaluation_items JSONB DEFAULT '[]'::jsonb;

-- Add differentiation
ALTER TABLE lesson_plans 
ADD COLUMN IF NOT EXISTS differentiation_notes TEXT;

-- Add indexes for performance (some may already exist)
CREATE INDEX IF NOT EXISTS idx_lesson_plans_chapter_id ON lesson_plans(chapter_id);

-- Add comments for documentation
COMMENT ON COLUMN lesson_plans.chapter_id IS 'Reference to curriculum chapter';
COMMENT ON COLUMN lesson_plans.chapter_name IS 'Display name from curriculum chapter';
COMMENT ON COLUMN lesson_plans.selected_learning_outcomes IS 'Array of learning outcome IDs from curriculum';
COMMENT ON COLUMN lesson_plans.teaching_methodology IS 'Teaching methodology and approach description';
COMMENT ON COLUMN lesson_plans.required_materials IS 'Text description of required materials';
COMMENT ON COLUMN lesson_plans.resource_files IS 'Array of file attachments with metadata {id, name, size, type, url}';
COMMENT ON COLUMN lesson_plans.resource_links IS 'Array of external links {id, title, url}';
COMMENT ON COLUMN lesson_plans.evaluation_criteria IS 'Evaluation criteria description';
COMMENT ON COLUMN lesson_plans.evaluation_items IS 'Structured evaluation items with percentages {id, criterion, percentage}';
COMMENT ON COLUMN lesson_plans.differentiation_notes IS 'Differentiation strategies and notes';

-- Update the view to include new fields
CREATE OR REPLACE VIEW teacher_weekly_timetable AS
SELECT 
  ts.id AS slot_id,
  ts.educator_id,
  se.teacher_id AS teacher_code,
  se.first_name || ' ' || se.last_name AS teacher_name,
  ts.day_of_week,
  ts.period_number,
  ts.start_time,
  ts.end_time,
  sc.name AS class_name,
  ts.subject_name,
  ts.room_number,
  tt.academic_year,
  tt.term,
  lp.id AS lesson_plan_id,
  lp.title AS lesson_plan_title,
  lp.status AS lesson_plan_status,
  lp.chapter_name,
  lp.teaching_methodology
FROM timetable_slots ts
JOIN school_educators se ON ts.educator_id = se.id
JOIN school_classes sc ON ts.class_id = sc.id
JOIN timetables tt ON ts.timetable_id = tt.id
LEFT JOIN lesson_plans lp ON 
  lp.educator_id = ts.educator_id AND
  lp.class_id = ts.class_id AND
  lp.subject = ts.subject_name AND
  EXTRACT(DOW FROM lp.date) = ts.day_of_week
WHERE tt.status = 'published'
ORDER BY ts.day_of_week, ts.period_number;

-- Function to validate evaluation items total percentage
CREATE OR REPLACE FUNCTION validate_evaluation_items()
RETURNS TRIGGER AS $$
DECLARE
  total_percentage NUMERIC;
BEGIN
  -- Calculate total percentage from evaluation_items
  IF NEW.evaluation_items IS NOT NULL AND jsonb_array_length(NEW.evaluation_items) > 0 THEN
    SELECT SUM((item->>'percentage')::NUMERIC)
    INTO total_percentage
    FROM jsonb_array_elements(NEW.evaluation_items) AS item;
    
    -- Check if total exceeds 100%
    IF total_percentage > 100 THEN
      RAISE EXCEPTION 'Total evaluation percentage cannot exceed 100%%. Current total: %', total_percentage;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for evaluation validation
DROP TRIGGER IF EXISTS validate_evaluation_items_trigger ON lesson_plans;
CREATE TRIGGER validate_evaluation_items_trigger
BEFORE INSERT OR UPDATE OF evaluation_items ON lesson_plans
FOR EACH ROW
EXECUTE FUNCTION validate_evaluation_items();

-- Function to auto-populate chapter_name from curriculum
CREATE OR REPLACE FUNCTION populate_chapter_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-populate chapter_name when chapter_id is set
  IF NEW.chapter_id IS NOT NULL THEN
    SELECT name INTO NEW.chapter_name
    FROM curriculum_chapters
    WHERE id = NEW.chapter_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for chapter name population
DROP TRIGGER IF EXISTS populate_chapter_name_trigger ON lesson_plans;
CREATE TRIGGER populate_chapter_name_trigger
BEFORE INSERT OR UPDATE OF chapter_id ON lesson_plans
FOR EACH ROW
EXECUTE FUNCTION populate_chapter_name();

-- Add RLS policies
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Educators can view own lesson plans" ON lesson_plans;
DROP POLICY IF EXISTS "Educators can create lesson plans" ON lesson_plans;
DROP POLICY IF EXISTS "Educators can update own draft lesson plans" ON lesson_plans;
DROP POLICY IF EXISTS "School admins can view all lesson plans" ON lesson_plans;
DROP POLICY IF EXISTS "School admins can review lesson plans" ON lesson_plans;

-- Policy: Educators can view their own lesson plans
CREATE POLICY "Educators can view own lesson plans"
ON lesson_plans FOR SELECT
USING (
  educator_id IN (
    SELECT id FROM school_educators WHERE user_id = auth.uid()
  )
);

-- Policy: Educators can insert their own lesson plans
CREATE POLICY "Educators can create lesson plans"
ON lesson_plans FOR INSERT
WITH CHECK (
  educator_id IN (
    SELECT id FROM school_educators WHERE user_id = auth.uid()
  )
);

-- Policy: Educators can update their own draft/revision_required lesson plans
CREATE POLICY "Educators can update own draft lesson plans"
ON lesson_plans FOR UPDATE
USING (
  educator_id IN (
    SELECT id FROM school_educators WHERE user_id = auth.uid()
  )
  AND status IN ('draft', 'revision_required')
);

-- Policy: School admins can view all lesson plans in their school
CREATE POLICY "School admins can view all lesson plans"
ON lesson_plans FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM school_educators se
    WHERE se.id = lesson_plans.educator_id
    AND se.school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid() 
      AND role = 'school_admin'
    )
  )
);

-- Policy: School admins can update lesson plan status (approve/reject)
CREATE POLICY "School admins can review lesson plans"
ON lesson_plans FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM school_educators se
    WHERE se.id = lesson_plans.educator_id
    AND se.school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid() 
      AND role = 'school_admin'
    )
  )
);
