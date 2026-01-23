-- Reset a completed attempt back to in-progress
-- Use this when you delete a result and want to regenerate it

-- Step 1: Find your latest completed attempt
SELECT 
  id,
  student_id,
  status,
  grade_level,
  stream_id,
  created_at,
  completed_at
FROM personal_assessment_attempts
WHERE student_id = (SELECT id FROM students WHERE email = 'litikesh23@rareminds.in')
  AND status = 'completed'
ORDER BY completed_at DESC
LIMIT 1;

-- Step 2: Reset the attempt status to 'in_progress'
-- Replace 'YOUR-ATTEMPT-ID' with the id from Step 1
UPDATE personal_assessment_attempts
SET 
  status = 'in_progress',
  completed_at = NULL,
  updated_at = NOW()
WHERE id = 'YOUR-ATTEMPT-ID';

-- Step 3: Verify the change
SELECT 
  id,
  student_id,
  status,
  grade_level,
  stream_id,
  created_at,
  completed_at
FROM personal_assessment_attempts
WHERE id = 'YOUR-ATTEMPT-ID';
