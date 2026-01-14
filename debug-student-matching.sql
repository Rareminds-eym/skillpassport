-- =====================================================
-- DEBUG: Student Matching for Program Sections
-- =====================================================
-- Purpose: Find out why students aren't showing up
-- =====================================================

-- Step 1: Check if program_sections exist
SELECT 
    ps.id as section_id,
    ps.program_id,
    ps.semester,
    ps.section,
    ps.academic_year,
    p.name as program_name,
    d.name as department_name
FROM program_sections ps
LEFT JOIN programs p ON ps.program_id = p.id
LEFT JOIN departments d ON ps.department_id = d.id
WHERE ps.status = 'active'
ORDER BY ps.semester, ps.section;

-- Step 2: Check if students exist
SELECT 
    s.id,
    s.user_id,
    s.name,
    s.email,
    s.program_id,
    s.semester,
    s.section,
    s.roll_number,
    s.is_deleted,
    p.name as program_name
FROM students s
LEFT JOIN programs p ON s.program_id = p.id
WHERE s.is_deleted = false
ORDER BY s.program_id, s.semester, s.section;

-- Step 3: Check for matching students for a specific section
-- Replace 'YOUR_SECTION_ID' with actual section ID from Step 1
/*
SELECT 
    ps.id as section_id,
    ps.program_id as section_program_id,
    ps.semester as section_semester,
    ps.section as section_section,
    s.id as student_id,
    s.name as student_name,
    s.program_id as student_program_id,
    s.semester as student_semester,
    s.section as student_section,
    -- Check matching
    (ps.program_id = s.program_id) as program_match,
    (ps.semester = s.semester) as semester_match,
    (ps.section = s.section) as section_match
FROM program_sections ps
CROSS JOIN students s
WHERE ps.id = 'YOUR_SECTION_ID'
    AND s.is_deleted = false
ORDER BY 
    (ps.program_id = s.program_id) DESC,
    (ps.semester = s.semester) DESC,
    (ps.section = s.section) DESC;
*/

-- Step 4: Check data types (might be the issue)
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'students'
    AND column_name IN ('program_id', 'semester', 'section')
ORDER BY ordinal_position;

SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'program_sections'
    AND column_name IN ('program_id', 'semester', 'section')
ORDER BY ordinal_position;

-- Step 5: Test the function directly
-- Replace 'YOUR_SECTION_ID' with actual section ID
/*
SELECT * FROM get_program_section_students('YOUR_SECTION_ID');
*/

-- =====================================================
-- TROUBLESHOOTING CHECKLIST:
-- =====================================================
-- 1. Do program_sections exist? (Step 1)
-- 2. Do students exist? (Step 2)
-- 3. Do program_id, semester, section values match exactly? (Step 3)
-- 4. Are data types compatible? (Step 4)
-- 5. Does the function work? (Step 5)
-- =====================================================
