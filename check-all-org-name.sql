-- Check ALL experience records for org_name (including hidden ones)
SELECT 
  id,
  role,
  organization,
  enabled,
  has_pending_edit,
  verified_data,
  pending_edit_data,
  CASE 
    WHEN verified_data ? 'org_name' THEN 'verified_data has org_name'
    WHEN pending_edit_data ? 'org_name' THEN 'pending_edit_data has org_name'
    ELSE 'clean'
  END as status
FROM experience
WHERE student_id = '3531e63e-589e-46e7-9248-4a769e84b00d'  -- Your student ID from the log
ORDER BY updated_at DESC;

-- Clean ALL records (including hidden ones)
UPDATE experience
SET verified_data = verified_data - 'org_name'
WHERE verified_data ? 'org_name'
  AND student_id = '3531e63e-589e-46e7-9248-4a769e84b00d';

UPDATE experience
SET pending_edit_data = pending_edit_data - 'org_name'
WHERE pending_edit_data ? 'org_name'
  AND student_id = '3531e63e-589e-46e7-9248-4a769e84b00d';

-- Verify cleanup
SELECT 
  id,
  role,
  verified_data,
  pending_edit_data
FROM experience
WHERE (verified_data ? 'org_name' OR pending_edit_data ? 'org_name')
  AND student_id = '3531e63e-589e-46e7-9248-4a769e84b00d';
