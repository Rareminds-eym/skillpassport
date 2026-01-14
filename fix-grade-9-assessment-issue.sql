-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX GRADE 9 ASSESSMENT ISSUE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Problem: 9th grade students complete assessment but data is not saved
-- Reason: grade_level constraint may not include proper value for 9th grade
-- Solution: Ensure 'highschool' grade_level is properly handled
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Check current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'personal_assessment_results'::regclass
  AND conname LIKE '%grade_level%';

-- Step 2: Drop the old constraint if it exists
ALTER TABLE personal_assessment_results 
DROP CONSTRAINT IF EXISTS personal_assessment_results_grade_level_check;

-- Step 3: Add updated constraint that includes all grade levels
ALTER TABLE personal_assessment_results
ADD CONSTRAINT personal_assessment_results_grade_level_check 
CHECK (grade_level = ANY (ARRAY[
    'middle'::text,           -- Grades 6-8
    'highschool'::text,       -- Grades 9-10
    'higher_secondary'::text, -- Grades 11-12
    'after10'::text,          -- After 10th (Grade 11)
    'after12'::text,          -- After 12th / College
    'college'::text           -- College/University
]));

-- Step 4: Check if there are any failed assessment attempts for 9th grade students
SELECT 
    pa.id as attempt_id,
    pa.student_id,
    pa.grade_level,
    pa.status,
    pa.created_at,
    s.name as student_name,
    s.grade as student_grade,
    (SELECT COUNT(*) FROM personal_assessment_results WHERE attempt_id = pa.id) as has_result
FROM personal_assessment_attempts pa
LEFT JOIN students s ON pa.student_id = s.id
WHERE s.grade IN ('9', '9th', 'Grade 9', 'IX')
   OR pa.grade_level = 'highschool'
ORDER BY pa.created_at DESC
LIMIT 10;

-- Step 5: Check for completed attempts without results
SELECT 
    pa.id as attempt_id,
    pa.student_id,
    pa.grade_level,
    pa.status,
    pa.stream_id,
    pa.created_at,
    s.name as student_name,
    s.grade,
    CASE 
        WHEN par.id IS NULL THEN 'NO RESULT SAVED'
        ELSE 'HAS RESULT'
    END as result_status
FROM personal_assessment_attempts pa
LEFT JOIN students s ON pa.student_id = s.id
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
WHERE pa.status = 'completed'
  AND par.id IS NULL
ORDER BY pa.created_at DESC
LIMIT 10;

-- Step 6: If you find your specific attempt, you can manually create the result
-- (Replace the values with your actual data)
/*
INSERT INTO personal_assessment_results (
    attempt_id,
    student_id,
    stream_id,
    grade_level,
    status,
    gemini_results
)
SELECT 
    id as attempt_id,
    student_id,
    stream_id,
    COALESCE(grade_level, 'highschool') as grade_level,
    'completed' as status,
    '{}'::jsonb as gemini_results
FROM personal_assessment_attempts
WHERE id = 'YOUR_ATTEMPT_ID_HERE'
  AND NOT EXISTS (
    SELECT 1 FROM personal_assessment_results 
    WHERE attempt_id = personal_assessment_attempts.id
  );
*/
