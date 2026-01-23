-- Fix pipeline_candidates_detailed view to handle UUID opportunity_id
-- This fixes the error: invalid input syntax for type integer

-- Drop the existing view
DROP VIEW IF EXISTS pipeline_candidates_detailed CASCADE;

-- Recreate the view with UUID support
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

COMMENT ON VIEW pipeline_candidates_detailed IS 'Pipeline candidates with full details - UUID compatible';

-- Verify the fix
SELECT 
  'View created successfully' as status,
  count(*) as total_records
FROM pipeline_candidates_detailed;

-- Test with a UUID
DO $$
DECLARE
  test_uuid uuid;
BEGIN
  -- Get a sample opportunity_id
  SELECT opportunity_id INTO test_uuid
  FROM pipeline_candidates
  LIMIT 1;
  
  IF test_uuid IS NOT NULL THEN
    RAISE NOTICE 'Testing view with UUID: %', test_uuid;
    PERFORM * FROM pipeline_candidates_detailed WHERE opportunity_id = test_uuid;
    RAISE NOTICE '✅ View works with UUID!';
  ELSE
    RAISE NOTICE 'No pipeline candidates found to test';
  END IF;
END $$;
