-- Verify Assessment 6-Month Restriction Setup
-- This script checks if the necessary table structure exists for the restriction feature

-- 1. Check if personal_assessment_results table exists with required columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'personal_assessment_results'
    AND column_name IN ('id', 'student_id', 'created_at', 'status')
ORDER BY ordinal_position;

-- 2. Check for any completed assessments
SELECT 
    COUNT(*) as total_completed_assessments,
    COUNT(DISTINCT student_id) as unique_students
FROM personal_assessment_results
WHERE status = 'completed';

-- 3. Sample query to check student eligibility (replace 'STUDENT_USER_ID' with actual ID)
-- SELECT 
--     student_id,
--     created_at as last_assessment_date,
--     created_at + INTERVAL '6 months' as next_available_date,
--     NOW() >= (created_at + INTERVAL '6 months') as can_take_now,
--     CASE 
--         WHEN NOW() >= (created_at + INTERVAL '6 months') THEN 'Eligible'
--         ELSE CONCAT('Wait until ', TO_CHAR(created_at + INTERVAL '6 months', 'Mon DD, YYYY'))
--     END as eligibility_status
-- FROM personal_assessment_results
-- WHERE student_id = 'STUDENT_USER_ID'
--     AND status = 'completed'
-- ORDER BY created_at DESC
-- LIMIT 1;

-- 4. Find students who can retake assessment (completed > 6 months ago)
SELECT 
    student_id,
    created_at as last_assessment_date,
    created_at + INTERVAL '6 months' as became_eligible_on,
    AGE(NOW(), created_at) as time_since_last_assessment
FROM personal_assessment_results
WHERE status = 'completed'
    AND created_at <= NOW() - INTERVAL '6 months'
ORDER BY created_at DESC;

-- 5. Find students who must wait (completed < 6 months ago)
SELECT 
    student_id,
    created_at as last_assessment_date,
    created_at + INTERVAL '6 months' as next_available_date,
    AGE(created_at + INTERVAL '6 months', NOW()) as time_remaining
FROM personal_assessment_results
WHERE status = 'completed'
    AND created_at > NOW() - INTERVAL '6 months'
ORDER BY created_at DESC;

-- 6. Check index on student_id for performance
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'personal_assessment_results'
    AND indexdef LIKE '%student_id%';

-- 7. Verify foreign key constraint exists
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'personal_assessment_results'
    AND kcu.column_name = 'student_id';
