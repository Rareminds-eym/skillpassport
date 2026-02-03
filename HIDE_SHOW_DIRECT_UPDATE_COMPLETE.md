# Hide/Show Direct Update - Complete

## Problem Fixed
When hiding a verified certificate, it would hide temporarily but reappear after page refresh. The certificate was being updated in the database correctly, but the Dashboard was reading the `enabled` field from `verified_data` instead of the main `enabled` field.

## Root Cause
1. Hide/show updates the main `enabled` field in the database ✅
2. Dashboard was using `cert.verified_data.enabled` for certificates with pending edits ❌
3. The main `cert.enabled` field was being ignored ❌

## Solution Implemented
Modified three files to properly handle the `enabled` field:

### 1. UnifiedProfileEditModal.jsx
- Removed duplicate `supabase` import
- `toggleEnabled` function now updates database directly using Supabase client
- Only updates the `enabled` field (does NOT trigger versioning)
- Includes confirmation dialog before hide/show
- Prevents hiding/showing pending certificates

### 2. Dashboard.jsx
- Fixed `enabledCertificates` useMemo to use `cert.enabled` instead of `cert.verified_data.enabled`
- Added comment explaining that hide/show is NOT part of versioning
- Now correctly respects the main `enabled` field even for certificates with pending edits

### 3. CertificatesTab.jsx
- Added `.filter(cert => cert.enabled !== false)` to only show enabled certificates
- Hidden certificates are now properly filtered out in Settings view

## How It Works Now

### Hide/Show Flow
1. User clicks eye icon in Settings → Certificates
2. Confirmation dialog appears
3. Function updates database: `UPDATE certificates SET enabled = false WHERE id = ?`
4. Only the `enabled` field is updated (no versioning triggered)
5. Certificate stays "Verified" and is hidden
6. After refresh, certificate remains hidden ✅

### Display Logic
- **Dashboard**: Filters `cert.enabled !== false` (uses main enabled field)
- **Settings**: Filters `cert.enabled !== false` (uses main enabled field)
- **Edit Modal**: Shows ALL certificates (including hidden) so user can unhide them

## Key Points
- `enabled` field is stored at the TOP LEVEL of the certificate record
- `enabled` field is NOT stored in `verified_data` or `pending_edit_data`
- Hide/show does NOT trigger versioning workflow
- Hide/show does NOT change `approval_status`
- Verified certificates stay "Verified" when hidden

## Testing Instructions

### Test 1: Hide Verified Certificate
1. Go to Settings → Certificates
2. Find a certificate with "Verified" badge
3. Click the eye icon (hide)
4. Confirm the dialog
5. **Expected**: Certificate disappears from list
6. Refresh page (F5)
7. **Expected**: Certificate still hidden ✅

### Test 2: Show Hidden Certificate
1. In Settings → Certificates, click "Update Certificates"
2. Find a hidden certificate (eye-off icon)
3. Click the eye-off icon (show)
4. Confirm the dialog
5. Close modal
6. **Expected**: Certificate appears in list
7. Refresh page
8. **Expected**: Certificate still visible ✅

### Test 3: Dashboard Respects Hidden State
1. Hide a certificate in Settings
2. Go to Dashboard
3. **Expected**: Hidden certificate does NOT appear on Dashboard ✅
4. Refresh Dashboard
5. **Expected**: Hidden certificate still does NOT appear ✅

### Test 4: Cannot Hide Pending Certificates
1. Create a new certificate (will be "Pending Verification")
2. Try to click the eye icon
3. **Expected**: Error toast "Cannot Hide/Show. You cannot hide or show certificates that are pending verification or approval."

## Files Modified
1. `src/components/Students/components/ProfileEditModals/UnifiedProfileEditModal.jsx`
   - Removed duplicate import
   - Fixed toggleEnabled to update database directly
   
2. `src/pages/student/Dashboard.jsx`
   - Fixed enabledCertificates to use `cert.enabled` instead of `cert.verified_data.enabled`
   
3. `src/components/Students/components/SettingsTabs/ProfileSubTabs/CertificatesTab.jsx`
   - Added filter to only show enabled certificates

## Status
✅ **COMPLETE** - Hide/show now persists correctly after page refresh
