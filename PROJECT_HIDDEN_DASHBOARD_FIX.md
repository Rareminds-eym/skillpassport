# Hidden Projects Not Visible in Dashboard Modal - FIXED ✅

## 🐛 Issue

**Problem**: Hidden projects are not showing up in the Dashboard "Edit Projects" modal, so users cannot enable them again from the Dashboard.

**Where it works**: Settings page - hidden projects appear and can be enabled
**Where it doesn't work**: Dashboard - hidden projects don't appear in the modal

## 🔍 Root Cause

The `useStudentProjects` hook was filtering out hidden projects at the database level:

```javascript
.eq('enabled', true) // Only fetch enabled projects
```

This meant:
1. Dashboard fetches only `enabled = true` projects
2. Hidden projects are not in the list
3. User cannot see or enable hidden projects from Dashboard
4. Settings page works because it uses a different data source

## ✅ Solution Applied

### Fixed: useStudentProjects.js

**Location**: `src/hooks/useStudentProjects.js` (line 99)

**Before:**
```javascript
const { data, error: fetchError } = await supabase
  .from('projects')
  .select('*')
  .eq('student_id', studentId)
  .eq('enabled', true) // ❌ Only fetched enabled projects
  .in('approval_status', ['approved', 'verified'])
  .order('created_at', { ascending: false });
```

**After:**
```javascript
const { data, error: fetchError } = await supabase
  .from('projects')
  .select('*')
  .eq('student_id', studentId)
  // ✅ Removed: .eq('enabled', true) - Fetch ALL projects including hidden ones
  .in('approval_status', ['approved', 'verified'])
  .order('created_at', { ascending: false });
```

## 🔄 How It Works Now

### Data Flow:
```
1. Fetch: useStudentProjects()
   → Fetches ALL projects (enabled + disabled)
   → Still filters by approval_status (approved/verified only)
   
2. Dashboard Display
   → Filters projects by enabled !== false
   → Only shows enabled projects to users
   
3. Edit Modal (Dashboard)
   → Shows ALL projects (including hidden ones)
   → Hidden projects have gray eye-off icon
   → Enabled projects have green eye icon
   
4. Toggle: Click eye icon
   → Updates local state: enabled = true/false
   → Shows toast notification
   
5. Save: Click "Save All Changes"
   → Saves ALL projects to database
   → Including enabled field for each
```

## 🧪 Testing Steps

### Test 1: Hide Project from Dashboard
1. Open Dashboard
2. Click "Edit Projects" (pencil icon on Projects card)
3. You should see ALL projects (including any previously hidden ones)
4. Click green eye icon on a project
5. ✅ Icon turns gray (eye-off)
6. ✅ Toast: "Hidden - Project will be hidden. Click 'Save All Changes' to save."
7. Click "Save All Changes"
8. Close modal
9. ✅ Project is NO LONGER visible on Dashboard
10. **IMPORTANT**: Open "Edit Projects" modal again
11. ✅ Hidden project is STILL THERE with gray eye-off icon

### Test 2: Show Hidden Project from Dashboard
1. Open Dashboard
2. Click "Edit Projects"
3. Find project with gray eye-off icon
4. Click the gray eye-off icon
5. ✅ Icon turns green (eye)
6. ✅ Toast: "Shown - Project will be visible. Click 'Save All Changes' to save."
7. Click "Save All Changes"
8. Close modal
9. ✅ Project is NOW visible on Dashboard

### Test 3: Verify Settings Page Still Works
1. Go to Settings page
2. Open Projects section
3. ✅ Hidden projects should appear with gray eye-off icon
4. ✅ Can toggle visibility
5. ✅ Same behavior as Dashboard

## 📊 Comparison: Before vs After

### Before (Broken):
```
Dashboard:
  ↓
useStudentProjects fetches only enabled = true
  ↓
Hidden projects NOT in list
  ↓
Edit Projects modal shows only visible projects
  ↓
❌ Cannot enable hidden projects from Dashboard
  ↓
Must go to Settings page to enable
```

### After (Fixed):
```
Dashboard:
  ↓
useStudentProjects fetches ALL projects
  ↓
Hidden projects in list with enabled = false
  ↓
Edit Projects modal shows ALL projects
  ↓
✅ Can toggle visibility from Dashboard
  ↓
Same experience as Settings page
```

## ✅ Files Modified

1. **src/hooks/useStudentProjects.js**
   - Removed `.eq('enabled', true)` filter (line 99)
   - Now fetches ALL projects (including hidden ones)

## 🎯 Result

- ✅ Hidden projects appear in Dashboard edit modal
- ✅ Can enable/disable projects from Dashboard
- ✅ Same behavior as Settings page
- ✅ Consistent user experience
- ✅ No data loss when hiding projects

## 🔧 Next Steps

1. **Clear browser cache**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Open Dashboard
3. Click "Edit Projects"
4. Verify hidden projects appear with gray eye-off icon
5. Test toggle functionality

---

**Status**: ✅ COMPLETE
**Date**: January 30, 2026
**Issue**: Hidden projects not visible in Dashboard modal
**Solution**: Removed enabled filter from useStudentProjects hook
**Testing**: Ready for testing after cache clear
