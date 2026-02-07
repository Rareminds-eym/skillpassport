-- Check if org_name exists in JSONB fields
SELECT 
  id,
  role,
  organization,
  verified_data,
  pending_edit_data,
  has_pending_edit,
  verified_data ? 'org_name' as has_org_name_in_verified,
  pending_edit_data ? 'org_name' as has_org_name_in_pending
FROM experience
WHERE student_id = (
  SELECT id FROM students WHERE email = 'testss@gmail.com'
)
ORDER BY created_at DESC;
