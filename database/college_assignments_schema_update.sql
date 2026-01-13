-- =====================================================
-- College Assignments Schema Updates
-- =====================================================
-- Purpose: Extend assignments table to support college educators
--          while keeping school system completely intact
-- =====================================================

-- Add new columns to assignments table for college support
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS college_id uuid,
ADD COLUMN IF NOT EXISTS college_educator_id uuid,  -- Separate column for college educators
ADD COLUMN IF NOT EXISTS program_section_id uuid,
ADD COLUMN IF NOT EXISTS department_id uuid,
ADD COLUMN IF NOT EXISTS program_id uuid;

-- Add foreign key constraints for college system
ALTER TABLE assignments 
ADD CONSTRAINT IF NOT EXISTS assignments_college_id_fkey 
    FOREIGN KEY (college_id) REFERENCES organizations (id) ON DELETE CASCADE;

ALTER TABLE assignments 
ADD CONSTRAINT IF NOT EXISTS assignments_college_educator_id_fkey 
    FOREIGN KEY (college_educator_id) REFERENCES college_lecturers (user_id) ON DELETE SET NULL;

ALTER TABLE assignments 
ADD CONSTRAINT IF NOT EXISTS assignments_program_section_id_fkey 
    FOREIGN KEY (program_section_id) REFERENCES program_sections (id) ON DELETE CASCADE;

ALTER TABLE assignments 
ADD CONSTRAINT IF NOT EXISTS assignments_department_id_fkey 
    FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE;

ALTER TABLE assignments 
ADD CONSTRAINT IF NOT EXISTS assignments_program_id_fkey 
    FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE CASCADE;

-- Keep existing school educator constraint unchanged
-- assignments.educator_id → school_educators.id (for schools)
-- assignments.college_educator_id → college_lecturers.user_id (for colleges)

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignments_college_id ON assignments(college_id);
CREATE INDEX IF NOT EXISTS idx_assignments_college_educator_id ON assignments(college_educator_id);
CREATE INDEX IF NOT EXISTS idx_assignments_program_section_id ON assignments(program_section_id);
CREATE INDEX IF NOT EXISTS idx_assignments_department_id ON assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_assignments_program_id ON assignments(program_id);

-- Add check constraint to ensure either school or college assignment
ALTER TABLE assignments 
ADD CONSTRAINT IF NOT EXISTS chk_assignments_institution_type 
CHECK (
    (school_class_id IS NOT NULL AND college_id IS NULL AND program_section_id IS NULL AND college_educator_id IS NULL) OR
    (school_class_id IS NULL AND college_id IS NOT NULL AND program_section_id IS NOT NULL AND college_educator_id IS NOT NULL)
);

-- =====================================================
-- Update student_assignments table for college support
-- =====================================================

-- The student_assignments table already references students(user_id)
-- which works for both school and college students
-- No changes needed here as it's already flexible

-- =====================================================
-- Create view for college assignments with related data
-- =====================================================

CREATE OR REPLACE VIEW college_assignments_view AS
SELECT 
    a.*,
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
    o.name as college_name
FROM assignments a
LEFT JOIN program_sections ps ON a.program_section_id = ps.id
LEFT JOIN programs p ON a.program_id = p.id
LEFT JOIN departments d ON a.department_id = d.id
LEFT JOIN college_lecturers cl ON a.college_educator_id = cl.user_id  -- Updated to use college_educator_id
LEFT JOIN organizations o ON a.college_id = o.id
WHERE a.college_id IS NOT NULL;

-- =====================================================
-- Create view for school assignments (existing functionality)
-- =====================================================

CREATE OR REPLACE VIEW school_assignments_view AS
SELECT 
    a.*,
    sc.name as class_name,
    sc.grade,
    sc.section,
    sc.academic_year,
    sc.current_students,
    se.first_name || ' ' || se.last_name as educator_full_name,
    se.email as educator_email,
    s.name as school_name
FROM assignments a
LEFT JOIN school_classes sc ON a.school_class_id = sc.id
LEFT JOIN school_educators se ON a.educator_id = se.id  -- Keep using educator_id for schools
LEFT JOIN schools s ON sc.school_id = s.id
WHERE a.school_class_id IS NOT NULL;

-- =====================================================
-- Function to get assignments for college educator
-- =====================================================

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
        a.assignment_id,
        a.title,
        a.description,
        a.course_name,
        a.course_code,
        a.due_date,
        a.total_points,
        a.assignment_type,
        a.skill_outcomes,
        CASE 
            WHEN a.due_date < NOW() THEN 'completed'
            WHEN a.available_from > NOW() THEN 'draft'
            ELSE 'active'
        END as status,
        a.created_date,
        p.name as program_name,
        d.name as department_name,
        ps.semester,
        ps.section,
        ps.academic_year,
        COUNT(sa.student_assignment_id) as student_count
    FROM assignments a
    LEFT JOIN program_sections ps ON a.program_section_id = ps.id
    LEFT JOIN programs p ON a.program_id = p.id
    LEFT JOIN departments d ON a.department_id = d.id
    LEFT JOIN student_assignments sa ON a.assignment_id = sa.assignment_id AND sa.is_deleted = false
    WHERE a.college_educator_id = educator_user_id  -- Updated to use college_educator_id
        AND a.is_deleted = false
        AND a.college_id IS NOT NULL
    GROUP BY a.assignment_id, p.name, d.name, ps.semester, ps.section, ps.academic_year
    ORDER BY a.created_date DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function to get students for program section
-- =====================================================

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
        s.name,
        s.email,
        s.roll_number,
        s.program_id,
        s.section,
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

-- =====================================================
-- RLS Policies for college assignments
-- =====================================================

-- Enable RLS on assignments table if not already enabled
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Policy for college lecturers to see their own assignments
CREATE POLICY "college_lecturers_own_assignments" ON assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM college_lecturers cl 
            WHERE cl.user_id = auth.uid() 
            AND cl.user_id = assignments.college_educator_id  -- Updated to use college_educator_id
        )
    );

-- Policy for college admins to see all college assignments
CREATE POLICY "college_admins_all_assignments" ON assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM college_admins ca
            INNER JOIN organizations o ON ca.college_id = o.id
            WHERE ca.user_id = auth.uid() 
            AND o.id = assignments.college_id
        )
    );

-- =====================================================
-- Sample data insertion function for testing
-- =====================================================

CREATE OR REPLACE FUNCTION create_sample_college_assignment(
    p_educator_user_id uuid,
    p_college_id uuid,
    p_program_section_id uuid,
    p_title text DEFAULT 'Sample Programming Assignment'
)
RETURNS uuid AS $$
DECLARE
    v_assignment_id uuid;
    v_section_record record;
BEGIN
    -- Get section details
    SELECT ps.*, p.name as program_name, d.name as department_name
    INTO v_section_record
    FROM program_sections ps
    INNER JOIN programs p ON ps.program_id = p.id
    INNER JOIN departments d ON ps.department_id = d.id
    WHERE ps.id = p_program_section_id;
    
    -- Insert assignment
    INSERT INTO assignments (
        title,
        description,
        instructions,
        course_name,
        course_code,
        college_educator_id,  -- Updated to use college_educator_id
        college_id,
        program_section_id,
        department_id,
        program_id,
        total_points,
        assignment_type,
        skill_outcomes,
        due_date,
        available_from
    ) VALUES (
        p_title,
        'A comprehensive programming assignment to test problem-solving skills',
        'Complete the given programming challenges and submit your solutions',
        'Data Structures and Algorithms',
        'CS301',
        p_educator_user_id,
        p_college_id,
        p_program_section_id,
        v_section_record.department_id,
        v_section_record.program_id,
        100,
        'project',
        ARRAY['Programming', 'Problem Solving', 'Data Structures'],
        NOW() + INTERVAL '7 days',
        NOW()
    ) RETURNING assignment_id INTO v_assignment_id;
    
    RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON COLUMN assignments.college_id IS 'Reference to college/organization for college assignments';
COMMENT ON COLUMN assignments.college_educator_id IS 'Reference to college lecturer user_id for college assignments (separate from school educator_id)';
COMMENT ON COLUMN assignments.program_section_id IS 'Reference to program section for college assignments';
COMMENT ON COLUMN assignments.department_id IS 'Reference to department for college assignments';
COMMENT ON COLUMN assignments.program_id IS 'Reference to program for college assignments';

COMMENT ON VIEW college_assignments_view IS 'Comprehensive view of college assignments with related program, department, and educator information';
COMMENT ON FUNCTION get_college_educator_assignments(uuid) IS 'Returns all assignments created by a specific college educator with summary statistics';
COMMENT ON FUNCTION get_program_section_students(uuid) IS 'Returns all students enrolled in a specific program section';