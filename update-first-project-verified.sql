-- Update the first project to have verified approval status
-- This will make it visible on the dashboard

UPDATE projects
SET 
  approval_status = 'verified',
  has_pending_edit = false,
  verified_data = NULL,
  pending_edit_data = NULL,
  updated_at = NOW()
WHERE id = (
  SELECT id 
  FROM projects 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Verify the update
SELECT 
  id,
  title,
  approval_status,
  has_pending_edit,
  enabled,
  created_at
FROM projects
ORDER BY created_at ASC
LIMIT 3;
