-- =====================================================
-- FIX: Add program_section_id to get_college_educator_assignments function
-- =====================================================
-- Purpose: Update function to return program_section_id field
-- =====================================================

-- Step 1: Drop the existing function
DROP FUNCTION IF EXISTS get_college_educator_assignments(uuid);

-- Step 2: Recreate with program_section_id included
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
    student_count bigint,
    program_section_id uuid  -- NEW FIELD ADDED
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
        COUNT(csa.student_assignment_id) as student_count,
        ca.program_section_id  -- NEW FIELD ADDED
    FROM college_assignments ca
    LEFT JOIN program_sections ps ON ca.program_section_id = ps.id
    LEFT JOIN programs p ON ca.program_id = p.id
    LEFT JOIN departments d ON ca.department_id = d.id
    LEFT JOIN college_student_assignments csa ON ca.assignment_id = csa.assignment_id AND csa.is_deleted = false
    WHERE ca.college_educator_id = educator_user_id
        AND ca.is_deleted = false
    GROUP BY ca.assignment_id, p.name, d.name, ps.semester, ps.section, ps.academic_year, ca.program_section_id
    ORDER BY ca.created_date DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_college_educator_assignments(uuid) IS 'Returns all assignments created by a specific college educator with summary statistics and program_section_id';

-- =====================================================
-- COMPLETE!
-- =====================================================
-- Function updated to include program_section_id
-- This allows the UI to fetch students when clicking "Assign to Section"
-- =====================================================
