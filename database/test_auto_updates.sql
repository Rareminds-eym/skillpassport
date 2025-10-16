-- ===================================================================
-- TEST SCRIPT: Verify Automatic Recent Updates System
-- Run this AFTER running setup_auto_updates_FIXED.sql
-- ===================================================================

-- Step 1: Verify all functions exist
SELECT 
  routine_name as function_name,
  routine_type as type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'add_recent_update',
  'track_profile_view',
  'add_opportunity_match_update',
  'add_achievement_update',
  'trigger_training_completion',
  'trigger_skills_improvement'
)
ORDER BY routine_name;

-- Expected: 6 functions

-- Step 2: Verify all triggers exist
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE 'auto_recent_update%'
ORDER BY trigger_name;

-- Expected: 2 triggers on students table

-- Step 3: Check if profile_views table exists
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'profile_views'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Expected: 5 columns (id, student_id, viewer_type, viewer_id, viewed_at)

-- ===================================================================
-- LIVE TESTS - Replace 'your-email@example.com' with your actual email
-- ===================================================================

-- Test 1: Training Completion Trigger
-- This should automatically create a "You completed X course" update
DO $$
DECLARE
  v_student_id uuid;
  v_old_updates jsonb;
  v_new_updates jsonb;
BEGIN
  -- Get your student ID
  SELECT id INTO v_student_id 
  FROM students 
  WHERE email = 'durkadevidurkadevi43@gmail.com' 
  LIMIT 1;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Student not found! Change the email in this script.';
  END IF;

  -- Get current updates count
  SELECT updates INTO v_old_updates
  FROM recent_updates
  WHERE student_id = v_student_id;

  RAISE NOTICE '📋 Before update: % updates', 
    COALESCE(jsonb_array_length(v_old_updates->'updates'), 0);

  -- Mark first training as completed
  UPDATE students
  SET profile = jsonb_set(
    profile,
    '{training,0,status}',
    '"completed"'
  )
  WHERE id = v_student_id;

  -- Get new updates
  SELECT updates INTO v_new_updates
  FROM recent_updates
  WHERE student_id = v_student_id;

  RAISE NOTICE '📋 After update: % updates', 
    COALESCE(jsonb_array_length(v_new_updates->'updates'), 0);
  
  RAISE NOTICE '✅ TEST 1 COMPLETE: Check if a new "You completed..." update was added';
END $$;

-- View the result
SELECT 
  s.email,
  ru.updates->'updates'->0 as latest_update,
  jsonb_array_length(ru.updates->'updates') as total_updates
FROM recent_updates ru
JOIN students s ON s.id = ru.student_id
WHERE s.email = 'durkadevidurkadevi43@gmail.com';

-- ===================================================================

-- Test 2: Skills Addition Trigger
-- This should automatically create a "You added X new skill(s)" update
DO $$
DECLARE
  v_student_id uuid;
  v_current_skills jsonb;
  v_skill_count_before int;
  v_skill_count_after int;
BEGIN
  -- Get your student ID
  SELECT id INTO v_student_id 
  FROM students 
  WHERE email = 'durkadevidurkadevi43@gmail.com' 
  LIMIT 1;

  -- Count current skills
  SELECT profile->'technicalSkills' INTO v_current_skills
  FROM students
  WHERE id = v_student_id;
  
  v_skill_count_before := COALESCE(jsonb_array_length(v_current_skills), 0);
  RAISE NOTICE '🔧 Before: % technical skills', v_skill_count_before;

  -- Add a new test skill
  UPDATE students
  SET profile = jsonb_set(
    profile,
    '{technicalSkills}',
    COALESCE(profile->'technicalSkills', '[]'::jsonb) || 
    jsonb_build_array(
      jsonb_build_object(
        'id', floor(random() * 10000)::int,
        'name', 'Test Skill - ' || now()::text,
        'level', 4,
        'category', 'testing'
      )
    )
  )
  WHERE id = v_student_id;

  -- Count after
  SELECT jsonb_array_length(profile->'technicalSkills') INTO v_skill_count_after
  FROM students
  WHERE id = v_student_id;

  RAISE NOTICE '🔧 After: % technical skills', v_skill_count_after;
  RAISE NOTICE '✅ TEST 2 COMPLETE: Check if "You added 1 new skill(s)" update was added';
END $$;

-- View the result
SELECT 
  s.email,
  ru.updates->'updates'->0 as latest_update,
  ru.updates->'updates'->1 as second_latest
FROM recent_updates ru
JOIN students s ON s.id = ru.student_id
WHERE s.email = 'durkadevidurkadevi43@gmail.com';

-- ===================================================================

-- Test 3: Profile View Tracking
-- This should create an update after 5 views
DO $$
DECLARE
  v_student_id uuid;
  v_view_count int;
BEGIN
  -- Get your student ID
  SELECT id INTO v_student_id 
  FROM students 
  WHERE email = 'durkadevidurkadevi43@gmail.com' 
  LIMIT 1;

  -- Count current views this week
  SELECT COUNT(*) INTO v_view_count
  FROM profile_views
  WHERE student_id = v_student_id
  AND viewed_at >= now() - interval '7 days';

  RAISE NOTICE '👁️ Current views this week: %', v_view_count;

  -- Add 5 more views to trigger an update
  FOR i IN 1..5 LOOP
    PERFORM track_profile_view(v_student_id, 'recruiter', NULL);
  END LOOP;

  -- Count after
  SELECT COUNT(*) INTO v_view_count
  FROM profile_views
  WHERE student_id = v_student_id
  AND viewed_at >= now() - interval '7 days';

  RAISE NOTICE '👁️ Views after test: %', v_view_count;
  RAISE NOTICE '✅ TEST 3 COMPLETE: If views are multiple of 5, check for "viewed X times" update';
END $$;

-- View the result
SELECT 
  s.email,
  ru.updates->'updates'->0 as latest_update,
  (SELECT COUNT(*) FROM profile_views pv WHERE pv.student_id = ru.student_id AND pv.viewed_at >= now() - interval '7 days') as views_this_week
FROM recent_updates ru
JOIN students s ON s.id = ru.student_id
WHERE s.email = 'durkadevidurkadevi43@gmail.com';

-- ===================================================================

-- View ALL recent updates for your student
SELECT 
  s.email,
  jsonb_pretty(ru.updates) as all_updates
FROM recent_updates ru
JOIN students s ON s.id = ru.student_id
WHERE s.email = 'durkadevidurkadevi43@gmail.com';

-- ===================================================================

-- Summary: Check what was created
DO $$
DECLARE
  v_function_count int;
  v_trigger_count int;
  v_table_exists boolean;
  v_student_id uuid;
  v_update_count int;
BEGIN
  -- Count functions
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name LIKE '%recent_update%'
  OR routine_name LIKE '%profile_view%'
  OR routine_name LIKE '%achievement%'
  OR routine_name LIKE '%opportunity%';

  -- Count triggers
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'auto_recent_update%';

  -- Check table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'profile_views'
  ) INTO v_table_exists;

  -- Check updates for test user
  SELECT id INTO v_student_id 
  FROM students 
  WHERE email = 'durkadevidurkadevi43@gmail.com' 
  LIMIT 1;

  IF v_student_id IS NOT NULL THEN
    SELECT jsonb_array_length(updates->'updates') INTO v_update_count
    FROM recent_updates
    WHERE student_id = v_student_id;
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '📊 AUTOMATIC RECENT UPDATES - STATUS';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Functions Created: %', v_function_count;
  RAISE NOTICE '✅ Triggers Active: %', v_trigger_count;
  RAISE NOTICE '✅ Profile Views Table: %', CASE WHEN v_table_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '✅ Your Updates Count: %', COALESCE(v_update_count, 0);
  RAISE NOTICE '';
  RAISE NOTICE '🎯 System Status: %', 
    CASE 
      WHEN v_function_count >= 6 AND v_trigger_count >= 2 AND v_table_exists 
      THEN '✅ FULLY OPERATIONAL'
      ELSE '⚠️ INCOMPLETE - Check errors above'
    END;
  RAISE NOTICE '============================================';
END $$;
