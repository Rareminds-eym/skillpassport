    -- Quick script to reset your assessment to "Continue" state
    -- Replace 'litikesh23@rareminds.in' with your email

    -- 1. Delete your latest result
    DELETE FROM personal_assessment_results
    WHERE student_id = (SELECT id FROM students WHERE email = 'litikesh23@rareminds.in')
    AND id = (
        SELECT id FROM personal_assessment_results
        WHERE student_id = (SELECT id FROM students WHERE email = 'litikesh23@rareminds.in')
        ORDER BY created_at DESC
        LIMIT 1
    );

    -- 2. Reset your latest attempt to 'in_progress'
    UPDATE personal_assessment_attempts
    SET 
    status = 'in_progress',
    completed_at = NULL,
    updated_at = NOW()
    WHERE student_id = (SELECT id FROM students WHERE email = 'litikesh23@rareminds.in')
    AND id = (
        SELECT id FROM personal_assessment_attempts
        WHERE student_id = (SELECT id FROM students WHERE email = 'litikesh23@rareminds.in')
        ORDER BY created_at DESC
        LIMIT 1
    );

    -- 3. Verify - should show status = 'in_progress'
    SELECT 
    id,
    status,
    grade_level,
    stream_id,
    created_at,
    completed_at
    FROM personal_assessment_attempts
    WHERE student_id = (SELECT id FROM students WHERE email = 'litikesh23@rareminds.in')
    ORDER BY created_at DESC
    LIMIT 1;
