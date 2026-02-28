-- Check the structure of career_fit data for grade 9 student
-- This will show us what's actually stored in the database

SELECT 
    id,
    student_id,
    grade_level,
    riasec_code,
    
    -- Check if career_fit column exists and has data
    CASE 
        WHEN career_fit IS NULL THEN 'NULL'
        WHEN jsonb_typeof(career_fit) = 'null' THEN 'JSON NULL'
        ELSE 'HAS DATA'
    END as career_fit_status,
    
    -- Check structure of career_fit
    jsonb_typeof(career_fit) as career_fit_type,
    jsonb_pretty(career_fit) as career_fit_data,
    
    -- Check if gemini_results has career data
    CASE 
        WHEN gemini_results IS NULL THEN 'NULL'
        WHEN gemini_results->>'careerFit' IS NOT NULL THEN 'IN careerFit'
        WHEN gemini_results->>'career_fit' IS NOT NULL THEN 'IN career_fit'
        ELSE 'MISSING'
    END as gemini_career_status,
    
    -- Extract career data from gemini_results
    jsonb_pretty(gemini_results->'careerFit') as gemini_careerFit,
    jsonb_pretty(gemini_results->'career_fit') as gemini_career_fit,
    
    created_at
FROM personal_assessment_results
WHERE grade_level = 'highschool'  -- Grade 9-10
ORDER BY created_at DESC
LIMIT 3;
