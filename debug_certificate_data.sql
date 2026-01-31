-- Debug script to check certificate data
-- Run this in Supabase SQL Editor to see what's in your database

-- Check all certificates for a specific student
SELECT 
  id,
  title,
  issuer,
  approval_status,
  has_pending_edit,
  CASE 
    WHEN verified_data IS NOT NULL THEN 'YES'
    ELSE 'NO'
  END as has_verified_data,
  CASE 
    WHEN pending_edit_data IS NOT NULL THEN 'YES'
    ELSE 'NO'
  END as has_pending_data,
  verified_data->>'title' as verified_title,
  enabled,
  created_at,
  updated_at
FROM certificates
ORDER BY updated_at DESC
LIMIT 20;

-- Count certificates by status
SELECT 
  approval_status,
  has_pending_edit,
  COUNT(*) as count
FROM certificates
GROUP BY approval_status, has_pending_edit
ORDER BY approval_status;

-- Check if any certificates have verified_data
SELECT COUNT(*) as certificates_with_verified_data
FROM certificates
WHERE verified_data IS NOT NULL;

-- Check if any certificates have pending_edit_data
SELECT COUNT(*) as certificates_with_pending_data
FROM certificates
WHERE pending_edit_data IS NOT NULL;
