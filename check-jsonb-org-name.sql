-- Check the actual JSONB content for org_name
SELECT 
  id,
  role,
  organization,
  has_pending_edit,
  verified_data,
  pending_edit_data,
  verified_data ? 'org_name' as verified_has_org_name,
  pending_edit_data ? 'org_name' as pending_has_org_name
FROM experience
WHERE student_id = (
  SELECT id FROM students 
  WHERE email = 'your-email@example.com'  -- Replace with your test user email
)
ORDER BY updated_at DESC
LIMIT 5;

-- Or check all records
SELECT 
  id,
  role,
  organization,
  verified_data,
  pending_edit_data
FROM experience
WHERE 
  verified_data ? 'org_name' 
  OR pending_edit_data ? 'org_name'
LIMIT 10;
