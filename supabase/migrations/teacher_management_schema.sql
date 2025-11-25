-- Teacher Management Schema
-- 3.3.1 Onboarding & 3.3.2 Timetable Allocation

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id VARCHAR(20) UNIQUE NOT NULL, -- Auto-generated Teacher ID
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  address TEXT,
  qualification VARCHAR(200),
  
  -- Onboarding Documents
  degree_certificate_url TEXT,
  experience_letters_url TEXT[], -- Array of URLs
  id_proof_url TEXT,
  
  -- Subject Expertise
  subject_expertise JSONB DEFAULT '[]'::jsonb, -- Array of subjects with proficiency
  class_assignments JSONB DEFAULT '[]'::jsonb, -- Array of class assignments
  work_experience JSONB DEFAULT '[]'::jsonb, -- Array of work experience
  
  -- Status
  onboarding_status VARCHAR(20) DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'documents_uploaded', 'verified', 'active', 'inactive')),
  verification_date TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Subject Mappings table (auto-generated from subject_expertise)
CREATE TABLE IF NOT EXISTS teacher_subject_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  subject_name VARCHAR(100) NOT NULL,
  proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_of_experience INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(teacher_id, subject_name)
);

-- Timetable table
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

-- Timetable Slots table
CREATE TABLE IF NOT EXISTS timetable_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID REFERENCES timetables(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  
  -- Schedule Details
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  period_number INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 10),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Class Details
  class_name VARCHAR(50) NOT NULL,
  subject_name VARCHAR(100) NOT NULL,
  room_number VARCHAR(20),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(timetable_id, day_of_week, period_number, teacher_id)
);

-- Teacher Workload Summary (for tracking 30 periods/week limit)
CREATE TABLE IF NOT EXISTS teacher_workload (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  timetable_id UUID REFERENCES timetables(id) ON DELETE CASCADE,
  total_periods_per_week INTEGER DEFAULT 0,
  max_consecutive_classes INTEGER DEFAULT 0,
  last_calculated TIMESTAMP DEFAULT NOW(),
  UNIQUE(teacher_id, timetable_id)
);

-- Timetable Conflicts Log
CREATE TABLE IF NOT EXISTS timetable_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID REFERENCES timetables(id) ON DELETE CASCADE,
  conflict_type VARCHAR(50) NOT NULL, -- 'max_periods_exceeded', 'consecutive_classes_exceeded', 'time_overlap', 'double_booking'
  teacher_id UUID REFERENCES teachers(id),
  slot_id UUID REFERENCES timetable_slots(id),
  conflict_details JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Function to auto-generate Teacher ID
CREATE OR REPLACE FUNCTION generate_teacher_id()
RETURNS TRIGGER AS $$
DECLARE
  school_code VARCHAR(10);
  next_number INTEGER;
  new_teacher_id VARCHAR(20);
BEGIN
  -- Get school code (first 3 letters of school name or use 'SCH')
  SELECT COALESCE(UPPER(SUBSTRING(name FROM 1 FOR 3)), 'SCH')
  INTO school_code
  FROM schools
  WHERE id = NEW.school_id;
  
  -- Get next sequential number for this school
  SELECT COALESCE(MAX(CAST(SUBSTRING(teacher_id FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM teachers
  WHERE school_id = NEW.school_id;
  
  -- Generate Teacher ID: SCHOOLCODE-T-0001
  new_teacher_id := school_code || '-T-' || LPAD(next_number::TEXT, 4, '0');
  
  NEW.teacher_id := new_teacher_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_teacher_id
BEFORE INSERT ON teachers
FOR EACH ROW
WHEN (NEW.teacher_id IS NULL OR NEW.teacher_id = '')
EXECUTE FUNCTION generate_teacher_id();

-- Function to auto-generate subject mappings from subject_expertise
CREATE OR REPLACE FUNCTION sync_subject_mappings()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete existing mappings
  DELETE FROM teacher_subject_mappings WHERE teacher_id = NEW.id;
  
  -- Insert new mappings from JSONB array
  INSERT INTO teacher_subject_mappings (teacher_id, subject_name, proficiency_level, years_of_experience)
  SELECT 
    NEW.id,
    (subject->>'name')::VARCHAR(100),
    (subject->>'proficiency')::VARCHAR(20),
    COALESCE((subject->>'years_experience')::INTEGER, 0)
  FROM jsonb_array_elements(NEW.subject_expertise) AS subject;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_teacher_subjects
AFTER INSERT OR UPDATE OF subject_expertise ON teachers
FOR EACH ROW
EXECUTE FUNCTION sync_subject_mappings();

-- Function to calculate teacher workload
CREATE OR REPLACE FUNCTION calculate_teacher_workload(p_teacher_id UUID, p_timetable_id UUID)
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
  WHERE teacher_id = p_teacher_id AND timetable_id = p_timetable_id;
  
  -- Calculate max consecutive classes
  WITH consecutive_periods AS (
    SELECT 
      day_of_week,
      period_number,
      period_number - ROW_NUMBER() OVER (PARTITION BY day_of_week ORDER BY period_number) AS grp
    FROM timetable_slots
    WHERE teacher_id = p_teacher_id AND timetable_id = p_timetable_id
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
  INSERT INTO teacher_workload (teacher_id, timetable_id, total_periods_per_week, max_consecutive_classes, last_calculated)
  VALUES (p_teacher_id, p_timetable_id, v_total_periods, v_max_consecutive, NOW())
  ON CONFLICT (teacher_id, timetable_id)
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
  -- Clear existing unresolved conflicts for this timetable
  DELETE FROM timetable_conflicts 
  WHERE timetable_id = p_timetable_id AND resolved = FALSE;
  
  -- Check for max periods exceeded (>30 per week)
  INSERT INTO timetable_conflicts (timetable_id, conflict_type, teacher_id, conflict_details)
  SELECT 
    p_timetable_id,
    'max_periods_exceeded',
    teacher_id,
    jsonb_build_object(
      'total_periods', total_periods_per_week,
      'limit', 30
    )
  FROM teacher_workload
  WHERE timetable_id = p_timetable_id AND total_periods_per_week > 30;
  
  -- Check for consecutive classes exceeded (>3 back-to-back)
  INSERT INTO timetable_conflicts (timetable_id, conflict_type, teacher_id, conflict_details)
  SELECT 
    p_timetable_id,
    'consecutive_classes_exceeded',
    teacher_id,
    jsonb_build_object(
      'max_consecutive', max_consecutive_classes,
      'limit', 3
    )
  FROM teacher_workload
  WHERE timetable_id = p_timetable_id AND max_consecutive_classes > 3;
  
  -- Check for double booking (same teacher, same time slot)
  INSERT INTO timetable_conflicts (timetable_id, conflict_type, teacher_id, slot_id, conflict_details)
  SELECT 
    p_timetable_id,
    'double_booking',
    ts1.teacher_id,
    ts1.id,
    jsonb_build_object(
      'day', ts1.day_of_week,
      'period', ts1.period_number,
      'conflicting_slots', jsonb_agg(ts2.id)
    )
  FROM timetable_slots ts1
  JOIN timetable_slots ts2 ON 
    ts1.timetable_id = ts2.timetable_id AND
    ts1.teacher_id = ts2.teacher_id AND
    ts1.day_of_week = ts2.day_of_week AND
    ts1.period_number = ts2.period_number AND
    ts1.id < ts2.id
  WHERE ts1.timetable_id = p_timetable_id
  GROUP BY ts1.id, ts1.teacher_id, ts1.day_of_week, ts1.period_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate workload and detect conflicts when slots change
CREATE OR REPLACE FUNCTION on_timetable_slot_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate workload for affected teacher
  PERFORM calculate_teacher_workload(
    COALESCE(NEW.teacher_id, OLD.teacher_id),
    COALESCE(NEW.timetable_id, OLD.timetable_id)
  );
  
  -- Detect conflicts for the timetable
  PERFORM detect_timetable_conflicts(COALESCE(NEW.timetable_id, OLD.timetable_id));
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER timetable_slot_workload_trigger
AFTER INSERT OR UPDATE OR DELETE ON timetable_slots
FOR EACH ROW
EXECUTE FUNCTION on_timetable_slot_change();

-- Indexes for performance
CREATE INDEX idx_teachers_school ON teachers(school_id);
CREATE INDEX idx_teachers_status ON teachers(onboarding_status);
CREATE INDEX idx_teacher_mappings_teacher ON teacher_subject_mappings(teacher_id);
CREATE INDEX idx_timetable_slots_teacher ON timetable_slots(teacher_id);
CREATE INDEX idx_timetable_slots_schedule ON timetable_slots(timetable_id, day_of_week, period_number);
CREATE INDEX idx_teacher_workload_teacher ON teacher_workload(teacher_id);
CREATE INDEX idx_conflicts_unresolved ON timetable_conflicts(timetable_id, resolved) WHERE resolved = FALSE;

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timetables_updated_at BEFORE UPDATE ON timetables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timetable_slots_updated_at BEFORE UPDATE ON timetable_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
