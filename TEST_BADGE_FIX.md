# Test Badge Fix

## Quick Test Steps

1. **Refresh the page** (Ctrl+R or Cmd+R on localhost:3000)

2. **Click the eye icon** to open "Edit Certificates" modal

3. **Check each certificate** - each should show ONLY ONE badge:

   - **AWS**: Should show "Pending Approval" only (not "active" + "Pending Approval")
   - **React test**: Should show "Verified" only (not "active" + "Verified")
   - **SQL**: Should show "Verified" only (not "active" + "Verified")
   - **psql**: Should show "Pending Verification" only (not "active" + "Pending Verification" + "Processing")

4. **Expected Result**: Each certificate has exactly ONE badge

## Badge Priority (from highest to lowest)

1. 🟠 **Unsaved Changes** - You have local changes not saved yet
2. 🟡 **Pending Approval** - Edited verified certificate waiting for admin approval
3. 🟡 **Pending Verification** - New certificate waiting for verification
4. 🟢 **Verified** - Certificate is verified/approved
5. 🔵 **Status** - Only shows if status is "completed" (not "active")

## What Changed

- ✅ Fixed multiple badges showing at once
- ✅ Hidden "active" badge (it's the default, no need to show)
- ✅ Removed "Processing" badge (was causing confusion)
- ✅ Only ONE badge shows per certificate

## If You Still See Multiple Badges

1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Check browser console for errors (F12)
4. Run `debug_psql_certificate.sql` in Supabase to check database

## Database Check

Run this in Supabase SQL Editor:

```sql
SELECT 
  title,
  status,
  approval_status,
  has_pending_edit
FROM certificates
WHERE student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
ORDER BY title;
```

Expected:
- AWS: `approval_status = 'pending'`, `has_pending_edit = true`
- React test: `approval_status = 'verified'`
- SQL: `approval_status = 'verified'`
- psql: `approval_status = 'pending'`, `has_pending_edit = false`
