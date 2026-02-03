# Test Certificate Versioning Fix

## Issue Fixed
When editing a certificate that already has `has_pending_edit = true`, the changes were getting automatically verified instead of staying in pending state.

## What Changed
Updated the versioning logic in `updateCertificatesByEmail` to handle 3 cases:

1. **Certificate already has pending edits** → Preserve original `verified_data`, update only `pending_edit_data`
2. **First edit of verified/approved certificate** → Create versioning (store verified_data, create pending_edit_data)
3. **New or unverified certificate** → No versioning needed

## Test Scenario

### Setup
1. Start with a verified certificate (e.g., "Sports day medal")
2. Dashboard should show the verified version

### Test Steps

#### Step 1: First Edit (Should create pending edit)
1. Click eye icon → Edit → Change title to "Sports"
2. Click "Update Certificates"
3. Click "Save All Changes"
4. **Expected Result:**
   - Dashboard still shows "Sports day medal" (verified_data)
   - Edit modal shows "Sports" with "Pending Approval" badge
   - Database: `has_pending_edit = true`, `approval_status = 'pending'`

#### Step 2: Second Edit (Should preserve original verified_data)
1. Click eye icon → Edit → Change title to "Sports Competition"
2. Click "Update Certificates"
3. Click "Save All Changes"
4. **Expected Result:**
   - Dashboard STILL shows "Sports day medal" (original verified_data preserved)
   - Edit modal shows "Sports Competition" with "Pending Approval" badge
   - Database: `has_pending_edit = true`, `approval_status = 'pending'`
   - Database: `verified_data` still contains "Sports day medal" (NOT "Sports")

#### Step 3: Third Edit (Should still preserve original)
1. Click eye icon → Edit → Change title to "Sports Award"
2. Click "Update Certificates"
3. Click "Save All Changes"
4. **Expected Result:**
   - Dashboard STILL shows "Sports day medal" (original verified_data preserved)
   - Edit modal shows "Sports Award" with "Pending Approval" badge
   - Database: `verified_data` still contains "Sports day medal"

### Verify in Database

```sql
-- Check the certificate structure
SELECT 
  id,
  title,
  approval_status,
  has_pending_edit,
  verified_data->>'title' as verified_title,
  pending_edit_data->>'title' as pending_title
FROM certificates
WHERE student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
  AND title = 'Sports Award';
```

**Expected Output:**
- `title`: "Sports Award" (current state)
- `approval_status`: "pending"
- `has_pending_edit`: true
- `verified_title`: "Sports day medal" (original verified version)
- `pending_title`: "Sports Award" (latest pending changes)

## Key Points

✅ **Original verified data is preserved** across multiple edits
✅ **Dashboard always shows verified_data** when has_pending_edit = true
✅ **Edit modal always shows pending_edit_data** when has_pending_edit = true
✅ **Changes don't auto-verify** when editing pending certificates
✅ **Only admin approval** can move pending_edit_data → verified_data

## What Happens After Admin Approval

When admin approves the pending edit:
1. `pending_edit_data` → becomes the new `verified_data`
2. `has_pending_edit` → set to false
3. `approval_status` → set to 'verified'
4. Dashboard now shows the approved changes

## Files Modified
- `src/services/studentServiceProfile.js` (lines 3143-3170)
