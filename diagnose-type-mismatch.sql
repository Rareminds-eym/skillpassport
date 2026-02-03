-- Diagnostic script to understand the type mismatch issue

-- 1. Check opportunities table columns and types
SELECT 
  '1. Opportunities columns:' as step,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'opportunities'
  AND column_name IN ('id', 'id_old')
ORDER BY column_name;

-- 2. Check pipeline_candidates columns and types
SELECT 
  '2. Pipeline_candidates columns:' as step,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'pipeline_candidates'
  AND column_name LIKE '%opportunity%'
ORDER BY column_name;

-- 3. Sample data from opportunities
SELECT 
  '3. Sample opportunities data:' as step,
  id,
  id_old,
  pg_typeof(id) as id_type,
  pg_typeof(id_old) as id_old_type,
  job_title
FROM opportunities
LIMIT 3;

-- 4. Sample data from pipeline_candidates
SELECT 
  '4. Sample pipeline_candidates data:' as step,
  id,
  opportunity_id,
  pg_typeof(opportunity_id) as opportunity_id_type,
  candidate_name
FROM pipeline_candidates
LIMIT 3;

-- 5. Try to find matching records
SELECT 
  '5. Matching test:' as step,
  COUNT(*) as potential_matches
FROM pipeline_candidates pc
JOIN opportunities o ON o.id_old::text = pc.opportunity_id::text;

-- 6. Show unmatched pipeline candidates
SELECT 
  '6. Unmatched pipeline candidates:' as step,
  pc.id,
  pc.opportunity_id,
  pc.candidate_name
FROM pipeline_candidates pc
LEFT JOIN opportunities o ON o.id_old::text = pc.opportunity_id::text
WHERE o.id IS NULL
LIMIT 5;

-- 7. Suggest the correct UPDATE statement
SELECT 
  '7. Suggested UPDATE:' as step,
  'UPDATE pipeline_candidates pc SET opportunity_id_new = o.id FROM opportunities o WHERE o.id_old::text = pc.opportunity_id::text' as sql_to_use;
