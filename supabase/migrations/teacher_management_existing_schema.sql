-- Teacher Management Integration with Existing Schema
-- Uses existing tables: school_educators, school_classes, school_educator_class_assignments

-- ============================================
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================

-- Add role column to school_educators if not exists
ALTER TABLE school_educators 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'subject_teacher' 
CHECK (role IN ('school_admin', 'principal', 'it_admin', 'class_teacher', 'subject_teacher'));

-- Add onboarding_status column if not exists
ALTER TABLE school_educators 
ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(20) DEFAULT 'active' 
CHECK (onboarding_status IN ('pending', 'documents_uploaded', 'verified', 'active', 'inactive'));

-- Add document URLs if not exists
ALTER TABLE school_educators 
ADD COLUMN IF NOT EXISTS degree_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS id_proof_url TEXT,
ADD COLUMN IF NOT EXISTS experience_letters_url TEXT[];

-- Add subject expertise JSONB if not exists
ALTER TABLE school_educators 
ADD COLUMN IF NOT EXISTS subject_expertise JSONB DEFAULT '[]'::jsonb;

-- Add teacher_id (unique identifier) if not exists
ALTER TABLE school_educators 
ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(20) UNIQUE;

-- ============================================
-- 2. CREATE TIMETABLE TABLES
-- ============================================

-- Timetables table
CREATE TABLE IF NOT EXISTS timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  academic_year VARCHAR(20) NOT NULL,
  term VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Timetable Slots table (links to school_educators and school_classes)
CREATE TABLE IF NOT EXISTS timetable_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID REFERENCES timetables(id) ON DELETE CASCADE,
  educator_id UUID REFERENCES school_educators(id) ON DELETE CASCADE,
  class_id UUID REFERENCES school_classes(id) ON DELETE SET NULL,
  
  -- Schedule Details
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  period_number INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 10),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Class Details
  subject_name VARCHAR(100) NOT NULL,
  room_number VARCHAR(20),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(timetable_id, day_of_week, period_number, educator_id)
);

-- Teacher Workload Summary
CREATE TABLE IF NOT EXISTS teacher_workload (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  educator_id UUID REFERENCES school_educators(id) ON DELETE CASCADE,
  timetable_id UUID REFERENCES timetables(id) ON DELETE CASCADE,
  total_periods_per_week INTEGER DEFAULT 0,
  max_consecutive_classes INTEGER DEFAULT 0,
  last_calculated TIMESTAMP DEFAULT NOW(),
  UNIQUE(educator_id, timetable_id)
);

-- Timetable Conflicts Log
CREATE TABLE IF NOT EXISTS timetable_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID REFERENCES timetables(id) ON DELETE CASCADE,
  conflict_type VARCHAR(50) NOT NULL,
  educator_id UUID REFERENCES school_educators(id),
  slot_id UUID REFERENCES timetable_slots(id),
  conflict_details JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. CREATE LESSON PLANS TABLES
-- ============================================

-- Lesson Plans table (links to school_educators)
CREATE TABLE IF NOT EXISTS lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  educator_id UUID REFERENCES school_educators(id) ON DELETE CASCADE,
  class_id UUID REFERENCES school_classes(id) ON DELETE SET NULL,
  
  -- Basic Information
  title VARCHAR(200) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  duration INTEGER NOT NULL,
  
  -- Lesson Plan Content
  learning_objectives TEXT NOT NULL,
  activities JSONB NOT NULL DEFAULT '[]'::jsonb,
  resources JSONB NOT NULL DEFAULT '[]'::jsonb,
  assessment_methods TEXT,
  homework TEXT,
  notes TEXT,
  
  -- Approval Workflow
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'revision_required')),
  submitted_at TIMESTAMP,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP,
  review_comments TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Teacher Journal Entries
CREATE TABLE IF NOT EXISTS teacher_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  educator_id UUID REFERENCES school_educators(id) ON DELETE CASCADE,
  lesson_plan_id UUID REFERENCES lesson_plans(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  reflection TEXT,
  student_engagement VARCHAR(20) CHECK (student_engagement IN ('low', 'medium', 'high')),
  objectives_met BOOLEAN DEFAULT FALSE,
  challenges TEXT,
  improvements TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(educator_id, lesson_plan_id, date)
);

-- ============================================
-- 4. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_school_educators_role ON school_educators(role);
CREATE INDEX IF NOT EXISTS idx_school_educators_status ON school_educators(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_school_educators_school ON school_educators(school_id);

CREATE INDEX IF NOT EXISTS idx_timetable_slots_educator ON timetable_slots(educator_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_schedule ON timetable_slots(timetable_id, day_of_week, period_number);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_class ON timetable_slots(class_id);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_educator ON lesson_plans(educator_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_status ON lesson_plans(status);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_date ON lesson_plans(date);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_class ON lesson_plans(class_id);

CREATE INDEX IF NOT EXISTS idx_teacher_workload_educator ON teacher_workload(educator_id);
CREATE INDEX IF NOT EXISTS idx_teacher_journal_educator ON teacher_journal(educator_id);

-- ============================================
-- 5. CREATE FUNCTIONS
-- ============================================

-- Function to auto-generate Teacher ID
CREATE OR REPLACE FUNCTION generate_teacher_id()
RETURNS TRIGGER AS $$
DECLARE
  school_code VARCHAR(10);
  next_number INTEGER;
  new_teacher_id VARCHAR(20);
BEGIN
  -- Get school code
  SELECT COALESCE(UPPER(SUBSTRING(name FROM 1 FOR 3)), 'SCH')
  INTO school_code
  FROM schools
  WHERE id = NEW.school_id;
  
  -- Get next sequential number
  SELECT COALESCE(MAX(CAST(SUBSTRING(teacher_id FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM school_educators
  WHERE school_id = NEW.school_id AND teacher_id IS NOT NULL;
  
  -- Generate Teacher ID: SCHOOLCODE-T-0001
  new_teacher_id := school_code || '-T-' || LPAD(next_number::TEXT, 4, '0');
  
  NEW.teacher_id := new_teacher_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for teacher_id generation
DROP TRIGGER IF EXISTS set_teacher_id ON school_educators;
CREATE TRIGGER set_teacher_id
BEFORE INSERT ON school_educators
FOR EACH ROW
WHEN (NEW.teacher_id IS NULL OR NEW.teacher_id = '')
EXECUTE FUNCTION generate_teacher_id();

-- Function to calculate teacher workload
CREATE OR REPLACE FUNCTION calculate_teacher_workload(p_educator_id UUID, p_timetable_id UUID)
RETURNS TABLE(
  total_periods INTEGER,
  max_consecutive INTEGER,
  exceeds_limit BOOLEAN,
  consecutive_violation BOOLEAN
) AS $$
DECLARE
  v_total_periods INTEGER;
  v_max_consecutive INTEGER;
BEGIN
  -- Count total periods per week
  SELECT COUNT(*)
  INTO v_total_periods
  FROM timetable_slots
  WHERE educator_id = p_educator_id AND timetable_id = p_timetable_id;
  
  -- Calculate max consecutive classes
  WITH consecutive_periods AS (
    SELECT 
      day_of_week,
      period_number,
      period_number - ROW_NUMBER() OVER (PARTITION BY day_of_week ORDER BY period_number) AS grp
    FROM timetable_slots
    WHERE educator_id = p_educator_id AND timetable_id = p_timetable_id
  ),
  consecutive_counts AS (
    SELECT 
      day_of_week,
      grp,
      COUNT(*) AS consecutive_count
    FROM consecutive_periods
    GROUP BY day_of_week, grp
  )
  SELECT COALESCE(MAX(consecutive_count), 0)
  INTO v_max_consecutive
  FROM consecutive_counts;
  
  -- Update workload table
  INSERT INTO teacher_workload (educator_id, timetable_id, total_periods_per_week, max_consecutive_classes, last_calculated)
  VALUES (p_educator_id, p_timetable_id, v_total_periods, v_max_consecutive, NOW())
  ON CONFLICT (educator_id, timetable_id)
  DO UPDATE SET 
    total_periods_per_week = v_total_periods,
    max_consecutive_classes = v_max_consecutive,
    last_calculated = NOW();
  
  RETURN QUERY SELECT 
    v_total_periods,
    v_max_consecutive,
    v_total_periods > 30 AS exceeds_limit,
    v_max_consecutive > 3 AS consecutive_violation;
END;
$$ LANGUAGE plpgsql;

-- Function to detect timetable conflicts
CREATE OR REPLACE FUNCTION detect_timetable_conflicts(p_timetable_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Clear existing unresolved conflicts
  DELETE FROM timetable_conflicts 
  WHERE timetable_id = p_timetable_id AND resolved = FALSE;
  
  -- Check for max periods exceeded
  INSERT INTO timetable_conflicts (timetable_id, conflict_type, educator_id, conflict_details)
  SELECT 
    p_timetable_id,
    'max_periods_exceeded',
    educator_id,
    jsonb_build_object('total_periods', total_periods_per_week, 'limit', 30)
  FROM teacher_workload
  WHERE timetable_id = p_timetable_id AND total_periods_per_week > 30;
  
  -- Check for consecutive classes exceeded
  INSERT INTO timetable_conflicts (timetable_id, conflict_type, educator_id, conflict_details)
  SELECT 
    p_timetable_id,
    'consecutive_classes_exceeded',
    educator_id,
    jsonb_build_object('max_consecutive', max_consecutive_classes, 'limit', 3)
  FROM teacher_workload
  WHERE timetable_id = p_timetable_id AND max_consecutive_classes > 3;
  
  -- Check for double booking
  INSERT INTO timetable_conflicts (timetable_id, conflict_type, educator_id, slot_id, conflict_details)
  SELECT 
    p_timetable_id,
    'double_booking',
    ts1.educator_id,
    ts1.id,
    jsonb_build_object('day', ts1.day_of_week, 'period', ts1.period_number, 'conflicting_slots', jsonb_agg(ts2.id))
  FROM timetable_slots ts1
  JOIN timetable_slots ts2 ON 
    ts1.timetable_id = ts2.timetable_id AND
    ts1.educator_id = ts2.educator_id AND
    ts1.day_of_week = ts2.day_of_week AND
    ts1.period_number = ts2.period_number AND
    ts1.id < ts2.id
  WHERE ts1.timetable_id = p_timetable_id
  GROUP BY ts1.id, ts1.educator_id, ts1.day_of_week, ts1.period_number;
END;
$$ LANGUAGE plpgsql;

-- Function to add approved lesson plans to journal
CREATE OR REPLACE FUNCTION add_to_teacher_journal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO teacher_journal (educator_id, lesson_plan_id, date)
    VALUES (NEW.educator_id, NEW.id, NEW.date)
    ON CONFLICT (educator_id, lesson_plan_id, date) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. CREATE TRIGGERS
-- ============================================

-- Trigger for lesson plan approval
DROP TRIGGER IF EXISTS lesson_plan_approved_trigger ON lesson_plans;
CREATE TRIGGER lesson_plan_approved_trigger
AFTER INSERT OR UPDATE OF status ON lesson_plans
FOR EACH ROW
EXECUTE FUNCTION add_to_teacher_journal();

-- Trigger for timetable slot changes
CREATE OR REPLACE FUNCTION on_timetable_slot_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_teacher_workload(
    COALESCE(NEW.educator_id, OLD.educator_id),
    COALESCE(NEW.timetable_id, OLD.timetable_id)
  );
  
  PERFORM detect_timetable_conflicts(COALESCE(NEW.timetable_id, OLD.timetable_id));
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS timetable_slot_workload_trigger ON timetable_slots;
CREATE TRIGGER timetable_slot_workload_trigger
AFTER INSERT OR UPDATE OR DELETE ON timetable_slots
FOR EACH ROW
EXECUTE FUNCTION on_timetable_slot_change();

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_timetables_updated_at ON timetables;
CREATE TRIGGER update_timetables_updated_at 
BEFORE UPDATE ON timetables 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timetable_slots_updated_at ON timetable_slots;
CREATE TRIGGER update_timetable_slots_updated_at 
BEFORE UPDATE ON timetable_slots 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_plans_updated_at ON lesson_plans;
CREATE TRIGGER update_lesson_plans_updated_at 
BEFORE UPDATE ON lesson_plans 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teacher_journal_updated_at ON teacher_journal;
CREATE TRIGGER update_teacher_journal_updated_at 
BEFORE UPDATE ON teacher_journal 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. CREATE VIEWS
-- ============================================

-- View for teacher's weekly timetable with lesson plans
CREATE OR REPLACE VIEW teacher_weekly_timetable AS
SELECT 
  ts.id AS slot_id,
  ts.educator_id,
  se.teacher_id AS teacher_code,
  u.raw_user_meta_data->>'name' AS teacher_name,
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
  lp.status AS lesson_plan_status
FROM timetable_slots ts
JOIN school_educators se ON ts.educator_id = se.id
JOIN auth.users u ON se.user_id = u.id
JOIN timetables tt ON ts.timetable_id = tt.id
LEFT JOIN school_classes sc ON ts.class_id = sc.id
LEFT JOIN lesson_plans lp ON 
  lp.educator_id = ts.educator_id AND
  lp.class_id = ts.class_id AND
  lp.subject = ts.subject_name AND
  EXTRACT(DOW FROM lp.date) = ts.day_of_week
WHERE tt.status = 'published'
ORDER BY ts.day_of_week, ts.period_number;

-- ============================================
-- 8. COMMENTS
-- ============================================

COMMENT ON TABLE timetables IS 'Academic timetables for schools';
COMMENT ON TABLE timetable_slots IS 'Individual time slots in timetables, linked to school_educators and school_classes';
COMMENT ON TABLE lesson_plans IS 'Lesson plans created by educators, linked to school_educators';
COMMENT ON TABLE teacher_journal IS 'Teacher reflection journal for approved lesson plans';
COMMENT ON TABLE teacher_workload IS 'Tracks educator workload (30 periods/week limit)';
COMMENT ON TABLE timetable_conflicts IS 'Logs timetable scheduling conflicts';

COMMENT ON COLUMN school_educators.role IS 'Educator role: school_admin, principal, it_admin, class_teacher, subject_teacher';
COMMENT ON COLUMN school_educators.teacher_id IS 'Auto-generated unique teacher identifier (e.g., SPR-T-0001)';
COMMENT ON COLUMN school_educators.subject_expertise IS 'JSONB array of subjects with proficiency and experience';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Teacher Management schema integrated successfully with existing tables!';
  RAISE NOTICE 'Using: school_educators, school_classes, school_educator_class_assignments';
  RAISE NOTICE 'Created: timetables, timetable_slots, lesson_plans, teacher_journal';
END $$;
