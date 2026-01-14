-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX COLLEGE STUDENT GRADE DISPLAY ISSUE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Problem: College students have old grade values (like "9") in students.grade field
-- Solution: Clear grade field for college students, use year/semester instead
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Update all college students to have NULL grade (they should use year/semester)
UPDATE students
SET grade = NULL
WHERE college_id IS NOT NULL
  AND school_id IS NULL
  AND grade IS NOT NULL
  AND grade NOT LIKE 'Year%'
  AND grade NOT LIKE 'Semester%';

-- Step 2: For college students with year field, set grade to "Year X" format
UPDATE students
SET grade = CONCAT('Year ', year)
WHERE college_id IS NOT NULL
  AND school_id IS NULL
  AND year IS NOT NULL
  AND (grade IS NULL OR grade NOT LIKE 'Year%');

-- Step 3: For college students with semester field but no year, set grade to "Semester X" format
UPDATE students
SET grade = CONCAT('Semester ', semester)
WHERE college_id IS NOT NULL
  AND school_id IS NULL
  AND semester IS NOT NULL
  AND year IS NULL
  AND (grade IS NULL OR grade NOT LIKE 'Semester%');

-- Step 4: Verify the changes
SELECT 
    id,
    name,
    grade,
    year,
    semester,
    course_name,
    branch_field,
    college_id,
    school_id,
    CASE 
        WHEN college_id IS NOT NULL THEN 'College Student'
        WHEN school_id IS NOT NULL THEN 'School Student'
        ELSE 'Unknown'
    END as student_type
FROM students
WHERE college_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- Step 5: Check if there are any remaining issues
SELECT 
    COUNT(*) as count,
    grade,
    CASE 
        WHEN college_id IS NOT NULL THEN 'College'
        WHEN school_id IS NOT NULL THEN 'School'
        ELSE 'Unknown'
    END as type
FROM students
WHERE college_id IS NOT NULL
GROUP BY grade, college_id, school_id
ORDER BY count DESC;
