-- ============================================================================
-- BACKUP: Pipeline Candidates Table
-- Run this BEFORE any migration to create a complete backup
-- ============================================================================

-- Create backup table with timestamp
CREATE TABLE IF NOT EXISTS pipeline_candidates_backup_20250123 AS
SELECT * FROM pipeline_candidates;

-- Verify backup
SELECT 
  'Backup created' as status,
  COUNT(*) as total_records,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM pipeline_candidates_backup_20250123;

-- Show sample of backed up data
SELECT 
  id,
  opportunity_id,
  student_id,
  candidate_name,
  stage,
  status,
  created_at
FROM pipeline_candidates_backup_20250123
ORDER BY created_at DESC
LIMIT 5;

-- Save current table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'pipeline_candidates'
ORDER BY ordinal_position;

-- Save current constraints
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'pipeline_candidates'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Save current indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'pipeline_candidates'
  AND schemaname = 'public';

COMMENT ON TABLE pipeline_candidates_backup_20250123 IS 'Backup before UUID migration on 2025-01-23';

-- Success message
SELECT '✅ Backup complete! Safe to proceed with migration.' as message;
