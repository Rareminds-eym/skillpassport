-- Check what assessments are already generated in the database
SELECT 
  id,
  certificate_name,
  assessment_level,
  total_questions,
  generated_at,
  generated_by,
  jsonb_array_length(questions) as actual_question_count
FROM generated_external_assessment
ORDER BY generated_at DESC;

-- If you want to see the questions for a specific course:
-- SELECT 
--   certificate_name,
--   questions
-- FROM generated_external_assessment
-- WHERE certificate_name = 'Delivering Constructive Criticism';
