# Settings Sync Fix - branch_field and course_name

## Problem

When a student updates their Program/Branch in the Settings page, the change wasn't reflected in the Assessment Test page.

### Root Cause

The system has two fields for storing program information:
- `branch_field` - Used by Settings page
- `course_name` - Used by Assessment Test page

When Settings page updated `branch_field`, it didn't update `course_name`, causing a mismatch.

### Example

**User Action**: Changed Program from "MCA" to "BCA" in Settings

**Database After Update**:
```sql
grade: 'UG Year 1'  ✅ Updated
branch_field: 'BCA'  ✅ Updated
course_name: 'MCA'   ❌ Not updated (still old value)
```

**Result**: Assessment Test page still showed "MCA" because it reads from `course_name`.

## Solution

Modified `studentSettingsService.js` to sync both fields when branch is updated.

### Code Change

**File**: `src/services/studentSettingsService.js`
**Function**: `updateStudentSettings()`

```javascript
// Process updates
Object.keys(updates).forEach(key => {
  if (fieldMapping[key]) {
    let value = updates[key];
    
    // ... existing validation code ...
    
    columnUpdates[fieldMapping[key]] = value;
    
    // IMPORTANT: When branch_field is updated, also update course_name
    // This ensures consistency between settings page and assessment test page
    if (key === 'branch' && value) {
      columnUpdates.course_name = value;
      console.log('📚 Syncing course_name with branch_field:', value);
    }
  }
  // ... rest of code ...
});
```

### How It Works

1. User updates "Program/Branch" field in Settings page
2. Settings page sends update with `branch: 'BCA'`
3. Service maps `branch` → `branch_field` in database
4. **NEW**: Service also updates `course_name` with the same value
5. Both fields are now in sync

### Database After Fix

```sql
grade: 'UG Year 1'  ✅ Updated
branch_field: 'BCA'  ✅ Updated
course_name: 'BCA'   ✅ Now synced!
```

## Testing

### Test Case 1: Update Program in Settings

1. Go to Settings page
2. Change "Program/Branch" from "MCA" to "BCA"
3. Click "Save Profile"
4. Go to Assessment Test page
5. **Expected**: Should show "BCA" (not "MCA")

### Test Case 2: Verify Database Sync

```sql
-- Check both fields are synced
SELECT grade, branch_field, course_name 
FROM students 
WHERE id = '<student_id>';

-- Expected: branch_field and course_name should match
```

### Test Case 3: Assessment Results

1. Take assessment test or regenerate report
2. Check console logs for student context
3. **Expected**: `programName: 'BCA'` (not "MCA")
4. **Expected**: AI recommendations aligned with BCA program

## Impact

### Before Fix:
- ❌ Settings and Assessment pages showed different programs
- ❌ AI recommendations based on old program
- ❌ Confusing user experience

### After Fix:
- ✅ Settings and Assessment pages show same program
- ✅ AI recommendations based on current program
- ✅ Consistent user experience

## Related Files

- **Service**: `src/services/studentSettingsService.js` (modified)
- **Settings Page**: `src/pages/student/Settings.jsx` (no changes needed)
- **Assessment Test**: `src/pages/student/AssessmentTest.jsx` (no changes needed)
- **Database**: `students` table (`branch_field` and `course_name` columns)

## Future Improvement

Consider consolidating to a single field:
- Option 1: Use only `course_name` everywhere
- Option 2: Use only `branch_field` everywhere
- Option 3: Add a database trigger to auto-sync the fields

For now, the sync logic in the service ensures consistency.

## Deployment

- ✅ Code change: Applied
- ✅ Database: No migration needed (existing columns)
- ✅ Testing: Verified working
- ✅ Status: Ready for production

---

**Date**: January 18, 2026
**Issue**: Settings update not reflected in Assessment Test
**Fix**: Sync `course_name` when `branch_field` is updated
**Status**: ✅ Complete
