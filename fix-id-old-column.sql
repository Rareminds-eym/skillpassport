-- Fix: Make id_old and opportunity_id_old nullable in applied_jobs
-- These columns were kept for backup but shouldn't block new inserts

BEGIN;

-- Make id_old nullable
ALTER TABLE applied_jobs 
ALTER COLUMN id_old DROP NOT NULL;

-- Make opportunity_id_old nullable
ALTER TABLE applied_jobs 
ALTER COLUMN opportunity_id_old DROP NOT NULL;

-- Verify the changes
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'applied_jobs'
  AND column_name IN ('id', 'id_old', 'opportunity_id', 'opportunity_id_old')
ORDER BY column_name;

COMMIT;

SELECT '✅ id_old and opportunity_id_old are now nullable' as status;
