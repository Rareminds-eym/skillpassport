-- ============================================================================
-- SIMPLE PIPELINE MIGRATION FIX
-- Use this if the complex version has type casting issues
-- ============================================================================

-- Step 1: Create backup
CREATE TABLE IF NOT EXISTS pipeline_candidates_backup_20250123 AS
SELECT * FROM pipeline_candidates;

SELECT '✅ Backup created: ' || COUNT(*) || ' records' as status
FROM pipeline_candidates_backup_20250123;

-- Step 2: Add new UUID column
ALTER TABLE pipeline_candidates 
ADD COLUMN IF NOT EXISTS opportunity_id_new UUID;

-- Step 3: Populate using text casting (works for any type)
UPDATE pipeline_candidates pc
SET opportunity_id_new = o.id
FROM opportunities o
WHERE o.id_old::text = pc.opportunity_id::text;

-- Step 4: Check results
SELECT 
  COUNT(*) as total,
  COUNT(opportunity_id_new) as matched,
  COUNT(*) - COUNT(opportunity_id_new) as unmatched
FROM pipeline_candidates;

-- Step 5: Show unmatched if any
SELECT 
  'Unmatched records:' as warning,
  id,
  opportunity_id,
  candidate_name
FROM pipeline_candidates
WHERE opportunity_id_new IS NULL
LIMIT 10;

-- Step 6: Rename columns
ALTER TABLE pipeline_candidates 
RENAME COLUMN opportunity_id TO opportunity_id_old;

ALTER TABLE pipeline_candidates 
RENAME COLUMN opportunity_id_new TO opportunity_id;

-- Step 7: Drop old constraints
ALTER TABLE pipeline_candidates 
DROP CONSTRAINT IF EXISTS pipeline_candidates_opportunity_id_fkey;

ALTER TABLE pipeline_candidates 
DROP CONSTRAINT IF EXISTS pipeline_candidates_opportunity_id_student_id_key;

-- Step 8: Add new foreign key
ALTER TABLE pipeline_candidates 
ADD CONSTRAINT pipeline_candidates_opportunity_id_fkey 
FOREIGN KEY (opportunity_id) 
REFERENCES opportunities(id) 
ON DELETE CASCADE;

-- Step 9: Add unique constraint
ALTER TABLE pipeline_candidates 
ADD CONSTRAINT pipeline_candidates_opportunity_id_student_id_key 
UNIQUE (opportunity_id, student_id);

-- Step 10: Create index
CREATE INDEX IF NOT EXISTS idx_pipeline_candidates_opportunity_id 
ON pipeline_candidates(opportunity_id);

-- Step 11: Make old column nullable
ALTER TABLE pipeline_candidates 
ALTER COLUMN opportunity_id_old DROP NOT NULL;

-- Step 12: Update view
DROP VIEW IF EXISTS pipeline_candidates_detailed CASCADE;

CREATE OR REPLACE VIEW pipeline_candidates_detailed AS
SELECT 
  pc.*,
  s.name as student_name,
  s.email as student_email,
  s.contact_number as student_phone,
  s.branch_field as department,
  s.university,
  s.cgpa,
  s.employability_score,
  s.verified,
  o.job_title,
  o.location as job_location,
  o.status as opportunity_status,
  o.company_name
FROM pipeline_candidates pc
LEFT JOIN students s ON pc.student_id = s.user_id
LEFT JOIN opportunities o ON pc.opportunity_id = o.id
WHERE pc.status = 'active';

-- Verification
SELECT 
  '✅ Migration complete!' as status,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'pipeline_candidates'
  AND column_name = 'opportunity_id';

SELECT * FROM pipeline_candidates_detailed LIMIT 3;
