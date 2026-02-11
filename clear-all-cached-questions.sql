-- Clear ALL cached questions to force regeneration with new validation
-- This will make the system generate fresh questions with proper answer validation

UPDATE adaptive_aptitude_questions_cache 
SET is_active = false 
WHERE is_active = true;

-- Verify all questions are deactivated
SELECT 
    COUNT(*) as total_questions,
    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_questions,
    SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as deactivated_questions
FROM adaptive_aptitude_questions_cache;
