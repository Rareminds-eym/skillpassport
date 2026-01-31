# Versioning System Implementation Guide

## Overview
This document explains how to implement a versioning system where verified data remains visible on the dashboard while edits are pending approval.

## Problem Statement
Currently, when a user edits verified data (certificates, projects, experience, education, skills), the changes immediately replace the verified data. This means:
- Verified data disappears from the dashboard
- Users see "Pending Verification" instead of their verified achievements
- This creates a poor user experience

## Solution
Implement a versioning system that:
1. Preserves verified data when edits are made
2. Stores pending edits separately
3. Shows verified data on dashboard
4. Shows pending edits in settings (with "Pending Verification" badge)
5. Replaces verified data only after approval

## Database Schema Changes

### Migration File
`database/migrations/add_pending_edit_fields.sql`

Adds three columns to each table (certificates, projects, experience, education, skills):
- `verified_data` (JSONB) - Stores the last verified version
- `pending_edit_data` (JSONB) - Stores the edited version awaiting approval
- `has_pending_edit` (BOOLEAN) - Flag for quick checking

## Implementation Steps

### Step 1: Run Database Migration
Run the SQL migration in Supabase SQL Editor (see `RUN_PENDING_EDIT_MIGRATION.md`)

### Step 2: Update Service Functions
Modify the update functions in `src/services/studentServiceProfile.js`:

#### For `updateCertificatesByEmail`:
```javascript
import { prepareVersionedUpdate } from '../utils/versioningHelper.js';

// In the update logic, before upsert:
const formatted = (certificatesData || [])
  .filter((cert) => cert && (cert.title || cert.name))
  .map((cert) => {
    // ... existing formatting logic ...
    
    // NEW: Check if this is an edit of verified data
    const existingRecord = (existingCertificates || []).find(e => e.id === cert.id);
    
    if (existingRecord && (existingRecord.approval_status === 'verified' || existingRecord.approval_status === 'approved')) {
      // This is an edit of verified data - use versioning
      return prepareVersionedUpdate(existingRecord, record);
    }
    
    return record;
  });
```

Apply the same pattern to:
- `updateProjectsByEmail`
- `updateExperienceByEmail`
- `updateEducationByEmail`
- `updateSkillsByEmail`

### Step 3: Update Data Fetching
Modify `getStudentByEmail` to handle versioned data:

```javascript
import { getDisplayData } from '../utils/versioningHelper.js';

// When fetching certificates, projects, etc.:
const { data: certificates } = await supabase
  .from('certificates')
  .select('*')
  .eq('student_id', studentId);

// Transform data for dashboard (show verified version)
const dashboardCertificates = certificates.map(cert => getDisplayData(cert));

// For settings page, show both verified and pending
const settingsCertificates = certificates; // Show all data including pending flags
```

### Step 4: Update Dashboard Components
Modify dashboard components to only show verified data:

#### `src/pages/student/Dashboard.jsx`:
```javascript
// Filter to show only verified data (versioning helper already handles this)
const verifiedCertificates = userData.certificates?.filter(cert => 
  cert.approval_status === 'verified' || cert.approval_status === 'approved'
) || [];
```

### Step 5: Update Settings Components
Modify settings components to show pending edits with badges:

#### `src/components/Students/components/SettingsTabs/ProfileSubTabs/CertificatesTab.jsx`:
```javascript
import { hasPendingEdit } from '../../../../../utils/versioningHelper';

// In the render:
{hasPendingEdit(certificate) && (
  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
    <Clock className="w-3 h-3 mr-1" /> Pending Verification
  </Badge>
)}

{certificate.is_pending_edit && (
  <div className="text-sm text-amber-600 mt-2">
    This is an edited version awaiting verification. Your verified data is still visible on your dashboard.
  </div>
)}
```

### Step 6: Update Approval Workflow
Create admin/educator approval interface:

```javascript
import { approvePendingEdit, rejectPendingEdit } from '../utils/versioningHelper';

// On approve:
const handleApprove = async (recordId) => {
  const { data: record } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', recordId)
    .single();
  
  const approvedData = approvePendingEdit(record);
  
  await supabase
    .from('certificates')
    .update(approvedData)
    .eq('id', recordId);
};

// On reject:
const handleReject = async (recordId) => {
  const { data: record } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', recordId)
    .single();
  
  const rejectedData = rejectPendingEdit(record);
  
  await supabase
    .from('certificates')
    .update(rejectedData)
    .eq('id', recordId);
};
```

## User Experience Flow

### Scenario 1: User Edits Verified Certificate

**Before Edit:**
- Dashboard: "AWS Certified Developer" (Verified ✓)
- Settings: "AWS Certified Developer" (Verified ✓)

**After Edit (Changed to "AWS Certified Developer Associate"):**
- Dashboard: "AWS Certified Developer" (Verified ✓) ← Still shows old verified data
- Settings: 
  - "AWS Certified Developer" (Verified ✓)
  - "AWS Certified Developer Associate" (Pending Verification ⏳) ← New edit

**After Approval:**
- Dashboard: "AWS Certified Developer Associate" (Verified ✓)
- Settings: "AWS Certified Developer Associate" (Verified ✓)

**After Rejection:**
- Dashboard: "AWS Certified Developer" (Verified ✓) ← Unchanged
- Settings: "AWS Certified Developer" (Verified ✓) ← Pending edit removed

### Scenario 2: User Edits Unverified Data

**Before Edit:**
- Dashboard: (Not shown - unverified)
- Settings: "Test Certificate" (Pending Verification ⏳)

**After Edit:**
- Dashboard: (Still not shown - unverified)
- Settings: "Test Certificate Updated" (Pending Verification ⏳) ← Direct update, no versioning

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Edit verified certificate - old data still shows on dashboard
- [ ] Edit verified project - old data still shows on dashboard
- [ ] Edit verified experience - old data still shows on dashboard
- [ ] Edit verified education - old data still shows on dashboard
- [ ] Edit verified skills - old data still shows on dashboard
- [ ] Settings page shows both verified and pending versions
- [ ] Pending edits show "Pending Verification" badge
- [ ] Admin can approve pending edits
- [ ] After approval, new data replaces old data
- [ ] Admin can reject pending edits
- [ ] After rejection, verified data remains unchanged
- [ ] Edit unverified data - no versioning (direct update)

## Files to Modify

1. **Database:**
   - `database/migrations/add_pending_edit_fields.sql` ✓ Created

2. **Utilities:**
   - `src/utils/versioningHelper.js` ✓ Created

3. **Services:**
   - `src/services/studentServiceProfile.js` - Update all update functions

4. **Dashboard:**
   - `src/pages/student/Dashboard.jsx` - Already filters verified data ✓

5. **Settings:**
   - `src/components/Students/components/SettingsTabs/ProfileSubTabs/CertificatesTab.jsx`
   - `src/components/Students/components/SettingsTabs/ProfileSubTabs/ProjectsTab.jsx`
   - `src/components/Students/components/SettingsTabs/ProfileSubTabs/ExperienceTab.jsx`
   - `src/components/Students/components/SettingsTabs/ProfileSubTabs/EducationTab.jsx`
   - `src/components/Students/components/SettingsTabs/ProfileSubTabs/TechnicalSkillsTab.jsx`
   - `src/components/Students/components/SettingsTabs/ProfileSubTabs/SoftSkillsTab.jsx`

6. **Admin/Educator:**
   - Create approval interface components

## Next Steps

1. **Immediate:** Run the database migration
2. **Phase 1:** Update service functions to use versioning
3. **Phase 2:** Update settings components to show pending edits
4. **Phase 3:** Create admin approval interface
5. **Phase 4:** Test thoroughly with all data types

## Rollback Plan

If issues arise, you can rollback by:
1. Running the rollback SQL (see `RUN_PENDING_EDIT_MIGRATION.md`)
2. Reverting code changes
3. The system will work as before (direct updates)

## Benefits

✅ Better user experience - verified data always visible
✅ Clear indication of pending changes
✅ Admin control over data quality
✅ Audit trail of changes
✅ No data loss during edit process
✅ Maintains trust in verification system
