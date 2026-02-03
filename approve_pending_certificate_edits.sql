-- Script to view and approve pending certificate edits
-- This is useful when students edit their own verified certificates

-- 1. VIEW ALL PENDING CERTIFICATE EDITS
-- This shows certificates that have pending changes waiting for approval
SELECT 
  id,
  student_id,
  title as current_title_on_dashboard,
  verified_data->>'title' as original_verified_title,
  pending_edit_data->>'title' as new_pending_title,
  approval_status,
  has_pending_edit,
  updated_at
FROM certificates
WHERE has_pending_edit = true
ORDER BY updated_at DESC;

-- 2. APPROVE A SPECIFIC CERTIFICATE EDIT (Replace the ID)
-- This applies the pending changes and marks them as verified
/*
UPDATE certificates
SET 
  title = pending_edit_data->>'title',
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
  approval_status = 'verified',
  has_pending_edit = false,
  verified_data = NULL,
  pending_edit_data = NULL,
  updated_at = NOW()
WHERE id = 'YOUR-CERTIFICATE-ID-HERE';
*/

-- 3. APPROVE ALL PENDING EDITS FOR A SPECIFIC STUDENT (Replace the email)
-- Use this to approve all pending certificate changes for one student
/*
UPDATE certificates c
SET 
  title = c.pending_edit_data->>'title',
  issuer = COALESCE(c.pending_edit_data->>'issuer', c.issuer),
  level = COALESCE(c.pending_edit_data->>'level', c.level),
  credential_id = COALESCE(c.pending_edit_data->>'credential_id', c.credential_id),
  link = COALESCE(c.pending_edit_data->>'link', c.link),
  issued_on = COALESCE((c.pending_edit_data->>'issued_on')::date, c.issued_on),
  expiry_date = COALESCE((c.pending_edit_data->>'expiry_date')::date, c.expiry_date),
  description = COALESCE(c.pending_edit_data->>'description', c.description),
  document_url = COALESCE(c.pending_edit_data->>'document_url', c.document_url),
  platform = COALESCE(c.pending_edit_data->>'platform', c.platform),
  instructor = COALESCE(c.pending_edit_data->>'instructor', c.instructor),
  category = COALESCE(c.pending_edit_data->>'category', c.category),
  approval_status = 'verified',
  has_pending_edit = false,
  verified_data = NULL,
  pending_edit_data = NULL,
  updated_at = NOW()
FROM students s
WHERE c.student_id = s.id 
  AND s.email = 'student@example.com'
  AND c.has_pending_edit = true;
*/

-- 4. REJECT/REVERT A PENDING EDIT (go back to verified version)
-- This discards the pending changes and restores the verified version
/*
UPDATE certificates
SET 
  has_pending_edit = false,
  pending_edit_data = NULL,
  approval_status = 'verified',
  updated_at = NOW()
WHERE id = 'YOUR-CERTIFICATE-ID-HERE';
*/

-- 5. DISABLE VERSIONING FOR SELF-EDITS (OPTIONAL)
-- If you want students to be able to edit their own verified certificates without approval,
-- you can modify the update function to skip versioning for certain cases.
-- This is more complex and requires changing the application logic.

-- 6. CHECK SPECIFIC CERTIFICATE DETAILS
-- Replace 'Sports day medal' with your certificate title
SELECT 
  id,
  title,
  issuer,
  approval_status,
  has_pending_edit,
  verified_data,
  pending_edit_data,
  enabled,
  created_at,
  updated_at
FROM certificates
WHERE title LIKE '%Sports%'
ORDER BY updated_at DESC;
