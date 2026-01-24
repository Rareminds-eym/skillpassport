-- Fix foreign keys to reference students.id instead of students.user_id
-- Run this AFTER the UUID migrations are complete

BEGIN;

-- ============================================
-- STEP 1: CHECK STUDENTS TABLE
-- ============================================
DO $$
DECLARE
  has_id BOOLEAN;
  has_user_id BOOLEAN;
  pk_column TEXT;
BEGIN
  -- Check if students has both id and user_id columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'id'
  ) INTO has_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'user_id'
  ) INTO has_user_id;
  
  -- Check which is the primary key
  SELECT kcu.column_name INTO pk_column
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'students'
    AND tc.constraint_type = 'PRIMARY KEY';
  
  RAISE NOTICE 'Students table structure:';
  RAISE NOTICE '  - has id column: %', has_id;
  RAISE NOTICE '  - has user_id column: %', has_user_id;
  RAISE NOTICE '  - primary key: %', pk_column;
  
  IF NOT has_id THEN
    RAISE EXCEPTION 'Students table does not have id column!';
  END IF;
END $$;

-- ============================================
-- STEP 2: FIX PIPELINE_CANDIDATES
-- ============================================
DO $$ BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixing pipeline_candidates foreign key';
  RAISE NOTICE '========================================';
END $$;

-- Drop old constraint
ALTER TABLE pipeline_candidates 
DROP CONSTRAINT IF EXISTS pipeline_candidates_student_id_fkey;

-- Recreate with correct reference
ALTER TABLE pipeline_candidates
ADD CONSTRAINT pipeline_candidates_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES students(id);

DO $$ BEGIN
  RAISE NOTICE '✅ pipeline_candidates foreign key fixed';
END $$;

-- ============================================
-- STEP 3: FIX APPLIED_JOBS
-- ============================================
DO $$ BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixing applied_jobs foreign key';
  RAISE NOTICE '========================================';
END $$;

-- Drop old constraint
ALTER TABLE applied_jobs 
DROP CONSTRAINT IF EXISTS fk_applied_jobs_student;

-- Recreate with correct reference
ALTER TABLE applied_jobs
ADD CONSTRAINT fk_applied_jobs_student 
FOREIGN KEY (student_id) REFERENCES students(id);

DO $$ BEGIN
  RAISE NOTICE '✅ applied_jobs foreign key fixed';
END $$;

-- ============================================
-- STEP 4: VERIFY FOREIGN KEYS
-- ============================================
DO $$ BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Verifying foreign keys';
  RAISE NOTICE '========================================';
END $$;

-- Show all foreign keys pointing to students
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'students'
  AND tc.table_name IN ('pipeline_candidates', 'applied_jobs');

COMMIT;

DO $$ BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FOREIGN KEYS FIXED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Both tables now reference students.id';
  RAISE NOTICE 'Test your application to verify!';
END $$;
