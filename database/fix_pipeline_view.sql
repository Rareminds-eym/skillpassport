-- ==================================================================================
-- UPDATE: Fix student_applications_with_pipeline view
-- ==================================================================================
-- Run this if you already ran the main fix script and are getting 400 errors
-- This updates the view to use the correct JSONB profile structure
-- ==================================================================================

CREATE OR REPLACE VIEW student_applications_with_pipeline AS
SELECT 
  aj.id as application_id,
  aj.student_id,
  aj.opportunity_id,
  aj.application_status,
  aj.applied_at,
  aj.updated_at,
  COALESCE(
    s.profile->>'name',
    s.profile->>'firstName' || ' ' || s.profile->>'lastName',
    'Unknown Student'
  ) as student_name,
  COALESCE(
    s.profile->>'email',
    s.email
  ) as student_email,
  o.job_title,
  o.company_name,
  o.location,
  o.requisition_id,
  pc.id as pipeline_candidate_id,
  pc.stage as pipeline_stage,
  pc.status as pipeline_status,
  pc.stage_changed_at,
  pc.source as pipeline_source,
  CASE 
    WHEN pc.id IS NOT NULL THEN true 
    ELSE false 
  END as is_in_pipeline
FROM applied_jobs aj
LEFT JOIN students s ON aj.student_id = s.id
LEFT JOIN opportunities o ON aj.opportunity_id = o.id
LEFT JOIN pipeline_candidates pc ON pc.requisition_id = o.requisition_id 
  AND pc.student_id = aj.student_id
  AND pc.status = 'active'
ORDER BY aj.applied_at DESC;

-- Verify the view works
SELECT 
  application_id,
  student_name,
  student_email,
  job_title,
  is_in_pipeline,
  pipeline_stage
FROM student_applications_with_pipeline
LIMIT 5;
