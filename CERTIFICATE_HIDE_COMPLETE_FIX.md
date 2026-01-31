# Certificate Hide/Show - Complete Fix & Diagnosis

## ✅ Root Cause Identified

The certificate hide/show functionality has **3 components** that all need to work together:

1. **UI Toggle** (UnifiedProfileEditModal) - ✅ FIXED
2. **Database Save** (studentServiceProfile.js) - ✅ ALREADY WORKING
3. **Database Fetch** (useStudentCertificates.js) - ⚠️ NEEDS VERIFICATION

## 🔍 How It Should Work

### Flow:
1. User clicks eye icon → `toggleEnabled()` updates local state
2. User clicks "Save All Changes" → `updateCertificatesByEmail()` saves to database
3. Dashboard refreshes → `useStudentCertificates()` fetches only enabled certificates
4. Dashboard displays → filters by `cert.enabled !== false`

## ✅ Fixes Applied

### 1. UnifiedProfileEditModal.jsx - toggleEnabled Function
**Location**: `src/components/Students/components/ProfileEditModals/UnifiedProfileEditModal.jsx`

```javascript
const toggleEnabled = (index) => {
  setItems(prev => prev.map((item, idx) => 
    idx === index ? { ...item, enabled: !item.enabled, processing: true } : item
  ));
  const item = items[index];
  const newState = !item.enabled;
  toast({ 
    title: newState ? "Shown" : "Hidden", 
    description: `${config.title} ${newState ? 'will be visible' : 'will be hidden'}. Click 'Save All Changes' to save.` 
  });
};
```

**Changes:**
- ✅ Adds `processing: true` flag
- ✅ Shows toast notification
- ✅ Reminds user to click "Save All Changes"

### 2. studentServiceProfile.js - updateCertificatesByEmail
**Location**: `src/services/studentServiceProfile.js` (line ~3101)

```javascript
const record = {
  student_id: studentId,
  title: titleValue,
  issuer: issuerValue && issuerValue.length > 0 ? issuerValue : null,
  // ... other fields ...
  enabled: cert.enabled !== false, // ✅ This line saves the enabled field
  updated_at: nowIso,
};
```

**Status:** ✅ ALREADY WORKING - The `enabled` field is being saved correctly

### 3. useStudentCertificates.js - Fetch Logic
**Location**: `src/hooks/useStudentCertificates.js` (line 92)

```javascript
const { data, error: fetchError } = await supabase
  .from('certificates')
  .select('*')
  .eq('student_id', studentId)
  .is('training_id', null)
  .eq('enabled', true) // ⚠️ This filters at database level
  .order('issued_on', { ascending: false });
```

**Issue:** This query only fetches `enabled = true` certificates, so hidden certificates won't appear in the edit modal either!

## 🔧 Additional Fix Needed

The `useStudentCertificates` hook should fetch ALL certificates (including hidden ones) so they can be managed in the edit modal. The filtering should happen only in the Dashboard display.

### Option 1: Remove the filter from the hook (Recommended)
```javascript
const { data, error: fetchError } = await supabase
  .from('certificates')
  .select('*')
  .eq('student_id', studentId)
  .is('training_id', null)
  // Remove: .eq('enabled', true)
  .order('issued_on', { ascending: false});
```

### Option 2: Add a parameter to control filtering
```javascript
export const useStudentCertificates = (studentId, enabled = true, includeHidden = false) => {
  // ...
  let query = supabase
    .from('certificates')
    .select('*')
    .eq('student_id', studentId)
    .is('training_id', null);
  
  if (!includeHidden) {
    query = query.eq('enabled', true);
  }
  
  const { data, error: fetchError } = await query.order('issued_on', { ascending: false});
  // ...
};
```

## 🧪 Testing Steps

### Before Testing:
1. Clear browser cache: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Or test in incognito/private mode

### Test Scenario 1: Hide Certificate
1. Open Dashboard
2. Click "View All Certificates" (eye icon on Certificates card)
3. Click the green eye icon on any certificate
4. ✅ Verify: Icon turns gray
5. ✅ Verify: Toast says "Hidden - Certificate will be hidden. Click 'Save All Changes' to save."
6. ✅ Verify: Orange "Processing" badge appears
7. Click "Save All Changes"
8. ✅ Verify: Success toast appears
9. Close modal
10. ✅ Verify: Certificate is NO LONGER visible on Dashboard

### Test Scenario 2: Show Certificate
1. Open Dashboard
2. Click "View All Certificates"
3. Find a hidden certificate (gray eye-off icon)
4. Click the gray eye-off icon
5. ✅ Verify: Icon turns green
6. ✅ Verify: Toast says "Shown - Certificate will be visible. Click 'Save All Changes' to save."
7. Click "Save All Changes"
8. Close modal
9. ✅ Verify: Certificate is NOW visible on Dashboard

### Test Scenario 3: Database Verification
Open Supabase SQL Editor and run:
```sql
SELECT id, title, enabled, status 
FROM certificates 
WHERE student_id = 'YOUR_STUDENT_ID'
ORDER BY created_at DESC;
```

✅ Verify: `enabled` column shows `true` or `false` correctly

## 📊 Data Flow Diagram

```
User Action (Click Eye Icon)
    ↓
toggleEnabled() - Updates Local State
    ↓
User Clicks "Save All Changes"
    ↓
handleSubmit() - Calls onSave(items)
    ↓
updateCertificates() - Calls updateCertificatesByEmail()
    ↓
Database UPDATE - Sets enabled = true/false
    ↓
refreshCertificates() - Calls useStudentCertificates()
    ↓
Database SELECT - Fetches certificates WHERE enabled = true
    ↓
Dashboard Display - Shows only enabled certificates
```

## 🐛 Debugging Checklist

If hide/show still doesn't work:

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed API calls

2. **Check Database**
   ```sql
   SELECT * FROM certificates WHERE student_id = 'YOUR_ID';
   ```
   - Verify `enabled` column exists
   - Verify values are being updated

3. **Check Local State**
   - Add `console.log('Items:', items)` in UnifiedProfileEditModal
   - Verify `enabled` property is toggling

4. **Check Save Function**
   - Add `console.log('Saving:', processedItems)` in handleSubmit
   - Verify `enabled` field is in the data being saved

5. **Check Fetch Function**
   - Add `console.log('Fetched:', data)` in useStudentCertificates
   - Verify certificates are being fetched

## 📝 Files Modified

1. `src/components/Students/components/ProfileEditModals/UnifiedProfileEditModal.jsx`
   - Updated `toggleEnabled()` function

2. `src/services/studentServiceProfile.js`
   - Already has `enabled` field (line 3101)

3. `src/hooks/useStudentCertificates.js`
   - May need to remove `.eq('enabled', true)` filter

## ✅ Next Steps

1. Apply the fix to `useStudentCertificates.js` (remove the enabled filter)
2. Clear browser cache
3. Test hide/show functionality
4. Verify in database that `enabled` column is being updated

---

**Status**: 🔧 In Progress
**Date**: January 30, 2026
**Priority**: High
