-- =====================================================
-- FIX: College Assignment Functions - Data Type Casting
-- =====================================================
-- Purpose: Fix data type mismatch errors in RPC functions
-- Issue: varchar(255) columns need explicit casting to text
-- =====================================================

-- Drop and recreate the functions with proper type casting

-- Function: Get assignments for a college educator (WITH TYPE CASTING)
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

-- Function: Get students for program section (WITH TYPE CASTING)
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

-- =====================================================
-- COMPLETE!
-- =====================================================
-- Functions updated with explicit type casting
-- This fixes the "structure of query does not match function result type" error
-- =====================================================
