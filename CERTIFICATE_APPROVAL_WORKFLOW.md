# Certificate Approval Workflow - IMPLEMENTED ✅

## 🎯 Requirement

Newly added certificates should NOT appear on the Dashboard immediately. They should only show after verification by school or RareMinds platform.

## 🔄 Workflow

### 1. Student Adds Certificate
- Student clicks "Add Certificate" and fills in details
- Certificate is saved with `approval_status = 'pending'`
- ❌ Certificate does NOT appear on Dashboard
- ✅ Certificate appears in Edit modal with "Pending Verification" badge

### 2. Verification Process

#### If Student is Part of School:
- School admin reviews the certificate
- School admin approves → `approval_status = 'approved'`
- ✅ Certificate NOW appears on Dashboard with "Verified" badge

#### If Student is NOT Part of School:
- RareMinds platform reviews the certificate
- Platform approves → `approval_status = 'verified'`
- ✅ Certificate NOW appears on Dashboard with "Verified" badge

### 3. Dashboard Display
- Only shows certificates with `approval_status = 'approved'` OR `'verified'`
- Pending certificates are hidden from Dashboard
- Verified certificates show green "Verified" badge

## ✅ Changes Implemented

### 1. Dashboard.jsx - Filter by Approval Status

**Location**: `src/pages/student/Dashboard.jsx` (line ~308)

**Before:**
```javascript
return certificatesData
  .filter((cert) => cert && cert.enabled !== false)
```

**After:**
```javascript
return certificatesData
  .filter((cert) => cert && cert.enabled !== false && (cert.approval_status === 'approved' || cert.approval_status === 'verified'))
```

### 2. UnifiedProfileEditModal.jsx - Show Approval Status Badges

**Location**: `src/components/Students/components/ProfileEditModals/UnifiedProfileEditModal.jsx` (lines ~860-872)

**Added:**
```javascript
{item.approval_status === 'pending' && (
  <Badge className="bg-yellow-100 text-yellow-700">
    <Clock className="w-3 h-3 mr-1" /> Pending Verification
  </Badge>
)}
{(item.approval_status === 'approved' || item.approval_status === 'verified') && (
  <Badge className="bg-green-100 text-green-700">
    <CheckCircle className="w-3 h-3 mr-1" /> Verified
  </Badge>
)}
```

### 3. studentServiceProfile.js - Default to Pending

**Location**: `src/services/studentServiceProfile.js` (line 3075)

**Already Correct:**
```javascript
const approvalSource = cert.approval_status || cert.status || 'pending';
const approvalStatus = typeof approvalSource === 'string' ? approvalSource.toLowerCase() : 'pending';
```

New certificates default to `approval_status = 'pending'`.

## 📊 Visual Flow

### Student View:

```
┌─────────────────────────────────────────────┐
│ Dashboard - Certificates Section            │
├─────────────────────────────────────────────┤
│                                             │
│ ✅ Sports day medal        [Verified]       │ ← Approved
│ ✅ Essay competition       [Verified]       │ ← Approved
│                                             │
│ ❌ "testing" certificate NOT shown          │ ← Pending (hidden)
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Edit Certificates Modal                     │
├─────────────────────────────────────────────┤
│                                             │
│ ⏳ testing    [Pending Verification] 🟡     │ ← Visible in modal
│ ✅ Sports day medal    [Verified] 🟢        │
│ ✅ Essay competition   [Verified] 🟢        │
│                                             │
└─────────────────────────────────────────────┘
```

## 🎨 Badge Colors

| Status | Badge Color | Icon | Text |
|--------|-------------|------|------|
| Pending | Yellow | ⏰ Clock | "Pending Verification" |
| Approved | Green | ✓ CheckCircle | "Verified" |
| Verified | Green | ✓ CheckCircle | "Verified" |

## 🧪 Testing Steps

### Test 1: Add New Certificate
1. Open Dashboard
2. Click "Edit Certificates"
3. Click "Add Certificate"
4. Fill in details (title, issuer, date, etc.)
5. Click "Save All Changes"
6. Close modal
7. ✅ Verify: Certificate does NOT appear on Dashboard
8. Open "Edit Certificates" again
9. ✅ Verify: Certificate appears with yellow "Pending Verification" badge

### Test 2: Approve Certificate (School Admin)
1. School admin logs in
2. Reviews pending certificate
3. Approves certificate → `approval_status = 'approved'`
4. Student refreshes Dashboard
5. ✅ Verify: Certificate NOW appears with green "Verified" badge

### Test 3: Verify Certificate (RareMinds Platform)
1. Platform admin reviews certificate
2. Verifies certificate → `approval_status = 'verified'`
3. Student refreshes Dashboard
4. ✅ Verify: Certificate appears with green "Verified" badge

## 📝 Database States

### Approval Status Values:
- `'pending'` - Newly added, awaiting verification (hidden from Dashboard)
- `'approved'` - Verified by school (shown on Dashboard)
- `'verified'` - Verified by RareMinds platform (shown on Dashboard)
- `'rejected'` - Rejected (hidden from Dashboard)

### SQL to Check Status:
```sql
SELECT 
  id,
  title,
  issuer,
  approval_status,
  enabled,
  created_at
FROM certificates
WHERE student_id = 'YOUR_STUDENT_ID'
ORDER BY created_at DESC;
```

## 🔧 Admin Approval Process

### For School Admins:
```sql
-- Approve a certificate
UPDATE certificates
SET approval_status = 'approved'
WHERE id = 'CERTIFICATE_ID';
```

### For RareMinds Platform:
```sql
-- Verify a certificate
UPDATE certificates
SET approval_status = 'verified'
WHERE id = 'CERTIFICATE_ID';
```

### Reject a Certificate:
```sql
-- Reject a certificate
UPDATE certificates
SET approval_status = 'rejected'
WHERE id = 'CERTIFICATE_ID';
```

## ✅ Files Modified

1. **src/pages/student/Dashboard.jsx**
   - Line ~308: Added approval status filter
   - Only shows approved/verified certificates

2. **src/components/Students/components/ProfileEditModals/UnifiedProfileEditModal.jsx**
   - Lines ~860-872: Added approval status badges
   - Shows "Pending Verification" for pending items
   - Shows "Verified" for approved/verified items

3. **src/services/studentServiceProfile.js**
   - Line 3075: Already defaults to 'pending'
   - No changes needed

## 🎯 Result

- ✅ New certificates start as "pending"
- ✅ Pending certificates hidden from Dashboard
- ✅ Pending certificates visible in Edit modal with yellow badge
- ✅ Approved/verified certificates show on Dashboard with green badge
- ✅ Clear visual feedback for students
- ✅ Proper approval workflow

---

**Status**: ✅ COMPLETE
**Date**: January 30, 2026
**Next Step**: Clear browser cache and test workflow
**Priority**: High
