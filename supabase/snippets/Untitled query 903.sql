SELECT 
  student_id,
  jsonb_pretty(gemini_results->'aptitude'->'scores') as aptitude_scores,
  (gemini_results->'aptitude'->>'overallScore')::int as overall_score
FROM personal_assessment_results
WHERE student_id = 'a65d515f-66b5-4765-a7d4-9bb446b69194'
ORDER BY created_at DESC
LIMIT 1;
