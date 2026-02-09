-- Check for org_name in JSONB fields
SELECT 
  id,
  role,
  organization,
  verified_data,
  pending_edit_data,
  has_pending_edit,
  approval_status
FROM experience
WHERE 
  (verified_data ? 'org_name') OR 
  (pending_edit_data ? 'org_name')
ORDER BY updated_at DESC;

-- Fix: Remove org_name from verified_data and pending_edit_data
UPDATE experience
SET 
  verified_data = CASE 
    WHEN verified_data IS NOT NULL THEN 
      (verified_data - 'org_name')
    ELSE NULL
  END,
  pending_edit_data = CASE 
    WHEN pending_edit_data IS NOT NULL THEN 
      (pending_edit_data - 'org_name')
    ELSE NULL
  END
WHERE 
  (verified_data ? 'org_name') OR 
  (pending_edit_data ? 'org_name');

-- Verify the fix
SELECT 
  id,
  role,
  organization,
  verified_data,
  pending_edit_data,
  has_pending_edit,
  approval_status
FROM experience
WHERE 
  student_id = (SELECT id FROM students WHERE email = 'aditi.sharma@aditya.college.edu')
ORDER BY updated_at DESC;
