-- Check pipeline_candidates data
-- Run this in Supabase SQL Editor to verify data exists

-- 1. Check all pipeline candidates
SELECT 
  pc.id,
  pc.requisition_id,
  pc.student_id,
  pc.candidate_name,
  pc.stage,
  pc.status,
  pc.created_at,
  r.title as job_title
FROM pipeline_candidates pc
LEFT JOIN requisitions r ON pc.requisition_id = r.id
ORDER BY pc.created_at DESC
LIMIT 20;

-- 2. Check candidates grouped by stage
SELECT 
  stage,
  status,
  COUNT(*) as count
FROM pipeline_candidates
GROUP BY stage, status
ORDER BY stage;

-- 3. Check if students data is linked properly
SELECT 
  pc.id as pipeline_id,
  pc.candidate_name,
  pc.stage,
  s.id as student_id,
  s.name as student_name,
  s.email,
  s.profile->>'dept' as dept,
  s.profile->>'college' as college,
  jsonb_array_length(COALESCE(s.profile->'skills', '[]'::jsonb)) as skills_count,
  (s.profile->>'ai_score_overall')::numeric as ai_score
FROM pipeline_candidates pc
LEFT JOIN students s ON pc.student_id = s.id
WHERE pc.status = 'active'
ORDER BY pc.created_at DESC
LIMIT 20;

-- 4. Check for any orphaned candidates (no student record)
SELECT 
  pc.id,
  pc.candidate_name,
  pc.student_id,
  pc.stage,
  CASE 
    WHEN s.id IS NULL THEN 'NO STUDENT RECORD'
    ELSE 'Student exists'
  END as student_status
FROM pipeline_candidates pc
LEFT JOIN students s ON pc.student_id = s.id
WHERE pc.status = 'active'
ORDER BY pc.created_at DESC;
