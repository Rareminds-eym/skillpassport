-- Test Experience Setup
-- This will help verify the experience functionality

-- 1. Check existing experience for Aditi Sharma
SELECT 
  e.id,
  e.role,
  e.organization,
  e.approval_status,
  e.has_pending_edit,
  e.enabled,
  s.email
FROM experience e
JOIN students s ON e.student_id = s.id
WHERE s.email = 'aditi.sharma@aditya.college.edu'
ORDER BY e.created_at DESC;

-- 2. If no experience exists, insert a test verified experience
-- Uncomment and run if needed:
/*
INSERT INTO experience (
  student_id,
  role,
  organization,
  start_date,
  end_date,
  description,
  approval_status,
  enabled,
  has_pending_edit
)
SELECT 
  s.id,
  'Software Developer',
  'Tech Company',
  '2023-01-01',
  '2024-01-01',
  'Worked on web development projects',
  'verified',
  true,
  false
FROM students s
WHERE s.email = 'aditi.sharma@aditya.college.edu'
RETURNING *;
*/

-- 3. Update first experience to verified (if it's pending)
UPDATE experience
SET 
  approval_status = 'verified',
  has_pending_edit = false,
  verified_data = NULL,
  pending_edit_data = NULL,
  updated_at = NOW()
WHERE id = (
  SELECT e.id 
  FROM experience e
  JOIN students s ON e.student_id = s.id
  WHERE s.email = 'aditi.sharma@aditya.college.edu'
  ORDER BY e.created_at ASC
  LIMIT 1
)
RETURNING id, role, organization, approval_status;
