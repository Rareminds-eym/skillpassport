-- ═══════════════════════════════════════════════════════════════════════════════
-- CREATE MISSING ASSESSMENT RESULTS FOR COMPLETED ATTEMPTS
-- ═══════════════════════════════════════════════════════════════════════════════
-- This script will create result entries for all completed attempts that don't have results
-- This is a one-time fix for the bug where grades 6-10 results weren't being saved
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: First, let's see what we're dealing with
SELECT 
    pa.id as attempt_id,
    pa.student_id,
    pa.grade_level,
    pa.stream_id,
    pa.created_at,
    s.name,
    s.grade,
    s.email
FROM personal_assessment_attempts pa
LEFT JOIN students s ON pa.student_id = s.id
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
WHERE pa.status = 'completed'
  AND par.id IS NULL
ORDER BY pa.created_at DESC;

-- Step 2: Create missing results for ALL completed attempts without results
-- This uses a safe INSERT that won't fail if results already exist
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
    'Assessment completed - AI analysis pending' as overall_summary,
    pa.completed_at as created_at,
    pa.completed_at as updated_at
FROM personal_assessment_attempts pa
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
WHERE pa.status = 'completed'
  AND par.id IS NULL
ON CONFLICT (attempt_id) DO NOTHING;

-- Step 3: Verify the fix
SELECT 
    pa.id as attempt_id,
    pa.student_id,
    pa.grade_level,
    pa.status as attempt_status,
    par.id as result_id,
    par.status as result_status,
    s.name,
    s.grade,
    CASE 
        WHEN par.id IS NOT NULL THEN '✅ HAS RESULT'
        ELSE '❌ STILL MISSING'
    END as status_check
FROM personal_assessment_attempts pa
LEFT JOIN students s ON pa.student_id = s.id
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
WHERE pa.status = 'completed'
ORDER BY pa.created_at DESC
LIMIT 20;

-- Step 4: Count results by grade level
SELECT 
    grade_level,
    COUNT(*) as total_results
FROM personal_assessment_results
GROUP BY grade_level
ORDER BY grade_level;
