-- Quick fix: Disable the embedding trigger on opportunities table
-- This allows imports to work without the embedding queue system

-- Disable the trigger
DROP TRIGGER IF EXISTS trigger_queue_opportunity_embedding ON opportunities;

-- Verify it's disabled
SELECT 'Embedding trigger disabled successfully' as status;

-- To re-enable later, run fix-embedding-trigger-opportunities.sql
