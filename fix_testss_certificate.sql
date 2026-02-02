-- Fix the "testss" certificate to properly show versioning

-- First, check current state
SELECT 
  id,
  title,
  approval_status,
  has_pending_edit,
  verified_data->>'title' as old_title
FROM certificates
WHERE title = 'testss';

-- Fix: Manually set the verified_data to show "test" as the old version
UPDATE certificates
SET 
  verified_data = jsonb_build_object(
    'title', 'test',
    'issuer', COALESCE(issuer, 'test'),
    'approval_status', 'verified',
    'enabled', true,
    'status', 'active'
  ),
  has_pending_edit = true,
  approval_status = 'pending'
WHERE title = 'testss';

-- Verify the fix
SELECT 
  id,
  title as current_title,
  approval_status as current_status,
  has_pending_edit,
  verified_data->>'title' as old_verified_title,
  verified_data->>'approval_status' as old_verified_status
FROM certificates
WHERE title = 'testss';

-- After running this:
-- 1. Refresh your application
-- 2. Dashboard should show "test" (the old verified version)
-- 3. Settings should show "testss" with "Pending Verification"
