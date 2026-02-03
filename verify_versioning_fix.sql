-- Verify Certificate Versioning Fix
-- This script helps you check if the versioning logic is working correctly

-- 1. Check testss@gmail.com certificates with pending edits
SELECT 
  id,
  title as current_title,
  approval_status,
  has_pending_edit,
  verified_data->>'title' as verified_title,
  pending_edit_data->>'title' as pending_title,
  created_at,
  updated_at
FROM certificates
WHERE student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
  AND has_pending_edit = true
ORDER BY updated_at DESC;

-- 2. Detailed view of a specific certificate (replace with your certificate ID)
-- SELECT 
--   id,
--   title,
--   issuer,
--   approval_status,
--   has_pending_edit,
--   verified_data,
--   pending_edit_data
-- FROM certificates
-- WHERE id = 'YOUR_CERTIFICATE_ID_HERE';

-- 3. Check if verified_data is preserved correctly
-- This should show that verified_data contains the ORIGINAL verified version
-- NOT any intermediate edits
SELECT 
  id,
  title as current_title,
  verified_data->>'title' as original_verified_title,
  verified_data->>'issuer' as original_verified_issuer,
  pending_edit_data->>'title' as latest_pending_title,
  pending_edit_data->>'issuer' as latest_pending_issuer,
  updated_at
FROM certificates
WHERE student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
  AND has_pending_edit = true;

-- 4. Count certificates by status
SELECT 
  approval_status,
  has_pending_edit,
  COUNT(*) as count
FROM certificates
WHERE student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
GROUP BY approval_status, has_pending_edit
ORDER BY approval_status, has_pending_edit;

-- Expected Results After Multiple Edits:
-- - verified_data should contain the ORIGINAL verified version (e.g., "Sports day medal")
-- - pending_edit_data should contain the LATEST changes (e.g., "Sports Award")
-- - has_pending_edit should be true
-- - approval_status should be 'pending'
