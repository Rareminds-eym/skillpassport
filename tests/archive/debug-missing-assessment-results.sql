-- ═══════════════════════════════════════════════════════════════════════════════
-- DEBUG: Why are grades 6-10 assessment results not being saved?
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Check ALL attempts regardless of grade
SELECT 
    pa.id as attempt_id,
    pa.student_id,
    pa.grade_level,
    pa.status,
    pa.stream_id,
    pa.created_at,
    pa.completed_at,
    s.name,
    s.grade as student_grade,
    s.email,
    CASE 
        WHEN par.id IS NOT NULL THEN '✅ HAS RESULT'
        ELSE '❌ NO RESULT'
    END as result_status
FROM personal_assessment_attempts pa
LEFT JOIN students s ON pa.student_id = s.id
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
ORDER BY pa.created_at DESC
LIMIT 50;

-- Step 2: Count attempts by grade_level and result status
SELECT 
    pa.grade_level,
    pa.status as attempt_status,
    COUNT(*) as total_attempts,
    COUNT(par.id) as attempts_with_results,
    COUNT(*) - COUNT(par.id) as attempts_without_results
FROM personal_assessment_attempts pa
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
GROUP BY pa.grade_level, pa.status
ORDER BY pa.grade_level, pa.status;

-- Step 3: Find completed attempts WITHOUT results (THE PROBLEM)
SELECT 
    pa.id as attempt_id,
    pa.student_id,
    pa.grade_level,
    pa.stream_id,
    pa.created_at,
    pa.completed_at,
    s.name,
    s.grade,
    s.email
FROM personal_assessment_attempts pa
LEFT JOIN students s ON pa.student_id = s.id
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
WHERE pa.status = 'completed'
  AND par.id IS NULL
ORDER BY pa.created_at DESC;

-- Step 4: Check if there's an RLS policy blocking inserts for certain grades
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'personal_assessment_results'
ORDER BY policyname;

-- Step 5: Try to manually insert a test result for a 9th grader
-- (This will help us see if it's an RLS issue or application logic issue)
-- UNCOMMENT TO TEST:
/*
DO $$
DECLARE
    v_attempt_id uuid;
    v_student_id uuid;
    v_stream_id varchar(50);
BEGIN
    -- Get a completed attempt without a result
    SELECT 
        pa.id,
        pa.student_id,
        pa.stream_id
    INTO v_attempt_id, v_student_id, v_stream_id
    FROM personal_assessment_attempts pa
    LEFT JOIN students s ON pa.student_id = s.id
    LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
    WHERE pa.status = 'completed'
      AND par.id IS NULL
      AND s.grade IN ('9', '9th', 'Grade 9')
    ORDER BY pa.created_at DESC
    LIMIT 1;

    IF v_attempt_id IS NOT NULL THEN
        -- Try to insert
        INSERT INTO personal_assessment_results (
            attempt_id,
            student_id,
            stream_id,
            grade_level,
            status,
            gemini_results
        ) VALUES (
            v_attempt_id,
            v_student_id,
            v_stream_id,
            'highschool',
            'completed',
            '{}'::jsonb
        );
        
        RAISE NOTICE 'Successfully inserted result for attempt %', v_attempt_id;
    ELSE
        RAISE NOTICE 'No completed attempts without results found for 9th graders';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting: % %', SQLERRM, SQLSTATE;
END $$;
*/
