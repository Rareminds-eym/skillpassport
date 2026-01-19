-- ═══════════════════════════════════════════════════════════════════════════════
-- CHECK ALL TYPES OF ASSESSMENTS FOR LITKESH
-- ═══════════════════════════════════════════════════════════════════════════════
-- Student ID: afaa9e81-1552-4c1d-a76d-551134295567
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Personal Career Assessment (the one that shows on dashboard)
SELECT 
    'Personal Career Assessment' as assessment_type,
    COUNT(*) as count
FROM personal_assessment_results
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567';

-- 2. External Course Assessments (for learning courses)
SELECT 
    'External Course Assessment' as assessment_type,
    COUNT(*) as count
FROM external_assessment_attempts
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567';

-- 3. Show external course assessment details if any
SELECT 
    id,
    student_id,
    course_name,
    status,
    score,
    created_at,
    completed_at
FROM external_assessment_attempts
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY created_at DESC;

-- 4. Check if there's any data in localStorage or other tables
-- Check generated assessments
SELECT 
    'Generated Assessments' as type,
    COUNT(*) as count
FROM generated_assessments
WHERE certificate_name LIKE '%Career%' OR certificate_name LIKE '%Personal%';

-- 5. Summary
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM personal_assessment_results 
            WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
        ) THEN '✅ You have completed the CAREER ASSESSMENT'
        ELSE '❌ You have NOT completed the CAREER ASSESSMENT yet'
    END as career_assessment_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM external_assessment_attempts 
            WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
        ) THEN '✅ You have completed COURSE ASSESSMENTS'
        ELSE '❌ You have NOT completed any COURSE ASSESSMENTS'
    END as course_assessment_status;
