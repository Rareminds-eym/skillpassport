-- ===================================================================
-- TEST OPPORTUNITY NOTIFICATIONS
-- Run this to verify the notification system works correctly
-- ===================================================================

-- Step 1: Check if triggers are installed
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'opportunities'
AND trigger_schema = 'public'
ORDER BY trigger_name;

-- Step 2: Check if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%opportunity%'
ORDER BY routine_name;

-- Step 3: Count current students (who will receive notifications)
SELECT 
  COUNT(*) as total_students,
  'These students will receive notifications when opportunities are posted' as note
FROM public.students;

-- Step 4: Count current opportunities
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(*) FILTER (WHERE is_active = true) as active_opportunities
FROM public.opportunities;

-- Step 5: Sample recent updates (to verify they're working)
SELECT 
  s.email,
  ru.updates->>'updates' as recent_updates_json,
  jsonb_array_length((ru.updates->'updates')::jsonb) as update_count
FROM public.recent_updates ru
JOIN public.students s ON s.id = ru.student_id
LIMIT 5;

-- Step 6: Test by inserting a sample opportunity (OPTIONAL - uncomment to test)
-- WARNING: This will create a real opportunity and notify all students!
/*
INSERT INTO public.opportunities (
  title,
  company_name,
  employment_type,
  location,
  mode,
  stipend_or_salary,
  description,
  application_link,
  is_active
) VALUES (
  'Test Software Developer Position',
  'Test Tech Company',
  'Full-Time',
  'Remote',
  'Remote',
  '₹50,000 - ₹80,000',
  'This is a test opportunity to verify notifications work correctly.',
  'https://example.com/apply',
  true
) RETURNING id, title, company_name, created_at;
*/

-- Step 7: Check if recent updates were created for the test opportunity
-- Run this AFTER inserting the test opportunity above
/*
SELECT 
  s.email,
  (ru.updates->'updates'->0->>'message') as latest_update,
  (ru.updates->'updates'->0->>'type') as update_type,
  (ru.updates->'updates'->0->>'timestamp') as update_time
FROM public.recent_updates ru
JOIN public.students s ON s.id = ru.student_id
WHERE (ru.updates->'updates'->0->>'message') LIKE '%Test Software Developer%'
ORDER BY s.email
LIMIT 10;
*/

-- Step 8: Delete test opportunity (OPTIONAL - run after testing)
-- Replace [ID] with the id returned from Step 6
/*
DELETE FROM public.opportunities 
WHERE title = 'Test Software Developer Position'
AND company_name = 'Test Tech Company';
*/

-- Display summary
DO $$
DECLARE
  v_trigger_count int;
  v_student_count int;
BEGIN
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers
  WHERE event_object_table = 'opportunities'
  AND trigger_schema = 'public';

  SELECT COUNT(*) INTO v_student_count
  FROM public.students;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OPPORTUNITY NOTIFICATION TEST SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Triggers installed: %', v_trigger_count;
  RAISE NOTICE 'Students in system: %', v_student_count;
  RAISE NOTICE '';
  
  IF v_trigger_count >= 2 THEN
    RAISE NOTICE '✅ Triggers are properly installed';
  ELSE
    RAISE NOTICE '❌ Triggers missing - run setup_opportunity_notifications.sql';
  END IF;

  IF v_student_count > 0 THEN
    RAISE NOTICE '✅ Students will receive notifications';
  ELSE
    RAISE NOTICE '⚠️  No students in database to notify';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'To test: Uncomment Step 6 above and run this script again';
  RAISE NOTICE '========================================';
END $$;
