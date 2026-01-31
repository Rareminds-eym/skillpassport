# Where Old Data is Stored - Complete Guide

## Quick Answer

The old verified data is stored in the **`verified_data`** field (JSONB column) in the `certificates` table.

## Visual Explanation

### Before You Edit (Verified Certificate):
```
certificates table:
┌─────────────────────────────────────────┐
│ id: abc-123                             │
│ title: "Sports club"                    │
│ issuer: "Aditya College"                │
│ approval_status: "verified"             │
│ has_pending_edit: false                 │
│ verified_data: null                     │
│ pending_edit_data: null                 │
└─────────────────────────────────────────┘
```

### After You Edit (Versioning Activated):
```
certificates table:
┌─────────────────────────────────────────────────────────────┐
│ id: abc-123                                                 │
│ title: "Sports club"  ← STILL OLD (dashboard shows this)   │
│ issuer: "Aditya College"  ← STILL OLD                      │
│ approval_status: "pending"  ← Changed from "verified"      │
│ has_pending_edit: true  ← Flag indicating pending changes  │
│                                                             │
│ verified_data: {  ← OLD DATA STORED HERE                   │
│   "title": "Sports club",                                  │
│   "issuer": "Aditya College",                              │
│   "level": null,                                           │
│   "credential_id": null,                                   │
│   "link": null,                                            │
│   "issued_on": null,                                       │
│   "expiry_date": null,                                     │
│   "description": "Achievement during college",             │
│   "approval_status": "verified",                           │
│   "enabled": true                                          │
│ }                                                           │
│                                                             │
│ pending_edit_data: {  ← YOUR NEW CHANGES STORED HERE       │
│   "title": "Sports",  ← Your new title                     │
│   "issuer": "Aditya College",                              │
│   "level": null,                                           │
│   "credential_id": null,                                   │
│   "link": null,                                            │
│   "issued_on": null,                                       │
│   "expiry_date": null,                                     │
│   "description": "Achievement during college",             │
│   "approval_status": "pending",                            │
│   "enabled": true                                          │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### After Admin Approves:
```
certificates table:
┌─────────────────────────────────────────┐
│ id: abc-123                             │
│ title: "Sports"  ← NOW UPDATED          │
│ issuer: "Aditya College"                │
│ approval_status: "verified"             │
│ has_pending_edit: false                 │
│ verified_data: null  ← Cleared          │
│ pending_edit_data: null  ← Cleared      │
└─────────────────────────────────────────┘
```

## How to View Old Data

### Option 1: Supabase Dashboard
1. Open Supabase Dashboard
2. Go to Table Editor → `certificates` table
3. Find your certificate row
4. Click on the `verified_data` column
5. You'll see the JSON with all old fields

### Option 2: SQL Query
Run this in Supabase SQL Editor:
```sql
SELECT 
  title as current_title,
  verified_data->>'title' as old_title,
  pending_edit_data->>'title' as new_title
FROM certificates
WHERE has_pending_edit = true;
```

### Option 3: Pretty Print
```sql
SELECT 
  title,
  jsonb_pretty(verified_data) as old_data,
  jsonb_pretty(pending_edit_data) as new_data
FROM certificates
WHERE title = 'Sports club';
```

## What Each Field Contains

### `verified_data` (JSONB):
Contains **complete snapshot** of the certificate when it was last verified:
- ✅ All field values at time of verification
- ✅ Original `approval_status: "verified"`
- ✅ Original timestamps
- ✅ All metadata

### `pending_edit_data` (JSONB):
Contains **your new changes** waiting for approval:
- ✅ All updated field values
- ✅ New `approval_status: "pending"`
- ✅ New timestamps
- ✅ All metadata

### Current Row Fields:
The main fields (title, issuer, etc.) **still contain old data** until approved:
- Dashboard reads from `verified_data` if `has_pending_edit = true`
- Edit modal reads from `pending_edit_data` if `has_pending_edit = true`
- This way both versions coexist safely

## Why This Design?

### Benefits:
1. **No Data Loss**: Old verified data is never overwritten
2. **Audit Trail**: Can see what changed and when
3. **Rollback**: Can reject changes and restore old data
4. **Comparison**: Can compare old vs new side-by-side
5. **Safety**: Verified data protected from accidental changes

### Example Use Cases:
- Admin reviews: "Did they really change the issuer?"
- Audit: "What was the original certificate name?"
- Rollback: "Reject this change and restore verified version"
- History: "When was this certificate last verified?"

## How Dashboard Shows Data

### Code Logic (simplified):
```javascript
// In Dashboard.jsx
const displayCertificate = (cert) => {
  if (cert.has_pending_edit && cert.verified_data) {
    // Show old verified data on dashboard
    return {
      title: cert.verified_data.title,
      issuer: cert.verified_data.issuer,
      // ... other fields from verified_data
    };
  } else {
    // Show current data
    return {
      title: cert.title,
      issuer: cert.issuer,
      // ... other fields
    };
  }
};
```

### Code Logic in Edit Modal:
```javascript
// In UnifiedProfileEditModal.jsx
const displayInEditModal = (cert) => {
  if (cert.has_pending_edit && cert.pending_edit_data) {
    // Show new pending changes in edit modal
    return {
      title: cert.pending_edit_data.title,
      issuer: cert.pending_edit_data.issuer,
      // ... other fields from pending_edit_data
    };
  } else {
    // Show current data
    return {
      title: cert.title,
      issuer: cert.issuer,
      // ... other fields
    };
  }
};
```

## Accessing Old Data in Code

### From Database Query:
```javascript
const { data: certificates } = await supabase
  .from('certificates')
  .select('*')
  .eq('student_id', studentId);

// Access old data
certificates.forEach(cert => {
  if (cert.has_pending_edit) {
    console.log('Old title:', cert.verified_data.title);
    console.log('New title:', cert.pending_edit_data.title);
    console.log('Dashboard shows:', cert.verified_data.title);
  }
});
```

### In React Component:
```javascript
const CertificateCard = ({ certificate }) => {
  const displayTitle = certificate.has_pending_edit && certificate.verified_data
    ? certificate.verified_data.title  // Show old verified title
    : certificate.title;  // Show current title
    
  const hasPendingChanges = certificate.has_pending_edit;
  const newTitle = certificate.pending_edit_data?.title;
  
  return (
    <div>
      <h3>{displayTitle}</h3>
      {hasPendingChanges && (
        <Badge>
          Pending: {newTitle}
        </Badge>
      )}
    </div>
  );
};
```

## SQL Queries to Explore

### See All Versions:
```sql
SELECT 
  id,
  title as current,
  verified_data->>'title' as old,
  pending_edit_data->>'title' as new
FROM certificates
WHERE has_pending_edit = true;
```

### Compare All Fields:
```sql
SELECT 
  id,
  verified_data as old_complete,
  pending_edit_data as new_complete
FROM certificates
WHERE id = 'your-certificate-id';
```

### Find Certificates with Pending Changes:
```sql
SELECT 
  id,
  title,
  verified_data->>'title' as original_name,
  pending_edit_data->>'title' as new_name,
  updated_at
FROM certificates
WHERE has_pending_edit = true
ORDER BY updated_at DESC;
```

## Important Notes

### Data Retention:
- ✅ Old data kept until changes are approved or rejected
- ✅ After approval, `verified_data` is cleared (no longer needed)
- ✅ After rejection, `pending_edit_data` is cleared (changes discarded)

### Storage:
- JSONB format (efficient binary JSON storage)
- Indexed for fast queries
- Supports partial updates
- Can query nested fields

### Performance:
- Minimal overhead (JSONB is efficient)
- No additional tables needed
- Fast queries with GIN indexes
- Compact storage

## Summary

**Old Data Location**: `certificates.verified_data` (JSONB column)
**New Data Location**: `certificates.pending_edit_data` (JSONB column)
**Dashboard Shows**: Data from `verified_data` (old)
**Edit Modal Shows**: Data from `pending_edit_data` (new)
**After Approval**: Both fields cleared, main fields updated

Use `check_old_data_storage.sql` to explore your data!
