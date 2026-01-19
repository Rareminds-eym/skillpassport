-- ═══════════════════════════════════════════════════════════════════════════════
-- CREATE A TEST CAREER ASSESSMENT RESULT FOR LITKESH
-- ═══════════════════════════════════════════════════════════════════════════════
-- This will create a basic assessment result so you can see the "View Report" button
-- The AI analysis will be generated when you click "View Report"
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Create an assessment attempt first
INSERT INTO personal_assessment_attempts (
    id,
    student_id,
    stream_id,
    grade_level,
    status,
    created_at,
    completed_at
) VALUES (
    gen_random_uuid(),
    'afaa9e81-1552-4c1d-a76d-551134295567',
    'science',  -- Change to 'commerce' or 'arts' if needed
    'highschool',  -- For 9th grade
    'completed',
    NOW(),
    NOW()
)
RETURNING id as attempt_id;

-- Step 2: Copy the attempt_id from above and use it here
-- Replace 'PASTE_ATTEMPT_ID_HERE' with the UUID from Step 1
/*
INSERT INTO personal_assessment_results (
    attempt_id,
    student_id,
    stream_id,
    grade_level,
    status,
    gemini_results,
    overall_summary,
    created_at,
    updated_at
) VALUES (
    'PASTE_ATTEMPT_ID_HERE',  -- Replace with attempt_id from Step 1
    'afaa9e81-1552-4c1d-a76d-551134295567',
    'science',  -- Same as above
    'highschool',
    'completed',
    '{}'::jsonb,
    'Test assessment - Please retake for accurate results',
    NOW(),
    NOW()
);
*/

-- Step 3: Verify
SELECT 
    pa.id as attempt_id,
    pa.status as attempt_status,
    par.id as result_id,
    par.status as result_status,
    CASE 
        WHEN par.id IS NOT NULL THEN '✅ Dashboard will show VIEW REPORT'
        ELSE '❌ Still missing result'
    END as dashboard_status
FROM personal_assessment_attempts pa
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
WHERE pa.student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY pa.created_at DESC
LIMIT 1;
