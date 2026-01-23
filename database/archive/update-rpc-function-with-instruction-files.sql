-- Update the get_college_educator_assignments RPC function to include instruction_files

-- First, drop the existing function if it exists
DROP FUNCTION IF EXISTS get_college_educator_assignments(uuid);

-- Create the updated function with instruction_files and proper type casting
CREATE OR REPLACE FUNCTION get_college_educator_assignments(educator_user_id uuid)
RETURNS TABLE (
    assignment_id uuid,
    title text,
    description text,
    instructions text,
    course_name text,
    course_code text,
    college_educator_id uuid,
    educator_name text,
    college_id uuid,
    program_section_id uuid,
    department_id uuid,
    program_id uuid,
    total_points numeric,
    assignment_type text,
    skill_outcomes text[],
    due_date timestamptz,
    available_from timestamptz,
    allow_late_submission boolean,
    document_pdf text,
    instruction_files jsonb,
    created_date timestamptz,
    updated_date timestamptz,
    status text,
    program_name text,
    department_name text,
    semester integer,
    section text,
    academic_year text,
    student_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.assignment_id,
        ca.title,
        ca.description,
        ca.instructions,
        ca.course_name,
        ca.course_code,
        ca.college_educator_id,
        ca.educator_name,
        ca.college_id,
        ca.program_section_id,
        ca.department_id,
        ca.program_id,
        ca.total_points,
        ca.assignment_type,
        ca.skill_outcomes,
        ca.due_date,
        ca.available_from,
        ca.allow_late_submission,
        ca.document_pdf,
        COALESCE(ca.instruction_files, '[]'::jsonb) as instruction_files,
        ca.created_date,
        ca.updated_date,
        CASE 
            WHEN ca.due_date < NOW() THEN 'completed'::text
            ELSE 'active'::text
        END as status,
        COALESCE(p.name, '')::text as program_name,
        COALESCE(d.name, '')::text as department_name,
        ps.semester,
        COALESCE(ps.section, '')::text as section,
        COALESCE(ps.academic_year, '')::text as academic_year,
        0 as student_count
    FROM 
        college_assignments ca
    LEFT JOIN programs p ON ca.program_id = p.id
    LEFT JOIN departments d ON ca.department_id = d.id
    LEFT JOIN program_sections ps ON ca.program_section_id = ps.id
    WHERE 
        ca.college_educator_id = educator_user_id
        AND ca.is_deleted = false
    ORDER BY 
        ca.created_date DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_college_educator_assignments(uuid) TO authenticated;

-- Verify the function was created
SELECT 
    routine_name,
    routine_type,
    data_type
FROM 
    information_schema.routines
WHERE 
    routine_name = 'get_college_educator_assignments';

