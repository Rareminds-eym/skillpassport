-- ===================================================================
-- QUICK CHECK: Is Automatic Updates System Active?
-- Run this to verify the system is installed and working
-- ===================================================================

-- Check 1: Are the triggers installed?
SELECT 
  '✅ TRIGGERS' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ Active'
    ELSE '❌ Missing'
  END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE 'auto_recent_update%';

-- Check 2: Are the functions installed?
SELECT 
  '✅ FUNCTIONS' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ Active'
    ELSE '❌ Missing'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'add_recent_update',
  'track_profile_view',
  'add_opportunity_match_update',
  'add_achievement_update',
  'trigger_training_completion',
  'trigger_skills_improvement'
);

-- Check 3: Does profile_views table exist?
SELECT 
  '✅ TABLES' as check_type,
  1 as count,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_views')
    THEN '✅ Active'
    ELSE '❌ Missing'
  END as status;

-- Overall Status
SELECT 
  CASE 
    WHEN 
      (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name LIKE 'auto_recent_update%') >= 2
      AND
      (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name IN ('add_recent_update', 'track_profile_view')) >= 2
      AND
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_views')
    THEN '🎉 AUTOMATIC UPDATES: FULLY OPERATIONAL'
    ELSE '⚠️ AUTOMATIC UPDATES: NOT INSTALLED - Run setup_auto_updates_FIXED.sql'
  END as system_status;
