-- Check if student data is actually being retrieved correctly

-- 1. Check the pipeline_candidates table
SELECT 
  '1. Pipeline Candidates' as section,
  id,
  student_id,
  candidate_name,
  candidate_email,
  stage
FROM pipeline_candidates
WHERE status = 'active'
LIMIT 3;

-- 2. Check if student_id matches students.id
SELECT 
  '2. Student ID Match Check' as section,
  pc.id as pipeline_id,
  pc.student_id,
  pc.candidate_name as stored_name,
  s.id as student_table_id,
  s.name as student_table_name,
  s.email as student_table_email,
  CASE 
    WHEN s.id IS NOT NULL THEN '✅ Match Found'
    ELSE '❌ No Match'
  END as match_status
FROM pipeline_candidates pc
LEFT JOIN students s ON pc.student_id = s.id
WHERE pc.status = 'active'
LIMIT 5;

-- 3. Check the view
SELECT 
  '3. View Data' as section,
  id,
  student_id,
  candidate_name,
  student_name,
  student_email
FROM pipeline_candidates_detailed
LIMIT 5;

-- 4. Check if candidate_name is being populated when adding to pipeline
SELECT 
  '4. Candidate Name Population' as section,
  COUNT(*) as total,
  COUNT(CASE WHEN candidate_name IS NOT NULL AND candidate_name != '' THEN 1 END) as with_name,
  COUNT(CASE WHEN candidate_name IS NULL OR candidate_name = '' THEN 1 END) as without_name
FROM pipeline_candidates
WHERE status = 'active';
