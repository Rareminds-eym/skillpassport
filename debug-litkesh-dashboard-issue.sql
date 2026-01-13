-- ═══════════════════════════════════════════════════════════════════════════════
-- DEBUG: Why Dashboard Shows "Start Assessment" for Litkesh
-- ═══════════════════════════════════════════════════════════════════════════════
-- Student: Litkesh Vilvanathan
-- Student ID: afaa9e81-1552-4c1d-a76d-551134295567
-- User ID: a6db1bce-77fd-4d25-bf3f-3e7144e4cf4a
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Verify student record exists and has correct user_id
SELECT 
    id as student_id,
    user_id,
    name,
    email,
    grade
FROM students
WHERE id = 'afaa9e81-1552-4c1d-a76d-551134295567';

-- Step 2: Check if there are ANY assessment results for this student_id
SELECT 
    id as result_id,
    attempt_id,
    student_id,
    grade_level,
    status,
    created_at,
    CASE 
        WHEN gemini_results IS NOT NULL AND gemini_results::text != '{}'::text 
        THEN '✅ HAS AI ANALYSIS'
        ELSE '⚠️ EMPTY AI ANALYSIS'
    END as ai_status
FROM personal_assessment_results
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY created_at DESC;

-- Step 3: Simulate what getLatestResult() does
-- This is EXACTLY what the dashboard hook calls
WITH student_lookup AS (
    SELECT id as student_id
    FROM students
    WHERE user_id = 'a6db1bce-77fd-4d25-bf3f-3e7144e4cf4a'
)
SELECT 
    par.*,
    CASE 
        WHEN par.id IS NOT NULL THEN '✅ DASHBOARD SHOULD SHOW VIEW REPORT'
        ELSE '❌ DASHBOARD WILL SHOW START ASSESSMENT'
    END as expected_dashboard_behavior
FROM student_lookup sl
LEFT JOIN personal_assessment_results par ON par.student_id = sl.student_id
ORDER BY par.created_at DESC
LIMIT 1;

-- Step 4: Check assessment attempts
SELECT 
    id as attempt_id,
    student_id,
    grade_level,
    status,
    stream_id,
    created_at,
    completed_at
FROM personal_assessment_attempts
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY created_at DESC;

-- Step 5: Check if there's a mismatch between attempts and results
SELECT 
    'Completed Attempts' as type,
    COUNT(*) as count
FROM personal_assessment_attempts
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
  AND status = 'completed'
UNION ALL
SELECT 
    'Assessment Results' as type,
    COUNT(*) as count
FROM personal_assessment_results
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567';

-- Step 6: If no results exist, let's check if there are completed attempts we can fix
SELECT 
    pa.id as attempt_id,
    pa.student_id,
    pa.grade_level,
    pa.status,
    pa.stream_id,
    pa.created_at,
    CASE 
        WHEN par.id IS NULL THEN '❌ NEEDS RESULT CREATED'
        ELSE '✅ HAS RESULT'
    END as fix_needed
FROM personal_assessment_attempts pa
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
WHERE pa.student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
  AND pa.status = 'completed'
ORDER BY pa.created_at DESC;
