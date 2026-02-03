# Versioning System - Implementation Summary

## What I've Done

### ✅ Step 1: Database Migration Files Created
- `database/migrations/add_pending_edit_fields.sql` - Adds versioning columns
- `RUN_PENDING_EDIT_MIGRATION.md` - Instructions to run migration

### ✅ Step 2: Helper Utilities Created
- `src/utils/versioningHelper.js` - Versioning logic functions

### ✅ Step 3: Updated `updateCertificatesByEmail` Function
Modified `src/services/studentServiceProfile.js` line ~3070 to:
- Check if editing verified data
- If yes, preserve verified data in `verified_data` column
- Store new edit in `pending_edit_data` column
- Set `has_pending_edit = true`
- Set `approval_status = 'pending'`

## What Still Needs to Be Done

### Step 4: Update `getStudentByEmail` Function
The `getStudentByEmail` function needs to be modified to return verified data when there's a pending edit.

**Location:** `src/services/studentServiceProfile.js` around line 368 and 847

**Current Code:**
```javascript
const formattedTableCertificates = tableCertificates.map((certificate) => {
  // ... formats certificate data directly
  return {
    id: certificate?.id,
    title: certificate?.title || "",
    // ... other fields
  };
});
```

**Needed Change:**
```javascript
const formattedTableCertificates = tableCertificates.map((certificate) => {
  // NEW: Check if has pending edit
  if (certificate.has_pending_edit && certificate.verified_data) {
    // Return verified data for dashboard
    const verifiedCert = certificate.verified_data;
    return {
      id: certificate.id,
      title: verifiedCert?.title || "",
      // ... use verifiedCert fields
      approval_status: 'verified',
      has_pending_edit: true,
    };
  }
  
  // Normal flow for non-edited data
  return {
    id: certificate?.id,
    title: certificate?.title || "",
    // ... other fields
  };
});
```

### Step 5: Apply Same Logic to Other Data Types

Need to update these functions in `src/services/studentServiceProfile.js`:

1. **Projects** - `updateProjectsByEmail` (line ~2814)
2. **Experience** - `updateExperienceByEmail` (line ~2205)
3. **Education** - `updateEducationByEmail` (line ~1523)
4. **Skills** - `updateSkillsByEmail` (line ~2657)

And their corresponding formatting in `getStudentByEmail`:
- Projects formatting
- Experience formatting
- Education formatting
- Skills formatting

## Quick Implementation Guide

### For Each Update Function:

1. Change the existing certificates fetch from:
```javascript
const { data: existingCertificates } = await supabase
  .from('certificates')
  .select('id')  // ❌ Only gets ID
  .eq('student_id', studentId);
```

To:
```javascript
const { data: existingCertificates } = await supabase
  .from('certificates')
  .select('*')  // ✅ Gets full record
  .eq('student_id', studentId);
```

2. Add versioning logic in the map function:
```javascript
.map((cert) => {
  // ... existing formatting ...
  
  // NEW: Check if editing verified data
  const existingRecord = (existingCertificates || []).find(e => e.id === record.id);
  if (existingRecord && (existingRecord.approval_status === 'verified' || existingRecord.approval_status === 'approved')) {
    const verifiedData = { ...existingRecord };
    delete verifiedData.pending_edit_data;
    delete verifiedData.has_pending_edit;
    delete verifiedData.verified_data;
    
    record.verified_data = verifiedData;
    record.pending_edit_data = { ...record };
    record.has_pending_edit = true;
    record.approval_status = 'pending';
  }
  
  return record;
});
```

### For getStudentByEmail Function:

Add this check at the start of each formatting map:
```javascript
.map((item) => {
  // Check for pending edit
  if (item.has_pending_edit && item.verified_data) {
    // Return verified version for dashboard
    return formatVerifiedData(item);
  }
  
  // Normal formatting
  return formatNormalData(item);
});
```

## Testing Steps

After implementation:

1. **Test Certificate Edit:**
   - Create a verified certificate
   - Edit it
   - Check dashboard - should show OLD data
   - Check settings - should show "Pending Verification"

2. **Test Project Edit:**
   - Same as above for projects

3. **Test Experience Edit:**
   - Same as above for experience

4. **Test Education Edit:**
   - Same as above for education

5. **Test Skills Edit:**
   - Same as above for skills

## Current Status

✅ Database migration ready
✅ Helper utilities created
✅ Certificates update function modified
⏳ Certificates get function needs modification
⏳ Projects update/get functions need modification
⏳ Experience update/get functions need modification
⏳ Education update/get functions need modification
⏳ Skills update/get functions need modification

## Estimated Time Remaining

- Modify getStudentByEmail for certificates: 15 minutes
- Modify projects update/get: 20 minutes
- Modify experience update/get: 20 minutes
- Modify education update/get: 20 minutes
- Modify skills update/get: 20 minutes
- Testing: 30 minutes

**Total: ~2 hours**

## Need Help?

The pattern is the same for all data types. I can:
1. Complete all the modifications now
2. Do them one at a time so you can test each
3. Provide you with the exact code snippets to copy-paste

Let me know how you'd like to proceed!
