-- Check current state of both tables

-- Check opportunities table structure
SELECT 
  'opportunities' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'opportunities'
  AND column_name IN ('id', 'id_old', 'id_new')
ORDER BY ordinal_position;

-- Check pipeline_candidates table structure
SELECT 
  'pipeline_candidates' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pipeline_candidates'
  AND column_name IN ('id', 'id_old', 'id_new', 'opportunity_id', 'opportunity_id_old', 'opportunity_id_new')
ORDER BY ordinal_position;

-- Check if backup tables exist
SELECT 
  table_name,
  'exists' as status
FROM information_schema.tables
WHERE table_name IN ('opportunities_backup_migration', 'pipeline_candidates_backup_migration');
