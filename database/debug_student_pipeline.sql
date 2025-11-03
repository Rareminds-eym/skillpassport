-- Debug query to check student P.DURKADEVID's pipeline status

-- 1. Find the student
SELECT id, name, email 
FROM students 
WHERE name ILIKE '%DURKADEVID%' OR email ILIKE '%durkadevid%';

-- 2. Check their applications
SELECT 
  aj.id as application_id,
  aj.student_id,
  aj.opportunity_id,
  aj.application_status,
  o.job_title,
  o.company_name,
  o.requisition_id
FROM applied_jobs aj
LEFT JOIN opportunities o ON aj.opportunity_id = o.id
WHERE aj.student_id IN (
  SELECT id FROM students WHERE name ILIKE '%DURKADEVID%'
);

-- 3. Check pipeline_candidates for this student
SELECT 
  pc.id,
  pc.student_id,
  pc.candidate_name,
  pc.stage,
  pc.status,
  pc.requisition_id,
  pc.stage_changed_at,
  r.title as job_title
FROM pipeline_candidates pc
LEFT JOIN requisitions r ON pc.requisition_id = r.id
WHERE pc.candidate_name ILIKE '%DURKADEVID%' 
   OR pc.student_id IN (SELECT id FROM students WHERE name ILIKE '%DURKADEVID%');

-- 4. Check the combined view
SELECT 
  aj.id as application_id,
  aj.student_id,
  s.name as student_name,
  o.job_title,
  o.requisition_id,
  pc.stage as pipeline_stage,
  pc.status as pipeline_status,
  CASE WHEN pc.id IS NOT NULL THEN true ELSE false END as has_pipeline_status
FROM applied_jobs aj
LEFT JOIN students s ON aj.student_id = s.id
LEFT JOIN opportunities o ON aj.opportunity_id = o.id
LEFT JOIN pipeline_candidates pc ON pc.requisition_id = o.requisition_id 
  AND pc.student_id = aj.student_id
  AND pc.status = 'active'
WHERE s.name ILIKE '%DURKADEVID%';
