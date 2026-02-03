-- Fix certificates approval_status to show verified badge
-- This sets all certificates to 'approved' status so they show the verified badge

-- Update all certificates that don't have approval_status set
UPDATE certificates
SET approval_status = 'approved'
WHERE approval_status IS NULL 
   OR approval_status NOT IN ('approved', 'verified', 'pending', 'rejected');

-- Verify the update
SELECT 
  COUNT(*) as total_certificates,
  COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN approval_status = 'verified' THEN 1 END) as verified_count,
  COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN approval_status IS NULL THEN 1 END) as null_count
FROM certificates;

-- Optional: View all certificates with their approval status
SELECT 
  id,
  title,
  issuer,
  approval_status,
  enabled,
  created_at
FROM certificates
ORDER BY created_at DESC
LIMIT 20;
