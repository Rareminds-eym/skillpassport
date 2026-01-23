-- Delete assessment result and reset attempt to in-progress
-- This allows you to regenerate the result from the same attempt
-- Replace 'litikesh23@rareminds.in' with your email

-- Get student ID
DO $$
DECLARE
  v_student_id UUID;
  v_attempt_id UUID;
  v_result_id UUID;
BEGIN
  -- Get student ID
  SELECT id INTO v_student_id 
  FROM students 
  WHERE email = 'litikesh23@rareminds.in';
  
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Student not found with email: litikesh23@rareminds.in';
  END IF;
  
  RAISE NOTICE 'Student ID: %', v_student_id;
  
  -- Get latest completed attempt
  SELECT id INTO v_attempt_id
  FROM personal_assessment_attempts
  WHERE student_id = v_student_id
    AND status = 'completed'
  ORDER BY completed_at DESC
  LIMIT 1;
  
  IF v_attempt_id IS NULL THEN
    RAISE EXCEPTION 'No completed attempt found for this student';
  END IF;
  
  RAISE NOTICE 'Attempt ID: %', v_attempt_id;
  
  -- Get result ID
  SELECT id INTO v_result_id
  FROM personal_assessment_results
  WHERE attempt_id = v_attempt_id;
  
  IF v_result_id IS NOT NULL THEN
    -- Delete the result
    DELETE FROM personal_assessment_results WHERE id = v_result_id;
    RAISE NOTICE 'Deleted result: %', v_result_id;
  ELSE
    RAISE NOTICE 'No result found for this attempt';
  END IF;
  
  -- Reset attempt to in-progress
  UPDATE personal_assessment_attempts
  SET 
    status = 'in_progress',
    completed_at = NULL,
    updated_at = NOW()
  WHERE id = v_attempt_id;
  
  RAISE NOTICE 'Reset attempt % to in-progress', v_attempt_id;
  RAISE NOTICE 'Done! Refresh your dashboard to see "Continue Assessment" button';
END $$;

-- Verify the changes
SELECT 
  'ATTEMPT STATUS' as info,
  id,
  status,
  grade_level,
  stream_id,
  created_at,
  completed_at
FROM personal_assessment_attempts
WHERE student_id = (SELECT id FROM students WHERE email = 'litikesh23@rareminds.in')
ORDER BY created_at DESC
LIMIT 1;

SELECT 
  'RESULTS' as info,
  COUNT(*) as result_count
FROM personal_assessment_results
WHERE student_id = (SELECT id FROM students WHERE email = 'litikesh23@rareminds.in');
