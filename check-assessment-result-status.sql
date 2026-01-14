-- Check your assessment result status
SELECT 
    id,
    student_id,
    stream_id,
    status,
    created_at,
    updated_at
FROM personal_assessment_results
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY created_at DESC
LIMIT 5;

-- If status is NULL or not 'completed', update it
UPDATE personal_assessment_results
SET status = 'completed'
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
  AND (status IS NULL OR status != 'completed');

-- Verify the update
SELECT 
    id,
    student_id,
    stream_id,
    status,
    created_at
FROM personal_assessment_results
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY created_at DESC
LIMIT 1;
