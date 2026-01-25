-- Verify Assessment Data is Complete
-- Run this to check if all questions and answers are being saved correctly

-- 1. Check the most recent in-progress assessment
SELECT 
  id,
  student_id,
  course_name,
  status,
  current_question_index,
  total_questions,
  jsonb_array_length(questions) as questions_stored,
  jsonb_array_length(student_answers) as answers_array_length,
  time_remaining,
  last_activity_at
FROM external_assessment_attempts
WHERE status = 'in_progress'
ORDER BY last_activity_at DESC
LIMIT 1;

-- 2. Check if all questions are stored (should match total_questions)
SELECT 
  id,
  course_name,
  total_questions,
  jsonb_array_length(questions) as questions_count,
  CASE 
    WHEN total_questions = jsonb_array_length(questions) THEN '✅ All questions stored'
    ELSE '❌ Missing questions!'
  END as status
FROM external_assessment_attempts
WHERE status = 'in_progress'
ORDER BY last_activity_at DESC
LIMIT 1;

-- 3. Check answers status (which are answered, which are null)
WITH latest_attempt AS (
  SELECT id, student_answers
  FROM external_assessment_attempts
  WHERE status = 'in_progress'
  ORDER BY last_activity_at DESC
  LIMIT 1
)
SELECT 
  (row_number() OVER ()) - 1 as question_index,
  value->>'question_id' as question_id,
  value->>'selected_answer' as selected_answer,
  CASE 
    WHEN value->>'selected_answer' IS NULL THEN '⚪ Not answered'
    ELSE '✅ Answered'
  END as status
FROM latest_attempt, jsonb_array_elements(student_answers) as value;

-- 4. Summary: How many answered vs unanswered
SELECT 
  id,
  course_name,
  current_question_index,
  total_questions,
  (SELECT COUNT(*) 
   FROM jsonb_array_elements(student_answers) 
   WHERE value->>'selected_answer' IS NOT NULL) as answered_count,
  (SELECT COUNT(*) 
   FROM jsonb_array_elements(student_answers) 
   WHERE value->>'selected_answer' IS NULL) as unanswered_count,
  CONCAT(
    'Currently on Q', current_question_index + 1, 
    ' of ', total_questions,
    ' (', 
    (SELECT COUNT(*) FROM jsonb_array_elements(student_answers) WHERE value->>'selected_answer' IS NOT NULL),
    ' answered, ',
    (SELECT COUNT(*) FROM jsonb_array_elements(student_answers) WHERE value->>'selected_answer' IS NULL),
    ' remaining)'
  ) as progress_summary
FROM external_assessment_attempts
WHERE status = 'in_progress'
ORDER BY last_activity_at DESC
LIMIT 1;

-- 5. Check specific questions (first 5)
SELECT 
  id,
  course_name,
  (questions->0->>'question') as q1_text,
  (questions->1->>'question') as q2_text,
  (questions->2->>'question') as q3_text,
  (questions->3->>'question') as q4_text,
  (questions->4->>'question') as q5_text,
  (student_answers->0->>'selected_answer') as q1_answer,
  (student_answers->1->>'selected_answer') as q2_answer,
  (student_answers->2->>'selected_answer') as q3_answer,
  (student_answers->3->>'selected_answer') as q4_answer,
  (student_answers->4->>'selected_answer') as q5_answer
FROM external_assessment_attempts
WHERE status = 'in_progress'
ORDER BY last_activity_at DESC
LIMIT 1;
