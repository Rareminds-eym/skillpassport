-- =====================================================
-- INTERLINKING ENHANCEMENTS
-- Link migration tables with existing students & college_lecturers
-- =====================================================
-- Created: December 2024
-- Purpose: Add references to students and college_lecturers tables
-- Dependencies: students, college_lecturers, all Phase 1 migration tables
-- =====================================================

-- =====================================================
-- PART 1: ADD STUDENT RECORD REFERENCES
-- =====================================================

-- 1. Add to mark_entries
ALTER TABLE mark_entries 
ADD COLUMN IF NOT EXISTS student_record_id UUID REFERENCES students(id) ON DELETE CASCADE;

COMMENT ON COLUMN mark_entries.student_record_id IS 'Direct reference to students table for roll_number, college_id, etc.';

CREATE INDEX IF NOT EXISTS idx_mark_entries_student_record ON mark_entries(student_record_id);

-- 2. Add to transcripts
ALTER TABLE transcripts 
ADD COLUMN IF NOT EXISTS student_record_id UUID REFERENCES students(id) ON DELETE CASCADE;

COMMENT ON COLUMN transcripts.student_record_id IS 'Direct reference to students table for complete student details';

CREATE INDEX IF NOT EXISTS idx_transcripts_student_record ON transcripts(student_record_id);

-- 3. Add to student_ledgers
ALTER TABLE student_ledgers 
ADD COLUMN IF NOT EXISTS student_record_id UUID REFERENCES students(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id) ON DELETE SET NULL;

COMMENT ON COLUMN student_ledgers.student_record_id IS 'Direct reference to students table';
COMMENT ON COLUMN student_ledgers.college_id IS 'College reference for multi-college support';

CREATE INDEX IF NOT EXISTS idx_student_ledgers_student_record ON student_ledgers(student_record_id);
CREATE INDEX IF NOT EXISTS idx_student_ledgers_college ON student_ledgers(college_id);

-- 4. Add to library_issued_books
ALTER TABLE library_issued_books 
ADD COLUMN IF NOT EXISTS student_record_id UUID REFERENCES students(id) ON DELETE CASCADE;

COMMENT ON COLUMN library_issued_books.student_record_id IS 'Direct reference to students table for roll_number, college_id';

CREATE INDEX IF NOT EXISTS idx_library_issued_books_student_record ON library_issued_books(student_record_id);

-- 5. Add to library_history
ALTER TABLE library_history 
ADD COLUMN IF NOT EXISTS student_record_id UUID REFERENCES students(id) ON DELETE SET NULL;

COMMENT ON COLUMN library_history.student_record_id IS 'Reference to students table (nullable for historical data)';

CREATE INDEX IF NOT EXISTS idx_library_history_student_record ON library_history(student_record_id);

-- 6. Add to exam_registrations
ALTER TABLE exam_registrations 
ADD COLUMN IF NOT EXISTS student_record_id UUID REFERENCES students(id) ON DELETE CASCADE;

COMMENT ON COLUMN exam_registrations.student_record_id IS 'Direct reference to students table';

CREATE INDEX IF NOT EXISTS idx_exam_registrations_student_record ON exam_registrations(student_record_id);

-- 7. Add to exam_seating_arrangements
ALTER TABLE exam_seating_arrangements 
ADD COLUMN IF NOT EXISTS student_record_id UUID REFERENCES students(id) ON DELETE CASCADE;

COMMENT ON COLUMN exam_seating_arrangements.student_record_id IS 'Direct reference to students table';

CREATE INDEX IF NOT EXISTS idx_exam_seating_student_record ON exam_seating_arrangements(student_record_id);

-- =====================================================
-- PART 2: ADD COLLEGE LECTURER REFERENCES
-- =====================================================

-- 1. Add to assessments
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES college_lecturers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id) ON DELETE SET NULL;

COMMENT ON COLUMN assessments.faculty_id IS 'Reference to college_lecturers for faculty who created assessment';
COMMENT ON COLUMN assessments.college_id IS 'College reference for multi-college support';

CREATE INDEX IF NOT EXISTS idx_assessments_faculty ON assessments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_assessments_college ON assessments(college_id);

-- 2. Add to invigilator_assignments
ALTER TABLE invigilator_assignments 
ADD COLUMN IF NOT EXISTS lecturer_record_id UUID REFERENCES college_lecturers(id) ON DELETE SET NULL;

COMMENT ON COLUMN invigilator_assignments.lecturer_record_id IS 'Reference to college_lecturers for invigilator details';

CREATE INDEX IF NOT EXISTS idx_invigilator_lecturer ON invigilator_assignments(lecturer_record_id);

-- 3. Add to library_books (optional college reference)
ALTER TABLE library_books 
ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id) ON DELETE SET NULL;

COMMENT ON COLUMN library_books.college_id IS 'College reference for multi-college library support';

CREATE INDEX IF NOT EXISTS idx_library_books_college ON library_books(college_id);

-- =====================================================
-- PART 3: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get complete student details
CREATE OR REPLACE FUNCTION get_student_details(p_user_id UUID)
RETURNS TABLE (
  student_id UUID,
  user_id UUID,
  email TEXT,
  name TEXT,
  roll_number TEXT,
  admission_number TEXT,
  college_id UUID,
  college_name TEXT,
  grade TEXT,
  section TEXT,
  category TEXT,
  quota TEXT,
  current_cgpa NUMERIC,
  enrollment_date DATE,
  expected_graduation_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.email,
    s.name,
    s.roll_number,
    s.admission_number,
    s.college_id,
    c.name as college_name,
    s.grade,
    s.section,
    s.category,
    s.quota,
    s."currentCgpa",
    s."enrollmentDate",
    s."expectedGraduationDate"
  FROM students s
  LEFT JOIN colleges c ON c.id = s.college_id
  WHERE s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_student_details IS 'Get complete student details by user_id';

-- Function to get complete lecturer details
CREATE OR REPLACE FUNCTION get_lecturer_details(p_user_id UUID)
RETURNS TABLE (
  lecturer_id UUID,
  user_id UUID,
  college_id UUID,
  college_name TEXT,
  employee_id TEXT,
  department TEXT,
  specialization TEXT,
  qualification TEXT,
  experience_years INTEGER,
  date_of_joining DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cl.id,
    cl.user_id,
    cl."collegeId",
    c.name as college_name,
    cl."employeeId"::TEXT,
    cl.department::TEXT,
    cl.specialization::TEXT,
    cl.qualification::TEXT,
    cl."experienceYears",
    cl."dateOfJoining"
  FROM college_lecturers cl
  LEFT JOIN colleges c ON c.id = cl."collegeId"
  WHERE cl.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_lecturer_details IS 'Get complete lecturer details by user_id';

-- Function to sync student_record_id from user_id
CREATE OR REPLACE FUNCTION sync_student_record_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-populate student_record_id from user_id
  IF NEW.student_id IS NOT NULL AND NEW.student_record_id IS NULL THEN
    SELECT id INTO NEW.student_record_id
    FROM students
    WHERE user_id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_student_record_id IS 'Auto-populate student_record_id from student_id (user_id)';

-- Function to sync lecturer_record_id from user_id
CREATE OR REPLACE FUNCTION sync_lecturer_record_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-populate lecturer_record_id from invigilator_id
  IF NEW.invigilator_id IS NOT NULL AND NEW.lecturer_record_id IS NULL THEN
    SELECT id INTO NEW.lecturer_record_id
    FROM college_lecturers
    WHERE user_id = NEW.invigilator_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_lecturer_record_id IS 'Auto-populate lecturer_record_id from invigilator_id (user_id)';

-- =====================================================
-- PART 4: CREATE TRIGGERS FOR AUTO-SYNC
-- =====================================================

-- Trigger for mark_entries
DROP TRIGGER IF EXISTS trigger_sync_student_record_mark_entries ON mark_entries;
CREATE TRIGGER trigger_sync_student_record_mark_entries
  BEFORE INSERT OR UPDATE ON mark_entries
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_record_id();

-- Trigger for transcripts
DROP TRIGGER IF EXISTS trigger_sync_student_record_transcripts ON transcripts;
CREATE TRIGGER trigger_sync_student_record_transcripts
  BEFORE INSERT OR UPDATE ON transcripts
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_record_id();

-- Trigger for student_ledgers
DROP TRIGGER IF EXISTS trigger_sync_student_record_ledgers ON student_ledgers;
CREATE TRIGGER trigger_sync_student_record_ledgers
  BEFORE INSERT OR UPDATE ON student_ledgers
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_record_id();

-- Trigger for library_issued_books
DROP TRIGGER IF EXISTS trigger_sync_student_record_library ON library_issued_books;
CREATE TRIGGER trigger_sync_student_record_library
  BEFORE INSERT OR UPDATE ON library_issued_books
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_record_id();

-- Trigger for exam_registrations
DROP TRIGGER IF EXISTS trigger_sync_student_record_exam_reg ON exam_registrations;
CREATE TRIGGER trigger_sync_student_record_exam_reg
  BEFORE INSERT OR UPDATE ON exam_registrations
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_record_id();

-- Trigger for exam_seating_arrangements
DROP TRIGGER IF EXISTS trigger_sync_student_record_seating ON exam_seating_arrangements;
CREATE TRIGGER trigger_sync_student_record_seating
  BEFORE INSERT OR UPDATE ON exam_seating_arrangements
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_record_id();

-- Trigger for invigilator_assignments
DROP TRIGGER IF EXISTS trigger_sync_lecturer_record_invigilator ON invigilator_assignments;
CREATE TRIGGER trigger_sync_lecturer_record_invigilator
  BEFORE INSERT OR UPDATE ON invigilator_assignments
  FOR EACH ROW
  EXECUTE FUNCTION sync_lecturer_record_id();

-- =====================================================
-- PART 5: CREATE USEFUL VIEWS
-- =====================================================

-- View: Student marks with complete details
CREATE OR REPLACE VIEW v_student_marks_detailed AS
SELECT 
  m.id,
  m.assessment_id,
  m.student_id,
  m.marks_obtained,
  m.total_marks,
  m.percentage,
  m.grade,
  m.grade_point,
  m.is_absent,
  m.is_pass,
  -- Student details
  s.roll_number,
  s.admission_number,
  s.name as student_name,
  s.email as student_email,
  s.college_id,
  c.name as college_name,
  s.grade as student_grade,
  s.section as student_section,
  s.category,
  s.quota,
  -- Assessment details
  a.assessment_code,
  a.type as assessment_type,
  a.course_name,
  a.course_code,
  a.academic_year,
  a.semester,
  -- Program details
  p.name as program_name,
  d.name as department_name
FROM mark_entries m
JOIN students s ON s.user_id = m.student_id
LEFT JOIN colleges c ON c.id = s.college_id
JOIN assessments a ON a.id = m.assessment_id
LEFT JOIN programs p ON p.id = a.program_id
LEFT JOIN departments d ON d.id = a.department_id;

COMMENT ON VIEW v_student_marks_detailed IS 'Complete student marks with student, assessment, and program details';

-- View: Student fee ledger with details
CREATE OR REPLACE VIEW v_student_fee_ledger_detailed AS
SELECT 
  l.id,
  l.student_id,
  l.fee_structure_id,
  l.fee_head_name,
  l.due_amount,
  l.paid_amount,
  l.balance,
  l.due_date,
  l.payment_status,
  l.is_overdue,
  -- Student details
  s.roll_number,
  s.admission_number,
  s.name as student_name,
  s.email as student_email,
  s.college_id,
  c.name as college_name,
  s.category,
  s.quota,
  -- Fee structure details
  fs.program_id,
  fs.program_name,
  fs.semester,
  fs.academic_year,
  fs.category as fee_category,
  -- Program details
  p.name as program_name_full,
  d.name as department_name
FROM student_ledgers l
JOIN students s ON s.user_id = l.student_id
LEFT JOIN colleges c ON c.id = s.college_id
JOIN fee_structures fs ON fs.id = l.fee_structure_id
LEFT JOIN programs p ON p.id = fs.program_id
LEFT JOIN departments d ON d.id = p.department_id;

COMMENT ON VIEW v_student_fee_ledger_detailed IS 'Complete student fee ledger with student and program details';

-- View: Library issued books with details
CREATE OR REPLACE VIEW v_library_issued_detailed AS
SELECT 
  lib.id,
  lib.book_id,
  lib.student_id,
  lib.issue_date,
  lib.due_date,
  lib.return_date,
  lib.days_overdue,
  lib.fine_amount,
  lib.status,
  -- Student details
  s.roll_number,
  s.admission_number,
  s.name as student_name,
  s.email as student_email,
  s.college_id,
  c.name as college_name,
  s.grade as student_grade,
  s.section as student_section,
  -- Book details
  lb.book_id as book_code,
  lb.title as book_title,
  lb.author as book_author,
  lb.isbn,
  lb.category as book_category,
  lb.location as book_location
FROM library_issued_books lib
JOIN students s ON s.user_id = lib.student_id
LEFT JOIN colleges c ON c.id = s.college_id
JOIN library_books lb ON lb.id = lib.book_id;

COMMENT ON VIEW v_library_issued_detailed IS 'Complete library issued books with student and book details';

-- View: Exam registrations with details
CREATE OR REPLACE VIEW v_exam_registrations_detailed AS
SELECT 
  er.id,
  er.exam_window_id,
  er.student_id,
  er.assessment_id,
  er.registration_number,
  er.registration_date,
  er.registration_type,
  er.status,
  er.hall_ticket_number,
  -- Student details
  s.roll_number,
  s.admission_number,
  s.name as student_name,
  s.email as student_email,
  s.college_id,
  c.name as college_name,
  s.category,
  s.quota,
  -- Exam window details
  ew.window_name,
  ew.academic_year,
  ew.semester as exam_semester,
  ew.start_date as exam_start_date,
  ew.end_date as exam_end_date,
  -- Assessment details
  a.assessment_code,
  a.type as assessment_type,
  a.course_name,
  a.course_code,
  -- Program details
  p.name as program_name,
  d.name as department_name
FROM exam_registrations er
JOIN students s ON s.user_id = er.student_id
LEFT JOIN colleges c ON c.id = s.college_id
JOIN exam_windows ew ON ew.id = er.exam_window_id
LEFT JOIN assessments a ON a.id = er.assessment_id
LEFT JOIN programs p ON p.id = er.program_id
LEFT JOIN departments d ON d.id = p.department_id;

COMMENT ON VIEW v_exam_registrations_detailed IS 'Complete exam registrations with student, exam, and program details';

-- =====================================================
-- PART 6: CREATE HELPER QUERIES
-- =====================================================

-- Function to get student academic summary
CREATE OR REPLACE FUNCTION get_student_academic_summary(p_student_user_id UUID)
RETURNS TABLE (
  student_name TEXT,
  roll_number TEXT,
  college_name TEXT,
  program_name TEXT,
  current_semester INTEGER,
  current_cgpa NUMERIC,
  total_assessments INTEGER,
  passed_assessments INTEGER,
  failed_assessments INTEGER,
  average_percentage NUMERIC,
  total_fee_due NUMERIC,
  total_fee_paid NUMERIC,
  fee_balance NUMERIC,
  books_issued INTEGER,
  books_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.name,
    s.roll_number,
    c.name as college_name,
    p.name as program_name,
    CAST(s.grade AS INTEGER) as current_semester,
    s."currentCgpa",
    COUNT(DISTINCT m.id)::INTEGER as total_assessments,
    COUNT(DISTINCT CASE WHEN m.is_pass = TRUE THEN m.id END)::INTEGER as passed_assessments,
    COUNT(DISTINCT CASE WHEN m.is_pass = FALSE THEN m.id END)::INTEGER as failed_assessments,
    ROUND(AVG(m.percentage), 2) as average_percentage,
    COALESCE(SUM(DISTINCT l.due_amount), 0) as total_fee_due,
    COALESCE(SUM(DISTINCT l.paid_amount), 0) as total_fee_paid,
    COALESCE(SUM(DISTINCT l.balance), 0) as fee_balance,
    COUNT(DISTINCT lib.id)::INTEGER as books_issued,
    COUNT(DISTINCT CASE WHEN lib.days_overdue > 0 THEN lib.id END)::INTEGER as books_overdue
  FROM students s
  LEFT JOIN colleges c ON c.id = s.college_id
  LEFT JOIN programs p ON p.id = CAST(s.grade AS UUID) -- Adjust based on actual relationship
  LEFT JOIN mark_entries m ON m.student_id = s.user_id
  LEFT JOIN student_ledgers l ON l.student_id = s.user_id
  LEFT JOIN library_issued_books lib ON lib.student_id = s.user_id AND lib.status = 'issued'
  WHERE s.user_id = p_student_user_id
  GROUP BY s.id, s.name, s.roll_number, c.name, p.name, s.grade, s."currentCgpa";
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_student_academic_summary IS 'Get comprehensive academic summary for a student';

-- =====================================================
-- PART 7: DATA MIGRATION (BACKFILL)
-- =====================================================

-- Backfill student_record_id for existing records
DO $$
BEGIN
  -- Update mark_entries
  UPDATE mark_entries m
  SET student_record_id = s.id
  FROM students s
  WHERE s.user_id = m.student_id
    AND m.student_record_id IS NULL;
  
  -- Update transcripts
  UPDATE transcripts t
  SET student_record_id = s.id
  FROM students s
  WHERE s.user_id = t.student_id
    AND t.student_record_id IS NULL;
  
  -- Update student_ledgers
  UPDATE student_ledgers l
  SET student_record_id = s.id,
      college_id = s.college_id
  FROM students s
  WHERE s.user_id = l.student_id
    AND l.student_record_id IS NULL;
  
  -- Update library_issued_books
  UPDATE library_issued_books lib
  SET student_record_id = s.id
  FROM students s
  WHERE s.user_id = lib.student_id
    AND lib.student_record_id IS NULL;
  
  -- Update exam_registrations
  UPDATE exam_registrations er
  SET student_record_id = s.id
  FROM students s
  WHERE s.user_id = er.student_id
    AND er.student_record_id IS NULL;
  
  -- Update exam_seating_arrangements
  UPDATE exam_seating_arrangements esa
  SET student_record_id = s.id
  FROM students s
  WHERE s.user_id = esa.student_id
    AND esa.student_record_id IS NULL;
  
  -- Update invigilator_assignments
  UPDATE invigilator_assignments ia
  SET lecturer_record_id = cl.id
  FROM college_lecturers cl
  WHERE cl.user_id = ia.invigilator_id
    AND ia.lecturer_record_id IS NULL;
  
  RAISE NOTICE 'Backfill completed successfully';
END $$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN mark_entries.student_record_id IS 'Direct reference to students table - auto-populated via trigger';
COMMENT ON COLUMN transcripts.student_record_id IS 'Direct reference to students table - auto-populated via trigger';
COMMENT ON COLUMN student_ledgers.student_record_id IS 'Direct reference to students table - auto-populated via trigger';
COMMENT ON COLUMN library_issued_books.student_record_id IS 'Direct reference to students table - auto-populated via trigger';
COMMENT ON COLUMN exam_registrations.student_record_id IS 'Direct reference to students table - auto-populated via trigger';
COMMENT ON COLUMN exam_seating_arrangements.student_record_id IS 'Direct reference to students table - auto-populated via trigger';
COMMENT ON COLUMN invigilator_assignments.lecturer_record_id IS 'Direct reference to college_lecturers table - auto-populated via trigger';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
