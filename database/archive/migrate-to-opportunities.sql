-- ==================================================================================
-- MIGRATION: Add opportunity_id to pipeline_candidates table
-- ==================================================================================
-- INSTRUCTIONS: Copy ALL of this SQL code and paste it into Supabase SQL Editor
-- Then click the RUN button
-- ==================================================================================

-- Step 1: Add opportunity_id column (if not exists)
ALTER TABLE pipeline_candidates 
ADD COLUMN IF NOT EXISTS opportunity_id INTEGER;

-- Step 2: Add foreign key constraint for opportunity_id (skip if already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_pipeline_opportunity'
  ) THEN
    ALTER TABLE pipeline_candidates 
    ADD CONSTRAINT fk_pipeline_opportunity 
    FOREIGN KEY (opportunity_id) 
    REFERENCES opportunities(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_pipeline_opportunity_id 
ON pipeline_candidates(opportunity_id);

-- Step 4: Add new unique constraint on (opportunity_id, student_id)
-- Note: This will fail if duplicate records exist. If it fails, we'll handle it differently.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pipeline_candidates_opportunity_id_student_id_key'
  ) THEN
    ALTER TABLE pipeline_candidates 
    ADD CONSTRAINT pipeline_candidates_opportunity_id_student_id_key 
    UNIQUE (opportunity_id, student_id);
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Unique constraint already exists or duplicates found';
END $$;

-- Step 5: Make opportunity_id NOT NULL (only if there are no NULL values)
-- This step is commented out for safety - run it manually after verifying all records have opportunity_id
-- ALTER TABLE pipeline_candidates 
-- ALTER COLUMN opportunity_id SET NOT NULL;

-- ==================================================================================
-- VERIFICATION QUERIES
-- ==================================================================================

-- Check the table structure
SELECT 
  COUNT(*) as total_pipeline_candidates,
  COUNT(opportunity_id) as with_opportunity_id,
  COUNT(*) - COUNT(opportunity_id) as missing_opportunity_id
FROM pipeline_candidates;

-- Show sample data
SELECT id, student_id, opportunity_id, stage, status, candidate_name
FROM pipeline_candidates
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any NULL opportunity_id values
SELECT COUNT(*) as null_opportunity_ids
FROM pipeline_candidates
WHERE opportunity_id IS NULL;
