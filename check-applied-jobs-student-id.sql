-- Check what applied_jobs.student_id actually references

-- 1. Check applied_jobs table
SELECT 
  '1. Applied Jobs Sample' as section,
  id,
  student_id,
  opportunity_id,
  application_status
FROM applied_jobs
LIMIT 5;

-- 2. Check if student_id matches students.user_id or students.id
SELECT 
  '2. Student ID Match Check' as section,
  aj.student_id as applied_jobs_student_id,
  s1.user_id as match_by_user_id,
  s1.name as name_by_user_id,
  s2.id as match_by_id,
  s2.name as name_by_id,
  CASE 
    WHEN s1.user_id IS NOT NULL THEN '✅ Matches user_id'
    WHEN s2.id IS NOT NULL THEN '✅ Matches id'
    ELSE '❌ No match'
  END as match_type
FROM applied_jobs aj
LEFT JOIN students s1 ON aj.student_id = s1.user_id
LEFT JOIN students s2 ON aj.student_id = s2.id
LIMIT 5;

-- 3. Check foreign key constraints
SELECT
  '3. Foreign Key Constraints' as section,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'applied_jobs'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'student_id';

-- 4. Check pipeline_candidates foreign key
SELECT
  '4. Pipeline Candidates FK' as section,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'pipeline_candidates'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'student_id';
