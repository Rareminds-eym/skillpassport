-- Fix student name display in pipeline_candidates_detailed view
-- The join should be on students.id, not students.user_id

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
  -- Student details (JOIN ON students.id, not user_id)
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
LEFT JOIN students s ON pc.student_id = s.id  -- FIXED: Changed from s.user_id to s.id
LEFT JOIN opportunities o ON pc.opportunity_id = o.id
WHERE pc.status = 'active';

COMMENT ON VIEW pipeline_candidates_detailed IS 'Pipeline candidates with full details - Fixed student join (2025-01-23)';

-- Verify the fix
SELECT 
  'Verification' as status,
  id,
  student_id,
  candidate_name,
  student_name,
  student_email
FROM pipeline_candidates_detailed
LIMIT 5;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Student name display fixed!';
  RAISE NOTICE 'Student names should now appear correctly';
END $$;
