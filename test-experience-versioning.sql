-- Test experience versioning by manually creating a pending edit
UPDATE experience 
SET 
  role = 'market intern',
  has_pending_edit = true,
  verified_data = '{"role": "Marketing Intern", "organization": "Company", "start_date": "2024-01-01", "end_date": "2025-12-31", "enabled": true}'::jsonb,
  pending_edit_data = '{"role": "market intern", "organization": "Company", "start_date": "2024-01-01", "end_date": "2025-12-31", "enabled": true}'::jsonb,
  approval_status = 'pending',
  updated_at = NOW()
WHERE id = '9e48d6b0-0ced-44f2-aa2d-2b6f032fb715';

-- Verify the update
SELECT 
  id,
  role,
  organization,
  approval_status,
  has_pending_edit,
  verified_data->>'role' as verified_role,
  pending_edit_data->>'role' as pending_role
FROM experience 
WHERE id = '9e48d6b0-0ced-44f2-aa2d-2b6f032fb715';
