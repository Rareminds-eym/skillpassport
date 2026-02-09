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
