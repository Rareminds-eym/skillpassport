-- Fix existing pending certificates that were edited before migration
-- This script will check if there are certificates with approval_status='pending' 
-- but no verified_data, and will clear them so they can be re-edited properly

-- First, let's see what we have
SELECT 
  id,
  title,
  approval_status,
  has_pending_edit,
  verified_data IS NOT NULL as has_verified_data,
  pending_edit_data IS NOT NULL as has_pending_data
FROM certificates
WHERE approval_status = 'pending';

-- Option 1: Reset pending certificates to their current state as "verified"
-- (Use this if you want to keep the current edited data and mark it as verified)
/*
UPDATE certificates
SET 
  approval_status = 'verified',
  has_pending_edit = false,
  verified_data = NULL,
  pending_edit_data = NULL
WHERE approval_status = 'pending' 
  AND verified_data IS NULL;
*/

-- Option 2: Delete pending certificates that have no verified backup
-- (Use this if you want to remove the pending edits and start fresh)
/*
DELETE FROM certificates
WHERE approval_status = 'pending' 
  AND verified_data IS NULL;
*/

-- After running one of the options above, you can test by:
-- 1. Refresh your application
-- 2. Edit a VERIFIED certificate
-- 3. Check if the old verified data still shows on dashboard
