# Test: Unchanged Certificates Should Stay Verified

## Problem
When editing ONE certificate (e.g., "React" → "React module"), OTHER certificates (SQL, AWS) that were verified are incorrectly changing to "Pending Approval".

## Root Cause
The versioning logic was comparing fields without normalizing null/undefined/empty values, causing false positives for "changes detected".

## Fix Applied
Updated the versioning logic in `updateCertificatesByEmail` to:
1. Normalize null/undefined/empty values before comparison
2. Add console logging to debug which certificates are being versioned
3. Only create versioning if actual data changes are detected

## Test Steps

### 1. Approve All Pending Certificates First
Run this in Supabase SQL Editor to start fresh:

```sql
UPDATE certificates
SET
  title = COALESCE(pending_edit_data->>'title', title),
  issuer = COALESCE(pending_edit_data->>'issuer', issuer),
  verified_data = NULL,
  pending_edit_data = NULL,
  has_pending_edit = false,
  approval_status = 'verified',
  status = 'active',
  updated_at = NOW()
WHERE 
  student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
  AND has_pending_edit = true;
```

### 2. Verify All Certificates Are Verified
```sql
SELECT title, approval_status, has_pending_edit
FROM certificates
WHERE student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
ORDER BY title;
```

Expected: All certificates should have `approval_status = 'verified'` and `has_pending_edit = false`.

### 3. Test Editing ONE Certificate
1. Refresh the page (Ctrl+R)
2. Click eye icon to open certificates
3. All certificates should show "Verified" badge
4. Click edit (pencil) on "React" certificate
5. Change title from "React" to "React module"
6. Click "Update Certificates"
7. **Expected Result**:
   - React: Shows "Pending Approval" ✅ (you edited it)
   - SQL: Shows "Verified" ✅ (you didn't edit it)
   - AWS: Shows "Verified" ✅ (you didn't edit it)
   - psql: Shows "Pending Verification" ✅ (it's a new certificate)

### 4. Check Browser Console
Open browser console (F12) and look for logs like:

```
🔍 Versioning check for "React": { hasChanges: true, ... }
✅ Created versioning for "React" - changes detected

🔍 Versioning check for "SQL": { hasChanges: false, ... }
✅ No changes for "SQL" - keeping approval_status: verified

🔍 Versioning check for "AWS": { hasChanges: false, ... }
✅ No changes for "AWS" - keeping approval_status: verified
```

### 5. Verify in Database
```sql
SELECT 
  title,
  approval_status,
  has_pending_edit,
  verified_data->>'title' as old_title,
  pending_edit_data->>'title' as new_title
FROM certificates
WHERE student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
ORDER BY title;
```

**Expected Result:**
- React: `approval_status = 'pending'`, `has_pending_edit = true`, `old_title = 'React'`, `new_title = 'React module'`
- SQL: `approval_status = 'verified'`, `has_pending_edit = false`, `old_title = NULL`, `new_title = NULL`
- AWS: `approval_status = 'verified'`, `has_pending_edit = false`, `old_title = NULL`, `new_title = NULL`

## What Changed

### Before Fix
```javascript
const hasChanges = 
  record.title !== existingRecord.title ||  // ❌ null !== undefined = true (false positive)
  record.issuer !== existingRecord.issuer ||
  // ...
```

This caused false positives when comparing null vs undefined vs empty string.

### After Fix
```javascript
const normalize = (val) => (val === null || val === undefined || val === '') ? null : val;

const hasChanges = 
  normalize(record.title) !== normalize(existingRecord.title) ||  // ✅ null === null = false
  normalize(record.issuer) !== normalize(existingRecord.issuer) ||
  // ...
```

Now null, undefined, and empty string are all treated as the same value.

## Files Modified
- `src/services/studentServiceProfile.js` (lines 3157-3210)
  - Added `normalize()` function for null/undefined/empty comparison
  - Added console logging for debugging
  - Improved change detection logic

## If It Still Doesn't Work
1. Check browser console for the versioning logs
2. Look for which certificates are showing `hasChanges: true`
3. Check the comparison values to see what's different
4. Run the database query to see the actual data
