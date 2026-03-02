-- Quick fix: Remove org_name from JSONB fields in running database
-- Run this against your LOCAL running Supabase instance

BEGIN;

-- Show affected records before fix
SELECT 
  'BEFORE FIX - Records with org_name in JSONB:' as status,
  COUNT(*) as count
FROM experience
WHERE 
  (verified_data ? 'org_name') OR 
  (pending_edit_data ? 'org_name');

-- Apply the fix
UPDATE experience
SET 
  verified_data = CASE 
    WHEN verified_data IS NOT NULL AND verified_data ? 'org_name' THEN 
      (verified_data - 'org_name')
    ELSE verified_data
  END,
  pending_edit_data = CASE 
    WHEN pending_edit_data IS NOT NULL AND pending_edit_data ? 'org_name' THEN 
      (pending_edit_data - 'org_name')
    ELSE pending_edit_data
  END
WHERE 
  (verified_data ? 'org_name') OR 
  (pending_edit_data ? 'org_name');

-- Show affected records after fix
SELECT 
  'AFTER FIX - Records with org_name in JSONB:' as status,
  COUNT(*) as count
FROM experience
WHERE 
  (verified_data ? 'org_name') OR 
  (pending_edit_data ? 'org_name');

-- Show the cleaned records for verification
SELECT 
  id,
  role,
  organization,
  has_pending_edit,
  approval_status,
  verified_data,
  pending_edit_data
FROM experience
WHERE student_id = (
  SELECT id FROM students WHERE email = 'aditi.sharma@aditya.college.edu'
)
ORDER BY updated_at DESC
LIMIT 5;

COMMIT;
