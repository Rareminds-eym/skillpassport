-- Deactivate questions with duplicate options
-- This prevents them from being used in future tests

UPDATE adaptive_aptitude_questions_cache
SET is_active = false
WHERE is_active = true
AND (
    options->>'A' = options->>'B' OR
    options->>'A' = options->>'C' OR
    options->>'A' = options->>'D' OR
    options->>'B' = options->>'C' OR
    options->>'B' = options->>'D' OR
    options->>'C' = options->>'D'
);

-- Show how many were deactivated
SELECT COUNT(*) as deactivated_count
FROM adaptive_aptitude_questions_cache
WHERE is_active = false;

-- Show remaining active questions
SELECT COUNT(*) as active_count
FROM adaptive_aptitude_questions_cache
WHERE is_active = true;
