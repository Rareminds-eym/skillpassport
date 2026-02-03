# Old Data Storage - Visual Diagram

## Where Is Old Data Stored?

```
┌─────────────────────────────────────────────────────────────────┐
│                    CERTIFICATES TABLE                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ id: "abc-123"                                              │ │
│  │ student_id: "xyz-789"                                      │ │
│  │                                                            │ │
│  │ ┌────────────────────────────────────────────────────────┐ │ │
│  │ │ title: "Sports day medal"  ← Dashboard shows this     │ │ │
│  │ └────────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │ issuer: "Aditya College"                                  │ │
│  │ approval_status: "pending"  ← Changed from "verified"     │ │
│  │ has_pending_edit: true  ← Flag indicating pending changes │ │
│  │                                                            │ │
│  │ ┌────────────────────────────────────────────────────────┐ │ │
│  │ │ 🔥 verified_data (JSONB) - OLD DATA STORED HERE       │ │ │
│  │ │ {                                                      │ │ │
│  │ │   "title": "Sports day medal",  ← Original title      │ │ │
│  │ │   "issuer": "Aditya College",                         │ │ │
│  │ │   "description": "Achievement during college",        │ │ │
│  │ │   "approval_status": "verified",                      │ │ │
│  │ │   "enabled": true                                     │ │ │
│  │ │ }                                                      │ │ │
│  │ └────────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │ ┌────────────────────────────────────────────────────────┐ │ │
│  │ │ 🔥 pending_edit_data (JSONB) - YOUR NEW CHANGES       │ │ │
│  │ │ {                                                      │ │ │
│  │ │   "title": "Sports",  ← Your new title                │ │ │
│  │ │   "issuer": "Aditya College",                         │ │ │
│  │ │   "description": "Achievement during college",        │ │ │
│  │ │   "approval_status": "pending",                       │ │ │
│  │ │   "enabled": true                                     │ │ │
│  │ │ }                                                      │ │ │
│  │ └────────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │ updated_at: "2025-01-31T10:30:00Z"                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
BEFORE EDIT (Verified Certificate)
┌──────────────────────────────────┐
│ title: "Sports day medal"        │
│ approval_status: "verified"      │
│ has_pending_edit: false          │
│ verified_data: null              │
│ pending_edit_data: null          │
└──────────────────────────────────┘
                │
                │ User edits to "Sports"
                ▼
AFTER EDIT (Pending Approval)
┌──────────────────────────────────────────────────────────┐
│ title: "Sports day medal"  ← Still shows old on dashboard│
│ approval_status: "pending"  ← Changed                    │
│ has_pending_edit: true  ← Flag set                       │
│                                                           │
│ verified_data: {  ← 🔥 OLD DATA PRESERVED                │
│   "title": "Sports day medal"                            │
│ }                                                         │
│                                                           │
│ pending_edit_data: {  ← 🔥 NEW DATA STORED               │
│   "title": "Sports"                                      │
│ }                                                         │
└──────────────────────────────────────────────────────────┘
                │
                │ Admin approves
                ▼
AFTER APPROVAL (Verified Again)
┌──────────────────────────────────┐
│ title: "Sports"  ← Updated!      │
│ approval_status: "verified"      │
│ has_pending_edit: false          │
│ verified_data: null  ← Cleared   │
│ pending_edit_data: null ← Cleared│
└──────────────────────────────────┘
```

## What Each Component Shows

```
┌─────────────────────────────────────────────────────────────┐
│                        DASHBOARD                             │
│  Shows: verified_data.title OR title (if no pending edit)   │
│  Result: "Sports day medal" (old verified version)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      EDIT MODAL                              │
│  Shows: pending_edit_data.title OR title (if no pending)    │
│  Result: "Sports" (your new changes)                        │
│  Badge: "Pending Approval" (amber/yellow)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
│  verified_data: { "title": "Sports day medal" }             │
│  pending_edit_data: { "title": "Sports" }                   │
│  has_pending_edit: true                                     │
└─────────────────────────────────────────────────────────────┘
```

## Code Implementation

### How Dashboard Reads Data:
```javascript
// In Dashboard.jsx (line 310-332)
const certificatesData = certificates.map((cert) => {
  // If there's a pending edit, use verified_data for dashboard
  if (cert.has_pending_edit && cert.verified_data) {
    return {
      ...cert,
      // Override with verified data for display
      title: cert.verified_data.title || cert.title,  // ← Shows old title
      issuer: cert.verified_data.issuer || cert.issuer,
      // ... other fields from verified_data
    };
  }
  return cert; // No pending edit, show current data
});
```

### How Edit Modal Reads Data:
```javascript
// In UnifiedProfileEditModal.jsx (line 48-75)
const processedItems = normalizedData.map(item => {
  // If there's a pending edit, merge it for display in edit modal
  if (item.has_pending_edit && item.pending_edit_data) {
    return {
      ...item,
      // Show pending edit data in the edit list
      ...item.pending_edit_data,  // ← Shows new title
      // Keep original id and metadata
      id: item.id,
      _hasPendingEdit: true,
    };
  }
  return item;
});
```

### How Backend Stores Data:
```javascript
// In studentServiceProfile.js (line 3155-3175)
const existingRecord = existingCertificates.find(e => e.id === record.id);

if (existingRecord && existingRecord.approval_status === 'verified') {
  // Store old verified data
  const verifiedData = { ...existingRecord };
  delete verifiedData.pending_edit_data;
  delete verifiedData.has_pending_edit;
  delete verifiedData.verified_data;
  
  // Save to database
  record.verified_data = verifiedData;  // ← Old data here
  record.pending_edit_data = { ...record };  // ← New data here
  record.has_pending_edit = true;
  record.approval_status = 'pending';
}
```

## Quick Reference

| Field | Contains | Shown Where |
|-------|----------|-------------|
| `title` | Current dashboard title | Dashboard (if no pending edit) |
| `verified_data` | 🔥 **OLD verified data** | Dashboard (when has_pending_edit = true) |
| `pending_edit_data` | 🔥 **YOUR new changes** | Edit modal (when has_pending_edit = true) |
| `has_pending_edit` | Boolean flag | Indicates if there are pending changes |
| `approval_status` | Status | 'pending', 'approved', 'verified' |

## Summary

✅ **Old data** is in `verified_data` column (JSONB)
✅ **New data** is in `pending_edit_data` column (JSONB)
✅ **Dashboard** shows `verified_data` (old version)
✅ **Edit modal** shows `pending_edit_data` (your changes)
✅ **After approval**, both fields are cleared and `title` is updated

This ensures:
- No data loss
- Admin can review changes
- Can rollback if needed
- Audit trail of what changed
