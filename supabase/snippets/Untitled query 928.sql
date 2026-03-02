 Check for triggers on experience table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'experience'
  AND event_object_schema = 'public';