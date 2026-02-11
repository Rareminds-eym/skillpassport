-- Check what will be deleted
SELECT 
  student_id,
  question_type,
  stream_id,
  grade_level,
  created_at,
  jsonb_array_length(questions) as question_count
FROM career_assessment_ai_questions 
WHERE question_type = 'aptitude'
ORDER BY created_at DESC;
 
-- Delete all aptitude questions
DELETE FROM career_assessment_ai_questions 
WHERE question_type = 'aptitude';
 
-- Or delete only for specific grade levels
DELETE FROM career_assessment_ai_questions 
WHERE question_type = 'aptitude' 
AND grade_level IN ('higher_secondary', 'after12', 'college', 'after10');