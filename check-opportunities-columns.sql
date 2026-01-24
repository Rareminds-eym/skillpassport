-- Check opportunities table structure
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'opportunities'
  AND column_name IN ('id', 'id_old')
ORDER BY ordinal_position;

-- Check pipeline_candidates structure
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pipeline_candidates'
  AND column_name LIKE '%opportunity%'
ORDER BY ordinal_position;

-- Sample data to understand the relationship
SELECT 
  'opportunities' as table_name,
  id,
  id_old,
  job_title
FROM opportunities
LIMIT 3;

SELECT 
  'pipeline_candidates' as table_name,
  id,
  opportunity_id,
  candidate_name
FROM pipeline_candidates
LIMIT 3;
