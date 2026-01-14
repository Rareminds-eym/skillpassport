-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: Enable Assessment Result Saving for Grades 6-10
-- ═══════════════════════════════════════════════════════════════════════════════
-- Problem: Career assessments for grades 6-10 are not being saved to personal_assessment_results
-- Solution: Create a database function to automatically create results when attempts are completed
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Create a function to auto-create results for completed attempts
CREATE OR REPLACE FUNCTION auto_create_assessment_result()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if status changed to 'completed' and no result exists yet
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Check if result already exists
        IF NOT EXISTS (
            SELECT 1 FROM personal_assessment_results 
            WHERE attempt_id = NEW.id
        ) THEN
            -- Create the result
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
                NEW.id,
                NEW.student_id,
                NEW.stream_id,
                COALESCE(NEW.grade_level, 'highschool'),
                'completed',
                '{}'::jsonb,
                'Assessment completed - AI analysis will be generated when viewing report',
                COALESCE(NEW.completed_at, NOW()),
                COALESCE(NEW.completed_at, NOW())
            );
            
            RAISE NOTICE 'Auto-created assessment result for attempt %', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger on personal_assessment_attempts
DROP TRIGGER IF EXISTS trigger_auto_create_assessment_result ON personal_assessment_attempts;

CREATE TRIGGER trigger_auto_create_assessment_result
    AFTER UPDATE ON personal_assessment_attempts
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_assessment_result();

-- Step 3: Backfill - Create results for ALL existing completed attempts without results
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
    pa.id,
    pa.student_id,
    pa.stream_id,
    COALESCE(pa.grade_level, 'highschool'),
    'completed',
    '{}'::jsonb,
    'Assessment completed - AI analysis will be generated when viewing report',
    COALESCE(pa.completed_at, pa.created_at),
    COALESCE(pa.completed_at, pa.created_at)
FROM personal_assessment_attempts pa
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
WHERE pa.status = 'completed'
  AND par.id IS NULL
ON CONFLICT (attempt_id) DO NOTHING;

-- Step 4: Verify the fix for Litkesh
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
        WHEN par.id IS NOT NULL THEN '✅ FIXED - HAS RESULT'
        ELSE '❌ STILL MISSING'
    END as fix_status
FROM personal_assessment_attempts pa
LEFT JOIN students s ON pa.student_id = s.id
LEFT JOIN personal_assessment_results par ON par.attempt_id = pa.id
WHERE pa.student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY pa.created_at DESC;

-- Step 5: Count results by grade level after fix
SELECT 
    grade_level,
    COUNT(*) as total_results
FROM personal_assessment_results
GROUP BY grade_level
ORDER BY grade_level;

-- Step 6: Test the trigger - simulate completing an assessment
-- (This is just a test, won't affect real data)
/*
DO $$
DECLARE
    test_attempt_id uuid;
BEGIN
    -- Create a test attempt
    INSERT INTO personal_assessment_attempts (
        student_id,
        stream_id,
        grade_level,
        status
    ) VALUES (
        'afaa9e81-1552-4c1d-a76d-551134295567',
        'science',
        'highschool',
        'in_progress'
    ) RETURNING id INTO test_attempt_id;
    
    -- Mark it as completed (trigger should auto-create result)
    UPDATE personal_assessment_attempts
    SET status = 'completed', completed_at = NOW()
    WHERE id = test_attempt_id;
    
    -- Check if result was created
    IF EXISTS (SELECT 1 FROM personal_assessment_results WHERE attempt_id = test_attempt_id) THEN
        RAISE NOTICE '✅ Trigger working! Result auto-created for test attempt %', test_attempt_id;
        -- Clean up test data
        DELETE FROM personal_assessment_results WHERE attempt_id = test_attempt_id;
        DELETE FROM personal_assessment_attempts WHERE id = test_attempt_id;
    ELSE
        RAISE NOTICE '❌ Trigger not working for test attempt %', test_attempt_id;
    END IF;
END $$;
*/
