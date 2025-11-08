-- ==================================================================================
-- FIX: Update Pipeline Views for JSONB Profile Structure
-- ==================================================================================
-- This fixes the 400 errors when fetching pipeline candidates
-- The issue: Views were trying to access columns (name, email, phone) that don't
-- exist in the students table - they're stored in the JSONB profile column instead
-- ==================================================================================

-- Fix pipeline_candidates_detailed view
CREATE OR REPLACE VIEW pipeline_candidates_detailed AS
SELECT 
  pc.*,
  COALESCE(
    s.profile->>'name',
    s.profile->>'firstName' || ' ' || s.profile->>'lastName',
    'Unknown Student'
  ) as student_name,
  COALESCE(
    s.profile->>'email',
    s.email
  ) as student_email,
  COALESCE(
    s.profile->>'contact_number',
    s.profile->>'phone'
  ) as student_phone,
  COALESCE(
    s.profile->>'dept',
    s.profile->>'department'
  ) as department,
  COALESCE(
    s.profile->>'college',
    s.profile->>'university'
  ) as university,
  COALESCE(
    (s.profile->>'cgpa')::numeric,
    0
  ) as cgpa,
  COALESCE(
    (s.profile->>'employability_score')::numeric,
    (s.profile->>'ai_score_overall')::numeric,
    0
  ) as employability_score,
  COALESCE(
    (s.profile->>'verified')::boolean,
    false
  ) as verified,
  s.profile as student_profile,
  r.title as job_title,
  r.location as job_location,
  r.status as requisition_status
FROM pipeline_candidates pc
LEFT JOIN students s ON pc.student_id = s.id
LEFT JOIN requisitions r ON pc.requisition_id = r.id
WHERE pc.status = 'active';

COMMENT ON VIEW pipeline_candidates_detailed IS 'Pipeline candidates with full student and requisition details (using JSONB profile)';

-- Fix student_applications_with_pipeline view
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

COMMENT ON VIEW student_applications_with_pipeline IS 'Combined view of student applications with their pipeline status';

-- Verify the views work
SELECT 'Testing pipeline_candidates_detailed view...' as status;
SELECT 
  candidate_name,
  student_name,
  student_email,
  department,
  university,
  job_title
FROM pipeline_candidates_detailed
LIMIT 3;

SELECT 'Testing student_applications_with_pipeline view...' as status;
SELECT 
  application_id,
  student_name,
  student_email,
  job_title,
  is_in_pipeline,
  pipeline_stage
FROM student_applications_with_pipeline
LIMIT 3;

SELECT 'Views updated successfully!' as status;
