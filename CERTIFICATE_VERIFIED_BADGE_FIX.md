# Certificate Verified Badge Not Showing - FIX

## 🐛 Issue

Certificates are NOT showing the green "Verified" badge on the Dashboard, while Experience items DO show the verified badge.

**Screenshot shows**:
- ❌ Certificates: No verified badge
- ✅ Experience: Shows green "Verified" badge

## 🔍 Root Cause

The Dashboard code already has the verified badge logic (lines 1673-1678 in Dashboard.jsx):

```javascript
{(cert.approval_status === "verified" || cert.approval_status === "approved" || cert.verified) && (
  <Badge className="!bg-gradient-to-r !from-green-100 !to-emerald-100 !text-green-700 px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm flex items-center gap-1.5">
    <CheckCircle className="w-3.5 h-3.5" />
    Verified
  </Badge>
)}
```

**The problem**: Certificates in the database don't have `approval_status` set to "approved" or "verified".

## ✅ Solution

### Step 1: Update Database - Set Approval Status

Run this SQL in Supabase SQL Editor:

```sql
-- Update all certificates to have approval_status = 'approved'
UPDATE certificates
SET approval_status = 'approved'
WHERE approval_status IS NULL 
   OR approval_status NOT IN ('approved', 'verified', 'pending', 'rejected');

-- Verify the update
SELECT 
  COUNT(*) as total_certificates,
  COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN approval_status = 'verified' THEN 1 END) as verified_count
FROM certificates;
```

### Step 2: Verify Data Transformation

Check that `useStudentCertificates` transforms the data correctly:

```javascript
// src/hooks/useStudentCertificates.js (line ~115)
approval_status: item.approval_status,
verified: item.approval_status === 'approved' || item.approval_status === 'verified',
```

### Step 3: Clear Browser Cache

After running the SQL:
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

## 🎯 Expected Result

After running the SQL fix and clearing cache, certificates should show:

```
┌──────────────────────────────────────┐
│ Sports day medal          [Verified] │ ← Green badge
│ No credential ID                     │
│ 🏢 Aditya College          [View]    │
└──────────────────────────────────────┘
```

## 📊 Comparison

### Before Fix:
```
Certificates:
- Sports day medal (no badge)
- Essay competition award (no badge)
- Art competition winner (no badge)

Experience:
- Tech Support [Verified] ✅
- Marketing Intern [Verified] ✅
- Startup Intern [Verified] ✅
```

### After Fix:
```
Certificates:
- Sports day medal [Verified] ✅
- Essay competition award [Verified] ✅
- Art competition winner [Verified] ✅

Experience:
- Tech Support [Verified] ✅
- Marketing Intern [Verified] ✅
- Startup Intern [Verified] ✅
```

## 🧪 Testing Steps

1. **Run SQL in Supabase**:
   ```sql
   UPDATE certificates SET approval_status = 'approved' WHERE approval_status IS NULL;
   ```

2. **Clear Browser Cache**: `Ctrl + Shift + R`

3. **Open Dashboard**

4. **Verify Certificates Section**:
   - ✅ Each certificate should show green "Verified" badge
   - ✅ Badge should be next to certificate title
   - ✅ Same style as Experience verified badges

## 🔧 Alternative: Set Specific Certificates

If you want to set approval status for specific certificates:

```sql
-- Set approval status for specific certificates by title
UPDATE certificates
SET approval_status = 'approved'
WHERE title IN ('Sports day medal', 'Essay competition award', 'Art competition winner');

-- Or set by student_id
UPDATE certificates
SET approval_status = 'approved'
WHERE student_id = 'YOUR_STUDENT_ID';
```

## 📝 Files Involved

1. **src/pages/student/Dashboard.jsx**
   - Lines 1673-1678: Verified badge rendering
   - ✅ Already correct

2. **src/hooks/useStudentCertificates.js**
   - Line ~115: `approval_status` transformation
   - ✅ Already correct

3. **Database: certificates table**
   - ⚠️ Needs `approval_status = 'approved'` or `'verified'`

## ✅ Quick Fix SQL

```sql
-- Run this in Supabase SQL Editor
UPDATE certificates 
SET approval_status = 'approved' 
WHERE approval_status IS NULL;
```

Then clear browser cache and refresh!

---

**Status**: 🔧 Requires SQL Update
**Date**: January 30, 2026
**Priority**: Medium
**Next Step**: Run SQL fix in Supabase
