-- Clean org_name from verified_data and pending_edit_data JSONB fields in experience table
-- This removes the old field that's causing "column org_name does not exist" errors

-- First, let's see what we're dealing with
SELECT 
  id,
  role,
  organization,
  CASE 
    WHEN verified_data ? 'org_name' THEN 'HAS org_name'
    ELSE 'clean'
  END as verified_status,
  CASE 
    WHEN pending_edit_data ? 'org_name' THEN 'HAS org_name'
    ELSE 'clean'
  END as pending_status,
  verified_data,
  pending_edit_data
FROM experience
WHERE verified_data ? 'org_name' OR pending_edit_data ? 'org_name';

-- Clean verified_data: remove org_name key
UPDATE experience
SET verified_data = verified_data - 'org_name'
WHERE verified_data ? 'org_name';

-- Clean pending_edit_data: remove org_name key
UPDATE experience
SET pending_edit_data = pending_edit_data - 'org_name'
WHERE pending_edit_data ? 'org_name';

-- Verify the cleanup
SELECT 
  id,
  role,
  organization,
  CASE 
    WHEN verified_data ? 'org_name' THEN 'STILL HAS org_name - ERROR!'
    ELSE 'clean ✓'
  END as verified_status,
  CASE 
    WHEN pending_edit_data ? 'org_name' THEN 'STILL HAS org_name - ERROR!'
    ELSE 'clean ✓'
  END as pending_status
FROM experience
WHERE verified_data IS NOT NULL OR pending_edit_data IS NOT NULL;

-- Show summary
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN verified_data IS NOT NULL THEN 1 END) as has_verified_data,
  COUNT(CASE WHEN pending_edit_data IS NOT NULL THEN 1 END) as has_pending_data,
  COUNT(CASE WHEN verified_data ? 'org_name' THEN 1 END) as verified_has_org_name,
  COUNT(CASE WHEN pending_edit_data ? 'org_name' THEN 1 END) as pending_has_org_name
FROM experience;
