-- Debug Assessment Result Data Issue
-- Check why fields are empty despite triggers

-- 1. Check the specific result record
SELECT 
    id,
    attempt_id,
    student_id,
    grade_level,
    -- Check if gemini_results exists
    CASE 
        WHEN gemini_results IS NULL THEN '❌ NULL'
        WHEN gemini_results::text = '{}' THEN '❌ Empty Object'
        WHEN gemini_results::text = 'null' THEN '❌ null value'
        ELSE '✅ Has Data (' || length(gemini_results::text) || ' chars)'
    END as gemini_results_status,
    -- Check individual fields
    CASE WHEN riasec_scores IS NULL THEN '❌ NULL' ELSE '✅ Populated' END as riasec_scores_status,
    CASE WHEN aptitude_scores IS NULL THEN '❌ NULL' ELSE '✅ Populated' END as aptitude_scores_status,
    CASE WHEN bigfive_scores IS NULL THEN '❌ NULL' ELSE '✅ Populated' END as bigfive_scores_status,
    CASE WHEN career_fit IS NULL THEN '❌ NULL' ELSE '✅ Populated' END as career_fit_status,
    CASE WHEN roadmap IS NULL THEN '❌ NULL' ELSE '✅ Populated' END as roadmap_status,
    riasec_code,
    status,
    created_at,
    updated_at
FROM personal_assessment_results
WHERE attempt_id = 'a8f895c6-b60b-41c0-92f8-7b6765db34a8'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Check if gemini_results has the expected structure
SELECT 
    id,
    -- Check what keys exist in gemini_results
    jsonb_object_keys(gemini_results) as gemini_keys
FROM personal_assessment_results
WHERE attempt_id = 'a8f895c6-b60b-41c0-92f8-7b6765db34a8'
AND gemini_results IS NOT NULL;

-- 3. Check the trigger function exists and is enabled
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'personal_assessment_results'
AND trigger_name LIKE '%populate%';

-- 4. Manually trigger the population (if gemini_results exists but fields are empty)
-- This will re-run the trigger logic
UPDATE personal_assessment_results
SET updated_at = now()
WHERE attempt_id = 'a8f895c6-b60b-41c0-92f8-7b6765db34a8'
AND gemini_results IS NOT NULL
AND (riasec_scores IS NULL OR career_fit IS NULL);

-- 5. Check the attempt data to see what was submitted
SELECT 
    id,
    student_id,
    grade_level,
    status,
    -- Check if all_responses exists
    CASE 
        WHEN all_responses IS NULL THEN '❌ NULL'
        WHEN all_responses::text = '{}' THEN '❌ Empty'
        ELSE '✅ Has Data (' || (SELECT count(*) FROM jsonb_object_keys(all_responses)) || ' keys)'
    END as all_responses_status,
    -- Check adaptive session
    CASE 
        WHEN adaptive_aptitude_session_id IS NULL THEN '❌ Not taken'
        ELSE '✅ Session: ' || adaptive_aptitude_session_id::text
    END as adaptive_status,
    -- Check student context
    CASE 
        WHEN student_context IS NULL THEN '❌ NULL'
        ELSE '✅ Has Context'
    END as student_context_status,
    created_at,
    completed_at
FROM personal_assessment_attempts
WHERE id = 'a8f895c6-b60b-41c0-92f8-7b6765db34a8';

-- 6. If gemini_results is NULL, check if AI analysis was ever run
-- Look for any errors or missing data
SELECT 
    par.id as result_id,
    par.attempt_id,
    par.status as result_status,
    paa.status as attempt_status,
    paa.completed_at as attempt_completed,
    par.created_at as result_created,
    CASE 
        WHEN par.gemini_results IS NULL THEN 'AI analysis never ran or failed'
        WHEN par.gemini_results::text = '{}' THEN 'AI returned empty object'
        ELSE 'AI analysis completed'
    END as diagnosis
FROM personal_assessment_results par
JOIN personal_assessment_attempts paa ON paa.id = par.attempt_id
WHERE par.attempt_id = 'a8f895c6-b60b-41c0-92f8-7b6765db34a8';

-- 7. Check if there are any recent results with proper data (for comparison)
SELECT 
    id,
    grade_level,
    CASE WHEN gemini_results IS NOT NULL THEN 'Has gemini_results' ELSE 'Missing' END as gemini_status,
    CASE WHEN riasec_scores IS NOT NULL THEN 'Has riasec' ELSE 'Missing' END as riasec_status,
    CASE WHEN career_fit IS NOT NULL THEN 'Has career_fit' ELSE 'Missing' END as career_status,
    created_at
FROM personal_assessment_results
ORDER BY created_at DESC
LIMIT 5;
