# Certificate Versioning System - Explained

## What's Happening?

When you edited "Sports day medal" to "Sports", the system **did save your changes**, but they're in a "pending approval" state. This is because your certificate was previously **verified/approved**, and the system has a versioning workflow to protect verified data.

## How It Works

### The Versioning Flow:

1. **Original State**: Certificate "Sports day medal" with `approval_status = 'verified'`
2. **You Edit**: Change title to "Sports" and click "Update Certificates"
3. **System Response**:
   - ✅ Saves your changes to `pending_edit_data` field
   - ✅ Preserves original verified data in `verified_data` field
   - ✅ Sets `has_pending_edit = true`
   - ✅ Changes `approval_status` to `'pending'`
4. **What You See**:
   - **Dashboard**: Shows "Sports day medal" (the verified version)
   - **Edit Modal**: Shows "Sports" (your pending changes) with "Pending Approval" badge
   - **Badge**: "Pending Approval" indicates changes are waiting

### Why This System Exists:

- **Data Integrity**: Prevents accidental loss of verified information
- **Audit Trail**: Keeps history of what was verified vs what's being changed
- **Admin Review**: Allows administrators to review changes before they go live

## What You Can Do

### Option 1: Wait for Approval (Recommended for Production)
Your changes are saved and will appear on the dashboard once an administrator approves them.

### Option 2: Self-Approve (For Testing/Development)
If you have database access and want to approve your own changes immediately:

1. Open Supabase SQL Editor
2. Run the script in `approve_pending_certificate_edits.sql`
3. Find your certificate and approve it

Example:
```sql
-- View pending edits
SELECT id, title, pending_edit_data->>'title' as new_title
FROM certificates
WHERE has_pending_edit = true;

-- Approve a specific certificate (replace the ID)
UPDATE certificates
SET 
  title = pending_edit_data->>'title',
  approval_status = 'verified',
  has_pending_edit = false,
  verified_data = NULL,
  pending_edit_data = NULL
WHERE id = 'your-certificate-id';
```

### Option 3: Disable Versioning (For Development Only)
If you're in development and want immediate updates without approval:

**Modify `src/services/studentServiceProfile.js`** around line 3155:

```javascript
// VERSIONING LOGIC: Check if this is an edit of verified data
const existingRecord = (existingCertificates || []).find(e => e.id === record.id);

// OPTION A: Disable versioning completely (not recommended)
// Comment out the entire versioning block

// OPTION B: Skip versioning for self-edits (better approach)
if (existingRecord && 
    (existingRecord.approval_status === 'verified' || existingRecord.approval_status === 'approved') &&
    !skipVersioning) { // Add a flag to skip versioning when needed
  // ... versioning logic
}
```

## Current Status

✅ **Your changes ARE saved** - they're in `pending_edit_data`
✅ **Edit modal shows your changes** - you can see "Sports" when editing
✅ **Dashboard shows verified version** - "Sports day medal" until approved
✅ **Clear indicator** - "Pending Approval" badge shows the status

## Testing the Fix

1. **Refresh the page** (Ctrl+R or Cmd+R)
2. **Open Edit Certificates modal**
3. **Look for your certificate** - it should show:
   - Title: "Sports" (your pending change)
   - Badge: "Pending Approval" (amber/yellow)
   - Info message: "Your changes are saved but pending approval..."
4. **Check Dashboard** - still shows "Sports day medal" (verified version)

## Next Steps

**For Production Use:**
- Keep the versioning system as-is
- Create an admin interface to approve pending edits
- Add notifications when edits are approved/rejected

**For Development/Testing:**
- Use the SQL script to self-approve changes
- Or temporarily disable versioning in the code

## Files Modified

1. ✅ `src/components/Students/components/ProfileEditModals/UnifiedProfileEditModal.jsx`
   - Shows pending edits in the edit list
   - Displays "Pending Approval" badge
   - Shows helpful info message

2. ✅ `src/components/Students/components/ProfileEditModals/ProfileItemModal.jsx`
   - Uses pending edit data when editing

3. ✅ `approve_pending_certificate_edits.sql`
   - SQL script to view and approve pending edits

## Questions?

- **Q: Why don't I see my changes on the dashboard?**
  - A: The dashboard shows the verified version until changes are approved.

- **Q: Are my changes lost?**
  - A: No! They're saved in `pending_edit_data` and visible in the edit modal.

- **Q: How do I approve changes?**
  - A: Use the SQL script or wait for an admin to approve them.

- **Q: Can I disable this for testing?**
  - A: Yes, see Option 3 above or use the SQL script to self-approve.
