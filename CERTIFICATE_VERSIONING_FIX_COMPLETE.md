# Certificate Versioning Fix - Complete Summary

## Problem
When editing a certificate that already had pending edits (`has_pending_edit = true`), the changes were getting automatically verified instead of staying in pending state. The original verified data was being lost.

## Root Cause
The versioning logic in `updateCertificatesByEmail` only checked if a certificate was verified/approved, but didn't handle the case where a certificate already had pending edits. This caused:

1. **First edit**: "Sports day medal" → "Sports" ✅ (worked correctly, created pending edit)
2. **Second edit**: "Sports" → "Sports Competition" ❌ (overwrote verified_data with "Sports" instead of preserving "Sports day medal")
3. **Third edit**: "Sports Competition" → "Sports Award" ❌ (continued to lose original data)

## Solution
Updated the versioning logic to handle 3 distinct cases:

### Case 1: Certificate Already Has Pending Edits
```javascript
if (existingRecord && existingRecord.has_pending_edit === true) {
  // Preserve the original verified_data
  record.verified_data = existingRecord.verified_data;
  // Update only the pending_edit_data
  record.pending_edit_data = { ...record };
  record.has_pending_edit = true;
  record.approval_status = 'pending';
}
```

### Case 2: First Edit of Verified Certificate
```javascript
else if (existingRecord && (existingRecord.approval_status === 'verified' || existingRecord.approval_status === 'approved')) {
  // Store only essential fields (no embedding, upload, etc.)
  const verifiedData = {
    title: existingRecord.title,
    issuer: existingRecord.issuer,
    level: existingRecord.level,
    credential_id: existingRecord.credential_id,
    link: existingRecord.link,
    issued_on: existingRecord.issued_on,
    expiry_date: existingRecord.expiry_date,
    description: existingRecord.description,
    status: existingRecord.status,
    approval_status: existingRecord.approval_status,
    document_url: existingRecord.document_url,
    platform: existingRecord.platform,
    instructor: existingRecord.instructor,
    category: existingRecord.category,
    enabled: existingRecord.enabled
  };
  
  record.verified_data = verifiedData;
  record.pending_edit_data = { ...record };
  record.has_pending_edit = true;
  record.approval_status = 'pending';
}
```

### Case 3: New or Unverified Certificate
```javascript
else {
  // No versioning needed
  record.verified_data = null;
  record.pending_edit_data = null;
  record.has_pending_edit = false;
}
```

## Data Flow

### Before Fix
```
Edit 1: "Sports day medal" → "Sports"
  verified_data: "Sports day medal" ✅
  pending_edit_data: "Sports" ✅
  
Edit 2: "Sports" → "Sports Competition"
  verified_data: "Sports" ❌ (WRONG! Lost original)
  pending_edit_data: "Sports Competition"
  
Edit 3: "Sports Competition" → "Sports Award"
  verified_data: "Sports Competition" ❌ (WRONG!)
  pending_edit_data: "Sports Award"
```

### After Fix
```
Edit 1: "Sports day medal" → "Sports"
  verified_data: "Sports day medal" ✅
  pending_edit_data: "Sports" ✅
  
Edit 2: "Sports" → "Sports Competition"
  verified_data: "Sports day medal" ✅ (PRESERVED!)
  pending_edit_data: "Sports Competition" ✅
  
Edit 3: "Sports Competition" → "Sports Award"
  verified_data: "Sports day medal" ✅ (STILL PRESERVED!)
  pending_edit_data: "Sports Award" ✅
```

## Benefits

1. ✅ **Original verified data is always preserved** across multiple edits
2. ✅ **Dashboard shows consistent verified version** until admin approves
3. ✅ **Users can make multiple edits** without losing original data
4. ✅ **Admin can see both versions** when reviewing pending edits
5. ✅ **No auto-verification** of pending changes

## Testing

See `TEST_CERTIFICATE_VERSIONING_FIX.md` for detailed test scenarios.

Quick test:
1. Edit a verified certificate 3 times
2. Dashboard should always show the original verified version
3. Edit modal should show the latest pending changes
4. Database `verified_data` should contain original, not intermediate edits

## Files Modified

- `src/services/studentServiceProfile.js` (lines 3143-3170)
  - Added check for `existingRecord.has_pending_edit === true`
  - Preserves original `verified_data` when editing pending certificates
  - Only stores essential fields (no embedding, upload, etc.)

## Related Documentation

- `CERTIFICATE_VERSIONING_EXPLAINED.md` - How versioning system works
- `TEST_CERTIFICATE_VERSIONING_FIX.md` - Test scenarios
- `verify_versioning_fix.sql` - SQL queries to verify fix
- `approve_pending_certificate_edits.sql` - Admin approval workflow

## Next Steps

1. Test the fix on localhost:3000
2. Verify in database using `verify_versioning_fix.sql`
3. Test admin approval workflow
4. Deploy to production when verified
