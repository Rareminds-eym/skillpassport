-- Properly approve a certificate with pending edits
-- This script moves pending_edit_data to main fields and clears versioning

-- Replace 'SQL' with the certificate title you want to approve
-- Replace 'testss@gmail.com' with the student email

UPDATE certificates
SET
  -- Move pending_edit_data to main fields
  title = COALESCE(pending_edit_data->>'title', title),
  issuer = COALESCE(pending_edit_data->>'issuer', issuer),
  level = COALESCE(pending_edit_data->>'level', level),
  credential_id = COALESCE(pending_edit_data->>'credential_id', credential_id),
  link = COALESCE(pending_edit_data->>'link', link),
  issued_on = COALESCE((pending_edit_data->>'issued_on')::date, issued_on),
  expiry_date = COALESCE((pending_edit_data->>'expiry_date')::date, expiry_date),
  description = COALESCE(pending_edit_data->>'description', description),
  document_url = COALESCE(pending_edit_data->>'document_url', document_url),
  platform = COALESCE(pending_edit_data->>'platform', platform),
  instructor = COALESCE(pending_edit_data->>'instructor', instructor),
  category = COALESCE(pending_edit_data->>'category', category),
  enabled = COALESCE((pending_edit_data->>'enabled')::boolean, enabled),
  
  -- Clear versioning fields
  verified_data = NULL,
  pending_edit_data = NULL,
  has_pending_edit = false,
  
  -- Set as verified
  approval_status = 'verified',
  status = 'active',
  
  -- Update timestamp
  updated_at = NOW()
WHERE 
  student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
  AND title = 'SQL'
  AND has_pending_edit = true;

-- Verify the update
SELECT 
  title,
  issuer,
  approval_status,
  has_pending_edit,
  verified_data IS NULL as verified_data_cleared,
  pending_edit_data IS NULL as pending_edit_data_cleared
FROM certificates
WHERE student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
  AND title = 'SQL';
