-- ═══════════════════════════════════════════════════════════════════════════════
-- CHECK FOR IN-PROGRESS ASSESSMENT ATTEMPTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Check if you have any in-progress attempts
-- Replace 'YOUR_STUDENT_ID' with your actual student ID (afaa9e81-1552-4c1d-a76d-551134295567)
SELECT 
    id,
    student_id,
    stream_id,
    grade_level,
    status,
    progress,
    created_at,
    updated_at,
    (SELECT COUNT(*) FROM personal_assessment_responses WHERE attempt_id = personal_assessment_attempts.id) as response_count
FROM personal_assessment_attempts
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY created_at DESC
LIMIT 5;

-- Check the most recent attempt details
SELECT 
    pa.*,
    (SELECT json_agg(par.*) 
     FROM personal_assessment_responses par 
     WHERE par.attempt_id = pa.id) as responses
FROM personal_assessment_attempts pa
WHERE pa.student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
  AND pa.status = 'in_progress'
ORDER BY pa.created_at DESC
LIMIT 1;

-- If no in-progress attempt found, check all statuses
SELECT 
    status,
    COUNT(*) as count,
    MAX(created_at) as latest_attempt
FROM personal_assessment_attempts
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
GROUP BY status
ORDER BY latest_attempt DESC;
