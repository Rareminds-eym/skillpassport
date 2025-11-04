-- Sync Applications to Pipeline
-- This script creates pipeline_candidates records for all applied_jobs that don't have them yet

-- Insert pipeline candidates for all applications that aren't in the pipeline yet
INSERT INTO pipeline_candidates (
  opportunity_id,
  student_id,
  candidate_name,
  candidate_email,
  candidate_phone,
  stage,
  source,
  status,
  added_at,
  stage_changed_at,
  created_at,
  updated_at
)
SELECT 
  aj.opportunity_id,
  aj.student_id,
  COALESCE(s.profile->>'name', 'Unknown'),
  COALESCE(s.profile->>'email', ''),
  COALESCE(s.profile->>'contact_number', ''),
  'sourced', -- Default stage for new applications
  'direct_application',
  'active',
  aj.applied_at,
  aj.applied_at,
  aj.applied_at,
  aj.applied_at
FROM applied_jobs aj
LEFT JOIN students s ON aj.student_id = s.id
WHERE NOT EXISTS (
  SELECT 1 
  FROM pipeline_candidates pc 
  WHERE pc.opportunity_id = aj.opportunity_id 
    AND pc.student_id = aj.student_id
)
AND aj.opportunity_id IS NOT NULL;

-- Verification: Show synced records
SELECT 
  COUNT(*) as total_synced,
  stage,
  source
FROM pipeline_candidates
WHERE source = 'direct_application'
GROUP BY stage, source;

-- Show sample of synced candidates
SELECT 
  pc.id,
  pc.candidate_name,
  pc.candidate_email,
  pc.stage,
  o.job_title,
  o.company_name
FROM pipeline_candidates pc
JOIN opportunities o ON pc.opportunity_id = o.id
WHERE pc.source = 'direct_application'
ORDER BY pc.added_at DESC
LIMIT 10;
