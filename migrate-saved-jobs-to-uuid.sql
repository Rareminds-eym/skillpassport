-- Migration: Change saved_jobs table IDs to UUID
-- Changes: id (serial → UUID), opportunity_id (integer → UUID), student_id FK (user_id → id)

BEGIN;

-- ============================================
-- STEP 1: VERIFY DEPENDENCIES
-- ============================================
DO $$
DECLARE
  opp_id_type TEXT;
  students_has_id BOOLEAN;
BEGIN
  -- Check opportunities.id is UUID
  SELECT data_type INTO opp_id_type 
  FROM information_schema.columns
  WHERE table_name = 'opportunities' AND column_name = 'id';
  
  IF opp_id_type != 'uuid' THEN
    RAISE EXCEPTION 'Opportunities.id must be UUID first! Current type: %', opp_id_type;
  END IF;
  
  -- Check students has id column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'id'
  ) INTO students_has_id;
  
  IF NOT students_has_id THEN
    RAISE EXCEPTION 'Students table must have id column!';
  END IF;
  
  RAISE NOTICE '✅ Prerequisites met - proceeding with migration';
END $$;

-- ============================================
-- STEP 2: CREATE BACKUP
-- ============================================
DROP TABLE IF EXISTS saved_jobs_backup_migration;
CREATE TABLE saved_jobs_backup_migration AS 
SELECT * FROM saved_jobs;

DO $$ BEGIN
  RAISE NOTICE '✅ Backup created: saved_jobs_backup_migration';
END $$;

-- ============================================
-- STEP 3: ADD NEW UUID COLUMNS
-- ============================================
ALTER TABLE saved_jobs 
ADD COLUMN IF NOT EXISTS id_new UUID DEFAULT gen_random_uuid();

ALTER TABLE saved_jobs 
ADD COLUMN IF NOT EXISTS opportunity_id_new UUID;

ALTER TABLE saved_jobs 
ADD COLUMN IF NOT EXISTS student_id_new UUID;

-- Generate UUIDs for id_new
UPDATE saved_jobs 
SET id_new = gen_random_uuid() 
WHERE id_new IS NULL;

-- Map opportunity_id (integer) to opportunities.id (uuid)
UPDATE saved_jobs sj
SET opportunity_id_new = o.id
FROM opportunities o
WHERE sj.opportunity_id = o.id_old;

-- Map student_id (user_id) to students.id
UPDATE saved_jobs sj
SET student_id_new = s.id
FROM students s
WHERE sj.student_id = s.user_id;

-- Make columns NOT NULL
ALTER TABLE saved_jobs 
ALTER COLUMN id_new SET NOT NULL;

ALTER TABLE saved_jobs 
ALTER COLUMN opportunity_id_new SET NOT NULL;

ALTER TABLE saved_jobs 
ALTER COLUMN student_id_new SET NOT NULL;

DO $$ BEGIN
  RAISE NOTICE '✅ UUID columns added and mapped';
END $$;

-- ============================================
-- STEP 4: DROP OLD CONSTRAINTS
-- ============================================
ALTER TABLE saved_jobs DROP CONSTRAINT IF EXISTS saved_jobs_pkey CASCADE;
ALTER TABLE saved_jobs DROP CONSTRAINT IF EXISTS unique_saved_job;
ALTER TABLE saved_jobs DROP CONSTRAINT IF EXISTS fk_saved_jobs_student;

DO $$ BEGIN
  RAISE NOTICE '✅ Old constraints dropped';
END $$;

-- ============================================
-- STEP 5: SWAP COLUMNS
-- ============================================
ALTER TABLE saved_jobs RENAME COLUMN id TO id_old;
ALTER TABLE saved_jobs RENAME COLUMN id_new TO id;
ALTER TABLE saved_jobs RENAME COLUMN opportunity_id TO opportunity_id_old;
ALTER TABLE saved_jobs RENAME COLUMN opportunity_id_new TO opportunity_id;
ALTER TABLE saved_jobs RENAME COLUMN student_id TO student_id_old;
ALTER TABLE saved_jobs RENAME COLUMN student_id_new TO student_id;

DO $$ BEGIN
  RAISE NOTICE '✅ Columns swapped';
END $$;

-- ============================================
-- STEP 6: CREATE NEW CONSTRAINTS
-- ============================================
-- Primary key
ALTER TABLE saved_jobs 
ADD CONSTRAINT saved_jobs_pkey PRIMARY KEY (id);

-- Unique constraint
ALTER TABLE saved_jobs
ADD CONSTRAINT unique_saved_job 
UNIQUE (student_id, opportunity_id);

-- Foreign keys
ALTER TABLE saved_jobs
ADD CONSTRAINT fk_saved_jobs_student 
FOREIGN KEY (student_id) REFERENCES students(id);

ALTER TABLE saved_jobs
ADD CONSTRAINT fk_saved_jobs_opportunity 
FOREIGN KEY (opportunity_id) REFERENCES opportunities(id);

DO $$ BEGIN
  RAISE NOTICE '✅ New constraints created';
END $$;

-- ============================================
-- STEP 7: MAKE OLD COLUMNS NULLABLE
-- ============================================
ALTER TABLE saved_jobs ALTER COLUMN id_old DROP NOT NULL;
ALTER TABLE saved_jobs ALTER COLUMN opportunity_id_old DROP NOT NULL;
ALTER TABLE saved_jobs ALTER COLUMN student_id_old DROP NOT NULL;

DO $$ BEGIN
  RAISE NOTICE '✅ Old columns made nullable';
END $$;

-- ============================================
-- STEP 8: DROP OLD SEQUENCE
-- ============================================
DROP SEQUENCE IF EXISTS saved_jobs_id_seq CASCADE;

DO $$ BEGIN
  RAISE NOTICE '✅ Old sequence dropped';
END $$;

-- ============================================
-- STEP 9: VERIFY MIGRATION
-- ============================================
DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
  id_type TEXT;
  opp_id_type TEXT;
  student_id_type TEXT;
BEGIN
  -- Check counts
  SELECT COUNT(*) INTO old_count FROM saved_jobs_backup_migration;
  SELECT COUNT(*) INTO new_count FROM saved_jobs;
  
  IF old_count != new_count THEN
    RAISE EXCEPTION 'Row count mismatch! Backup: %, Current: %', old_count, new_count;
  END IF;
  
  -- Check data types
  SELECT data_type INTO id_type 
  FROM information_schema.columns
  WHERE table_name = 'saved_jobs' AND column_name = 'id';
  
  SELECT data_type INTO opp_id_type 
  FROM information_schema.columns
  WHERE table_name = 'saved_jobs' AND column_name = 'opportunity_id';
  
  SELECT data_type INTO student_id_type 
  FROM information_schema.columns
  WHERE table_name = 'saved_jobs' AND column_name = 'student_id';
  
  IF id_type != 'uuid' OR opp_id_type != 'uuid' OR student_id_type != 'uuid' THEN
    RAISE EXCEPTION 'ID columns are not UUID! id: %, opportunity_id: %, student_id: %', 
      id_type, opp_id_type, student_id_type;
  END IF;
  
  RAISE NOTICE '✅ Verification passed: % rows, all IDs are UUID', new_count;
END $$;

-- ============================================
-- STEP 10: SHOW RESULTS
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'saved_jobs'
  AND column_name IN ('id', 'id_old', 'opportunity_id', 'opportunity_id_old', 'student_id', 'student_id_old')
ORDER BY column_name;

COMMIT;

DO $$ BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'saved_jobs table migrated to UUID';
  RAISE NOTICE '⚠️  Keep old columns for a few days';
  RAISE NOTICE '⚠️  Keep backup table as safety net';
  RAISE NOTICE 'Test save/unsave functionality!';
END $$;

-- ============================================
-- CLEANUP (Run after verification)
-- ============================================
-- After 1-2 weeks of testing:
-- ALTER TABLE saved_jobs DROP COLUMN id_old;
-- ALTER TABLE saved_jobs DROP COLUMN opportunity_id_old;
-- ALTER TABLE saved_jobs DROP COLUMN student_id_old;
-- DROP TABLE saved_jobs_backup_migration;
