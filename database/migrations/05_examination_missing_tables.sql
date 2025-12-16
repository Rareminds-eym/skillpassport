-- =====================================================
-- EXAMINATION MANAGEMENT - MISSING TABLES ONLY
-- Creates only tables that don't already exist
-- =====================================================
-- Created: December 2024
-- Purpose: Add missing examination management tables
-- Dependencies: assessments, exam_timetable, mark_entries, transcripts (already exist)
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES YOU ALREADY HAVE (Will Skip):
-- ✅ assessments (25 columns)
-- ✅ assessment_types (7 columns)
-- ✅ assignments (20 columns)
-- ✅ assignment_attachments (7 columns)
-- ✅ exam_timetable (20 columns)
-- ✅ mark_entries (24 columns)
-- ✅ transcripts (32 columns)
-- =====================================================

-- =====================================================
-- MISSING TABLES TO CREATE:
-- =====================================================

-- 1. GRADING SYSTEMS TABLE (MISSING)
-- =====================================================
CREATE TABLE IF NOT EXISTS grading_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- System Details
  system_name TEXT NOT NULL,
  system_code TEXT NOT NULL UNIQUE,
  
  -- Grade Details
  grade_label TEXT NOT NULL,
  min_marks DECIMAL(5,2) NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL,
  grade_point DECIMAL(3,2) NOT NULL,
  
  -- Status
  is_pass BOOLEAN DEFAULT TRUE,
  is_distinction BOOLEAN DEFAULT FALSE,
  
  -- Applicability
  applicable_to TEXT DEFAULT 'all' CHECK (applicable_to IN ('all', 'school', 'college', 'university')),
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  color_code TEXT,
  description TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_marks_range CHECK (max_marks > min_marks),
  CONSTRAINT valid_grade_point CHECK (grade_point >= 0 AND grade_point <= 10),
  UNIQUE(system_code, grade_label)
);

CREATE INDEX IF NOT EXISTS idx_grading_systems_code ON grading_systems(system_code);
CREATE INDEX IF NOT EXISTS idx_grading_systems_active ON grading_systems(is_active);
CREATE INDEX IF NOT EXISTS idx_grading_systems_default ON grading_systems(is_default);

COMMENT ON TABLE grading_systems IS 'Grading scales and grade point mappings for both school and college';

-- =====================================================
-- 2. EXAM WINDOWS TABLE (MISSING)
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_windows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Window Details
  window_name TEXT NOT NULL,
  window_code TEXT NOT NULL UNIQUE,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL CHECK (semester IN ('Odd', 'Even', 'Summer', '1', '2')),
  
  -- Assessment Type
  assessment_type_id UUID REFERENCES assessment_types(id),
  assessment_type_name TEXT NOT NULL,
  
  -- Date Range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Registration
  registration_start_date DATE,
  registration_end_date DATE,
  
  -- Applicability
  department_id UUID REFERENCES departments(id),
  program_id UUID REFERENCES programs(id),
  school_id UUID REFERENCES schools(id),
  college_id UUID REFERENCES colleges(id),
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'ongoing', 'completed', 'cancelled')),
  is_published BOOLEAN DEFAULT FALSE,
  
  -- Configuration
  allow_late_registration BOOLEAN DEFAULT FALSE,
  late_fee_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Instructions
  instructions TEXT,
  special_notes TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_exam_window_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_registration_dates CHECK (
    registration_start_date IS NULL OR 
    registration_end_date IS NULL OR 
    registration_end_date >= registration_start_date
  ),
  CONSTRAINT chk_exam_window_institution CHECK (
    (school_id IS NOT NULL AND college_id IS NULL) OR
    (school_id IS NULL AND college_id IS NOT NULL) OR
    (school_id IS NULL AND college_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_exam_windows_academic_year ON exam_windows(academic_year);
CREATE INDEX IF NOT EXISTS idx_exam_windows_semester ON exam_windows(semester);
CREATE INDEX IF NOT EXISTS idx_exam_windows_status ON exam_windows(status);
CREATE INDEX IF NOT EXISTS idx_exam_windows_dates ON exam_windows(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_exam_windows_school ON exam_windows(school_id);
CREATE INDEX IF NOT EXISTS idx_exam_windows_college ON exam_windows(college_id);

COMMENT ON TABLE exam_windows IS 'Exam scheduling windows with registration periods for both school and college';

-- =====================================================
-- 3. EXAM REGISTRATIONS TABLE (MISSING)
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  exam_window_id UUID NOT NULL REFERENCES exam_windows(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id),
  
  -- Student Details
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  program_id UUID REFERENCES programs(id),
  semester INTEGER NOT NULL,
  
  -- Registration Details
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  registration_number TEXT UNIQUE NOT NULL,
  
  -- Type
  registration_type TEXT DEFAULT 'regular' CHECK (registration_type IN ('regular', 'arrear', 'improvement', 'supplementary')),
  
  -- Fee
  registration_fee DECIMAL(10,2) DEFAULT 0,
  late_fee DECIMAL(10,2) DEFAULT 0,
  total_fee DECIMAL(10,2) DEFAULT 0,
  fee_paid BOOLEAN DEFAULT FALSE,
  payment_reference TEXT,
  payment_date DATE,
  
  -- Status
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled', 'appeared', 'absent')),
  
  -- Hall Ticket
  hall_ticket_number TEXT UNIQUE,
  hall_ticket_issued BOOLEAN DEFAULT FALSE,
  hall_ticket_issued_date DATE,
  hall_ticket_url TEXT,
  
  -- Special Requirements
  special_requirements TEXT,
  has_disability BOOLEAN DEFAULT FALSE,
  disability_details TEXT,
  extra_time_minutes INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(exam_window_id, student_id, assessment_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_registrations_window ON exam_registrations(exam_window_id);
CREATE INDEX IF NOT EXISTS idx_exam_registrations_student ON exam_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_registrations_assessment ON exam_registrations(assessment_id);
CREATE INDEX IF NOT EXISTS idx_exam_registrations_status ON exam_registrations(status);
CREATE INDEX IF NOT EXISTS idx_exam_registrations_hall_ticket ON exam_registrations(hall_ticket_number);

-- Trigger to calculate total_fee
CREATE OR REPLACE FUNCTION calculate_exam_registration_fee()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_fee := NEW.registration_fee + NEW.late_fee;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_exam_registration_fee
BEFORE INSERT OR UPDATE ON exam_registrations
FOR EACH ROW
EXECUTE FUNCTION calculate_exam_registration_fee();

COMMENT ON TABLE exam_registrations IS 'Student exam registrations with hall ticket management';

-- =====================================================
-- 4. EXAM ROOMS TABLE (MISSING)
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Room Details
  room_code TEXT NOT NULL UNIQUE,
  room_name TEXT NOT NULL,
  building TEXT,
  floor TEXT,
  
  -- Institution Reference
  school_id UUID REFERENCES schools(id),
  college_id UUID REFERENCES colleges(id),
  
  -- Capacity
  total_capacity INTEGER NOT NULL,
  exam_capacity INTEGER NOT NULL,
  
  -- Facilities
  has_projector BOOLEAN DEFAULT FALSE,
  has_ac BOOLEAN DEFAULT FALSE,
  has_cctv BOOLEAN DEFAULT FALSE,
  has_backup_power BOOLEAN DEFAULT FALSE,
  
  -- Accessibility
  is_accessible BOOLEAN DEFAULT TRUE,
  accessibility_features TEXT[],
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'unavailable', 'retired')),
  
  -- Location
  location_description TEXT,
  map_url TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_capacity CHECK (exam_capacity <= total_capacity),
  CONSTRAINT chk_exam_room_institution CHECK (
    (school_id IS NOT NULL AND college_id IS NULL) OR
    (school_id IS NULL AND college_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_exam_rooms_code ON exam_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_exam_rooms_status ON exam_rooms(status);
CREATE INDEX IF NOT EXISTS idx_exam_rooms_building ON exam_rooms(building);
CREATE INDEX IF NOT EXISTS idx_exam_rooms_school ON exam_rooms(school_id);
CREATE INDEX IF NOT EXISTS idx_exam_rooms_college ON exam_rooms(college_id);

COMMENT ON TABLE exam_rooms IS 'Exam venue definitions with capacity and facilities';

-- =====================================================
-- 5. EXAM SEATING ARRANGEMENTS TABLE (MISSING)
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_seating_arrangements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  exam_timetable_id UUID NOT NULL REFERENCES exam_timetable(id) ON DELETE CASCADE,
  exam_room_id UUID NOT NULL REFERENCES exam_rooms(id),
  student_id UUID NOT NULL REFERENCES users(id),
  
  -- Student Details
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  hall_ticket_number TEXT,
  
  -- Seating
  seat_number TEXT NOT NULL,
  row_number TEXT,
  column_number TEXT,
  
  -- Status
  attendance_status TEXT DEFAULT 'expected' CHECK (attendance_status IN ('expected', 'present', 'absent', 'late')),
  marked_at TIMESTAMPTZ,
  marked_by UUID REFERENCES users(id),
  
  -- Special Arrangements
  has_special_arrangement BOOLEAN DEFAULT FALSE,
  special_arrangement_details TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(exam_timetable_id, exam_room_id, seat_number),
  UNIQUE(exam_timetable_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_seating_timetable ON exam_seating_arrangements(exam_timetable_id);
CREATE INDEX IF NOT EXISTS idx_exam_seating_room ON exam_seating_arrangements(exam_room_id);
CREATE INDEX IF NOT EXISTS idx_exam_seating_student ON exam_seating_arrangements(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_seating_attendance ON exam_seating_arrangements(attendance_status);

COMMENT ON TABLE exam_seating_arrangements IS 'Student seating assignments for exams';

-- =====================================================
-- 6. INVIGILATOR ASSIGNMENTS TABLE (MISSING)
-- =====================================================
CREATE TABLE IF NOT EXISTS invigilator_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  exam_timetable_id UUID NOT NULL REFERENCES exam_timetable(id) ON DELETE CASCADE,
  exam_room_id UUID REFERENCES exam_rooms(id),
  invigilator_id UUID NOT NULL REFERENCES users(id),
  
  -- Invigilator Details
  invigilator_name TEXT NOT NULL,
  invigilator_type TEXT DEFAULT 'regular' CHECK (invigilator_type IN ('chief', 'regular', 'relief', 'external')),
  
  -- Duty Details
  duty_date DATE NOT NULL,
  duty_start_time TIME NOT NULL,
  duty_end_time TIME NOT NULL,
  
  -- Attendance
  attendance_status TEXT DEFAULT 'assigned' CHECK (attendance_status IN ('assigned', 'present', 'absent', 'relieved')),
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  
  -- Compensation
  duty_hours DECIMAL(4,2),
  compensation_amount DECIMAL(10,2) DEFAULT 0,
  compensation_paid BOOLEAN DEFAULT FALSE,
  
  -- Remarks
  remarks TEXT,
  issues_reported TEXT,
  
  -- Audit
  assigned_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_duty_time CHECK (duty_end_time > duty_start_time)
);

CREATE INDEX IF NOT EXISTS idx_invigilator_assignments_timetable ON invigilator_assignments(exam_timetable_id);
CREATE INDEX IF NOT EXISTS idx_invigilator_assignments_room ON invigilator_assignments(exam_room_id);
CREATE INDEX IF NOT EXISTS idx_invigilator_assignments_invigilator ON invigilator_assignments(invigilator_id);
CREATE INDEX IF NOT EXISTS idx_invigilator_assignments_date ON invigilator_assignments(duty_date);
CREATE INDEX IF NOT EXISTS idx_invigilator_assignments_status ON invigilator_assignments(attendance_status);

COMMENT ON TABLE invigilator_assignments IS 'Invigilator duty assignments with attendance tracking';

-- =====================================================
-- 7. MARK ENTRY BATCHES TABLE (MISSING)
-- =====================================================
CREATE TABLE IF NOT EXISTS mark_entry_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Assessment Reference
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  
  -- Batch Details
  batch_name TEXT NOT NULL,
  batch_number TEXT UNIQUE NOT NULL,
  
  -- Statistics
  total_students INTEGER NOT NULL DEFAULT 0,
  entries_completed INTEGER DEFAULT 0,
  entries_pending INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'locked', 'cancelled')),
  is_locked BOOLEAN DEFAULT FALSE,
  
  -- Entry Details
  entered_by UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  locked_by UUID REFERENCES users(id),
  locked_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mark_entry_batches_assessment ON mark_entry_batches(assessment_id);
CREATE INDEX IF NOT EXISTS idx_mark_entry_batches_status ON mark_entry_batches(status);
CREATE INDEX IF NOT EXISTS idx_mark_entry_batches_entered_by ON mark_entry_batches(entered_by);

-- Trigger to calculate statistics
CREATE OR REPLACE FUNCTION calculate_batch_statistics()
RETURNS TRIGGER AS $$
BEGIN
  NEW.entries_pending := NEW.total_students - NEW.entries_completed;
  
  IF NEW.total_students > 0 THEN
    NEW.completion_percentage := (NEW.entries_completed::DECIMAL / NEW.total_students * 100);
  ELSE
    NEW.completion_percentage := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_batch_statistics
BEFORE INSERT OR UPDATE ON mark_entry_batches
FOR EACH ROW
EXECUTE FUNCTION calculate_batch_statistics();

COMMENT ON TABLE mark_entry_batches IS 'Batch processing for mark entry operations';

-- =====================================================
-- 8. MARK MODERATION LOG TABLE (MISSING)
-- =====================================================
CREATE TABLE IF NOT EXISTS mark_moderation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Mark Entry Reference
  mark_entry_id UUID NOT NULL REFERENCES mark_entries(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id),
  student_id UUID NOT NULL REFERENCES users(id),
  
  -- Moderation Details
  original_marks DECIMAL(5,2) NOT NULL,
  moderated_marks DECIMAL(5,2) NOT NULL,
  difference DECIMAL(5,2) DEFAULT 0,
  
  -- Reason
  moderation_type TEXT NOT NULL CHECK (moderation_type IN ('correction', 'revaluation', 'grace_marks', 'normalization', 'appeal')),
  reason TEXT NOT NULL,
  justification TEXT,
  
  -- Moderator
  moderated_by UUID NOT NULL REFERENCES users(id),
  moderator_name TEXT NOT NULL,
  moderated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Approval
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mark_moderation_log_entry ON mark_moderation_log(mark_entry_id);
CREATE INDEX IF NOT EXISTS idx_mark_moderation_log_assessment ON mark_moderation_log(assessment_id);
CREATE INDEX IF NOT EXISTS idx_mark_moderation_log_student ON mark_moderation_log(student_id);
CREATE INDEX IF NOT EXISTS idx_mark_moderation_log_moderator ON mark_moderation_log(moderated_by);
CREATE INDEX IF NOT EXISTS idx_mark_moderation_log_type ON mark_moderation_log(moderation_type);

-- Trigger to calculate difference
CREATE OR REPLACE FUNCTION calculate_moderation_difference()
RETURNS TRIGGER AS $$
BEGIN
  NEW.difference := NEW.moderated_marks - NEW.original_marks;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_moderation_difference
BEFORE INSERT OR UPDATE ON mark_moderation_log
FOR EACH ROW
EXECUTE FUNCTION calculate_moderation_difference();

COMMENT ON TABLE mark_moderation_log IS 'Audit trail for all mark moderation activities';

-- =====================================================
-- 9. TRANSCRIPT REQUESTS TABLE (MISSING)
-- =====================================================
CREATE TABLE IF NOT EXISTS transcript_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Student Reference
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  
  -- Request Details
  request_number TEXT UNIQUE NOT NULL,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transcript_type TEXT NOT NULL CHECK (transcript_type IN ('provisional', 'final', 'consolidated', 'semester', 'degree')),
  
  -- Purpose
  purpose TEXT NOT NULL CHECK (purpose IN ('higher_studies', 'employment', 'visa', 'personal', 'other')),
  purpose_details TEXT,
  
  -- Copies
  number_of_copies INTEGER DEFAULT 1,
  
  -- Delivery
  delivery_method TEXT DEFAULT 'collect' CHECK (delivery_method IN ('collect', 'post', 'email', 'courier')),
  delivery_address TEXT,
  delivery_email TEXT,
  
  -- Fee
  processing_fee DECIMAL(10,2) DEFAULT 0,
  courier_charges DECIMAL(10,2) DEFAULT 0,
  total_fee DECIMAL(10,2) DEFAULT 0,
  fee_paid BOOLEAN DEFAULT FALSE,
  payment_reference TEXT,
  payment_date DATE,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'dispatched', 'delivered', 'rejected')),
  
  -- Processing
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ,
  ready_date DATE,
  dispatch_date DATE,
  delivery_date DATE,
  
  -- Transcript Reference
  transcript_id UUID REFERENCES transcripts(id),
  
  -- Remarks
  remarks TEXT,
  rejection_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_copies CHECK (number_of_copies > 0)
);

CREATE INDEX IF NOT EXISTS idx_transcript_requests_student ON transcript_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_transcript_requests_number ON transcript_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_transcript_requests_status ON transcript_requests(status);
CREATE INDEX IF NOT EXISTS idx_transcript_requests_date ON transcript_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_transcript_requests_type ON transcript_requests(transcript_type);

-- Trigger to calculate total_fee
CREATE OR REPLACE FUNCTION calculate_transcript_request_fee()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_fee := NEW.processing_fee + NEW.courier_charges;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_transcript_request_fee
BEFORE INSERT OR UPDATE ON transcript_requests
FOR EACH ROW
EXECUTE FUNCTION calculate_transcript_request_fee();

COMMENT ON TABLE transcript_requests IS 'Student transcript requests with delivery tracking';

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_grading_systems_updated_at BEFORE UPDATE ON grading_systems
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_windows_updated_at BEFORE UPDATE ON exam_windows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_registrations_updated_at BEFORE UPDATE ON exam_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_rooms_updated_at BEFORE UPDATE ON exam_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_seating_updated_at BEFORE UPDATE ON exam_seating_arrangements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invigilator_assignments_updated_at BEFORE UPDATE ON invigilator_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mark_entry_batches_updated_at BEFORE UPDATE ON mark_entry_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcript_requests_updated_at BEFORE UPDATE ON transcript_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- END OF MIGRATION
-- =====================================================
