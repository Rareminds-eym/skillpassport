-- Debug Assessment Progress
-- Run this to check what's being saved in the database

-- 1. Check if the table has the required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'external_assessment_attempts'
ORDER BY ordinal_position;

-- 2. Check recent assessment attempts
SELECT 
  id,
  student_id,
  course_name,
  status,
  current_question_index,
  time_remaining,
  total_questions,
  jsonb_array_length(student_answers) as answers_count,
  (SELECT COUNT(*) FROM jsonb_array_elements(student_answers) WHERE value->>'selected_answer' IS NOT NULL) as non_null_answers,
  last_activity_at,
  started_at,
  completed_at
FROM external_assessment_attempts
ORDER BY last_activity_at DESC NULLS LAST
LIMIT 10;

-- 3. Check a specific attempt's answers in detail
-- Replace 'YOUR_ATTEMPT_ID' with actual attempt ID
SELECT 
  id,
  course_name,
  current_question_index,
  jsonb_pretty(student_answers) as student_answers_detail
FROM external_assessment_attempts
WHERE status = 'in_progress'
ORDER BY last_activity_at DESC
LIMIT 1;

-- 4. Check if answers are being saved correctly
SELECT 
  id,
  course_name,
  current_question_index,
  (student_answers->0->>'selected_answer') as q1_answer,
  (student_answers->1->>'selected_answer') as q2_answer,
  (student_answers->2->>'selected_answer') as q3_answer,
  (student_answers->3->>'selected_answer') as q4_answer,
  (student_answers->4->>'selected_answer') as q5_answer
FROM external_assessment_attempts
WHERE status = 'in_progress'
ORDER BY last_activity_at DESC
LIMIT 1;
