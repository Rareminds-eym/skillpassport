# Where Is Old Data Stored? - Complete Guide

## Quick Answer

When you edit a **verified certificate**, the old data is stored in the **`verified_data`** column in the `certificates` table.

## Database Structure

### Certificates Table Columns:

```sql
certificates
├── id (uuid)
├── student_id (uuid)
├── title (text) ← Current title shown on dashboard
├── issuer (text)
├── level (text)
├── credential_id (text)
├── link (text)
├── issued_on (date)
├── expiry_date (date)
├── description (text)
├── approval_status (text) ← 'pending', 'approved', 'verified'
├── has_pending_edit (boolean) ← TRUE when you have pending changes
├── verified_data (jsonb) ← 🔥 OLD DATA STORED HERE
├── pending_edit_data (jsonb) ← 🔥 YOUR NEW CHANGES STORED HERE
├── enabled (boolean)
├── created_at (timestamp)
└── updated_at (timestamp)
```

## Example: How Data Is Stored

### Before Edit (Verified Certificate):
```sql
{
  id: "abc-123",
  title: "Sports day medal",
  issuer: "Aditya College",
  approval_status: "verified",
  has_pending_edit: false,
  verified_data: null,
  pending_edit_data: null
}
```

### After You Edit to "Sports":
```sql
{
  id: "abc-123",
  title: "Sports day medal", ← Still shows old title on dashboard
  issuer: "Aditya College",
  approval_status: "pending", ← Changed from "verified"
  has_pending_edit: true, ← Flag indicating pending changes
  
  verified_data: { ← 🔥 OLD DATA PRESERVED HERE
    "title": "Sports day medal",
    "issuer": "Aditya College",
    "level": null,
    "credential_id": null,
    "link": null,
    "issued_on": null,
    "expiry_date": null,
    "description": "Achievement during college",
    "status": "active",
    "approval_status": "verified",
    "enabled": true
  },
  
  pending_edit_data: { ← 🔥 YOUR NEW CHANGES HERE
    "title": "Sports", ← Your new title
    "issuer": "Aditya College",
    "level": null,
    "credential_id": null,
    "link": null,
    "issued_on": null,
    "expiry_date": null,
    "description": "Achievement during college",
    "status": "active",
    "approval_status": "pending",
    "enabled": true
  }
}
```

## How to View Old Data

### Method 1: SQL Query (Recommended)
Open Supabase SQL Editor and run:

```sql
-- View all certificates with pending edits
SELECT 
  id,
  title as current_dashboard_title,
  approval_status,
  has_pending_edit,
  
  -- Old verified data
  verified_data->>'title' as old_title,
  verified_data->>'issuer' as old_issuer,
  verified_data->>'description' as old_description,
  verified_data->>'approval_status' as old_status,
  
  -- Your new pending changes
  pending_edit_data->>'title' as new_title,
  pending_edit_data->>'issuer' as new_issuer,
  pending_edit_data->>'description' as new_description,
  
  updated_at
FROM certificates
WHERE has_pending_edit = true
ORDER BY updated_at DESC;
```

### Method 2: View Specific Certificate
```sql
-- Replace 'Sports' with your certificate name
SELECT 
  id,
  title,
  verified_data,
  pending_edit_data,
  has_pending_edit,
  approval_status
FROM certificates
WHERE title LIKE '%Sports%' OR pending_edit_data->>'title' LIKE '%Sports%'
ORDER BY updated_at DESC;
```

### Method 3: View Full JSON
```sql
-- See complete verified_data JSON
SELECT 
  id,
  title,
  jsonb_pretty(verified_data) as old_data_formatted,
  jsonb_pretty(pending_edit_data) as new_data_formatted
FROM certificates
WHERE has_pending_edit = true;
```

## What Happens When Approved?

### Before Approval:
```sql
{
  title: "Sports day medal", ← Dashboard shows this
  verified_data: { title: "Sports day medal" }, ← Old data
  pending_edit_data: { title: "Sports" }, ← Your changes
  has_pending_edit: true
}
```

### After Approval:
```sql
{
  title: "Sports", ← Dashboard now shows this
  verified_data: null, ← Cleared
  pending_edit_data: null, ← Cleared
  has_pending_edit: false,
  approval_status: "verified"
}
```

The system:
1. Copies data from `pending_edit_data` to main fields
2. Clears `verified_data` and `pending_edit_data`
3. Sets `has_pending_edit = false`
4. Sets `approval_status = 'verified'`

## Why This System Exists?

### Benefits:
✅ **No Data Loss** - Original verified data is preserved
✅ **Audit Trail** - Can see what changed
✅ **Rollback** - Can reject changes and restore old data
✅ **Admin Review** - Admins can compare old vs new before approving

### Use Cases:
- Student accidentally changes verified certificate
- Admin needs to review changes before approval
- Need to track history of edits
- Compliance/audit requirements

## How to Access Old Data in Code

### In Frontend (React):
```javascript
// When fetching certificates
const certificate = {
  id: "abc-123",
  title: "Sports day medal", // Current dashboard title
  has_pending_edit: true,
  verified_data: {
    title: "Sports day medal" // Old verified title
  },
  pending_edit_data: {
    title: "Sports" // Your new pending title
  }
};

// Dashboard shows verified version
const dashboardTitle = certificate.has_pending_edit 
  ? certificate.verified_data.title 
  : certificate.title;
// Result: "Sports day medal"

// Edit modal shows pending changes
const editModalTitle = certificate.has_pending_edit 
  ? certificate.pending_edit_data.title 
  : certificate.title;
// Result: "Sports"
```

### In Backend (Supabase Function):
```javascript
// When updating certificate
if (existingRecord.approval_status === 'verified') {
  // Store old data in verified_data
  record.verified_data = { ...existingRecord };
  
  // Store new data in pending_edit_data
  record.pending_edit_data = { ...newData };
  
  // Mark as having pending edit
  record.has_pending_edit = true;
  record.approval_status = 'pending';
}
```

## Common Questions

### Q: Can I see old data in the UI?
**A:** Not directly in the current UI. You need to:
1. Use SQL queries in Supabase
2. Or build an admin interface to show old vs new

### Q: What if I edit multiple times?
**A:** Each edit overwrites `pending_edit_data`, but `verified_data` stays the same (preserves original).

### Q: Can I restore old data?
**A:** Yes! Run this SQL:
```sql
UPDATE certificates
SET 
  has_pending_edit = false,
  pending_edit_data = null,
  approval_status = 'verified'
WHERE id = 'your-certificate-id';
```

### Q: What about new certificates (never verified)?
**A:** They don't use versioning:
- `verified_data = null`
- `pending_edit_data = null`
- Changes update directly
- No old data to preserve

## Viewing Old Data - Step by Step

### Step 1: Open Supabase
1. Go to your Supabase project
2. Click "SQL Editor" in left sidebar

### Step 2: Run Query
```sql
SELECT 
  id,
  title as dashboard_shows,
  verified_data->>'title' as old_verified_title,
  pending_edit_data->>'title' as your_new_title,
  has_pending_edit,
  approval_status,
  updated_at
FROM certificates
WHERE student_id = (
  SELECT id FROM students WHERE email = 'your-email@example.com'
)
ORDER BY updated_at DESC;
```

### Step 3: Interpret Results
```
dashboard_shows | old_verified_title | your_new_title | has_pending_edit
----------------|-------------------|----------------|------------------
Sports day medal| Sports day medal  | Sports         | true
```

This means:
- Dashboard shows: "Sports day medal" (old verified version)
- Old data stored in: `verified_data->>'title'` = "Sports day medal"
- Your changes in: `pending_edit_data->>'title'` = "Sports"
- Status: Pending approval

## Summary

🔥 **Old data is stored in the `verified_data` column** (JSONB format)
🔥 **Your new changes are in the `pending_edit_data` column** (JSONB format)
🔥 **Dashboard shows the `verified_data` until approved**
🔥 **Edit modal shows the `pending_edit_data`**

This ensures no data loss and allows admin review before changes go live!
