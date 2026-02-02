# Certificate Eye Button (Hide/Show) - Status Based Display

## Problem Fixed
The eye icon (hide/show button) was showing for certificates with "Pending Approval" status. Since these certificates aren't displayed on the frontend (Dashboard shows verified version), the hide/show button doesn't make sense for them.

## Solution
Hide the eye icon button for certificates that are:
1. **Pending Verification** (`approval_status === 'pending'`)
2. **Pending Approval** (has pending edits: `_hasPendingEdit === true`)

## Implementation

### File: `src/components/Students/components/ProfileEditModals/UnifiedProfileEditModal.jsx`

```javascript
<div className="flex gap-1">
  {/* Edit button - always visible */}
  <Button 
    variant="ghost" 
    size="sm" 
    onClick={() => handleEditItem(index)} 
    className="text-blue-600 hover:bg-blue-50"
  >
    <PenSquare className="w-4 h-4" />
  </Button>
  
  {/* Delete button - always visible */}
  <Button 
    variant="ghost" 
    size="sm" 
    onClick={() => deleteItem(index)} 
    className="text-red-500 hover:bg-red-50"
  >
    <Trash2 className="w-4 h-4" />
  </Button>
  
  {/* Hide/Show button - ONLY for verified certificates */}
  {!(item.approval_status === 'pending' || item._hasPendingEdit) && (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => toggleEnabled(index)} 
      className={item.enabled === false ? "text-gray-500" : "text-green-600"}
    >
      {item.enabled === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </Button>
  )}
</div>
```

## Button Visibility Logic

| Certificate Status | Edit Button | Delete Button | Eye Button |
|-------------------|-------------|---------------|------------|
| **Verified** | ✅ Visible | ✅ Visible | ✅ Visible |
| **Pending Verification** (new) | ✅ Visible | ✅ Visible | ❌ Hidden |
| **Pending Approval** (edited) | ✅ Visible | ✅ Visible | ❌ Hidden |

## Why Hide Eye Button for Pending Certificates?

### Pending Verification (New Certificates)
- Not yet shown on Dashboard
- Nothing to hide/show since it's not visible anyway
- User should wait for verification first

### Pending Approval (Edited Certificates)
- Dashboard shows the **verified version** (old data)
- The pending changes are not visible on Dashboard
- Hiding/showing doesn't make sense because:
  - If you "hide" it, the verified version is still showing on Dashboard
  - The pending edit is not displayed anywhere on frontend
  - User should wait for approval first, then hide/show the approved version

## User Experience

### Before Fix
1. User edits "React" → "React module" (becomes "Pending Approval")
2. Eye icon is visible
3. User clicks eye icon → Error toast ❌
4. Confusing: "Why is the button there if I can't use it?"

### After Fix
1. User edits "React" → "React module" (becomes "Pending Approval")
2. Eye icon is **hidden** ✅
3. Only Edit and Delete buttons are visible
4. Clear: "I can edit or delete, but hide/show is not available for pending items"

## Testing Instructions

### Test 1: Verified Certificate Shows Eye Button
1. Go to Settings → Certificates → Update Certificates
2. Find a certificate with "Verified" badge
3. **Expected**: Edit, Delete, and Eye buttons are all visible ✅

### Test 2: Pending Verification Hides Eye Button
1. Add a new certificate (will be "Pending Verification")
2. **Expected**: Only Edit and Delete buttons visible, NO eye button ✅

### Test 3: Pending Approval Hides Eye Button
1. Edit a verified certificate (e.g., "React" → "React module")
2. Certificate now shows "Pending Approval" badge
3. **Expected**: Only Edit and Delete buttons visible, NO eye button ✅

### Test 4: After Approval, Eye Button Returns
1. Admin approves the pending edit
2. Certificate becomes "Verified" again
3. **Expected**: Eye button reappears ✅

## Related Files
- `src/components/Students/components/ProfileEditModals/UnifiedProfileEditModal.jsx` - Button visibility logic
- `HIDE_SHOW_DIRECT_UPDATE_COMPLETE.md` - Hide/show functionality documentation
- `CERTIFICATE_VERSIONING_EXPLAINED.md` - Versioning system explanation

## Status
✅ **COMPLETE** - Eye button now hidden for pending certificates
