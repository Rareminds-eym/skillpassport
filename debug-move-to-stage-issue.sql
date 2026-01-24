-- Debug script to check pipeline_candidates table structure and data
-- Run this to understand the current state

-- 1. Check column types
SELECT 
  'Column Types' as section,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'pipeline_candidates'
  AND column_name IN ('id', 'opportunity_id', 'student_id')
ORDER BY ordinal_position;

-- 2. Check if there are any pipeline candidates
SELECT 
  'Sample Pipeline Candidates' as section,
  id,
  opportunity_id,
  student_id,
  candidate_name,
  stage,
  status
FROM pipeline_candidates
LIMIT 5;

-- 3. Check for any constraints that might be failing
SELECT
  'Constraints' as section,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'pipeline_candidates';

-- 4. Check if the view exists
SELECT 
  'Views' as section,
  table_name
FROM information_schema.views
WHERE table_name LIKE '%pipeline%';
