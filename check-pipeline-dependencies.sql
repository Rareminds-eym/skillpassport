-- Check for views that reference pipeline_candidates
SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition ILIKE '%pipeline_candidates%';

-- Check for functions that reference pipeline_candidates
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition ILIKE '%pipeline_candidates%';

-- Check current foreign keys on pipeline_candidates
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'pipeline_candidates';

-- Check current indexes on pipeline_candidates
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'pipeline_candidates'
  AND schemaname = 'public';

-- Check current data type of opportunity_id
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'pipeline_candidates'
  AND column_name LIKE '%opportunity%'
ORDER BY ordinal_position;
