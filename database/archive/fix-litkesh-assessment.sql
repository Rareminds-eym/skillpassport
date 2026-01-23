-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX LITKESH'S ASSESSMENT - DIRECT FIX
-- ═══════════════════════════════════════════════════════════════════════════════
-- Student: Litkesh Vilvanathan (litkesh@rareminds.in)
-- Student ID: afaa9e81-1552-4c1d-a76d-551134295567
-- User ID: a6db1bce-77fd-4d25-bf3f-3e7144e4cf4a
-- Grade: 9
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Check current status
SELECT 
    pa.id as attempt_id,
    pa.grade_level,
    pa.status as attempt_status,
    pa.created_at,
    par.id as result_id,
    par.status as result_status,
    CASE 
        WHEN par.id IS NOT NULL THEN '✅ HAS RESULT'
        ELSE '❌ NO RESULT'
    END as status
FROM personal_assessment_attempts pa
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
WHERE pa.student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY pa.created_at DESC;

-- Step 2: Create missing results for any completed attempts
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
)
SELECT 
    pa.id as attempt_id,
    pa.student_id,
    pa.stream_id,
    COALESCE(pa.grade_level, 'highschool') as grade_level,
    'completed' as status,
    '{}'::jsonb as gemini_results,
    'Assessment completed - AI analysis will be generated when you view the report' as overall_summary,
    COALESCE(pa.completed_at, pa.created_at) as created_at,
    COALESCE(pa.completed_at, pa.created_at) as updated_at
FROM personal_assessment_attempts pa
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
WHERE pa.student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
  AND pa.status = 'completed'
  AND par.id IS NULL
ON CONFLICT (attempt_id) DO NOTHING;

-- Step 3: Verify the fix
SELECT 
    pa.id as attempt_id,
    pa.grade_level,
    pa.status as attempt_status,
    pa.stream_id,
    pa.created_at,
    par.id as result_id,
    par.status as result_status,
    par.created_at as result_created,
    CASE 
        WHEN par.id IS NOT NULL THEN '✅ FIXED - HAS RESULT'
        ELSE '❌ STILL MISSING'
    END as status
FROM personal_assessment_attempts pa
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
WHERE pa.student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY pa.created_at DESC;

-- Step 4: Show what the dashboard will see
-- This simulates the useAssessmentRecommendations hook query
SELECT 
    par.id,
    par.status,
    par.grade_level,
    par.created_at,
    CASE 
        WHEN par.gemini_results IS NOT NULL AND par.gemini_results::text != '{}'::text 
        THEN '✅ Dashboard will show VIEW REPORT'
        ELSE '⚠️ Dashboard will show VIEW REPORT (AI will generate on click)'
    END as dashboard_status
FROM personal_assessment_results par
WHERE par.student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY par.created_at DESC
LIMIT 1;
