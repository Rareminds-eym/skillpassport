-- Fix foreign keys with data cleanup
-- This handles orphaned records before creating the constraint

BEGIN;

-- ============================================
-- STEP 1: ANALYZE THE SITUATION
-- ============================================
DO $$
DECLARE
  students_has_user_id BOOLEAN;
  pc_orphaned_count INTEGER;
  aj_orphaned_count INTEGER;
  pc_matches_user_id INTEGER;
  aj_matches_user_id INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Analyzing data integrity';
  RAISE NOTICE '========================================';
  
  -- Check if students has user_id column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'user_id'
  ) INTO students_has_user_id;
  
  RAISE NOTICE 'Students table has user_id column: %', students_has_user_id;
  
  -- Count orphaned records in pipeline_candidates
  SELECT COUNT(*) INTO pc_orphaned_count
  FROM pipeline_candidates pc
  WHERE NOT EXISTS (
    SELECT 1 FROM students s WHERE s.id = pc.student_id
  );
  
  RAISE NOTICE 'Pipeline_candidates orphaned records (student_id not in students.id): %', pc_orphaned_count;
  
  -- Count orphaned records in applied_jobs
  SELECT COUNT(*) INTO aj_orphaned_count
  FROM applied_jobs aj
  WHERE NOT EXISTS (
    SELECT 1 FROM students s WHERE s.id = aj.student_id
  );
  
  RAISE NOTICE 'Applied_jobs orphaned records (student_id not in students.id): %', aj_orphaned_count;
  
  -- Check if student_id actually matches user_id
  IF students_has_user_id THEN
    SELECT COUNT(*) INTO pc_matches_user_id
    FROM pipeline_candidates pc
    WHERE EXISTS (
      SELECT 1 FROM students s WHERE s.user_id = pc.student_id
    );
    
    SELECT COUNT(*) INTO aj_matches_user_id
    FROM applied_jobs aj
    WHERE EXISTS (
      SELECT 1 FROM students s WHERE s.user_id = aj.student_id
    );
    
    RAISE NOTICE 'Pipeline_candidates records matching students.user_id: %', pc_matches_user_id;
    RAISE NOTICE 'Applied_jobs records matching students.user_id: %', aj_matches_user_id;
  END IF;
END $$;

-- ============================================
-- STEP 2: BACKUP ORPHANED RECORDS
-- ============================================
CREATE TEMP TABLE orphaned_pipeline_candidates AS
SELECT * FROM pipeline_candidates pc
WHERE NOT EXISTS (
  SELECT 1 FROM students s WHERE s.id = pc.student_id
)
AND NOT EXISTS (
  SELECT 1 FROM students s WHERE s.user_id = pc.student_id
);

CREATE TEMP TABLE orphaned_applied_jobs AS
SELECT * FROM applied_jobs aj
WHERE NOT EXISTS (
  SELECT 1 FROM students s WHERE s.id = aj.student_id
)
AND NOT EXISTS (
  SELECT 1 FROM students s WHERE s.user_id = aj.student_id
);

DO $$ 
DECLARE
  pc_orphaned INTEGER;
  aj_orphaned INTEGER;
BEGIN
  SELECT COUNT(*) INTO pc_orphaned FROM orphaned_pipeline_candidates;
  SELECT COUNT(*) INTO aj_orphaned FROM orphaned_applied_jobs;
  
  RAISE NOTICE '✅ Backed up % orphaned pipeline_candidates', pc_orphaned;
  RAISE NOTICE '✅ Backed up % orphaned applied_jobs', aj_orphaned;
END $$;

-- ============================================
-- STEP 3: FIX DATA - Map user_id to id
-- ============================================
-- If student_id is actually matching students.user_id, we need to update it to students.id

DO $$ BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixing student_id references';
  RAISE NOTICE '========================================';
END $$;

-- Update pipeline_candidates: if student_id matches user_id, change it to id
UPDATE pipeline_candidates pc
SET student_id = s.id
FROM students s
WHERE pc.student_id = s.user_id
  AND pc.student_id != s.id;

-- Update applied_jobs: if student_id matches user_id, change it to id
UPDATE applied_jobs aj
SET student_id = s.id
FROM students s
WHERE aj.student_id = s.user_id
  AND aj.student_id != s.id;

DO $$ BEGIN
  RAISE NOTICE '✅ Updated student_id references';
END $$;

-- ============================================
-- STEP 4: DELETE TRULY ORPHANED RECORDS
-- ============================================
-- Delete records that still don't have a matching student

DELETE FROM pipeline_candidates pc
WHERE NOT EXISTS (
  SELECT 1 FROM students s WHERE s.id = pc.student_id
);

DELETE FROM applied_jobs aj
WHERE NOT EXISTS (
  SELECT 1 FROM students s WHERE s.id = aj.student_id
);

DO $$ 
DECLARE
  pc_deleted INTEGER;
  aj_deleted INTEGER;
BEGIN
  GET DIAGNOSTICS pc_deleted = ROW_COUNT;
  
  DELETE FROM applied_jobs aj
  WHERE NOT EXISTS (
    SELECT 1 FROM students s WHERE s.id = aj.student_id
  );
  
  GET DIAGNOSTICS aj_deleted = ROW_COUNT;
  
  IF pc_deleted > 0 OR aj_deleted > 0 THEN
    RAISE WARNING '⚠️  Deleted orphaned records: pipeline_candidates=%, applied_jobs=%', pc_deleted, aj_deleted;
  ELSE
    RAISE NOTICE '✅ No orphaned records to delete';
  END IF;
END $$;

-- ============================================
-- STEP 5: DROP OLD FOREIGN KEYS
-- ============================================
ALTER TABLE pipeline_candidates 
DROP CONSTRAINT IF EXISTS pipeline_candidates_student_id_fkey;

ALTER TABLE applied_jobs 
DROP CONSTRAINT IF EXISTS fk_applied_jobs_student;

DO $$ BEGIN
  RAISE NOTICE '✅ Old foreign key constraints dropped';
END $$;

-- ============================================
-- STEP 6: CREATE NEW FOREIGN KEYS
-- ============================================
ALTER TABLE pipeline_candidates
ADD CONSTRAINT pipeline_candidates_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES students(id);

ALTER TABLE applied_jobs
ADD CONSTRAINT fk_applied_jobs_student 
FOREIGN KEY (student_id) REFERENCES students(id);

DO $$ BEGIN
  RAISE NOTICE '✅ New foreign key constraints created';
END $$;

-- ============================================
-- STEP 7: VERIFY
-- ============================================
DO $$
DECLARE
  pc_count INTEGER;
  aj_count INTEGER;
  pc_orphaned INTEGER;
  aj_orphaned INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Verification';
  RAISE NOTICE '========================================';
  
  SELECT COUNT(*) INTO pc_count FROM pipeline_candidates;
  SELECT COUNT(*) INTO aj_count FROM applied_jobs;
  
  -- Check for any remaining orphaned records (should be 0)
  SELECT COUNT(*) INTO pc_orphaned
  FROM pipeline_candidates pc
  WHERE NOT EXISTS (
    SELECT 1 FROM students s WHERE s.id = pc.student_id
  );
  
  SELECT COUNT(*) INTO aj_orphaned
  FROM applied_jobs aj
  WHERE NOT EXISTS (
    SELECT 1 FROM students s WHERE s.id = aj.student_id
  );
  
  RAISE NOTICE 'Pipeline_candidates: % total records, % orphaned', pc_count, pc_orphaned;
  RAISE NOTICE 'Applied_jobs: % total records, % orphaned', aj_count, aj_orphaned;
  
  IF pc_orphaned > 0 OR aj_orphaned > 0 THEN
    RAISE EXCEPTION 'Still have orphaned records! Cannot create foreign keys.';
  END IF;
  
  RAISE NOTICE '✅ All records have valid student references';
END $$;

-- Show the orphaned records that were backed up
SELECT 
  'Orphaned pipeline_candidates (backed up in temp table)' as info,
  COUNT(*) as count
FROM orphaned_pipeline_candidates;

SELECT 
  'Orphaned applied_jobs (backed up in temp table)' as info,
  COUNT(*) as count
FROM orphaned_applied_jobs;

COMMIT;

DO $$ BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Foreign keys now reference students.id';
  RAISE NOTICE 'Orphaned records were cleaned up';
  RAISE NOTICE 'Test your application thoroughly!';
END $$;
