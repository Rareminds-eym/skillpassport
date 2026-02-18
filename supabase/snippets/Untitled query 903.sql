-- Clear ALL adaptive aptitude cached questions to force regeneration with new validation
-- This includes diagnostic_screener, adaptive_core, and stability_confirmation phases
-- Run this after deploying the new validation code

-- Deactivate all cached questions (soft delete - keeps history)
UPDATE adaptive_aptitude_questions_cache 
SET is_active = false 
WHERE is_active = true;

-- If you want to completely remove them instead (hard delete), uncomment below:
-- DELETE FROM adaptive_aptitude_questions_cache;

-- Verify all questions are cleared
SELECT 
    COUNT(*) as total_questions,
    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_questions,
    SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as deactivated_questions
FROM adaptive_aptitude_questions_cache;
