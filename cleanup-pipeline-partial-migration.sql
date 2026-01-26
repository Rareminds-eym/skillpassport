-- ============================================================================
-- CLEANUP: Remove partial migration artifacts
-- Run this if the migration was interrupted or failed partway through
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🧹 Cleaning up partial migration...';
END $$;

-- Drop new columns if they exist
ALTER TABLE pipeline_candidates 
DROP COLUMN IF EXISTS opportunity_id_new CASCADE;

-- Restore original column name if it was renamed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pipeline_candidates' 
    AND column_name = 'opportunity_id_old'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pipeline_candidates' 
    AND column_name = 'opportunity_id'
  ) THEN
    ALTER TABLE pipeline_candidates 
    RENAME COLUMN opportunity_id_old TO opportunity_id;
    RAISE NOTICE '✅ Restored opportunity_id column name';
  END IF;
END $$;

-- Check current state
SELECT 
  '📊 Current columns:' as status,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'pipeline_candidates'
  AND column_name LIKE '%opportunity%'
ORDER BY column_name;

SELECT '✅ Cleanup complete! Ready to run migration again.' as message;
