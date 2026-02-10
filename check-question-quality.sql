-- Check for questions with duplicate options
SELECT 
    COUNT(*) as duplicate_options_count
FROM adaptive_aptitude_questions_cache
WHERE is_active = true
AND (
    options->>'A' = options->>'B' OR
    options->>'A' = options->>'C' OR
    options->>'A' = options->>'D' OR
    options->>'B' = options->>'C' OR
    options->>'B' = options->>'D' OR
    options->>'C' = options->>'D'
);
