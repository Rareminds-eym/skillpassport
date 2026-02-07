-- Check the specific experience record that's failing
SELECT 
  id,
  role,
  organization,
  approval_status,
  has_pending_edit,
  verified_data,
  pending_edit_data,
  verified_data ? 'org_name' as has_org_name_in_verified,
  pending_edit_data ? 'org_name' as has_org_name_in_pending
FROM experience
WHERE id = '19e36dc9-1eb8-4749-8f86-97d496021f1b';
