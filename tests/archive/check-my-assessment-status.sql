-- ═══════════════════════════════════════════════════════════════════════════════
-- CHECK YOUR SPECIFIC ASSESSMENT STATUS
-- ═══════════════════════════════════════════════════════════════════════════════
-- Replace litikesh23@rareminds.in with your actual email address
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Get your student record
SELECT 
    id as student_id,
    user_id,
    name,
    email,
    grade,
    college_id,
    school_id
FROM students
WHERE email = 'litikesh23@rareminds.in';  -- REPLACE THIS

-- Step 2: Get your assessment attempts
SELECT 
    pa.id as attempt_id,
    pa.student_id,
    pa.grade_level,
    pa.status,
    pa.stream_id,
    pa.created_at,
    pa.completed_at
FROM personal_assessment_attempts pa
JOIN students s ON pa.student_id = s.id
WHERE s.email = 'litikesh23@rareminds.in'  -- REPLACE THIS
ORDER BY pa.created_at DESC;

-- Step 3: Get your assessment results
SELECT 
    par.id as result_id,
    par.attempt_id,
    par.student_id,
    par.grade_level,
    par.status,
    par.created_at,
    CASE 
        WHEN par.gemini_results IS NOT NULL AND par.gemini_results::text != '{}'::text 
        THEN '✅ HAS AI ANALYSIS'
        ELSE '⚠️ NO AI ANALYSIS'
    END as ai_status
FROM personal_assessment_results par
JOIN students s ON par.student_id = s.id
WHERE s.email = 'litikesh23@rareminds.in'  -- REPLACE THIS
ORDER BY par.created_at DESC;

-- Step 4: Check the complete picture - attempts WITH their results
SELECT 
    pa.id as attempt_id,
    pa.grade_level as attempt_grade,
    pa.status as attempt_status,
    pa.created_at as attempt_date,
    par.id as result_id,
    par.grade_level as result_grade,
    par.status as result_status,
    CASE 
        WHEN par.id IS NOT NULL THEN '✅ HAS RESULT'
        ELSE '❌ NO RESULT'
    END as has_result,
    CASE 
        WHEN par.gemini_results IS NOT NULL AND par.gemini_results::text != '{}'::text 
        THEN '✅ HAS AI'
        ELSE '⚠️ NO AI'
    END as has_ai
FROM personal_assessment_attempts pa
JOIN students s ON pa.student_id = s.id
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
WHERE s.email = 'litikesh23@rareminds.in'  -- REPLACE THIS
ORDER BY pa.created_at DESC;
