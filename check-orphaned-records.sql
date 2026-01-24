a-- Check for orphaned records in pipeline_candidates and applied_jobs

-- ============================================
-- CHECK PIPELINE_CANDIDATES
-- ============================================
SELECT 
  'pipeline_candidates' as table_name,
  COUNT(*) as orphaned_count
FROM pipeline_candidates pc
WHERE NOT EXISTS (
  SELECT 1 FROM students s 
  WHERE s.id = pc.student_id
);

-- Show sample orphaned records
SELECT 
  'pipeline_candidates orphaned records' as info,
  pc.id,
  pc.student_id,
  pc.candidate_name,
  pc.candidate_email
FROM pipeline_candidates pc
WHERE NOT EXISTS (
  SELECT 1 FROM students s 
  WHERE s.id = pc.student_id
)
LIMIT 10;

-- ============================================
-- CHECK APPLIED_JOBS
-- ============================================
SELECT 
  'applied_jobs' as table_name,
  COUNT(*) as orphaned_count
FROM applied_jobs aj
WHERE NOT EXISTS (
  SELECT 1 FROM students s 
  WHERE s.id = aj.student_id
);

-- Show sample orphaned records
SELECT 
  'applied_jobs orphaned records' as info,
  aj.id,
  aj.student_id,
  aj.application_status,
  aj.applied_at
FROM applied_jobs aj
WHERE NOT EXISTS (
  SELECT 1 FROM students s 
  WHERE s.id = aj.student_id
)
LIMIT 10;

-- ============================================
-- CHECK IF STUDENTS HAS user_id COLUMN
-- ============================================
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'students'
  AND column_name IN ('id', 'user_id')
ORDER BY column_name;

-- ============================================
-- CHECK IF student_id MATCHES user_id INSTEAD
-- ============================================
-- Maybe student_id is actually matching students.user_id?
SELECT 
  'Checking if student_id matches user_id' as info,
  COUNT(*) as matching_user_id_count
FROM pipeline_candidates pc
WHERE EXISTS (
  SELECT 1 FROM students s 
  WHERE s.user_id = pc.student_id
);

SELECT 
  'Checking if student_id matches user_id' as info,
  COUNT(*) as matching_user_id_count
FROM applied_jobs aj
WHERE EXISTS (
  SELECT 1 FROM students s 
  WHERE s.user_id = aj.student_id
);
