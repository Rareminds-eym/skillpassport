SELECT 
  id,
  role,
  organization,
  approval_status,
  has_pending_edit,
  verified_data,
  pending_edit_data
FROM experience
WHERE has_pending_edit = true
ORDER BY updated_at DESC
LIMIT 10;
