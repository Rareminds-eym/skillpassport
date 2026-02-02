# How to Approve Certificates Properly

## The Problem
When you manually change `approval_status = 'verified'` in the database, the frontend still shows "Pending Approval" because the certificate has `has_pending_edit = true`.

## Why This Happens
The badge logic checks fields in this priority order:
1. `_hasLocalChanges` → Shows "Unsaved Changes"
2. `_hasPendingEdit` → Shows "Pending Approval" ⚠️ **This is checked FIRST**
3. `approval_status === 'pending'` → Shows "Pending Verification"
4. `approval_status === 'verified'` → Shows "Verified"

So even if you set `approval_status = 'verified'`, if `has_pending_edit = true`, it will show "Pending Approval".

## What You Need to Do
To properly approve a certificate, you need to:

1. ✅ Move `pending_edit_data` → main fields (title, issuer, etc.)
2. ✅ Clear `pending_edit_data` (set to NULL)
3. ✅ Clear `verified_data` (set to NULL)
4. ✅ Set `has_pending_edit = false`
5. ✅ Set `approval_status = 'verified'`

## Quick Fix - Approve All Pending Certificates

Run this in Supabase SQL Editor:

```sql
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
  
  updated_at = NOW()
WHERE 
  student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
  AND has_pending_edit = true;
```

## Approve Single Certificate

Run this in Supabase SQL Editor (replace 'SQL' with certificate title):

```sql
UPDATE certificates
SET
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
  verified_data = NULL,
  pending_edit_data = NULL,
  has_pending_edit = false,
  approval_status = 'verified',
  status = 'active',
  updated_at = NOW()
WHERE 
  student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
  AND title = 'SQL'
  AND has_pending_edit = true;
```

## Verify the Fix

After running the approval script, check:

```sql
SELECT 
  title,
  issuer,
  approval_status,
  has_pending_edit,
  verified_data IS NULL as verified_data_cleared,
  pending_edit_data IS NULL as pending_edit_data_cleared
FROM certificates
WHERE student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
ORDER BY title;
```

**Expected Result:**
- `approval_status` = 'verified'
- `has_pending_edit` = false
- `verified_data_cleared` = true
- `pending_edit_data_cleared` = true

## Test in Frontend

1. Refresh the page (Ctrl+R)
2. Click eye icon to open certificates
3. All approved certificates should show "Verified" badge (green)
4. No "Pending Approval" badges

## Understanding the Badge Logic

```javascript
{item._hasLocalChanges ? (
  <Badge>Unsaved Changes</Badge>
) : item._hasPendingEdit ? (           // ← Checks has_pending_edit FIRST
  <Badge>Pending Approval</Badge>
) : item.approval_status === 'pending' ? (
  <Badge>Pending Verification</Badge>
) : (item.approval_status === 'approved' || item.approval_status === 'verified') ? (
  <Badge>Verified</Badge>
) : null}
```

The `_hasPendingEdit` flag comes from `has_pending_edit` in the database, which is set when processing items in the modal.

## Files Created
- `approve_certificate_properly.sql` - Approve single certificate
- `approve_all_pending_certificates.sql` - Approve all pending certificates
- `HOW_TO_APPROVE_CERTIFICATES.md` - This guide
