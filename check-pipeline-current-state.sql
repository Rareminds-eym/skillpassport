-- Check current state of pipeline_candidates table

SELECT 
  '📊 All columns in pipeline_candidates:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pipeline_candidates'
ORDER BY ordinal_position;

-- Check constraints
SELECT
  '🔒 Constraints:' as info,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'pipeline_candidates';

-- Sample data
SELECT 
  '📝 Sample data (first 3 rows):' as info,
  *
FROM pipeline_candidates
LIMIT 3;
