-- Fix: Make all *_old columns nullable in applied_jobs and pipeline_candidates
-- These columns were kept for backup during migration but shouldn't block new inserts

BEGIN;

-- ============================================
-- FIX APPLIED_JOBS TABLE
-- ============================================
ALTER TABLE applied_jobs 
ALTER COLUMN id_old DROP NOT NULL;

ALTER TABLE applied_jobs 
ALTER COLUMN opportunity_id_old DROP NOT NULL;

-- ============================================
-- FIX PIPELINE_CANDIDATES TABLE
-- ============================================
ALTER TABLE pipeline_candidates 
ALTER COLUMN id_old DROP NOT NULL;

ALTER TABLE pipeline_candidates 
ALTER COLUMN opportunity_id_old DROP NOT NULL;

-- ============================================
-- VERIFY CHANGES
-- ============================================
SELECT 
  'applied_jobs' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'applied_jobs'
  AND column_name LIKE '%_old'
UNION ALL
SELECT 
  'pipeline_candidates' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pipeline_candidates'
  AND column_name LIKE '%_old'
ORDER BY table_name, column_name;

COMMIT;

SELECT '✅ All *_old columns are now nullable in both tables' as status;
