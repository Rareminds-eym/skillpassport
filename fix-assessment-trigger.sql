-- Step 1: Add the missing column to personal_assessment_results
ALTER TABLE public.personal_assessment_results 
ADD COLUMN IF NOT EXISTS skill_gap_courses jsonb NULL;

-- Step 2: Check the full trigger function
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'schedule_assessment_reminder';

-- Step 3: If the trigger still fails, we can recreate it with a safer version
-- First, let's see what the current function does
