-- Check the specific experience record that's failing
SELECT 
  id,
  student_id,
  role,
  organization,
  start_date,
  end_date,
  duration,
  description,
  approval_status,
  has_pending_edit,
  enabled,
  verified_data,
  pending_edit_data,
  created_at,
  updated_at
FROM experience
WHERE id = '19e36dc9-1eb8-4749-8f86-97d496021f1b';

-- Also check all experience for this student
SELECT 
  id,
  role,
  organization,
  approval_status,
  has_pending_edit,
  enabled,
  jsonb_object_keys(verified_data) as verified_keys,
  jsonb_object_keys(pending_edit_data) as pending_keys
FROM experience
WHERE student_id = '3531e63e-589e-46e7-9248-4a769e84b00d'
ORDER BY updated_at DESC;
