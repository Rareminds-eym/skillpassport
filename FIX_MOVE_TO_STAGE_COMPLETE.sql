-- ============================================================================
-- COMPLETE FIX FOR MOVE TO STAGE ISSUE
-- ============================================================================
-- This script fixes the UUID type mismatch in pipeline_candidates_detailed view
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Check current state
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHECKING CURRENT STATE';
  RAISE NOTICE '========================================';
END $$;

-- Check column types
SELECT 
  '1. Column Types' as step,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'pipeline_candidates'
  AND column_name IN ('id', 'opportunity_id', 'student_id')
ORDER BY ordinal_position;

-- Check opportunities table type
SELECT 
  '2. Opportunities ID Type' as step,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'opportunities'
  AND column_name = 'id';

-- Step 2: Drop and recreate the view with UUID support
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIXING pipeline_candidates_detailed VIEW';
  RAISE NOTICE '========================================';
END $$;

DROP VIEW IF EXISTS pipeline_candidates_detailed CASCADE;

CREATE OR REPLACE VIEW pipeline_candidates_detailed AS
SELECT 
  pc.id,
  pc.opportunity_id,
  pc.student_id,
  pc.candidate_name,
  pc.candidate_email,
  pc.candidate_phone,
  pc.stage,
  pc.previous_stage,
  pc.status,
  pc.source,
  pc.recruiter_rating,
  pc.recruiter_notes,
  pc.next_action,
  pc.next_action_date,
  pc.next_action_notes,
  pc.rejection_reason,
  pc.rejection_date,
  pc.assigned_to,
  pc.added_at,
  pc.updated_at,
  pc.added_by,
  pc.stage_changed_at,
  pc.stage_changed_by,
  -- Student details
  s.name as student_name,
  s.email as student_email,
  s.contact_number as student_phone,
  s.university as student_university,
  s.branch_field as student_department,
  s.course_name as student_course,
  s.college_school_name as student_college,
  s.district_name as student_location,
  -- Opportunity details
  o.job_title as opportunity_title,
  o.company_name,
  o.location as opportunity_location,
  o.employment_type,
  o.experience_level
FROM pipeline_candidates pc
LEFT JOIN students s ON pc.student_id = s.user_id
LEFT JOIN opportunities o ON pc.opportunity_id = o.id
WHERE pc.status = 'active';

COMMENT ON VIEW pipeline_candidates_detailed IS 'Pipeline candidates with full details - UUID compatible (Fixed 2025-01-23)';

-- Step 3: Verify the fix
DO $$
DECLARE
  test_uuid uuid;
  record_count integer;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFYING FIX';
  RAISE NOTICE '========================================';
  
  -- Count total records
  SELECT count(*) INTO record_count FROM pipeline_candidates_detailed;
  RAISE NOTICE '✅ View created successfully with % records', record_count;
  
  -- Test with a UUID
  SELECT opportunity_id INTO test_uuid
  FROM pipeline_candidates
  LIMIT 1;
  
  IF test_uuid IS NOT NULL THEN
    RAISE NOTICE '✅ Testing view with UUID: %', test_uuid;
    PERFORM * FROM pipeline_candidates_detailed WHERE opportunity_id = test_uuid;
    RAISE NOTICE '✅ View works with UUID!';
  ELSE
    RAISE NOTICE '⚠️  No pipeline candidates found to test';
  END IF;
END $$;

-- Step 4: Show sample data
SELECT 
  '3. Sample Data' as step,
  id,
  opportunity_id,
  student_id,
  candidate_name,
  stage,
  status
FROM pipeline_candidates_detailed
LIMIT 3;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FIX COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'The pipeline_candidates_detailed view now supports UUID';
  RAISE NOTICE 'You can now move candidates between stages';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Refresh your browser';
  RAISE NOTICE '2. Try moving a candidate to a different stage';
  RAISE NOTICE '3. Check browser console for success logs';
END $$;
