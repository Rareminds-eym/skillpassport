-- Fix pipeline_candidates_detailed view to use UUID opportunity_id
-- This assumes the pipeline_candidates table has been migrated to use UUID

DROP VIEW IF EXISTS pipeline_candidates_detailed CASCADE;

CREATE OR REPLACE VIEW pipeline_candidates_detailed AS
SELECT 
  pc.*,
  s.name as student_name,
  s.email as student_email,
  s.contact_number as student_phone,
  s.branch_field as department,
  s.university,
  s.cgpa,
  s.employability_score,
  s.verified,
  o.job_title,
  o.location as job_location,
  o.status as opportunity_status,
  o.company_name
FROM pipeline_candidates pc
LEFT JOIN students s ON pc.student_id = s.user_id
LEFT JOIN opportunities o ON pc.opportunity_id = o.id
WHERE pc.status = 'active';

COMMENT ON VIEW pipeline_candidates_detailed IS 'Pipeline candidates with full student and opportunity details (UUID-based)';

-- Test the view
SELECT 
  id,
  opportunity_id,
  student_id,
  candidate_name,
  stage,
  job_title,
  company_name
FROM pipeline_candidates_detailed
LIMIT 5;
