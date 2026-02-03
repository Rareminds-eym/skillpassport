-- Verify the testss certificate has correct versioning data

SELECT 
  id,
  title,
  issuer,
  approval_status,
  has_pending_edit,
  verified_data,
  verified_data->>'title' as verified_title,
  verified_data->>'approval_status' as verified_approval_status,
  enabled,
  created_at,
  updated_at
FROM certificates
WHERE title = 'testss';

-- This should show:
-- title: 'testss'
-- approval_status: 'pending'
-- has_pending_edit: true
-- verified_title: 'test'
-- verified_approval_status: 'verified'
