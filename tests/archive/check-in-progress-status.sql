-- Check for in-progress assessment attempts
-- This query will show if there's an in-progress attempt and why it might not be detected

SELECT 
  pa.id as attempt_id,
  pa.student_id,
  pa.status,
  pa.grade_level,
  pa.stream_id,
  pa.created_at,
  pa.updated_at,
  pa.current_section_index,
  pa.current_question_index,
  s.id as student_table_id,
  s.user_id,
  s.email,
  -- Check if there's a completed result
  (SELECT COUNT(*) FROM personal_assessment_results WHERE student_id = pa.student_id AND status = 'completed') as completed_results_count
FROM personal_assessment_attempts pa
LEFT JOIN students s ON s.id = pa.student_id
WHERE pa.status = 'in_progress'
ORDER BY pa.created_at DESC
LIMIT 5;
