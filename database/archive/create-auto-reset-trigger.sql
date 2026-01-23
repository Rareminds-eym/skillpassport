-- Create a trigger that automatically resets attempt to 'in_progress' when result is deleted
-- This makes it easy to regenerate results for testing

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION reset_attempt_on_result_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- When a result is deleted, reset the associated attempt to 'in_progress'
  UPDATE personal_assessment_attempts
  SET 
    status = 'in_progress',
    completed_at = NULL,
    updated_at = NOW()
  WHERE id = OLD.attempt_id
    AND status = 'completed'; -- Only reset if it was completed
  
  -- Log the action
  RAISE NOTICE 'Result deleted for attempt %. Attempt reset to in_progress.', OLD.attempt_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create the trigger
DROP TRIGGER IF EXISTS auto_reset_attempt_on_result_delete ON personal_assessment_results;

CREATE TRIGGER auto_reset_attempt_on_result_delete
  AFTER DELETE ON personal_assessment_results
  FOR EACH ROW
  EXECUTE FUNCTION reset_attempt_on_result_delete();

-- Step 3: Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'auto_reset_attempt_on_result_delete';

-- Test it:
-- 1. Complete an assessment (creates result with status='completed')
-- 2. Delete the result: DELETE FROM personal_assessment_results WHERE id = 'your-result-id';
-- 3. Check the attempt: SELECT status FROM personal_assessment_attempts WHERE id = 'your-attempt-id';
-- 4. Status should automatically be 'in_progress'!
