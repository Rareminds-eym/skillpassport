-- Lesson Plans Schema
-- US-TM-03: Create lesson plan
-- US-TM-05: View my timetable

-- Lesson Plans table
CREATE TABLE IF NOT EXISTS lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  
  -- Basic Information
  title VARCHAR(200) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  
  -- Lesson Plan Content
  learning_objectives TEXT NOT NULL, -- LO (Learning Objectives)
  activities JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of activities
  resources JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of resources
  assessment_methods TEXT,
  homework TEXT,
  notes TEXT,
  
  -- Approval Workflow
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'revision_required')),
  submitted_at TIMESTAMP,
  reviewed_by UUID REFERENCES auth.users(id), -- Coordinator
  reviewed_at TIMESTAMP,
  review_comments TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Teacher Journal Entries (for approved lesson plans)
CREATE TABLE IF NOT EXISTS teacher_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  lesson_plan_id UUID REFERENCES lesson_plans(id) ON DELETE CASCADE,
  
  -- Journal Entry
  date DATE NOT NULL,
  reflection TEXT,
  student_engagement VARCHAR(20) CHECK (student_engagement IN ('low', 'medium', 'high')),
  objectives_met BOOLEAN DEFAULT FALSE,
  challenges TEXT,
  improvements TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(teacher_id, lesson_plan_id, date)
);

-- Indexes for performance
CREATE INDEX idx_lesson_plans_teacher ON lesson_plans(teacher_id);
CREATE INDEX idx_lesson_plans_status ON lesson_plans(status);
CREATE INDEX idx_lesson_plans_date ON lesson_plans(date);
CREATE INDEX idx_teacher_journal_teacher ON teacher_journal(teacher_id);
CREATE INDEX idx_teacher_journal_date ON teacher_journal(date);

-- Function to auto-add to journal when lesson plan is approved
CREATE OR REPLACE FUNCTION add_to_teacher_journal()
RETURNS TRIGGER AS $$
BEGIN
  -- Only add to journal when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO teacher_journal (teacher_id, lesson_plan_id, date)
    VALUES (NEW.teacher_id, NEW.id, NEW.date)
    ON CONFLICT (teacher_id, lesson_plan_id, date) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lesson_plan_approved_trigger
AFTER INSERT OR UPDATE OF status ON lesson_plans
FOR EACH ROW
EXECUTE FUNCTION add_to_teacher_journal();

-- Updated timestamp trigger
CREATE TRIGGER update_lesson_plans_updated_at 
BEFORE UPDATE ON lesson_plans 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_journal_updated_at 
BEFORE UPDATE ON teacher_journal 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- View for teacher's weekly timetable with lesson plans
CREATE OR REPLACE VIEW teacher_weekly_timetable AS
SELECT 
  ts.id AS slot_id,
  ts.teacher_id,
  t.teacher_id AS teacher_code,
  t.first_name || ' ' || t.last_name AS teacher_name,
  ts.day_of_week,
  ts.period_number,
  ts.start_time,
  ts.end_time,
  ts.class_name,
  ts.subject_name,
  ts.room_number,
  tt.academic_year,
  tt.term,
  lp.id AS lesson_plan_id,
  lp.title AS lesson_plan_title,
  lp.status AS lesson_plan_status
FROM timetable_slots ts
JOIN teachers t ON ts.teacher_id = t.id
JOIN timetables tt ON ts.timetable_id = tt.id
LEFT JOIN lesson_plans lp ON 
  lp.teacher_id = ts.teacher_id AND
  lp.class_name = ts.class_name AND
  lp.subject = ts.subject_name AND
  EXTRACT(DOW FROM lp.date) = ts.day_of_week
WHERE tt.status = 'published'
ORDER BY ts.day_of_week, ts.period_number;

-- Function to check for timetable conflicts for a teacher
CREATE OR REPLACE FUNCTION check_teacher_timetable_conflicts(p_teacher_id UUID, p_timetable_id UUID)
RETURNS TABLE(
  has_conflicts BOOLEAN,
  conflict_details JSONB
) AS $$
DECLARE
  v_conflicts JSONB;
BEGIN
  -- Check for double bookings (same teacher, same day/period)
  SELECT jsonb_agg(
    jsonb_build_object(
      'day', day_of_week,
      'period', period_number,
      'count', slot_count
    )
  )
  INTO v_conflicts
  FROM (
    SELECT day_of_week, period_number, COUNT(*) as slot_count
    FROM timetable_slots
    WHERE teacher_id = p_teacher_id AND timetable_id = p_timetable_id
    GROUP BY day_of_week, period_number
    HAVING COUNT(*) > 1
  ) conflicts;
  
  RETURN QUERY SELECT 
    v_conflicts IS NOT NULL AND jsonb_array_length(v_conflicts) > 0,
    COALESCE(v_conflicts, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;
