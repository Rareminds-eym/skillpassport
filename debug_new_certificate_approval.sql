-- Debug script to check approval status of recently created certificates
-- Run this in Supabase SQL Editor after creating a new certificate

-- Check the most recent certificates
SELECT 
  id,
  title,
  issuer,
  approval_status,
  status,
  has_pending_edit,
  verified_data IS NOT NULL as has_verified_data,
  pending_edit_data IS NOT NULL as has_pending_edit_data,
  created_at,
  updated_at
FROM certificates
WHERE student_id = (
  SELECT id FROM students WHERE email = 'testss@gmail.com' LIMIT 1
)
ORDER BY created_at DESC
LIMIT 5;

-- Check if there are any triggers or policies that might auto-approve
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'certificates';
