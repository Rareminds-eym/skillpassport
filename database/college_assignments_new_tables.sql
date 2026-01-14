-- =====================================================
-- COLLEGE ASSIGNMENTS - NEW SEPARATE TABLES
-- =====================================================
-- Purpose: Create dedicated tables for college assignment system
--          Completely separate from school assignment system
-- =====================================================

-- =====================================================
-- 1. COLLEGE_ASSIGNMENTS TABLE
-- =====================================================
-- Main table for college assignments (separate from school assignments)

CREATE TABLE IF NOT EXISTS public.college_assignments (
    assignment_id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NULL,
    instructions text NULL,
    course_name text NOT NULL,
    course_code text NULL,
    
    -- College-specific fields
    college_id uuid NOT NULL,
    college_educator_id uuid NOT NULL,
    program_section_id uuid NOT NULL,
    department_id uuid NOT NULL,
    program_id uuid NOT NULL,
    educator_name text NULL,
    
    -- Assignment configuration
    total_points numeric(7, 2) NOT NULL DEFAULT 100,
    assignment_type text NULL,
    skill_outcomes text[] NULL,
    document_pdf text NULL,
    
    -- Dates and deadlines
    due_date timestamp with time zone NOT NULL,
    available_from timestamp with time zone NULL,
    created_date timestamp with time zone NOT NULL DEFAULT now(),
    updated_date timestamp with time zone NOT NULL DEFAULT now(),
    
    -- Settings
    allow_late_submission boolean NOT NULL DEFAULT true,
    is_deleted boolean NOT NULL DEFAULT false,
    
    -- Constraints
    CONSTRAINT college_assignments_pkey PRIMARY KEY (assignment_id),
    CONSTRAINT college_assignments_college_id_fkey 
        FOREIGN KEY (college_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT college_assignments_college_educator_id_fkey 
        FOREIGN KEY (college_educator_id) REFERENCES college_lecturers(user_id) ON DELETE SET NULL,
    CONSTRAINT college_assignments_program_section_id_fkey 
        FOREIGN KEY (program_section_id) REFERENCES program_sections(id) ON DELETE CASCADE,
    CONSTRAINT college_assignments_department_id_fkey 
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    CONSTRAINT college_assignments_program_id_fkey 
        FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    CONSTRAINT college_assignments_assignment_type_check 
        CHECK (assignment_type = ANY (ARRAY[
            'homework'::text,
            'project'::text,
            'quiz'::text,
            'exam'::text,
            'lab'::text,
            'essay'::text,
            'presentation'::text,
            'other'::text
        ]))
) TABLESPACE pg_default;

-- Indexes for college_assignments
CREATE INDEX IF NOT EXISTS idx_college_assignments_college_id 
    ON public.college_assignments USING btree (college_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_college_assignments_educator_id 
    ON public.college_assignments USING btree (college_educator_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_college_assignments_program_section_id 
    ON public.college_assignments USING btree (program_section_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_college_assignments_department_id 
    ON public.college_assignments USING btree (department_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_college_assignments_program_id 
    ON public.college_assignments USING btree (program_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_college_assignments_due_date 
    ON public.college_assignments USING btree (due_date) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_college_assignments_course 
    ON public.college_assignments USING btree (course_name) TABLESPACE pg_default;

-- Trigger for updated_date
CREATE OR REPLACE FUNCTION trg_college_assignments_updated_fn()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_college_assignments_updated
    BEFORE UPDATE ON college_assignments
    FOR EACH ROW
    EXECUTE FUNCTION trg_college_assignments_updated_fn();

-- Comments
COMMENT ON TABLE college_assignments IS 'College-specific assignments separate from school assignments';
COMMENT ON COLUMN college_assignments.college_id IS 'Reference to college/organization';
COMMENT ON COLUMN college_assignments.college_educator_id IS 'Reference to college lecturer user_id';
COMMENT ON COLUMN college_assignments.program_section_id IS 'Reference to program section (semester-section combination)';
COMMENT ON COLUMN college_assignments.department_id IS 'Reference to academic department';
COMMENT ON COLUMN college_assignments.program_id IS 'Reference to degree program';

-- =====================================================
-- 2. COLLEGE_STUDENT_ASSIGNMENTS TABLE
-- =====================================================
-- Junction table linking college assignments to students with submission tracking

CREATE TABLE IF NOT EXISTS public.college_student_assignments (
    student_assignment_id uuid NOT NULL DEFAULT gen_random_uuid(),
    assignment_id uuid NOT NULL,
    student_id uuid NOT NULL,
    
    -- Status tracking
    status text NOT NULL DEFAULT 'todo'::text,
    priority text NOT NULL DEFAULT 'medium'::text,
    
    -- Grading
    grade_received numeric(7, 2) NULL,
    grade_percentage numeric(5, 2) NULL,
    instructor_feedback text NULL,
    feedback_date timestamp with time zone NULL,
    graded_by uuid NULL,
    graded_date timestamp with time zone NULL,
    
    -- Submission details
    submission_date timestamp with time zone NULL,
    submission_type text NULL,
    submission_content text NULL,
    submission_url text NULL,
    submission_files jsonb NULL,  -- Array of file objects with metadata
    is_late boolean NOT NULL DEFAULT false,
    late_penalty numeric(5, 2) NULL,
    
    -- Dates
    assigned_date timestamp with time zone NOT NULL DEFAULT now(),
    started_date timestamp with time zone NULL,
    completed_date timestamp with time zone NULL,
    updated_date timestamp with time zone NOT NULL DEFAULT now(),
    
    -- Soft delete
    is_deleted boolean NOT NULL DEFAULT false,
    
    -- Constraints
    CONSTRAINT college_student_assignments_pkey PRIMARY KEY (student_assignment_id),
    CONSTRAINT uq_college_student_assignment UNIQUE (assignment_id, student_id),
    CONSTRAINT college_student_assignments_assignment_id_fkey 
        FOREIGN KEY (assignment_id) REFERENCES college_assignments(assignment_id) ON DELETE CASCADE,
    CONSTRAINT college_student_assignments_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
    CONSTRAINT college_student_assignments_graded_by_fkey 
        FOREIGN KEY (graded_by) REFERENCES college_lecturers(user_id) ON DELETE SET NULL,
    CONSTRAINT college_student_assignments_status_check 
        CHECK (status = ANY (ARRAY[
            'todo'::text,
            'in-progress'::text,
            'submitted'::text,
            'graded'::text
        ])),
    CONSTRAINT college_student_assignments_priority_check 
        CHECK (priority = ANY (ARRAY[
            'low'::text,
            'medium'::text,
            'high'::text
        ])),
    CONSTRAINT college_student_assignments_submission_type_check 
        CHECK (submission_type = ANY (ARRAY[
            'file'::text,
            'text'::text,
            'url'::text,
            'code'::text,
            'other'::text
        ])),
    CONSTRAINT chk_college_status_dates 
        CHECK (
            ((status <> 'submitted'::text) OR (completed_date IS NOT NULL)) AND
            ((status <> 'graded'::text) OR (graded_date IS NOT NULL))
        ),
    CONSTRAINT chk_college_grade_percentage_range 
        CHECK (
            (grade_percentage IS NULL) OR 
            ((grade_percentage >= 0::numeric) AND (grade_percentage <= 100::numeric))
        )
) TABLESPACE pg_default;

-- Indexes for college_student_assignments
CREATE INDEX IF NOT EXISTS idx_college_student_assignments_assignment 
    ON public.college_student_assignments USING btree (assignment_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_college_student_assignments_student 
    ON public.college_student_assignments USING btree (student_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_college_student_assignments_status 
    ON public.college_student_assignments USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_college_student_assignments_student_status 
    ON public.college_student_assignments USING btree (student_id, status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_college_student_assignments_submission_date 
    ON public.college_student_assignments USING btree (submission_date) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_college_student_assignments_lookup 
    ON public.college_student_assignments USING btree (student_id, is_deleted) 
    TABLESPACE pg_default WHERE (is_deleted = false);

-- Triggers for college_student_assignments

-- 1. Auto-calculate grade percentage
CREATE OR REPLACE FUNCTION trg_college_student_assignments_grade_pct_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_total_points numeric;
BEGIN
    IF NEW.grade_received IS NOT NULL THEN
        SELECT total_points INTO v_total_points
        FROM college_assignments
        WHERE assignment_id = NEW.assignment_id;
        
        IF v_total_points > 0 THEN
            NEW.grade_percentage := (NEW.grade_received / v_total_points) * 100;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_college_student_assignments_grade_pct
    BEFORE INSERT OR UPDATE OF grade_received ON college_student_assignments
    FOR EACH ROW
    EXECUTE FUNCTION trg_college_student_assignments_grade_pct_fn();

-- 2. Check late submission
CREATE OR REPLACE FUNCTION trg_college_student_assignments_late_check_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_due_date timestamp with time zone;
BEGIN
    IF NEW.submission_date IS NOT NULL THEN
        SELECT due_date INTO v_due_date
        FROM college_assignments
        WHERE assignment_id = NEW.assignment_id;
        
        IF NEW.submission_date > v_due_date THEN
            NEW.is_late := true;
        ELSE
            NEW.is_late := false;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_college_student_assignments_late_check
    BEFORE INSERT OR UPDATE OF submission_date ON college_student_assignments
    FOR EACH ROW
    EXECUTE FUNCTION trg_college_student_assignments_late_check_fn();

-- 3. Auto-update status dates
CREATE OR REPLACE FUNCTION trg_college_student_assignments_status_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'in-progress' AND OLD.status = 'todo' THEN
        NEW.started_date := NOW();
    END IF;
    
    IF NEW.status = 'submitted' AND OLD.status <> 'submitted' THEN
        NEW.completed_date := NOW();
        NEW.submission_date := NOW();
    END IF;
    
    IF NEW.status = 'graded' AND OLD.status <> 'graded' THEN
        NEW.graded_date := NOW();
        NEW.feedback_date := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_college_student_assignments_status
    BEFORE INSERT OR UPDATE OF status ON college_student_assignments
    FOR EACH ROW
    EXECUTE FUNCTION trg_college_student_assignments_status_fn();

-- 4. Updated date trigger
CREATE OR REPLACE FUNCTION trg_college_student_assignments_updated_fn()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_college_student_assignments_updated
    BEFORE UPDATE ON college_student_assignments
    FOR EACH ROW
    EXECUTE FUNCTION trg_college_student_assignments_updated_fn();

-- Comments
COMMENT ON TABLE college_student_assignments IS 'Junction table for college assignments and students with submission tracking';
COMMENT ON COLUMN college_student_assignments.assignment_id IS 'Reference to college assignment';
COMMENT ON COLUMN college_student_assignments.student_id IS 'Reference to student user_id';
COMMENT ON COLUMN college_student_assignments.graded_by IS 'Reference to college lecturer who graded';
COMMENT ON COLUMN college_student_assignments.submission_files IS 'JSONB array of submitted files: [{"file_url": "...", "original_filename": "...", "file_size": 123, "file_type": "...", "uploaded_date": "..."}]';

-- =====================================================
-- 3. COLLEGE_ASSIGNMENT_ATTACHMENTS TABLE
-- =====================================================
-- File attachments for college assignments

CREATE TABLE IF NOT EXISTS public.college_assignment_attachments (
    attachment_id uuid NOT NULL DEFAULT gen_random_uuid(),
    assignment_id uuid NOT NULL,
    file_name text NOT NULL,
    file_type text NULL,
    file_size integer NULL,
    file_url text NULL,
    uploaded_date timestamp with time zone NOT NULL DEFAULT now(),
    uploaded_by uuid NULL,
    
    CONSTRAINT college_assignment_attachments_pkey PRIMARY KEY (attachment_id),
    CONSTRAINT college_assignment_attachments_assignment_id_fkey 
        FOREIGN KEY (assignment_id) REFERENCES college_assignments(assignment_id) ON DELETE CASCADE,
    CONSTRAINT college_assignment_attachments_uploaded_by_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES college_lecturers(user_id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Indexes for college_assignment_attachments
CREATE INDEX IF NOT EXISTS idx_college_assignment_attachments_assignment 
    ON public.college_assignment_attachments USING btree (assignment_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_college_assignment_attachments_uploaded_by 
    ON public.college_assignment_attachments USING btree (uploaded_by) TABLESPACE pg_default;

-- Comments
COMMENT ON TABLE college_assignment_attachments IS 'File attachments for college assignments';
COMMENT ON COLUMN college_assignment_attachments.uploaded_by IS 'Reference to college lecturer who uploaded the file';

-- =====================================================
-- 4. VIEWS FOR EASY DATA ACCESS
-- =====================================================

-- View: College assignments with related data
CREATE OR REPLACE VIEW college_assignments_view AS
SELECT 
    ca.*,
    ps.semester,
    ps.section,
    ps.academic_year,
    ps.current_students,
    p.name as program_name,
    p.code as program_code,
    d.name as department_name,
    d.code as department_code,
    cl.first_name || ' ' || cl.last_name as educator_full_name,
    cl.email as educator_email,
    o.name as college_name,
    COUNT(DISTINCT csa.student_assignment_id) as total_assigned,
    COUNT(DISTINCT CASE WHEN csa.status = 'submitted' THEN csa.student_assignment_id END) as total_submitted,
    COUNT(DISTINCT CASE WHEN csa.status = 'graded' THEN csa.student_assignment_id END) as total_graded
FROM college_assignments ca
LEFT JOIN program_sections ps ON ca.program_section_id = ps.id
LEFT JOIN programs p ON ca.program_id = p.id
LEFT JOIN departments d ON ca.department_id = d.id
LEFT JOIN college_lecturers cl ON ca.college_educator_id = cl.user_id
LEFT JOIN organizations o ON ca.college_id = o.id
LEFT JOIN college_student_assignments csa ON ca.assignment_id = csa.assignment_id AND csa.is_deleted = false
WHERE ca.is_deleted = false
GROUP BY ca.assignment_id, ps.semester, ps.section, ps.academic_year, ps.current_students,
         p.name, p.code, d.name, d.code, cl.first_name, cl.last_name, cl.email, o.name;

COMMENT ON VIEW college_assignments_view IS 'Comprehensive view of college assignments with related data and statistics';

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function: Get assignments for a college educator
CREATE OR REPLACE FUNCTION get_college_educator_assignments(educator_user_id uuid)
RETURNS TABLE (
    assignment_id uuid,
    title text,
    description text,
    course_name text,
    course_code text,
    due_date timestamptz,
    total_points numeric,
    assignment_type text,
    skill_outcomes text[],
    status text,
    created_date timestamptz,
    program_name text,
    department_name text,
    semester integer,
    section text,
    academic_year text,
    student_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.assignment_id,
        ca.title,
        ca.description,
        ca.course_name,
        ca.course_code,
        ca.due_date,
        ca.total_points,
        ca.assignment_type,
        ca.skill_outcomes,
        CASE 
            WHEN ca.due_date < NOW() THEN 'completed'::text
            WHEN ca.available_from > NOW() THEN 'draft'::text
            ELSE 'active'::text
        END as status,
        ca.created_date,
        p.name::text as program_name,
        d.name::text as department_name,
        ps.semester,
        ps.section::text,
        ps.academic_year::text,
        COUNT(csa.student_assignment_id) as student_count
    FROM college_assignments ca
    LEFT JOIN program_sections ps ON ca.program_section_id = ps.id
    LEFT JOIN programs p ON ca.program_id = p.id
    LEFT JOIN departments d ON ca.department_id = d.id
    LEFT JOIN college_student_assignments csa ON ca.assignment_id = csa.assignment_id AND csa.is_deleted = false
    WHERE ca.college_educator_id = educator_user_id
        AND ca.is_deleted = false
    GROUP BY ca.assignment_id, p.name, d.name, ps.semester, ps.section, ps.academic_year
    ORDER BY ca.created_date DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_college_educator_assignments(uuid) IS 'Returns all assignments created by a specific college educator with summary statistics';

-- Function: Get students for program section
CREATE OR REPLACE FUNCTION get_program_section_students(section_id uuid)
RETURNS TABLE (
    student_id uuid,
    user_id uuid,
    name text,
    email text,
    roll_number text,
    program_id uuid,
    section text,
    semester integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as student_id,
        s.user_id,
        s.name::text,
        s.email::text,
        s.roll_number::text,
        s.program_id,
        s.section::text,
        s.semester
    FROM students s
    INNER JOIN program_sections ps ON s.program_id = ps.program_id 
        AND s.section = ps.section 
        AND s.semester = ps.semester
    WHERE ps.id = section_id
        AND s.is_deleted = false
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_program_section_students(uuid) IS 'Returns all students enrolled in a specific program section';

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE college_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_assignment_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: College lecturers can see their own assignments
CREATE POLICY "college_lecturers_own_assignments" ON college_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM college_lecturers cl 
            WHERE cl.user_id = auth.uid() 
            AND cl.user_id = college_assignments.college_educator_id
        )
    );

-- Policy: College admins can see all assignments in their college
-- Uses organizations table where organization_type = 'college'
CREATE POLICY "college_admins_all_assignments" ON college_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = college_assignments.college_id
            AND o.organization_type = 'college'
            AND o.admin_id = auth.uid()
        )
    );

-- Policy: Students can see their own assignments
CREATE POLICY "students_own_assignments" ON college_student_assignments
    FOR ALL USING (
        auth.uid() = student_id
    );

-- Policy: Educators can see assignments they created
CREATE POLICY "educators_created_assignments" ON college_student_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM college_assignments ca
            WHERE ca.assignment_id = college_student_assignments.assignment_id
            AND ca.college_educator_id = auth.uid()
        )
    );

-- =====================================================
-- COMPLETE! 
-- =====================================================
-- New tables created:
-- 1. college_assignments
-- 2. college_student_assignments (with submission_files as JSONB)
-- 3. college_assignment_attachments
--
-- These are completely separate from school assignment tables
-- 
-- JSONB submission_files format:
-- [
--   {
--     "file_url": "https://storage.../file1.pdf",
--     "original_filename": "MyReport.pdf",
--     "file_size": 1024000,
--     "file_type": "application/pdf",
--     "uploaded_date": "2024-01-14T10:00:00Z"
--   },
--   {
--     "file_url": "https://storage.../file2.docx",
--     "original_filename": "SourceCode.zip",
--     "file_size": 2048000,
--     "file_type": "application/zip",
--     "uploaded_date": "2024-01-14T10:05:00Z"
--   }
-- ]
-- =====================================================
