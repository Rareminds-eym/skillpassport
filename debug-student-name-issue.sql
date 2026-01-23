-- Debug script to check why student names are showing as "Unknown"

-- 1. Check pipeline_candidates data
SELECT 
  'Pipeline Candidates Data' as section,
  id,
  student_id,
  candidate_name,
  candidate_email,
  stage
FROM pipeline_candidates
LIMIT 5;

-- 2. Check if student_id matches students.user_id or students.id
SELECT 
  'Student ID Matching Check' as section,
  pc.student_id as pipeline_student_id,
  s1.user_id as students_user_id,
  s1.id as students_id,
  s1.name as student_name,
  CASE 
    WHEN pc.student_id = s1.user_id THEN 'Matches user_id'
    WHEN pc.student_id::text = s1.id::text THEN 'Matches id'
    ELSE 'No match'
  END as match_type
FROM pipeline_candidates pc
LEFT JOIN students s1 ON pc.student_id = s1.user_id
LIMIT 5;

-- 3. Check students table structure
SELECT 
  'Students Table Sample' as section,
  id,
  user_id,
  name,
  email
FROM students
LIMIT 5;

-- 4. Check if candidate_name is populated
SELECT 
  'Candidate Name Population' as section,
  COUNT(*) as total_candidates,
  COUNT(candidate_name) as with_name,
  COUNT(*) - COUNT(candidate_name) as without_name
FROM pipeline_candidates;
