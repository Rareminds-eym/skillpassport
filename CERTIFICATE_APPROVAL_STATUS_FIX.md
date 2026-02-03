# Certificate Approval Status Fix

## Problem
New certificates and edited certificates were getting automatically marked as "verified" instead of staying "pending".

## Root Cause
In `src/services/studentServiceProfile.js` line 3105, the code was conflating two different fields:
- `approval_status`: 'pending' | 'approved' | 'verified' (for verification workflow)
- `status`: 'active' | 'disabled' | 'completed' (for visibility/completion state)

The buggy code was:
```javascript
const approvalSource = cert.approval_status || cert.status || 'pending';
```

This meant if a certificate had `status: 'completed'` or `status: 'active'`, it could be used as the approval_status, causing incorrect behavior.

## Fix Applied
Changed line 3105-3108 to:
```javascript
// IMPORTANT: approval_status and status are different fields!
// approval_status: 'pending' | 'approved' | 'verified' (for verification workflow)
// status: 'active' | 'disabled' | 'completed' (for visibility/completion state)
const approvalSource = cert.approval_status || 'pending';
const approvalStatus = typeof approvalSource === 'string' ? approvalSource.toLowerCase() : 'pending';
```

Now `approval_status` defaults to 'pending' if not explicitly set, and never falls back to the `status` field.

## Expected Behavior After Fix

### New Certificates
1. Click "Update Certificates" → "Add New"
2. Fill in certificate details
3. Click "Save"
4. **Expected**: Certificate shows "Pending Verification" badge
5. **Expected**: Dashboard does NOT show the certificate (it's pending approval)

### Edit Unverified Certificates
1. Edit a certificate with "Pending Verification" badge
2. Make changes and click "Save"
3. **Expected**: Certificate stays "Pending Verification"
4. **Expected**: Changes are saved but still need approval

### Edit Verified Certificates
1. Edit a certificate with "Verified" badge
2. Make changes and click "Save"
3. **Expected**: Certificate shows "Pending Approval" badge in edit modal
4. **Expected**: Dashboard continues to show OLD verified version
5. **Expected**: After admin approval, dashboard shows NEW version

## Testing Steps

1. **Test New Certificate**:
   ```
   - Go to localhost:3000
   - Login as testss@gmail.com
   - Click "Update Certificates"
   - Click "Add New"
   - Fill in: Title="Test New Cert", Issuer="Test Org"
   - Click "Save"
   - Verify badge shows "Pending Verification" (NOT "Verified")
   ```

2. **Test Edit Unverified**:
   ```
   - Find a certificate with "Pending Verification" badge
   - Click edit (pencil icon)
   - Change the title
   - Click "Save"
   - Verify badge still shows "Pending Verification"
   ```

3. **Test Edit Verified**:
   ```
   - Find a certificate with "Verified" badge
   - Click edit (pencil icon)
   - Change the title
   - Click "Save"
   - Verify badge shows "Pending Approval" in edit modal
   - Go to Dashboard
   - Verify Dashboard shows OLD title (not the new one)
   ```

4. **Check Database**:
   Run the diagnostic script:
   ```sql
   -- In Supabase SQL Editor
   SELECT 
     id,
     title,
     issuer,
     approval_status,
     status,
     has_pending_edit,
     verified_data IS NOT NULL as has_verified_data,
     pending_edit_data IS NOT NULL as has_pending_edit_data,
     created_at
   FROM certificates
   WHERE student_id = (
     SELECT id FROM students WHERE email = 'testss@gmail.com' LIMIT 1
   )
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   
   **Expected for new certificates**:
   - `approval_status` = 'pending'
   - `has_pending_edit` = false
   - `has_verified_data` = false
   - `has_pending_edit_data` = false

## Files Modified
- `src/services/studentServiceProfile.js` (line 3105-3108)

## Related Documentation
- `CERTIFICATE_VERSIONING_EXPLAINED.md` - How the versioning system works
- `WHERE_IS_OLD_DATA_STORED.md` - Where verified vs pending data is stored
- `debug_new_certificate_approval.sql` - Diagnostic script
