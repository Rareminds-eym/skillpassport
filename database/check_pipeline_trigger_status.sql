-- ==================================================================================
-- Check Pipeline Trigger Status
-- ==================================================================================
-- This script checks if the trigger and function for auto-adding students to 
-- pipeline is properly set up
-- ==================================================================================

-- 1. Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_add_to_pipeline'
  AND event_object_table = 'applied_jobs';

-- 2. Check if the function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'auto_add_applicant_to_pipeline'
  AND routine_schema = 'public';

-- 3. Check if opportunities have requisition_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'opportunities'
  AND column_name = 'requisition_id';

-- 4. Check how many opportunities have requisition_id set
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(requisition_id) as opportunities_with_requisition,
  COUNT(*) - COUNT(requisition_id) as opportunities_without_requisition
FROM opportunities;

-- 5. Check recent applications and their pipeline status
SELECT 
  aj.id as application_id,
  aj.student_id,
  aj.opportunity_id,
  aj.applied_at,
  aj.application_status,
  o.job_title,
  o.requisition_id,
  CASE 
    WHEN pc.id IS NOT NULL THEN 'In Pipeline'
    ELSE 'NOT in Pipeline'
  END as pipeline_status,
  pc.stage as current_stage,
  pc.source
FROM applied_jobs aj
LEFT JOIN opportunities o ON o.id = aj.opportunity_id
LEFT JOIN pipeline_candidates pc ON pc.requisition_id = o.requisition_id 
  AND pc.student_id = aj.student_id
ORDER BY aj.applied_at DESC
LIMIT 20;

-- 6. Check for duplicate pipeline entries
SELECT 
  requisition_id,
  student_id,
  candidate_name,
  COUNT(*) as duplicate_count
FROM pipeline_candidates
GROUP BY requisition_id, student_id, candidate_name
HAVING COUNT(*) > 1;

-- 7. Check students table structure for profile fields
SELECT 
  s.id,
  s.profile->>'name' as name,
  s.profile->>'email' as email,
  s.profile->>'contact_number' as contact_number,
  COUNT(aj.id) as applications_count,
  COUNT(pc.id) as pipeline_entries_count
FROM students s
LEFT JOIN applied_jobs aj ON aj.student_id = s.id
LEFT JOIN pipeline_candidates pc ON pc.student_id = s.id
GROUP BY s.id, s.profile
ORDER BY applications_count DESC
LIMIT 10;
