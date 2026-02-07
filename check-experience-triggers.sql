-- Check for triggers on experience table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'experience'
  AND event_object_schema = 'public';

-- Check the trigger functions
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('notify_admin_experience', 'notify_student_on_approval', 'set_experience_approval_authority');
