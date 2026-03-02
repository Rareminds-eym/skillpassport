-- Clean org_name from verified_data and pending_edit_data in experience table
-- This fixes the "column org_name does not exist" error

-- Update verified_data to remove org_name
UPDATE experience
SET verified_data = (
  SELECT jsonb_object_agg(key, value)
  FROM jsonb_each(verified_data)
  WHERE key IN ('role', 'organization', 'start_date', 'end_date', 'duration', 'description', 'enabled')
)
WHERE verified_data IS NOT NULL
  AND verified_data ? 'org_name';

-- Update pending_edit_data to remove org_name
UPDATE experience
SET pending_edit_data = (
  SELECT jsonb_object_agg(key, value)
  FROM jsonb_each(pending_edit_data)
  WHERE key IN ('role', 'organization', 'start_date', 'end_date', 'duration', 'description', 'enabled')
)
WHERE pending_edit_data IS NOT NULL
  AND pending_edit_data ? 'org_name';

-- Verify the cleanup
SELECT 
  id,
  role,
  organization,
  has_pending_edit,
  verified_data,
  pending_edit_data
FROM experience
WHERE has_pending_edit = true
ORDER BY updated_at DESC
LIMIT 10;
