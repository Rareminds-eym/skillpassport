-- Enable UUID generation (Supabase/PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- Assignments Table Schema (PostgreSQL/Supabase)
-- =====================================================
-- Purpose: Store assignment templates/definitions
--          created by instructors for courses
-- =====================================================

CREATE TABLE IF NOT EXISTS assignments (
    -- Primary Key
    assignment_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    title               text NOT NULL,
    description         text,
    instructions        text,
    
    -- Course Information
    course_name         text NOT NULL,
    course_code         text,
    
    -- Instructor Information
    educator_id       uuid,
    educator_name     text,
    
    -- Assignment Configuration
    total_points        numeric(7,2) NOT NULL DEFAULT 100,
    assignment_type     text CHECK (assignment_type IN ('homework', 'project', 'quiz', 'exam', 'lab', 'essay', 'presentation', 'other')),
    
    -- Additional Fields
    skill_outcomes      text[],
    assign_classes      text,
    document_pdf        text,
    
    -- Dates
    due_date            timestamptz NOT NULL,
    available_from      timestamptz,
    created_date        timestamptz NOT NULL DEFAULT now(),
    
    -- Settings
    allow_late_submission boolean NOT NULL DEFAULT true,
    
    -- Metadata
    is_deleted          boolean NOT NULL DEFAULT false,
    updated_date        timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- Student Assignments Table (Junction/Association)
-- =====================================================
-- Purpose: Link students to assignments and track their
--          individual progress and status
-- =====================================================

CREATE TABLE IF NOT EXISTS student_assignments (
    -- Primary Key
    student_assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    assignment_id       uuid NOT NULL,
    student_id          uuid NOT NULL,
    
    -- Student-specific Status
    status              text NOT NULL DEFAULT 'todo'
                        CHECK (status IN ('todo', 'in-progress', 'submitted', 'graded')),
    priority            text NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low', 'medium', 'high')),
    
    -- Grading
    grade_received      numeric(7,2),
    grade_percentage    numeric(5,2),
    
    -- Instructor Feedback
    instructor_feedback text,
    feedback_date       timestamptz,
    graded_by           uuid,
    graded_date         timestamptz,
    
    -- Submission Details
    submission_date     timestamptz,
    submission_type     text CHECK (submission_type IN ('file', 'text', 'url', 'code', 'other')),
    submission_content  text,
    submission_url      text,
    
    -- Late submission tracking
    is_late             boolean NOT NULL DEFAULT false,
    late_penalty        numeric(5,2),
    
    -- Metadata
    assigned_date       timestamptz NOT NULL DEFAULT now(),
    started_date        timestamptz,
    completed_date      timestamptz,
    is_deleted          boolean NOT NULL DEFAULT false,
    updated_date        timestamptz NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_grade_percentage_range
        CHECK (grade_percentage IS NULL OR 
               (grade_percentage >= 0 AND grade_percentage <= 100)),
    CONSTRAINT chk_status_dates
        CHECK ((status <> 'submitted' OR completed_date IS NOT NULL) AND
               (status <> 'graded' OR graded_date IS NOT NULL)),
    
    -- Foreign Keys
    CONSTRAINT fk_student_assignment_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES assignments(assignment_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_student_assignment_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,
    
    -- Unique constraint: one record per student per assignment
    CONSTRAINT uq_student_assignment
        UNIQUE (assignment_id, student_id)
);


-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Assignments indexes
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_name);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_educator ON assignments(educator_id);

-- Student Assignments indexes
CREATE INDEX IF NOT EXISTS idx_student_assignments_assignment ON student_assignments(assignment_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_student ON student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_status ON student_assignments(status);
CREATE INDEX IF NOT EXISTS idx_student_assignments_student_status ON student_assignments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_student_assignments_submission_date ON student_assignments(submission_date);

-- =====================================================
-- Assignment Attachments Table (Optional Related Table)
-- =====================================================

CREATE TABLE IF NOT EXISTS assignment_attachments (
    attachment_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id       uuid NOT NULL,
    file_name           text NOT NULL,
    file_type           text,
    file_size           integer,
    file_url            text,
    uploaded_date       timestamptz NOT NULL DEFAULT now(),
    
    -- Foreign Key
    CONSTRAINT fk_attachment_assignment 
        FOREIGN KEY (assignment_id) 
        REFERENCES assignments(assignment_id) 
        ON DELETE CASCADE
);

-- Index for attachments by assignment
CREATE INDEX IF NOT EXISTS idx_attachments_assignment ON assignment_attachments(assignment_id);


-- =====================================================
-- Triggers
-- =====================================================

-- Trigger: Auto-update updated_date for assignments
CREATE OR REPLACE FUNCTION trg_assignments_updated_fn()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assignments_updated ON assignments;
CREATE TRIGGER trg_assignments_updated
BEFORE UPDATE ON assignments
FOR EACH ROW
EXECUTE FUNCTION trg_assignments_updated_fn();

-- Trigger: Auto-update updated_date for student_assignments
CREATE OR REPLACE FUNCTION trg_student_assignments_updated_fn()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_student_assignments_updated ON student_assignments;
CREATE TRIGGER trg_student_assignments_updated
BEFORE UPDATE ON student_assignments
FOR EACH ROW
EXECUTE FUNCTION trg_student_assignments_updated_fn();

-- Trigger: Auto-calculate grade percentage for student assignments
CREATE OR REPLACE FUNCTION trg_student_assignments_grade_pct_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_total_points numeric(7,2);
BEGIN
    -- Get total points from the assignment
    SELECT total_points INTO v_total_points
    FROM assignments
    WHERE assignment_id = NEW.assignment_id;
    
    IF NEW.grade_received IS NOT NULL AND v_total_points IS NOT NULL AND v_total_points > 0 THEN
        NEW.grade_percentage := ROUND((NEW.grade_received / v_total_points) * 100, 2);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_student_assignments_grade_pct ON student_assignments;
CREATE TRIGGER trg_student_assignments_grade_pct
BEFORE INSERT OR UPDATE OF grade_received ON student_assignments
FOR EACH ROW
EXECUTE FUNCTION trg_student_assignments_grade_pct_fn();

-- Trigger: Auto-set dates based on status changes
CREATE OR REPLACE FUNCTION trg_student_assignments_status_fn()
RETURNS TRIGGER AS $$
BEGIN
    -- Set started_date when status changes to in-progress
    IF NEW.status = 'in-progress' AND (OLD.status IS NULL OR OLD.status = 'todo') THEN
        IF NEW.started_date IS NULL THEN
            NEW.started_date := CURRENT_TIMESTAMP;
        END IF;
    END IF;
    
    -- Set completed_date when status changes to submitted
    IF NEW.status = 'submitted' AND (OLD IS NULL OR OLD.status != 'submitted') THEN
        IF NEW.completed_date IS NULL THEN
            NEW.completed_date := CURRENT_TIMESTAMP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_student_assignments_status ON student_assignments;
CREATE TRIGGER trg_student_assignments_status
BEFORE INSERT OR UPDATE OF status ON student_assignments
FOR EACH ROW
EXECUTE FUNCTION trg_student_assignments_status_fn();

-- Trigger: Check if submission is late
CREATE OR REPLACE FUNCTION trg_student_assignments_late_check_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_due_date timestamptz;
BEGIN
    -- Only check if submission_date is being set
    IF NEW.submission_date IS NOT NULL THEN
        -- Get due date from assignment
        SELECT a.due_date INTO v_due_date
        FROM assignments a
        WHERE a.assignment_id = NEW.assignment_id;
        
        -- Mark as late if submitted after due date
        IF NEW.submission_date > v_due_date THEN
            NEW.is_late := true;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_student_assignments_late_check ON student_assignments;
CREATE TRIGGER trg_student_assignments_late_check
BEFORE INSERT OR UPDATE OF submission_date ON student_assignments
FOR EACH ROW
EXECUTE FUNCTION trg_student_assignments_late_check_fn();

-- =====================================================
-- Sample Queries
-- =====================================================

-- Get all assignments for a student with their status
-- SELECT a.*, sa.status, sa.grade_received, sa.grade_percentage
-- FROM assignments a
-- INNER JOIN student_assignments sa ON a.assignment_id = sa.assignment_id
-- WHERE sa.student_id = :student_id AND sa.is_deleted = false;

-- Get assignments by status for a student
-- SELECT a.*, sa.status, sa.priority
-- FROM assignments a
-- INNER JOIN student_assignments sa ON a.assignment_id = sa.assignment_id
-- WHERE sa.student_id = :student_id AND sa.status = 'todo' AND sa.is_deleted = false;

-- Get assignments due in a date range (for calendar view)
-- SELECT a.*, sa.status, sa.priority
-- FROM assignments a
-- INNER JOIN student_assignments sa ON a.assignment_id = sa.assignment_id
-- WHERE sa.student_id = :student_id 
--   AND a.due_date BETWEEN :start_date AND :end_date 
--   AND sa.is_deleted = false;

-- Get student assignment statistics
-- SELECT 
--     COUNT(*) as total_assignments,
--     SUM(CASE WHEN sa.status = 'todo' THEN 1 ELSE 0 END) as todo_count,
--     SUM(CASE WHEN sa.status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_count,
--     SUM(CASE WHEN sa.status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
--     SUM(CASE WHEN sa.status = 'graded' THEN 1 ELSE 0 END) as graded_count,
--     ROUND(AVG(CASE WHEN sa.grade_percentage IS NOT NULL THEN sa.grade_percentage END), 2) as avg_grade
-- FROM student_assignments sa
-- WHERE sa.student_id = :student_id AND sa.is_deleted = false;

-- Get assignment with submission for a student
-- SELECT a.*, sa.*
-- FROM assignments a
-- INNER JOIN student_assignments sa ON a.assignment_id = sa.assignment_id
-- WHERE sa.student_id = :student_id AND a.assignment_id = :assignment_id;

-- Get all students assigned to a specific assignment
-- SELECT s.*, sa.status, sa.grade_received
-- FROM students s
-- INNER JOIN student_assignments sa ON s.id = sa.student_id
-- WHERE sa.assignment_id = :assignment_id AND sa.is_deleted = false;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE assignments IS 'Master assignment templates created by instructors for courses';
COMMENT ON COLUMN assignments.assignment_id IS 'Primary key - auto-generated unique identifier';
COMMENT ON COLUMN assignments.total_points IS 'Maximum points possible for this assignment';
COMMENT ON COLUMN assignments.skill_outcomes IS 'Array of skill outcomes/learning objectives for this assignment';
COMMENT ON COLUMN assignments.assign_classes IS 'Classes/sections assigned to this assignment';
COMMENT ON COLUMN assignments.document_pdf IS 'URL or path to PDF document associated with assignment';

COMMENT ON TABLE student_assignments IS 'Links students to assignments and tracks their individual progress and submissions';
COMMENT ON COLUMN student_assignments.status IS 'Student status: todo, in-progress, submitted, graded, returned';
COMMENT ON COLUMN student_assignments.grade_percentage IS 'Auto-calculated from grade_received and assignment total_points';
COMMENT ON COLUMN student_assignments.is_late IS 'Auto-calculated by comparing submission_date with assignment due_date';

COMMENT ON TABLE assignment_attachments IS 'File attachments linked to assignment submissions or templates';
