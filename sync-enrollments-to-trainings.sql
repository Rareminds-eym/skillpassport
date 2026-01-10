-- Sync existing course enrollments to trainings table
-- This ensures all enrolled courses show up in "My Learning"

INSERT INTO trainings (
  student_id,
  course_id,
  title,
  organization,
  description,
  duration,
  status,
  completed_modules,
  total_modules,n
  hours_spent,
  approval_status,
  source,
  created_at
)
SELECT DISTINCT
  ce.student_id,
  ce.course_id,
  ce.course_title,
  COALESCE(c.university, 'Internal Platform') as organization,
  c.description,
  c.duration,
  CASE 
    WHEN ce.status = 'completed' THEN 'completed'
    ELSE 'ongoing'
  END as status,
  0 as completed_modules,
  0 as total_modules,
  0 as hours_spent,
  'approved' as approval_status,
  'internal_course' as source,
  ce.enrolled_at as created_at
FROM course_enrollments ce
LEFT JOIN courses c ON ce.course_id = c.course_id
WHERE NOT EXISTS (
  SELECT 1 FROM trainings t
  WHERE t.student_id = ce.student_id
  AND t.title = ce.course_title
)
ORDER BY ce.enrolled_at;

-- Update existing training records with module counts
UPDATE trainings t
SET total_modules = (
  SELECT COUNT(*)
  FROM course_modules cm
  WHERE cm.course_id = t.course_id
)
WHERE t.source = 'internal_course' AND t.course_id IS NOT NULL;

-- Add skills for existing enrollments
INSERT INTO skills (
  student_id,
  training_id,
  name,
  type,
  level,
  approval_status,
  enabled,
  verified
)
SELECT DISTINCT
  t.student_id,
  t.id as training_id,
  cs.skill_name,
  'technical' as type,
  3 as level,
  'approved' as approval_status,
  true as enabled,
  true as verified
FROM trainings t
JOIN course_skills cs ON t.course_id = cs.course_id
WHERE t.source = 'internal_course'
AND NOT EXISTS (
  SELECT 1 FROM skills s
  WHERE s.student_id = t.student_id
  AND s.training_id = t.id
  AND s.name = cs.skill_name
);

-- Verify the sync
SELECT 
  'Enrollments' as source,
  COUNT(*) as count
FROM course_enrollments
UNION ALL
SELECT 
  'Trainings (internal)' as source,
  COUNT(*) as count
FROM trainings
WHERE source = 'internal_course'
UNION ALL
SELECT 
  'Skills from courses' as source,
  COUNT(*) as count
FROM skills
WHERE training_id IN (
  SELECT id FROM trainings WHERE source = 'internal_course'
);
