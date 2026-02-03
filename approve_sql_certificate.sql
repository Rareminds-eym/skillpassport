-- Approve the SQL certificate pending edit
-- This moves pending_edit_data to become the main data and clears versioning fields

UPDATE certificates
SET 
  -- Move pending edit data to main fields (if you want to keep the changes)
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
  
  -- Set approval status to verified
  approval_status = 'verified',
  
  -- Clear versioning fields
  has_pending_edit = false,
  pending_edit_data = NULL,
  verified_data = NULL,
  
  -- Update timestamp
  updated_at = NOW()
WHERE student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
  AND title = 'SQL'
  AND has_pending_edit = true;

-- Verify the update
SELECT 
  id,
  title,
  issuer,
  approval_status,
  has_pending_edit,
  verified_data IS NOT NULL as has_verified_data,
  pending_edit_data IS NOT NULL as has_pending_edit_data
FROM certificates
WHERE student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
  AND title = 'SQL';
