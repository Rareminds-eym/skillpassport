# Manual Certificate Approval Guide

## Problem
You changed `approval_status = 'verified'` in the database, but the frontend still shows "Pending Approval".

## Why This Happens
The frontend checks `has_pending_edit` field BEFORE checking `approval_status`. The badge logic is:

```javascript
if (item._hasPendingEdit) {
  // Show "Pending Approval" badge
} else if (item.approval_status === 'verified') {
  // Show "Verified" badge
}
```

So even if `approval_status = 'verified'`, if `has_pending_edit = true`, it will show "Pending Approval".

## What You Need to Change
To properly approve a pending edit, you need to update 4 fields:

1. ✅ `approval_status` = 'verified' (you already did this)
2. ❌ `has_pending_edit` = false (you need to do this)
3. ❌ `pending_edit_data` = NULL (you need to do this)
4. ❌ `verified_data` = NULL (you need to do this)

## Quick Fix - Run This SQL

### Option 1: Approve ALL Pending Certificates
Run `approve_all_pending_certificates.sql` in Supabase SQL Editor.

This will:
- Move all data from `pending_edit_data` to main fields
- Set `approval_status = 'verified'`
- Set `has_pending_edit = false`
- Clear `pending_edit_data` and `verified_data`

### Option 2: Approve Only SQL Certificate
Run `approve_sql_certificate.sql` in Supabase SQL Editor.

This will approve only the SQL certificate.

### Option 3: Manual Update (Quick)
If you just want to quickly test, run this:

```sql
UPDATE certificates
SET 
  approval_status = 'verified',
  has_pending_edit = false,
  pending_edit_data = NULL,
  verified_data = NULL
WHERE student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
  AND title = 'SQL';
```

## After Running the SQL
1. Refresh the page (Ctrl+R or Cmd+R)
2. Click eye icon to open certificates
3. SQL certificate should now show "Verified" badge

## Understanding the Versioning System

### When a Verified Certificate is Edited:
1. Original data → stored in `verified_data`
2. New changes → stored in `pending_edit_data`
3. `has_pending_edit` = true
4. `approval_status` = 'pending'
5. Dashboard shows `verified_data` (old version)
6. Edit modal shows `pending_edit_data` (new version)

### When Admin Approves:
1. `pending_edit_data` → moved to main fields
2. `has_pending_edit` = false
3. `approval_status` = 'verified'
4. `pending_edit_data` = NULL
5. `verified_data` = NULL
6. Dashboard now shows the approved changes

## Files Created
- `approve_all_pending_certificates.sql` - Approve all pending edits
- `approve_sql_certificate.sql` - Approve only SQL certificate
- `approve_pending_certificate_edits.sql` - General approval script

## Testing
After approval, verify in database:
```sql
SELECT 
  title,
  approval_status,
  has_pending_edit,
  pending_edit_data IS NOT NULL as has_pending_data,
  verified_data IS NOT NULL as has_verified_data
FROM certificates
WHERE student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
  AND title = 'SQL';
```

Expected result:
- `approval_status` = 'verified'
- `has_pending_edit` = false
- `has_pending_data` = false
- `has_verified_data` = false
