-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPLETE FIX FOR 9TH GRADE ASSESSMENT ISSUE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Problem: 9th grade student completed assessment but it's not showing as completed
-- Root Cause: Assessment data not saved to personal_assessment_results table
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Find your student record
SELECT 
    id as student_id,
    user_id,
    name,
    email,
    grade
FROM students
WHERE grade IN ('9', '9th', 'Grade 9', 'IX')
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Check if you have any assessment attempts
SELECT 
    pa.id as attempt_id,
    pa.student_id,
    pa.grade_level,
    pa.status,
    pa.stream_id,
    pa.created_at,
    s.name as student_name,
    s.grade,
    s.email,
    (SELECT COUNT(*) FROM personal_assessment_results WHERE attempt_id = pa.id) as has_result
FROM personal_assessment_attempts pa
LEFT JOIN students s ON pa.student_id = s.id
WHERE s.grade IN ('9', '9th', 'Grade 9', 'IX')
ORDER BY pa.created_at DESC
LIMIT 10;

-- Step 3: Check for completed attempts WITHOUT results (THIS IS THE PROBLEM)
SELECT 
    pa.id as attempt_id,
    pa.student_id,
    pa.grade_level,
    pa.status,
    pa.stream_id,
    pa.created_at,
    s.name,
    s.email
FROM personal_assessment_attempts pa
LEFT JOIN students s ON pa.student_id = s.id
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
WHERE s.grade IN ('9', '9th', 'Grade 9', 'IX')
  AND pa.status = 'completed'
  AND par.id IS NULL  -- No result exists!
ORDER BY pa.created_at DESC;

-- Step 4: FIX - Create missing assessment results for completed attempts
-- This will create a basic result entry so the dashboard shows "View Report"
-- Replace 'YOUR_EMAIL_HERE' with your actual email

DO $$
DECLARE
    v_student_id uuid;
    v_attempt_id uuid;
    v_stream_id varchar(50);
    v_grade_level text;
BEGIN
    -- Get the student and their latest completed attempt without a result
    SELECT 
        pa.student_id,
        pa.id,
        pa.stream_id,
        COALESCE(pa.grade_level, 'highschool')
    INTO v_student_id, v_attempt_id, v_stream_id, v_grade_level
    FROM personal_assessment_attempts pa
    LEFT JOIN students s ON pa.student_id = s.id
    LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
    WHERE s.email = 'litikesh23@rareminds.in'  -- REPLACE THIS
      AND pa.status = 'completed'
      AND par.id IS NULL
    ORDER BY pa.created_at DESC
    LIMIT 1;

    -- If found, create the missing result
    IF v_attempt_id IS NOT NULL THEN
        INSERT INTO personal_assessment_results (
            attempt_id,
            student_id,
            stream_id,
            grade_level,
            status,
            gemini_results,
            overall_summary
        ) VALUES (
            v_attempt_id,
            v_student_id,
            v_stream_id,
            v_grade_level,
            'completed',
            '{}'::jsonb,  -- Empty for now, will be populated when you view the report
            'Assessment completed - results pending analysis'
        );
        
        RAISE NOTICE 'Created missing assessment result for attempt %', v_attempt_id;
    ELSE
        RAISE NOTICE 'No completed attempts without results found';
    END IF;
END $$;

-- Step 5: Verify the fix
SELECT 
    pa.id as attempt_id,
    pa.student_id,
    pa.grade_level,
    pa.status,
    par.id as result_id,
    par.status as result_status,
    par.created_at as result_created_at,
    s.name,
    s.email,
    CASE 
        WHEN par.id IS NOT NULL THEN '✅ HAS RESULT'
        ELSE '❌ MISSING RESULT'
    END as status_check
FROM personal_assessment_attempts pa
LEFT JOIN students s ON pa.student_id = s.id
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
WHERE s.email = 'YOUR_EMAIL_HERE'  -- REPLACE THIS
ORDER BY pa.created_at DESC
LIMIT 5;

-- Step 6: Alternative - If you want to manually insert for a specific attempt
-- Uncomment and replace the values:
/*
INSERT INTO personal_assessment_results (
    attempt_id,
    student_id,
    stream_id,
    grade_level,
    status,
    gemini_results
) VALUES (
    'YOUR_ATTEMPT_ID_HERE',  -- From Step 2
    'YOUR_STUDENT_ID_HERE',  -- From Step 1
    'science',  -- or 'commerce', 'arts', etc.
    'highschool',  -- For 9th grade
    'completed',
    '{}'::jsonb
);
*/
