-- Check the SDE experience record to see its approval_status and versioning data
SELECT 
  id,
  role,
  organization,
  approval_status,
  has_pending_edit,
  verified_data,
  pending_edit_data,
  created_at,
  updated_at
FROM experience
WHERE 
  student_id = '3531e63e-589e-46e7-9248-4a769e84b00d'
  AND role LIKE '%SDE%'
ORDER BY updated_at DESC;

-- Also check all experience for this student
SELECT 
  role,
  organization,
  approval_status,
  has_pending_edit,
  CASE 
    WHEN verified_data IS NOT NULL THEN 'Has verified_data'
    ELSE 'No verified_data'
  END as verified_data_status,
  CASE 
    WHEN pending_edit_data IS NOT NULL THEN 'Has pending_edit_data'
    ELSE 'No pending_edit_data'
  END as pending_edit_data_status
FROM experience
WHERE student_id = '3531e63e-589e-46e7-9248-4a769e84b00d'
ORDER BY updated_at DESC;
