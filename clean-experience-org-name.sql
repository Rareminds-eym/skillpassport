-- Clean org_name from JSONB fields in experience table
-- This removes the old field that's causing the error

-- First, let's see what we're cleaning
SELECT 
  id,
  role,
  organization,
  verified_data,
  pending_edit_data
FROM experience
WHERE 
  verified_data ? 'org_name' 
  OR pending_edit_data ? 'org_name';

-- Clean verified_data
UPDATE experience
SET verified_data = verified_data - 'org_name'
WHERE verified_data ? 'org_name';

-- Clean pending_edit_data
UPDATE experience
SET pending_edit_data = pending_edit_data - 'org_name'
WHERE pending_edit_data ? 'org_name';

-- Verify the cleanup
SELECT 
  id,
  role,
  organization,
  verified_data,
  pending_edit_data,
  verified_data ? 'org_name' as still_has_org_name_in_verified,
  pending_edit_data ? 'org_name' as still_has_org_name_in_pending
FROM experience
WHERE student_id = (
  SELECT id FROM students WHERE email = 'testss@gmail.com'
)
ORDER BY created_at DESC;
